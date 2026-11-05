// ===================================================================
// MotionBoss - Page Content Validation
// Zod validation schemas for page content writes
// ===================================================================

import { z } from 'zod';

// A section's content is free-form (its fields live in PAGE_DEFINITIONS) but it has to be an object.
const contentBlock = z.record(z.unknown());

const updateSectionContentZodSchema = z.object({
    body: z.object({
        content: contentBlock
    })
});

const updateMultipleSectionsZodSchema = z.object({
    body: z.object({
        sections: z.array(z.object({
            // A plain string only: this value goes straight into the update filter.
            sectionKey: z.string().min(1),
            content: contentBlock
        }))
    })
});

export const PageContentValidation = {
    updateSectionContentZodSchema,
    updateMultipleSectionsZodSchema
};
