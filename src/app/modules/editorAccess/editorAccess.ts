// ===================================================================
// ExtraWeb Backend - "editor" role: the money-free view of orders and domains
//
// An editor handles the website side of the business (order requests, projects, domains and hosting) but must never see a
// taka amount. Hiding numbers in the browser is not enough, so everything is enforced here, on the server:
//
//   - responses  → WHITELISTS: only the fields listed below leave the server for an editor. A money field added to a model
//                  later stays hidden until somebody deliberately adds it to a list (deny by default).
//   - requests   → the body of a write is filtered to the same kind of whitelist, so an editor can neither set nor wipe a price.
//
// Admins are not affected: every function here is only called when `req.user.role === 'editor'`.
// ===================================================================

import type { Request } from 'express';

export const isEditor = (req: Request): boolean => req.user?.role === 'editor';

const plain = (v: any): any => (v && typeof v.toObject === 'function' ? v.toObject() : v);

const pick = (obj: any, keys: readonly string[]): Record<string, any> => {
    const src = plain(obj) || {};
    const out: Record<string, any> = {};
    keys.forEach((k) => {
        if (src[k] !== undefined) out[k] = src[k];
    });
    return out;
};

// ---------------------------------------------------------------
// What an editor may READ
// ---------------------------------------------------------------
const DOMAIN_READ = [
    '_id', 'domainName', 'type', 'hostingGB', 'hostingPlan', 'provider', 'owner', 'ownerPhone', 'ownerEmail',
    'linkedProjectId', 'linkedClientName', 'fromProject', 'purchaseDate', 'expiryDate', 'nextPaymentDate',
    'status', 'autoRenew', 'cycleMonths', 'note', 'lastReminderAt', 'createdAt', 'updatedAt',
] as const;

const RENEWAL_READ = ['_id', 'date', 'fromExpiry', 'toExpiry', 'months', 'note'] as const; // no buy / sell price

const PROJECT_LITE_READ = ['projectId', 'clientName', 'companyBrand', 'phone', 'email', 'status', 'orderDate'] as const;

const PROJECT_READ = [
    '_id', 'slNo', 'projectId', 'projectSerial', 'messageDate', 'orderDate', 'orderNumber',
    'clientName', 'companyBrand', 'phone', 'email', 'websiteType', 'packageType',
    'desiredWebsiteName', 'referenceWebsite', 'similarToWebsite', 'projectDetails',
    'status', 'projectStartDate', 'projectDeliveryDate', 'workingDays', 'deliveryWeekOfMonth',
    'websiteUrl', 'submittedBy', 'assignedEmployee', 'hasDomainHosting', 'createdAt', 'updatedAt',
] as const;
// NOT in the list on purpose: paymentInfo, installments(+Count), every price / paid / due / profit field, nextPayDate,
// priceHistory, receipts, adminNote (admin's private notes may mention prices), domain buy / sell fields.

export const editorDomain = (d: any): Record<string, any> => {
    const src = plain(d) || {};
    const out = pick(src, DOMAIN_READ);
    out.renewals = (src.renewals || []).map((r: any) => pick(r, RENEWAL_READ));
    out.payments = []; // the payment ledger is money
    if (src.project !== undefined) out.project = src.project ? pick(src.project, PROJECT_LITE_READ) : null;
    return out;
};

export const editorProject = (p: any): Record<string, any> => {
    const src = plain(p) || {};
    const out = pick(src, PROJECT_READ);
    if (Array.isArray(src.linkedDomains)) out.linkedDomains = src.linkedDomains.map(editorDomain);
    return out;
};

export const editorProjects = (list: any[]): Record<string, any>[] => (list || []).map(editorProject);

// month folders: the name and how many projects, no totals
export const editorMonths = (list: any[]): { monthKey: string; projectCount: number }[] =>
    (list || []).map((m: any) => ({ monthKey: m.monthKey, projectCount: m.projectCount || 0 }));

// ---------------------------------------------------------------
// What an editor may WRITE
// ---------------------------------------------------------------
const PROJECT_WRITE = [
    'projectId', 'clientName', 'companyBrand', 'phone', 'email', 'websiteType', 'packageType',
    'desiredWebsiteName', 'referenceWebsite', 'similarToWebsite', 'projectDetails',
    'orderDate', 'messageDate', 'status', 'projectStartDate', 'projectDeliveryDate',
    'websiteUrl', 'submittedBy', 'assignedEmployee',
] as const;

const PROJECT_DOMAIN_WRITE = ['domainName', 'hostingGB', 'owner', 'provider', 'purchaseDate', 'expiryDate', 'note'] as const;

// A project body from an editor: no money, and no way to remove the project's domain / hosting record
// (switching the package to "without domain & hosting" deletes it — that is a delete, which only an admin may do).
export const editorProjectBody = (body: any): Record<string, any> => {
    const out = pick(body || {}, PROJECT_WRITE);
    if (out.packageType === 'without_domain_hosting') delete out.packageType;
    if (body?.domainHosting && typeof body.domainHosting === 'object') out.domainHosting = pick(body.domainHosting, PROJECT_DOMAIN_WRITE);
    if (out.status === 'request') delete out.status; // an editor cannot push a project back into the request inbox
    return out;
};

const DOMAIN_WRITE = [
    'domainName', 'type', 'hostingGB', 'hostingPlan', 'provider', 'owner', 'ownerPhone', 'ownerEmail',
    'linkedProjectId', 'purchaseDate', 'expiryDate', 'nextPaymentDate', 'cycleMonths', 'autoRenew', 'status', 'note', 'force',
] as const;

export const editorDomainBody = (body: any): Record<string, any> => pick(body || {}, DOMAIN_WRITE);

// a renewal from an editor: dates and note only (the price is taken from the record's own renewal price on the server)
export const editorRenewBody = (body: any): Record<string, any> => pick(body || {}, ['months', 'newExpiry', 'date', 'note']);
