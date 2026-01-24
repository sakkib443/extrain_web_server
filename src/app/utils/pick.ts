// ===================================================================
// Extrain Web Backend - Pick Utility
// Object থেকে নির্দিষ্ট keys বের করার জন্য utility
// ===================================================================

/**
 * pick - Extract specific keys from an object
 * Frontend থেকে আসা query parameters filter করতে এটা কাজে লাগে
 * 
 * @example
 * const filters = pick(req.query, ['search', 'category', 'minPrice', 'maxPrice']);
 * // { search: 'avada', category: 'ecommerce' }
 */
const pick = <T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    keys: K[]
): Partial<T> => {
    const finalObj: Partial<T> = {};

    for (const key of keys) {
        if (obj && Object.hasOwnProperty.call(obj, key)) {
            finalObj[key] = obj[key];
        }
    }

    return finalObj;
};

export default pick;
