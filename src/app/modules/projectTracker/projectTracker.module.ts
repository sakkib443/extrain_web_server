// ===================================================================
// ExtraWeb Backend - Project Tracker Module
// কাস্টম প্রজেক্ট অর্ডার + মান্থলি হিসাবরক্ষণ (Google Sheet tracker এর automated রূপ)
//
// গুরুত্বপূর্ণ: এই module পুরনো `projectclients` ও `expenses` কালেকশন-ই ব্যবহার করে
// (নতুন কালেকশন বানায় না — cluster 500 collection limit এ আছে, আর আসল ডেটা ওখানেই)।
// তাই ফিল্ডের নাম হুবহু existing ডেটার সাথে মেলানো।
//
// Flow:
//   1. ক্লায়েন্ট public form (/confirm-order) fill করে   →  status: 'request'
//   2. Admin approve করলে                                →  status: 'pending'
//   3. Admin amount/installment/delivery date বসায়        →  সব হিসাব auto
//   4. Expense আলাদা entry হয়  →  monthly summary তে profit/loss বের হয়
//
// হিসাব (Google Sheet অনুযায়ী):
//   domainProfit  = domainClientPaid - domainOurCost
//   totalPaid     = sum(installments.amount)
//   totalDue      = totalProjectAmount - totalPaid
//   Total Profit  = Collection + Domain/Hosting Profit - Expenses   (মাস ভিত্তিক)
// ===================================================================

import { Schema, model, Types } from 'mongoose';
import { z } from 'zod';
import express from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { NotificationService } from '../notification/notification.module';
import { User } from '../user/user.model';
import AuthService from '../auth/auth.service';
import EmailService from '../email/email.service';

// ==================== INTERFACES ====================
export interface IInstallment {
    no: number;
    amount: number;
    date?: Date;
    note?: string;
    paid?: boolean; // false = planned/future (totalPaid এ গণনা হয় না); undefined/true = actual payment
}

// Money receipt / order confirmation — ক্লায়েন্টকে পাঠানো রিসিটের রেকর্ড
export interface IReceipt {
    receiptNo: string;
    sentAt: Date;
    message?: string;
    options?: {
        paymentConfirmation?: boolean;
        installments?: boolean;
        delivery?: boolean;
        due?: boolean;
        contact?: boolean;
    };
    sentToEmail?: string;
    emailSent?: boolean;
}

export interface IProjectClient {
    _id?: Types.ObjectId;
    slNo?: number;
    projectId?: string; // EXP + YY + MM + serial (auto, যেমন EXP2607019)
    projectSerial?: number; // গ্লোবাল running serial (এক করে বাড়ে)
    // Dates
    messageDate?: Date;
    orderDate: Date;
    orderNumber?: string;
    // Client info (form থেকে আসে)
    clientName: string;
    companyBrand?: string;
    phone: string;
    email?: string;
    websiteType: string;
    // read এ dynamic: linked domain এর Type দেখে auto হয়
    // with_domain_hosting | with_domain | with_hosting | without_domain_hosting
    packageType: string;
    // ক্লায়েন্ট ব্রিফ (সব optional)
    desiredWebsiteName?: string; // কাঙ্ক্ষিত ওয়েবসাইটের নাম
    referenceWebsite?: string; // রেফারেন্স ওয়েবসাইট (link)
    similarToWebsite?: string; // আমাদের কোন ওয়েবসাইটের মতো
    projectDetails?: string; // বিস্তারিত ব্রিফ/description
    // ক্লায়েন্টের optional পেমেন্ট claim (form এর optional অংশ)
    paymentInfo?: {
        method?: string;
        senderNumber?: string;
        amount?: number;
        transactionId?: string;
        date?: string;
    };
    // Money (admin বসায়)
    domainClientPaid: number;
    domainOurCost: number;
    domainProfit: number; // auto
    totalProjectAmount: number;
    installmentCount?: number; // মোট কয়টা installment (optional)
    installments: IInstallment[];
    totalPaid: number; // auto
    totalDue: number; // auto
    duePercentage: number; // auto
    nextPayDate?: Date;
    // Progress
    status: 'request' | 'pending' | 'working' | 'done' | 'cancelled' | 'rejected';
    projectStartDate?: Date;
    projectDeliveryDate?: Date;
    workingDays: number; // auto
    deliveryWeekOfMonth: number; // auto
    adminNote?: string;
    receipts?: IReceipt[]; // পাঠানো money receipt গুলোর history
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IExpense {
    _id?: Types.ObjectId;
    slNo?: number;
    costDate: Date;
    reason: string;
    category?: string;
    amount: number;
    note?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Domain / Hosting registry — কোন ডোমেইন, মালিক, কোন প্রজেক্টে যুক্ত, কেনা/বেচা/লাভ
export interface IDomain {
    _id?: Types.ObjectId;
    domainName: string;
    type?: 'domain' | 'hosting' | 'both'; // শুধু ডোমেইন / শুধু হোস্টিং / দুইটাই
    hostingGB?: number; // হোস্টিং থাকলে কত GB
    owner?: string;
    linkedProjectId?: string; // EXP... projectId
    linkedClientName?: string; // display এর জন্য
    // included = দাম প্রজেক্টের totalProjectAmount এর ভিতরে (sell টা installment এই আদায় হয়)
    // separate = ডোমেইন/হোস্টিং এর আলাদা পেমেন্ট (প্রজেক্টের টাকার বাইরে)
    billing?: 'included' | 'separate';
    fromProject?: boolean; // Confirm Order থেকে auto তৈরি — তাই auto মুছেও ফেলা যায়
    buyPrice: number; // combined (ডোমেইন+হোস্টিং একসাথে হলেও একটাই)
    sellPrice: number;
    profit: number; // auto = sell - buy
    provider?: string; // যেখান থেকে কেনা (namecheap ইত্যাদি)
    purchaseDate?: Date;
    expiryDate?: Date;
    note?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// ==================== HELPERS ====================
// সব derived field এক জায়গায় হিসাব হয় (edit করলেও ঠিক থাকে)
const recompute = (doc: any): void => {
    doc.domainProfit = (doc.domainClientPaid || 0) - (doc.domainOurCost || 0);

    // paid === false হলে planned/future — totalPaid এ ধরা হয় না। legacy (undefined) ও true গণনা হয়।
    const paid = (doc.installments || []).reduce(
        (sum: number, i: any) => sum + (i.paid === false ? 0 : (i.amount || 0)),
        0
    );
    doc.totalPaid = paid;
    doc.totalDue = Math.max(0, (doc.totalProjectAmount || 0) - paid);
    doc.duePercentage =
        doc.totalProjectAmount > 0 ? Math.round((doc.totalDue / doc.totalProjectAmount) * 100) : 0;

    if (doc.projectStartDate && doc.projectDeliveryDate) {
        const ms =
            new Date(doc.projectDeliveryDate).getTime() - new Date(doc.projectStartDate).getTime();
        doc.workingDays = Math.max(0, Math.round(ms / 86400000));
    }
    if (doc.projectDeliveryDate) {
        doc.deliveryWeekOfMonth = Math.ceil(new Date(doc.projectDeliveryDate).getDate() / 7);
    }
};

// ==================== MODELS (existing collections) ====================
const installmentSchema = new Schema<IInstallment>(
    {
        no: { type: Number, required: true },
        amount: { type: Number, default: 0 },
        date: { type: Date },
        note: { type: String },
        paid: { type: Boolean },
    },
    { _id: false }
);

const projectClientSchema = new Schema<IProjectClient>(
    {
        slNo: { type: Number },
        projectId: { type: String, index: true },
        projectSerial: { type: Number },
        messageDate: { type: Date },
        orderDate: { type: Date, default: Date.now, index: true },
        orderNumber: { type: String },
        clientName: { type: String, required: true, trim: true },
        companyBrand: { type: String, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        websiteType: { type: String, required: true, trim: true },
        packageType: { type: String, default: 'without_domain_hosting' },
        desiredWebsiteName: { type: String, trim: true },
        referenceWebsite: { type: String, trim: true },
        similarToWebsite: { type: String, trim: true },
        projectDetails: { type: String },
        paymentInfo: {
            method: { type: String },
            senderNumber: { type: String },
            amount: { type: Number },
            transactionId: { type: String },
            date: { type: String },
        },
        domainClientPaid: { type: Number, default: 0 },
        domainOurCost: { type: Number, default: 0 },
        domainProfit: { type: Number, default: 0 },
        totalProjectAmount: { type: Number, default: 0 },
        installmentCount: { type: Number },
        installments: { type: [installmentSchema], default: [] },
        totalPaid: { type: Number, default: 0 },
        totalDue: { type: Number, default: 0 },
        duePercentage: { type: Number, default: 0 },
        nextPayDate: { type: Date },
        status: {
            type: String,
            enum: ['request', 'pending', 'working', 'done', 'cancelled', 'rejected'],
            default: 'pending',
            index: true,
        },
        projectStartDate: { type: Date },
        projectDeliveryDate: { type: Date },
        workingDays: { type: Number, default: 0 },
        deliveryWeekOfMonth: { type: Number, default: 0 },
        adminNote: { type: String },
        receipts: [
            {
                receiptNo: { type: String },
                sentAt: { type: Date },
                message: { type: String },
                options: {
                    paymentConfirmation: { type: Boolean },
                    installments: { type: Boolean },
                    delivery: { type: Boolean },
                    due: { type: Boolean },
                    contact: { type: Boolean },
                },
                sentToEmail: { type: String },
                emailSent: { type: Boolean },
            },
        ],
    },
    { timestamps: true }
);

projectClientSchema.pre('save', function (next) {
    recompute(this);
    next();
});

// 3rd arg = existing collection name (কোনো নতুন collection তৈরি হবে না)
export const ProjectClient = model<IProjectClient>('ProjectClient', projectClientSchema, 'projectclients');

const expenseSchema = new Schema<IExpense>(
    {
        slNo: { type: Number },
        costDate: { type: Date, default: Date.now, index: true },
        reason: { type: String, required: true, trim: true },
        category: { type: String, trim: true },
        amount: { type: Number, required: true },
        note: { type: String },
    },
    { timestamps: true }
);

export const Expense = model<IExpense>('Expense', expenseSchema, 'expenses');

// Domain model — নিজস্ব 'domains' collection (course collections ডিলিট করায় slot খালি হয়েছে)
const domainSchema = new Schema<IDomain>(
    {
        domainName: { type: String, required: true, trim: true },
        type: { type: String, enum: ['domain', 'hosting', 'both'], default: 'domain' },
        hostingGB: { type: Number },
        owner: { type: String, trim: true },
        linkedProjectId: { type: String, trim: true },
        linkedClientName: { type: String, trim: true },
        // পুরনো রেকর্ডে billing নেই — default 'separate' ধরায় আগের হিসাব অপরিবর্তিত থাকে
        billing: { type: String, enum: ['included', 'separate'], default: 'separate' },
        fromProject: { type: Boolean, default: false },
        buyPrice: { type: Number, default: 0 },
        sellPrice: { type: Number, default: 0 },
        profit: { type: Number, default: 0 },
        provider: { type: String, trim: true },
        purchaseDate: { type: Date },
        expiryDate: { type: Date },
        note: { type: String },
    },
    { timestamps: true }
);
domainSchema.pre('save', function (next) {
    this.profit = (this.sellPrice || 0) - (this.buyPrice || 0);
    next();
});
export const Domain = model<IDomain>('Domain', domainSchema, 'domains');

// একটা domain রেকর্ড মাসের মোট লাভে আসলে কতটা যোগ করে।
// included হলে sell টা project এর installment হিসেবেই totalCollection এ ধরা আছে —
// তাই আবার sell যোগ করলে দুবার গোনা হবে; শুধু আমাদের খরচটাই বাদ যাবে।
export const domainRevenueImpact = (d: any): number =>
    (d?.billing === 'included' ? 0 : d?.sellPrice || 0) - (d?.buyPrice || 0);

// ==================== VALIDATION ====================
// Public client form — ক্লায়েন্ট যেটুকু fill করবে
export const clientRequestValidation = z.object({
    body: z.object({
        clientName: z.string().min(2, 'Name is required'),
        companyBrand: z.string().optional(),
        phone: z.string().min(6, 'Phone is required'),
        email: z.string().email().optional().or(z.literal('')),
        websiteType: z.string().min(2, 'Website type is required'),
        packageType: z.string().optional(),
        desiredWebsiteName: z.string().optional(),
        referenceWebsite: z.string().optional(),
        similarToWebsite: z.string().optional(),
        projectDetails: z.string().optional(),
        paymentInfo: z
            .object({
                method: z.string().optional(),
                senderNumber: z.string().optional(),
                amount: z.number().optional(),
                transactionId: z.string().optional(),
                date: z.string().optional(),
            })
            .optional(),
    }),
});

// ==================== SERVICE ====================
const monthExpr = { $dateToString: { format: '%Y-%m', date: '$orderDate' } };
// cancelled সহ সবই হিসাবে ধরা হয় — cancel করলেও টাকা রিফান্ড না করলে collection এ থাকে।
// রিফান্ড করলে refund installment (negative) দিয়ে totalPaid নিজেই কমে যাবে।
const ACTIVE = { $nin: ['request', 'rejected'] };

const nextSlNo = async (): Promise<number> => {
    const last = await ProjectClient.findOne().sort({ slNo: -1 }).select('slNo');
    return (last?.slNo || 0) + 1;
};

// Project ID: EXP + YY + MM + serial (গ্লোবাল, এক করে বাড়ে) — যেমন EXP2607019
const nextProjectSerial = async (): Promise<number> => {
    const last = await ProjectClient.findOne({ projectSerial: { $exists: true } })
        .sort({ projectSerial: -1 })
        .select('projectSerial');
    return (last?.projectSerial || 0) + 1;
};
const makeProjectId = (serial: number, date: Date): string => {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `EXP${yy}${mm}${String(serial).padStart(3, '0')}`;
};

const ProjectTrackerService = {
    // ---------- Client side ----------
    // অর্ডার রিকোয়েস্ট তৈরি + (email থাকলে) অটো user account বানানো ও auto-login token ফেরত
    async createRequest(payload: any): Promise<{ doc: IProjectClient; account: any }> {
        const orderDate = new Date();
        const serial = await nextProjectSerial();
        const doc = await ProjectClient.create({
            ...payload,
            email: payload.email || undefined,
            orderDate,
            status: 'request',
            slNo: await nextSlNo(),
            projectSerial: serial,
            projectId: makeProjectId(serial, orderDate),
        });

        try {
            await NotificationService.createNotification({
                forAdmin: true,
                title: 'New Project Order Request',
                message: `${payload.clientName} (${payload.phone}) — ${payload.websiteType}`,
                type: 'order',
            });
        } catch (err) {
            console.error('Notification error:', err);
        }

        // ---- Auto user account (email + phone) ----
        // email দিলে account বানাই; default password = phone number (ক্লায়েন্ট সহজে লগইন করতে পারে)
        let account: any = { created: false };
        if (payload.email) {
            try {
                const email = payload.email.toLowerCase().trim();
                const existing = await User.findOne({ email });
                if (existing) {
                    // আগে থেকেই account আছে — নতুন করে বানাবো না, শুধু auto-login token দিই
                    const tokens = AuthService.generateTokens({
                        userId: existing._id!.toString(),
                        email: existing.email,
                        role: existing.role,
                    });
                    account = {
                        created: false,
                        alreadyExists: true,
                        accessToken: tokens.accessToken,
                        user: {
                            _id: existing._id!.toString(),
                            email: existing.email,
                            firstName: existing.firstName,
                            lastName: existing.lastName,
                            phone: existing.phone,
                            role: existing.role,
                        },
                    };
                } else {
                    const parts = String(payload.clientName || 'Client').trim().split(/\s+/);
                    const firstName = parts[0] || 'Client';
                    const lastName = parts.slice(1).join(' ') || '.';
                    const newUser = await User.create({
                        email,
                        phone: payload.phone,
                        firstName,
                        lastName,
                        password: payload.phone, // default password = phone (pre-save hook এ hash হবে)
                        role: 'student',
                        status: 'active',
                        isEmailVerified: false,
                    });
                    const tokens = AuthService.generateTokens({
                        userId: newUser._id!.toString(),
                        email: newUser.email,
                        role: newUser.role,
                    });
                    account = {
                        created: true,
                        accessToken: tokens.accessToken,
                        user: {
                            _id: newUser._id!.toString(),
                            email: newUser.email,
                            firstName: newUser.firstName,
                            lastName: newUser.lastName,
                            phone: newUser.phone,
                            role: newUser.role,
                        },
                    };
                }
            } catch (err) {
                console.error('Auto-account creation error:', err);
                account = { created: false, error: true };
            }
        }

        return { doc, account };
    },

    // ---------- Requests inbox ----------
    async getRequests() {
        return ProjectClient.find({ status: 'request' }).sort({ createdAt: -1 });
    },

    async setRequestStatus(id: string, approve: boolean) {
        const doc = await ProjectClient.findById(id);
        if (!doc) throw new AppError(404, 'Request not found');
        doc.status = approve ? 'pending' : 'rejected';
        await doc.save();
        return doc;
    },

    // Confirm একটি request — Total Payment বাধ্যতামূলক।
    // দুইটি আলাদা confirmation: paymentConfirmed (paid amount রেকর্ড হয়) + orderConfirmed (tracker এ ঢোকে)।
    async confirmRequest(id: string, data: any) {
        const doc = await ProjectClient.findById(id);
        if (!doc) throw new AppError(404, 'Request not found');

        const total = Number(data.totalProjectAmount);
        if (!total || total <= 0) {
            throw new AppError(400, 'অর্ডার কনফার্ম করতে Total Payment (অর্ডার অ্যামাউন্ট) দেওয়া বাধ্যতামূলক');
        }
        doc.totalProjectAmount = total;

        // Optional — না দিলেও সমস্যা নেই
        if (data.projectDeliveryDate) doc.projectDeliveryDate = new Date(data.projectDeliveryDate);
        if (data.nextPayDate) doc.nextPayDate = new Date(data.nextPayDate);
        if (data.installmentCount) doc.installmentCount = Number(data.installmentCount);

        // ---- Payment Confirmation ---- paid amount কে advance installment হিসেবে রেকর্ড
        if (data.paymentConfirmed) {
            const paid = Number(data.paidAmount) || 0;
            if (paid > 0) {
                doc.installments = [
                    { no: 1, amount: paid, date: new Date(), note: 'Advance (payment confirmed)' },
                ];
            }
        }

        // ---- Order Confirmation ---- request → active (tracker এ চলে যায়)
        if (data.orderConfirmed) doc.status = 'pending';

        await doc.save(); // pre-save hook: totalPaid / totalDue / duePercentage auto হিসাব
        return doc;
    },

    // ---------- Projects ----------
    // packageType অনুযায়ী Domain/Hosting registry sync করে।
    // without_domain_hosting → এই project থেকে auto তৈরি রেকর্ড মুছে যায়
    // (হাতে যোগ করা রেকর্ডে হাত পড়ে না — শুধু fromProject: true গুলো)।
    async syncProjectDomain(project: any, dh: any) {
        const projectId = project?.projectId;
        if (!projectId) return;

        const pkg = project.packageType || 'without_domain_hosting';
        if (pkg === 'without_domain_hosting') {
            await Domain.deleteMany({ linkedProjectId: projectId, fromProject: true });
            return;
        }

        const type = pkg === 'with_domain_hosting' ? 'both' : pkg === 'with_hosting' ? 'hosting' : 'domain';
        const d = dh || {};
        const fields: any = {
            domainName: d.domainName || project.desiredWebsiteName || project.clientName,
            type,
            hostingGB: d.hostingGB ? Number(d.hostingGB) : undefined,
            owner: d.owner || project.clientName,
            linkedProjectId: projectId,
            linkedClientName: `${project.clientName}${project.companyBrand ? ` (${project.companyBrand})` : ''}`,
            billing: d.billing === 'included' ? 'included' : 'separate',
            fromProject: true,
            buyPrice: Number(d.buyPrice) || 0,
            sellPrice: Number(d.sellPrice) || 0,
            provider: d.provider || undefined,
            purchaseDate: d.purchaseDate ? new Date(d.purchaseDate) : project.orderDate || new Date(),
            expiryDate: d.expiryDate ? new Date(d.expiryDate) : undefined,
            note: d.note || undefined,
        };

        // একই project এ বারবার confirm/edit করলে যেন duplicate না হয়
        const existing = await Domain.findOne({ linkedProjectId: projectId, fromProject: true });
        if (existing) {
            Object.assign(existing, fields);
            await existing.save(); // pre-save: profit auto
            return existing;
        }
        return Domain.create(fields);
    },

    async createProject(payload: any) {
        const { domainHosting, ...rest } = payload;
        const orderDate = payload.orderDate ? new Date(payload.orderDate) : new Date();
        const serial = await nextProjectSerial();
        const doc = await ProjectClient.create({
            ...rest,
            orderDate,
            status: payload.status && payload.status !== 'request' ? payload.status : 'pending',
            slNo: await nextSlNo(),
            projectSerial: serial,
            projectId: makeProjectId(serial, orderDate),
        });
        await this.syncProjectDomain(doc, domainHosting);
        return doc;
    },

    async getProjects(month?: string, status?: string) {
        const query: any = { status: ACTIVE };
        if (status) query.status = status;
        let projects: any[] = await ProjectClient.find(query).sort({ orderDate: 1, slNo: 1 }).lean();
        if (month) {
            projects = projects.filter(
                (p) => p.orderDate && new Date(p.orderDate).toISOString().slice(0, 7) === month
            );
        }

        // Dynamic Domain/Hosting — registry থেকে linked domain দেখে packageType নির্ধারণ
        const domains = await Domain.find().lean();
        const byProject: Record<string, any[]> = {};
        domains.forEach((d: any) => {
            if (d.linkedProjectId) (byProject[d.linkedProjectId] = byProject[d.linkedProjectId] || []).push(d);
        });
        projects = projects.map((p) => {
            const linked = byProject[p.projectId] || [];
            const has = linked.length > 0;
            // linked domain এর Type (domain / hosting / both) দেখে packageType — ৩ রকম হতে পারে
            const hasDomain = linked.some((d) => (d.type || 'both') === 'domain' || (d.type || 'both') === 'both');
            const hasHosting = linked.some((d) => (d.type || 'both') === 'hosting' || (d.type || 'both') === 'both');
            const packageType = hasDomain && hasHosting
                ? 'with_domain_hosting'
                : hasDomain
                    ? 'with_domain'
                    : hasHosting
                        ? 'with_hosting'
                        : 'without_domain_hosting';
            return {
                ...p,
                linkedDomains: linked,
                hasDomainHosting: has,
                packageType, // dynamic
                domainBuy: linked.reduce((s, d) => s + (d.buyPrice || 0), 0),
                domainSell: linked.reduce((s, d) => s + (d.sellPrice || 0), 0),
                domainProfitLinked: linked.reduce((s, d) => s + (d.profit || 0), 0),
            };
        });
        return projects;
    },

    async updateProject(id: string, payload: any) {
        const doc = await ProjectClient.findById(id);
        if (!doc) throw new AppError(404, 'Project not found');
        // domainHosting schema field নয় — Domain registry তে আলাদা করে sync হয়
        const { domainHosting, ...rest } = payload;
        Object.assign(doc, rest);
        await doc.save(); // pre-save hook এ সব auto হিসাব
        if (payload.packageType !== undefined || domainHosting) {
            await this.syncProjectDomain(doc, domainHosting);
        }
        return doc;
    },

    async deleteProject(id: string) {
        const doc = await ProjectClient.findByIdAndDelete(id);
        if (!doc) throw new AppError(404, 'Project not found');
        return doc;
    },

    // ---------- Money Receipt / Order Confirmation ----------
    async sendReceipt(id: string, payload: any) {
        const doc = await ProjectClient.findById(id);
        if (!doc) throw new AppError(404, 'Project not found');

        const receiptNo = `EWR-${Date.now().toString(36).toUpperCase().slice(-7)}`;
        const receipt: IReceipt = {
            receiptNo,
            sentAt: new Date(),
            message: payload.message,
            options: payload.options || {},
            sentToEmail: doc.email,
            emailSent: false,
        };

        // Email পাঠানোর চেষ্টা (SMTP configured না থাকলে graceful fail)
        if (payload.sendEmail && doc.email) {
            try {
                receipt.emailSent = await EmailService.sendMoneyReceiptEmail(doc.email, {
                    receiptNo,
                    project: doc,
                    options: payload.options || {},
                    message: payload.message,
                });
            } catch (err) {
                console.error('Receipt email error:', err);
                receipt.emailSent = false;
            }
        }

        doc.receipts = [...(doc.receipts || []), receipt];
        await doc.save();

        // ইউজার account থাকলে notification
        try {
            const user = await User.findOne({ email: (doc.email || '').toLowerCase() });
            if (user) {
                await NotificationService.createNotification({
                    forUser: user._id as Types.ObjectId,
                    forAdmin: false,
                    title: 'Money Receipt',
                    message: `আপনার অর্ডার (${doc.websiteType}) এর মানি রিসিট #${receiptNo} তৈরি হয়েছে।`,
                    type: 'order',
                });
            }
        } catch (err) {
            console.error('Receipt notification error:', err);
        }

        return { receipt, emailSent: receipt.emailSent };
    },

    // ইউজার ড্যাশবোর্ডের জন্য — নিজের email এর সব receipt সহ প্রজেক্ট
    async getMyReceipts(email: string) {
        if (!email) return [];
        const projects = await ProjectClient.find({
            email: email.toLowerCase(),
            'receipts.0': { $exists: true },
        }).sort({ updatedAt: -1 });
        return projects;
    },

    // ---------- Monthly folders ----------
    async getMonths() {
        const projectMonths = await ProjectClient.aggregate([
            { $match: { status: ACTIVE, orderDate: { $ne: null } } },
            {
                $group: {
                    _id: monthExpr,
                    projectCount: { $sum: 1 },
                    totalValue: { $sum: '$totalProjectAmount' },
                    totalPaid: { $sum: '$totalPaid' },
                    totalDue: { $sum: '$totalDue' },
                },
            },
        ]);

        const expenseMonths = await Expense.aggregate([
            { $match: { costDate: { $ne: null } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$costDate' } },
                    totalExpenses: { $sum: '$amount' },
                },
            },
        ]);
        const expenseMap = new Map(expenseMonths.map((e) => [e._id, e.totalExpenses]));

        // Domain/Hosting profit per month (purchaseDate অনুযায়ী)
        const domainMonths = await Domain.aggregate([
            { $match: { purchaseDate: { $ne: null } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$purchaseDate' } },
                    domainProfit: { $sum: '$profit' },
                },
            },
        ]);
        const domainMap = new Map(domainMonths.map((d) => [d._id, d.domainProfit]));

        const seen = new Set(projectMonths.map((m) => m._id));
        const extra = expenseMonths
            .filter((e) => !seen.has(e._id))
            .map((e) => ({ _id: e._id, projectCount: 0, totalValue: 0, totalPaid: 0, totalDue: 0 }));

        return [...projectMonths, ...extra]
            .map((m) => ({
                monthKey: m._id,
                projectCount: m.projectCount,
                totalValue: m.totalValue,
                totalPaid: m.totalPaid,
                totalDue: m.totalDue,
                totalExpenses: expenseMap.get(m._id) || 0,
                // Total Profit = Collection + Domain/Hosting Profit - Expenses
                totalProfit: (m.totalPaid || 0) + (domainMap.get(m._id) || 0) - (expenseMap.get(m._id) || 0),
            }))
            .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    },

    // Google Sheet এর উপরের summary block (cancelled সহ — রিফান্ড না করলে টাকা থাকে)
    async getSummary(month?: string) {
        const projects = await this.getProjects(month);
        const p = projects.reduce(
            (acc, x: any) => {
                acc.totalProjectValue += x.totalProjectAmount || 0;
                acc.totalCollection += x.totalPaid || 0;
                acc.totalDue += x.totalDue || 0;
                return acc;
            },
            { totalProjectValue: 0, totalCollection: 0, totalDue: 0 }
        );

        const allExpenses = await Expense.find();
        const monthExpenses = month
            ? allExpenses.filter(
                  (e) => e.costDate && new Date(e.costDate).toISOString().slice(0, 7) === month
              )
            : allExpenses;
        const totalExpenses = monthExpenses.reduce((s, e) => s + (e.amount || 0), 0);

        // Domain/Hosting profit — registry থেকে, ওই মাসের (purchaseDate অনুযায়ী)
        const allDomains = await Domain.find();
        const monthDomains = month
            ? allDomains.filter(
                  (d) => d.purchaseDate && new Date(d.purchaseDate).toISOString().slice(0, 7) === month
              )
            : allDomains;
        // billing অনুযায়ী — included হলে sell আগেই collection এ আছে, শুধু খরচ বাদ যায়
        const domainProfit = monthDomains.reduce((s, d) => s + domainRevenueImpact(d), 0);

        return {
            month: month || 'all',
            projectCount: projects.length,
            ...p,
            domainProfit,
            totalExpenses,
            // Total Profit = Collection + Domain/Hosting এর net impact (registry) - Expenses
            totalProfit: p.totalCollection + domainProfit - totalExpenses,
            pendingRequests: await ProjectClient.countDocuments({ status: 'request' }),
        };
    },

    // মাসের প্রতিদিনের orders (orderDate অনুযায়ী) + collection (paid installment date অনুযায়ী)
    async getDailyStats(month: string) {
        const projects = await this.getProjects(month);
        const [y, m] = month.split('-').map(Number);
        const days = new Date(y, m, 0).getDate();
        const orders = new Array(days + 1).fill(0);
        const collection = new Array(days + 1).fill(0);

        projects.forEach((p: any) => {
            if (p.orderDate) {
                const d = new Date(p.orderDate);
                if (d.getFullYear() === y && d.getMonth() + 1 === m) orders[d.getDate()]++;
            }
            (p.installments || []).forEach((i: any) => {
                if (i.paid !== false && i.date) {
                    const d = new Date(i.date);
                    if (d.getFullYear() === y && d.getMonth() + 1 === m) collection[d.getDate()] += i.amount || 0;
                }
            });
        });

        const result = [];
        for (let day = 1; day <= days; day++) {
            result.push({ day: String(day).padStart(2, '0'), orders: orders[day], collection: collection[day] });
        }
        return result;
    },

    // ---------- Expenses ----------
    async getExpenses(month?: string) {
        let expenses = await Expense.find().sort({ costDate: -1 });
        if (month) {
            expenses = expenses.filter(
                (e) => e.costDate && new Date(e.costDate).toISOString().slice(0, 7) === month
            );
        }
        return expenses;
    },

    async createExpense(payload: any) {
        const last = await Expense.findOne().sort({ slNo: -1 }).select('slNo');
        return Expense.create({
            ...payload,
            costDate: payload.costDate ? new Date(payload.costDate) : new Date(),
            slNo: (last?.slNo || 0) + 1,
        });
    },

    async updateExpense(id: string, payload: any) {
        const doc = await Expense.findById(id);
        if (!doc) throw new AppError(404, 'Expense not found');
        Object.assign(doc, payload);
        if (payload.costDate) doc.costDate = new Date(payload.costDate);
        await doc.save();
        return doc;
    },

    async deleteExpense(id: string) {
        const doc = await Expense.findByIdAndDelete(id);
        if (!doc) throw new AppError(404, 'Expense not found');
        return doc;
    },

    // ---------- Domain / Hosting (মাসভিত্তিক — purchaseDate অনুযায়ী) ----------
    async getDomains(month?: string) {
        let domains = await Domain.find().sort({ createdAt: -1 });
        if (month) {
            domains = domains.filter(
                (d) => d.purchaseDate && new Date(d.purchaseDate).toISOString().slice(0, 7) === month
            );
        }
        return domains;
    },

    async getDomainSummary(month?: string) {
        const domains = await this.getDomains(month);
        return domains.reduce(
            (acc, d) => {
                acc.count += 1;
                acc.totalBuy += d.buyPrice || 0;
                acc.totalSell += d.sellPrice || 0;
                acc.totalProfit += d.profit || 0; // raw sell - buy (billing নির্বিশেষে)
                acc.revenueImpact += domainRevenueImpact(d); // মাসের লাভে আসল অবদান
                if (d.billing === 'included') acc.includedCount += 1;
                return acc;
            },
            { count: 0, totalBuy: 0, totalSell: 0, totalProfit: 0, revenueImpact: 0, includedCount: 0 }
        );
    },

    async createDomain(payload: any) {
        return Domain.create({
            ...payload,
            buyPrice: Number(payload.buyPrice) || 0,
            sellPrice: Number(payload.sellPrice) || 0,
            hostingGB: payload.hostingGB ? Number(payload.hostingGB) : undefined,
            purchaseDate: payload.purchaseDate ? new Date(payload.purchaseDate) : new Date(),
            expiryDate: payload.expiryDate ? new Date(payload.expiryDate) : undefined,
        });
    },

    async updateDomain(id: string, payload: any) {
        const doc = await Domain.findById(id);
        if (!doc) throw new AppError(404, 'Domain not found');
        Object.assign(doc, payload);
        if (payload.buyPrice !== undefined) doc.buyPrice = Number(payload.buyPrice) || 0;
        if (payload.sellPrice !== undefined) doc.sellPrice = Number(payload.sellPrice) || 0;
        if (payload.hostingGB !== undefined) doc.hostingGB = payload.hostingGB ? Number(payload.hostingGB) : undefined;
        if (payload.purchaseDate) doc.purchaseDate = new Date(payload.purchaseDate);
        if (payload.expiryDate) doc.expiryDate = new Date(payload.expiryDate);
        await doc.save(); // pre-save: profit auto
        return doc;
    },

    async deleteDomain(id: string) {
        const doc = await Domain.findByIdAndDelete(id);
        if (!doc) throw new AppError(404, 'Domain not found');
        return doc;
    },
};

// ==================== CONTROLLER ====================
const C = {
    createRequest: catchAsync(async (req, res) => {
        const { doc, account } = await ProjectTrackerService.createRequest(req.body);
        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: 'Order request submitted successfully',
            data: { id: doc._id, clientName: doc.clientName, account },
        });
    }),
    getRequests: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getRequests();
        sendResponse(res, { statusCode: 200, success: true, message: 'Requests fetched', data });
    }),
    approveRequest: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.setRequestStatus(req.params.id, true);
        sendResponse(res, { statusCode: 200, success: true, message: 'Request approved', data });
    }),
    rejectRequest: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.setRequestStatus(req.params.id, false);
        sendResponse(res, { statusCode: 200, success: true, message: 'Request rejected', data });
    }),
    confirmRequest: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.confirmRequest(req.params.id, req.body);
        sendResponse(res, { statusCode: 200, success: true, message: 'Order confirmed', data });
    }),
    createProject: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.createProject(req.body);
        sendResponse(res, { statusCode: 201, success: true, message: 'Project created', data });
    }),
    getProjects: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getProjects(
            req.query.month as string,
            req.query.status as string
        );
        sendResponse(res, { statusCode: 200, success: true, message: 'Projects fetched', data });
    }),
    updateProject: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.updateProject(req.params.id, req.body);
        sendResponse(res, { statusCode: 200, success: true, message: 'Project updated', data });
    }),
    deleteProject: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.deleteProject(req.params.id);
        sendResponse(res, { statusCode: 200, success: true, message: 'Project deleted', data });
    }),
    sendReceipt: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.sendReceipt(req.params.id, req.body);
        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: data.emailSent ? 'রিসিট তৈরি ও ইমেইলে পাঠানো হয়েছে' : 'রিসিট সংরক্ষণ হয়েছে (ইমেইল পাঠানো যায়নি/বন্ধ)',
            data,
        });
    }),
    getMyReceipts: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getMyReceipts(req.user!.email);
        sendResponse(res, { statusCode: 200, success: true, message: 'Receipts fetched', data });
    }),
    getMonths: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getMonths();
        sendResponse(res, { statusCode: 200, success: true, message: 'Months fetched', data });
    }),
    getSummary: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getSummary(req.query.month as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Summary fetched', data });
    }),
    getDailyStats: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getDailyStats(req.query.month as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Daily stats fetched', data });
    }),
    getExpenses: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getExpenses(req.query.month as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Expenses fetched', data });
    }),
    createExpense: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.createExpense(req.body);
        sendResponse(res, { statusCode: 201, success: true, message: 'Expense added', data });
    }),
    updateExpense: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.updateExpense(req.params.id, req.body);
        sendResponse(res, { statusCode: 200, success: true, message: 'Expense updated', data });
    }),
    deleteExpense: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.deleteExpense(req.params.id);
        sendResponse(res, { statusCode: 200, success: true, message: 'Expense deleted', data });
    }),
    // ---- Domains ----
    getDomains: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getDomains(req.query.month as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Domains fetched', data });
    }),
    getDomainSummary: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.getDomainSummary(req.query.month as string);
        sendResponse(res, { statusCode: 200, success: true, message: 'Domain summary', data });
    }),
    createDomain: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.createDomain(req.body);
        sendResponse(res, { statusCode: 201, success: true, message: 'Domain added', data });
    }),
    updateDomain: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.updateDomain(req.params.id, req.body);
        sendResponse(res, { statusCode: 200, success: true, message: 'Domain updated', data });
    }),
    deleteDomain: catchAsync(async (req, res) => {
        const data = await ProjectTrackerService.deleteDomain(req.params.id);
        sendResponse(res, { statusCode: 200, success: true, message: 'Domain deleted', data });
    }),
};

// ==================== ROUTES ====================
const router = express.Router();

// ---------- PUBLIC (client order form) ----------
router.post('/request', validateRequest(clientRequestValidation), C.createRequest);

// ---------- USER (authenticated, নিজের receipt) ----------
router.get('/my-receipts', authMiddleware, C.getMyReceipts);

// ---------- ADMIN ONLY ----------
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/admin/requests', C.getRequests);
router.patch('/admin/requests/:id/approve', C.approveRequest);
router.patch('/admin/requests/:id/reject', C.rejectRequest);
router.patch('/admin/requests/:id/confirm', C.confirmRequest);

router.get('/admin/months', C.getMonths);
router.get('/admin/summary', C.getSummary);
router.get('/admin/daily-stats', C.getDailyStats);

router.get('/admin/projects', C.getProjects);
router.post('/admin/projects', C.createProject);
router.patch('/admin/projects/:id', C.updateProject);
router.delete('/admin/projects/:id', C.deleteProject);
router.post('/admin/projects/:id/send-receipt', C.sendReceipt);

router.get('/admin/expenses', C.getExpenses);
router.post('/admin/expenses', C.createExpense);
router.patch('/admin/expenses/:id', C.updateExpense);
router.delete('/admin/expenses/:id', C.deleteExpense);

// Domain / Hosting
router.get('/admin/domains', C.getDomains);
router.get('/admin/domains/summary', C.getDomainSummary);
router.post('/admin/domains', C.createDomain);
router.patch('/admin/domains/:id', C.updateDomain);
router.delete('/admin/domains/:id', C.deleteDomain);

export const ProjectTrackerRoutes = router;
export default ProjectTrackerService;
