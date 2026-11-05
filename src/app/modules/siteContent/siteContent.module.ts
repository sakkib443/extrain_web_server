// ===================================================================
// ExtraWeb Backend - Site content module
//
// Small pieces of the public website that the admin edits from the dashboard, stored as one document per key.
// Right now: "home-media" — every photo on the home page (hero, the two three-photo sections, the gallery layout).
//
//   GET /api/site-content/:key   public — what the website shows (null = use the built-in defaults)
//   PUT /api/site-content/:key   admin only — replaces the whole document
//
// A save is validated against a strict schema and only the cleaned copy is stored: unknown fields are dropped,
// every picture must be an https:// address or a file of the site (/…), text is length-limited.
// ===================================================================

import express from 'express';
import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../utils/AppError';
import { authMiddleware, authorizeRoles } from '../../middlewares/auth';

// ==================== MODEL ====================
const siteContentSchema = new Schema(
    {
        key: { type: String, required: true, unique: true, trim: true },
        data: { type: Schema.Types.Mixed, default: null },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, minimize: false }
);
export const SiteContent = mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);

// ==================== VALIDATION ====================
// a picture: https://… or a file of this site (/… but not //other-host) — no quotes, spaces, < > or backslashes,
// so it can never break out of an attribute or a CSS url('…')
const src = z
    .string()
    .max(1000)
    .regex(/^(https?:\/\/[^\s"'<>\\]+|\/(?!\/)[^\s"'<>\\]*)$/, 'Image must be a full https:// link or a site path');
const pos = z.string().regex(/^(100|\d{1,2}(\.\d{1,2})?)% (100|\d{1,2}(\.\d{1,2})?)%$/, 'Position looks like "50% 30%"');
const label = z.string().max(120);

const photo = z.object({
    src,
    full: src.optional(),
    label: label.optional(),
    labelBn: label.optional(),
    alt: label.optional(),
    pos: pos.optional(),
});
const slot = z.object({ src, pos: pos.optional() });

const homeMediaSchema = z.object({
    hero: z
        .object({
            slides: z.array(photo).min(1).max(6),
            background: src.optional(),
            overlay: z.number().int().min(0).max(90).optional(),
        })
        .optional(),
    services: z.array(slot).length(3).optional(),
    roadmap: z.array(slot).length(3).optional(),
    gallery: z
        .object({
            rowHeight: z.number().int().min(220).max(480),
            rows: z
                .array(
                    z.object({
                        columns: z
                            .array(z.object({ w: z.number().int().min(120).max(800), items: z.array(photo).min(1).max(2) }))
                            .min(1)
                            .max(30),
                    })
                )
                .min(1)
                .max(3),
        })
        .optional(),
});

// the keys that exist, each with its schema (an unknown key is a 404, so nothing else can be stored here)
const SCHEMAS: Record<string, z.ZodTypeAny> = {
    'home-media': homeMediaSchema,
};

const schemaFor = (key: string) => {
    const schema = SCHEMAS[key];
    if (!schema) throw new AppError(404, 'Unknown content');
    return schema;
};

// ==================== SERVICE ====================
export const SiteContentService = {
    async get(key: string) {
        schemaFor(key);
        const doc: any = await SiteContent.findOne({ key }).lean();
        return doc ? { data: doc.data, updatedAt: doc.updatedAt } : { data: null, updatedAt: null };
    },

    async set(key: string, body: any, userId?: string) {
        const parsed = schemaFor(key).safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.issues[0];
            throw new AppError(400, `${first.path.join('.') || 'data'}: ${first.message}`);
        }
        const doc: any = await SiteContent.findOneAndUpdate(
            { key },
            { $set: { data: parsed.data, updatedBy: userId } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        return { data: doc.data, updatedAt: doc.updatedAt };
    },
};

// ==================== ROUTES ====================
const router = express.Router();

router.get(
    '/:key',
    catchAsync(async (req, res) => {
        const result = await SiteContentService.get(req.params.key);
        res.set('Cache-Control', 'no-store'); // the dashboard and the site must see a save at once
        sendResponse(res, { statusCode: 200, success: true, message: 'Site content', data: result.data, meta: { updatedAt: result.updatedAt } as any });
    })
);

router.put(
    '/:key',
    authMiddleware,
    authorizeRoles('admin'),
    catchAsync(async (req, res) => {
        const result = await SiteContentService.set(req.params.key, req.body, req.user?.userId);
        sendResponse(res, { statusCode: 200, success: true, message: 'Saved', data: result.data, meta: { updatedAt: result.updatedAt } as any });
    })
);

export const SiteContentRoutes = router;
