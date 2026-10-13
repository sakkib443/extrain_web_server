// ===================================================================
// ExtraWeb Backend - Domain & Hosting module
//
// ডোমেইন/হোস্টিং বিক্রির পুরো ব্যবসা: নিবন্ধন, মেয়াদ, রিনিউ, ক্লায়েন্টের পেমেন্ট, প্রজেক্টের সাথে যোগ।
//
// গুরুত্বপূর্ণ: নতুন কোনো collection নেই। এটা Project Tracker এর `domains` collection-ই ব্যবহার করে,
// তাই প্রজেক্টের ফর্ম থেকে যোগ করা ডোমেইন এখানে আসে, আর এখান থেকে যোগ করলে প্রজেক্ট ও মাসিক
// Domain/Hosting ট্যাবে (purchaseDate অনুযায়ী) দেখা যায়।
//
// সব হিসাব (মোট আয়, খরচ, লাভ, বাকি) ক্লায়েন্টে হয়; এখানে শুধু ডেটা ঠিকভাবে রাখা ও যাচাই করা হয়:
//   revenue = sellPrice + Σ renewals.sellPrice
//   cost    = buyPrice  + Σ renewals.buyPrice
//   due     = revenue − clientPaid        (clientPaid = মোট পাওয়া টাকা, খাতার যোগফল)
// ===================================================================

import express from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import { Domain, ProjectClient } from '../projectTracker/projectTracker.module';

// ==================== HELPERS ====================
const TYPES = ['domain', 'hosting', 'both'];
const STATUSES = ['active', 'suspended', 'cancelled'];

const str = (v: any, max = 200): string | undefined => {
    if (v === undefined || v === null) return undefined;
    const t = String(v).trim().slice(0, max);
    return t;
};

const money = (v: any): number => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

// ফাঁকা বা ভুল তারিখ => null (মানে "মুছে ফেলো"), undefined => "বদলাবে না"
const dateOf = (v: any): Date | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null || v === '') return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
};

// https://www.Example.com/path  →  example.com   (হোস্টিংয়ের নামে স্পেস থাকলে অপরিবর্তিত)
const cleanName = (name: string): string => {
    let n = name.trim();
    if (/^https?:\/\//i.test(n) || /^[^\s/]+\.[^\s/]+\//.test(n)) {
        n = n.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    }
    return /\s/.test(n) ? n : n.toLowerCase();
};

// মাস যোগ করা — ৩১ তারিখ থেকে ফেব্রুয়ারিতে গেলে মাসের শেষ দিন (UTC, তারিখ-ভিত্তিক)
export const addMonthsUTC = (d: Date, months: number): Date => {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + months;
    const day = d.getUTCDate();
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, lastDay)));
};

const hasDomain = (t?: string) => t === 'domain' || t === 'both';
const hasHosting = (t?: string) => t === 'hosting' || t === 'both';

// প্রজেক্ট নম্বর দিলে প্রজেক্ট খুঁজে মালিকের তথ্য ফাঁকা ঘরে বসায়
const resolveProject = async (fields: any, creating: boolean) => {
    const pid = fields.linkedProjectId;
    if (!pid) {
        // প্রজেক্ট থেকে আলাদা করা হলে নামটাও মুছে যায়
        if (pid === '') fields.linkedClientName = '';
        return;
    }
    const project: any = await ProjectClient.findOne({ projectId: pid })
        .select('clientName companyBrand phone email')
        .lean();
    if (!project) throw new AppError(400, `"${pid}" নম্বরের কোনো প্রজেক্ট পাওয়া যায়নি`);
    fields.linkedClientName = `${project.clientName}${project.companyBrand ? ` (${project.companyBrand})` : ''}`;
    if (creating) {
        if (!fields.owner) fields.owner = project.clientName;
        if (!fields.ownerPhone) fields.ownerPhone = project.phone;
        if (!fields.ownerEmail) fields.ownerEmail = project.email;
    }
};

// payload থেকে শুধু অনুমোদিত ফিল্ড নেয় (যা পাঠানো হয়নি তা বদলায় না)
const pickFields = (p: any): Record<string, any> => {
    const out: Record<string, any> = {};
    const text: [string, number][] = [
        ['domainName', 200], ['owner', 120], ['ownerPhone', 40], ['ownerEmail', 120], ['provider', 120],
        ['hostingPlan', 120], ['note', 1000], ['linkedProjectId', 60],
    ];
    text.forEach(([k, max]) => { if (p[k] !== undefined) out[k] = str(p[k], max) ?? ''; });
    if (p.type !== undefined) {
        if (!TYPES.includes(p.type)) throw new AppError(400, 'Type ভুল (domain / hosting / both)');
        out.type = p.type;
    }
    if (p.status !== undefined) {
        if (!STATUSES.includes(p.status)) throw new AppError(400, 'Status ভুল');
        out.status = p.status;
    }
    if (p.billing !== undefined) out.billing = p.billing === 'included' ? 'included' : 'separate';
    if (p.autoRenew !== undefined) out.autoRenew = !!p.autoRenew;
    if (p.hostingGB !== undefined) out.hostingGB = p.hostingGB === '' || p.hostingGB === null ? undefined : money(p.hostingGB) || undefined;
    if (p.cycleMonths !== undefined) {
        const c = Math.round(Number(p.cycleMonths));
        out.cycleMonths = c >= 1 && c <= 120 ? c : 12;
    }
    ['buyPrice', 'sellPrice', 'clientPaid'].forEach((k) => { if (p[k] !== undefined) out[k] = money(p[k]); });
    ['renewalSellPrice', 'renewalBuyPrice'].forEach((k) => {
        if (p[k] !== undefined) out[k] = p[k] === '' || p[k] === null ? undefined : money(p[k]);
    });
    ['purchaseDate', 'expiryDate', 'nextPaymentDate'].forEach((k) => {
        const d = dateOf(p[k]);
        if (d !== undefined) out[k] = d === null ? undefined : d;
    });
    return out;
};

const unsetKeys = (p: any): Record<string, 1> => {
    const unset: Record<string, 1> = {};
    ['expiryDate', 'nextPaymentDate', 'purchaseDate', 'hostingGB', 'renewalSellPrice', 'renewalBuyPrice'].forEach((k) => {
        if (p[k] !== undefined && (p[k] === '' || p[k] === null)) unset[k] = 1;
    });
    return unset;
};

// একই নামের রেকর্ড আগে থেকে আছে কিনা (ডোমেইনে ডোমেইন, হোস্টিংয়ে হোস্টিং মিললে)
const findDuplicate = async (name: string, type: string, exceptId?: string) => {
    const rx = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const same: any[] = await Domain.find({ domainName: rx, status: { $ne: 'cancelled' } })
        .select('domainName type owner')
        .lean();
    return same.find(
        (d) =>
            String(d._id) !== String(exceptId || '') &&
            ((hasDomain(type) && hasDomain(d.type || 'domain')) || (hasHosting(type) && hasHosting(d.type)))
    );
};

// ==================== SERVICE ====================
const DomainHostingService = {
    // সব রেকর্ড + প্রজেক্টের হালকা তথ্য (লিংক দেখানোর জন্য)
    async list() {
        const domains: any[] = await Domain.find().sort({ expiryDate: 1, createdAt: -1 }).lean();
        const ids = [...new Set(domains.map((d) => d.linkedProjectId).filter(Boolean))];
        const projects: any[] = ids.length
            ? await ProjectClient.find({ projectId: { $in: ids } })
                .select('projectId clientName companyBrand phone email status orderDate')
                .lean()
            : [];
        const byId = new Map(projects.map((p) => [p.projectId, p]));
        return domains.map((d) => ({ ...d, project: d.linkedProjectId ? byId.get(d.linkedProjectId) || null : null }));
    },

    // প্রজেক্ট বেছে নেওয়ার ড্রপডাউনের জন্য (request/rejected বাদে)
    async projectsLite() {
        return ProjectClient.find({ status: { $nin: ['request', 'rejected'] } })
            .sort({ orderDate: -1 })
            .select('projectId clientName companyBrand phone email status orderDate')
            .lean();
    },

    async create(payload: any) {
        const fields = pickFields(payload || {});
        if (!fields.domainName) throw new AppError(400, 'Domain / Site এর নাম দিন');
        fields.domainName = cleanName(fields.domainName);
        fields.type = fields.type || 'domain';

        if (!payload.force) {
            const dup = await findDuplicate(fields.domainName, fields.type);
            if (dup) {
                throw new AppError(
                    409,
                    `"${dup.domainName}" আগে থেকেই আছে${dup.owner ? ` (${dup.owner})` : ''}। তবুও যোগ করতে চাইলে নিশ্চিত করুন।`
                );
            }
        }
        await resolveProject(fields, true);

        const doc = await Domain.create({
            buyPrice: 0,
            sellPrice: 0,
            clientPaid: 0,
            ...fields,
            fromProject: false,
            purchaseDate: fields.purchaseDate || new Date(),
        });
        return doc;
    },

    async update(id: string, payload: any) {
        const doc: any = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        const fields = pickFields(payload || {});
        if (fields.domainName !== undefined) {
            if (!fields.domainName) throw new AppError(400, 'নাম ফাঁকা রাখা যাবে না');
            fields.domainName = cleanName(fields.domainName);
        }
        const nextName = fields.domainName ?? doc.domainName;
        const nextType = fields.type ?? doc.type ?? 'domain';
        if (!payload.force && (fields.domainName !== undefined || fields.type !== undefined)) {
            const dup = await findDuplicate(nextName, nextType, id);
            if (dup) throw new AppError(409, `"${dup.domainName}" আগে থেকেই আছে। তবুও রাখতে চাইলে নিশ্চিত করুন।`);
        }
        if (fields.linkedProjectId !== undefined && fields.linkedProjectId !== doc.linkedProjectId) {
            await resolveProject(fields, false);
        }
        const unset = unsetKeys(payload || {});
        Object.assign(doc, fields);
        Object.keys(unset).forEach((k) => { doc.set(k, undefined); });
        await doc.save(); // pre-save: profit = sell - buy
        return doc;
    },

    async remove(id: string) {
        const doc = await Domain.findByIdAndDelete(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        return doc;
    },

    // ---- রিনিউ: মেয়াদ বাড়ে, ইতিহাসে এন্ট্রি যোগ হয়, চাইলে সাথে সাথে পেমেন্টও খাতায় ওঠে ----
    async renew(id: string, p: any) {
        const doc: any = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        if (doc.status === 'cancelled') throw new AppError(400, 'বাতিল রেকর্ড রিনিউ করা যায় না — আগে Status বদলান');

        const months = Math.round(Number(p.months)) || doc.cycleMonths || 12;
        if (months < 1 || months > 120) throw new AppError(400, 'মেয়াদ ১ থেকে ১২০ মাসের মধ্যে দিন');
        const when = dateOf(p.date) || new Date();
        const from: Date | undefined = doc.expiryDate || undefined;
        const to = dateOf(p.newExpiry) || addMonthsUTC(from || when, months);
        if (from && to.getTime() <= from.getTime()) throw new AppError(400, 'নতুন মেয়াদ আগের মেয়াদের পরে হতে হবে');

        const sell = p.sellPrice !== undefined ? money(p.sellPrice) : money(doc.renewalSellPrice ?? doc.sellPrice);
        const buy = p.buyPrice !== undefined ? money(p.buyPrice) : money(doc.renewalBuyPrice ?? doc.buyPrice);

        doc.renewals.push({ date: when, fromExpiry: from, toExpiry: to, months, buyPrice: buy, sellPrice: sell, note: str(p.note, 300) });
        doc.expiryDate = to;
        doc.status = 'active';
        doc.nextPaymentDate = undefined; // নতুন মেয়াদ — পরের পেমেন্টের তারিখ আবার বসাতে হবে
        doc.renewalSellPrice = sell;
        doc.renewalBuyPrice = buy;

        const paidNow = money(p.paidNow);
        if (paidNow > 0) {
            doc.payments.push({ date: when, amount: paidNow, method: str(p.method, 40), note: 'Renewal', kind: 'renewal' });
            doc.clientPaid = (doc.clientPaid || 0) + paidNow;
        }
        await doc.save();
        return doc;
    },

    // শেষ রিনিউটা ভুল হলে বাতিল — মেয়াদ আগের অবস্থায় ফেরে (পেমেন্ট খাতা আলাদা, ওটা নিজে মুছতে হবে)
    async removeRenewal(id: string, rid: string) {
        const doc: any = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        const list: any[] = doc.renewals || [];
        const target = list.find((r) => String(r._id) === rid);
        if (!target) throw new AppError(404, 'রিনিউ পাওয়া যায়নি');
        if (String(list[list.length - 1]._id) !== rid) {
            throw new AppError(400, 'শুধু সবশেষ রিনিউটাই বাতিল করা যায়');
        }
        doc.expiryDate = target.fromExpiry || undefined;
        doc.renewals.pull({ _id: target._id });
        await doc.save();
        return doc;
    },

    // ---- ক্লায়েন্টের পেমেন্ট ----
    async addPayment(id: string, p: any) {
        const doc: any = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        const amount = money(p.amount);
        if (amount <= 0) throw new AppError(400, 'টাকার অঙ্ক দিন');
        doc.payments.push({ date: dateOf(p.date) || new Date(), amount, method: str(p.method, 40), note: str(p.note, 300), kind: 'payment' });
        doc.clientPaid = (doc.clientPaid || 0) + amount;
        await doc.save();
        return doc;
    },

    async removePayment(id: string, pid: string) {
        const doc: any = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        const target = (doc.payments || []).find((x: any) => String(x._id) === pid);
        if (!target) throw new AppError(404, 'পেমেন্ট পাওয়া যায়নি');
        doc.clientPaid = Math.max(0, (doc.clientPaid || 0) - (target.amount || 0));
        doc.payments.pull({ _id: target._id });
        await doc.save();
        return doc;
    },

    // রিমাইন্ডার পাঠানো হয়েছে — তারিখ রেখে দেয় (একই জনকে বারবার মেসেজ না করার জন্য)
    async markReminded(id: string) {
        const doc = await Domain.findByIdAndUpdate(id, { $set: { lastReminderAt: new Date() } }, { new: true });
        if (!doc) throw new AppError(404, 'রেকর্ড পাওয়া যায়নি');
        return doc;
    },
};

// ==================== CONTROLLER ====================
const ok = (res: any, data: any, message: string, statusCode = 200) =>
    sendResponse(res, { statusCode, success: true, message, data });

const C = {
    list: catchAsync(async (_req, res) => ok(res, await DomainHostingService.list(), 'Domain & hosting list')),
    projectsLite: catchAsync(async (_req, res) => ok(res, await DomainHostingService.projectsLite(), 'Projects')),
    create: catchAsync(async (req, res) => ok(res, await DomainHostingService.create(req.body), 'Added', 201)),
    update: catchAsync(async (req, res) => ok(res, await DomainHostingService.update(req.params.id, req.body), 'Updated')),
    remove: catchAsync(async (req, res) => ok(res, await DomainHostingService.remove(req.params.id), 'Deleted')),
    renew: catchAsync(async (req, res) => ok(res, await DomainHostingService.renew(req.params.id, req.body), 'Renewed')),
    removeRenewal: catchAsync(async (req, res) =>
        ok(res, await DomainHostingService.removeRenewal(req.params.id, req.params.rid), 'Renewal removed')),
    addPayment: catchAsync(async (req, res) => ok(res, await DomainHostingService.addPayment(req.params.id, req.body), 'Payment added')),
    removePayment: catchAsync(async (req, res) =>
        ok(res, await DomainHostingService.removePayment(req.params.id, req.params.pid), 'Payment removed')),
    markReminded: catchAsync(async (req, res) => ok(res, await DomainHostingService.markReminded(req.params.id), 'Marked')),
};

// ==================== ROUTES (admin only) ====================
const router = express.Router();
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/', C.list);
router.get('/projects', C.projectsLite);
router.post('/', C.create);
router.patch('/:id', C.update);
router.delete('/:id', C.remove);
router.post('/:id/renew', C.renew);
router.delete('/:id/renewals/:rid', C.removeRenewal);
router.post('/:id/payments', C.addPayment);
router.delete('/:id/payments/:pid', C.removePayment);
router.post('/:id/reminded', C.markReminded);

export const DomainHostingRoutes = router;
export default DomainHostingService;
