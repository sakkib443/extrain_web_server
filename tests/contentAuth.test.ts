// ===================================================================
// /api/design and /api/page-content: who may read and write.
//
// Mounts the real routers on a bare express app. No database: the Mongoose models and User.findById are stubbed,
// and tokens are real JWTs signed with config.jwt.access_secret. Run with: npm test
// ===================================================================

import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../src/app/config';
import globalErrorHandler from '../src/app/middlewares/globalErrorHandler';
import { User } from '../src/app/modules/user/user.model';
import { Design } from '../src/app/modules/design/design.model';
import { DesignRoutes } from '../src/app/modules/design/design.routes';
import { PageContent } from '../src/app/modules/pageContent/pageContent.model';
import { PageContentRoutes } from '../src/app/modules/pageContent/pageContent.routes';

// ==================== Stubs ====================
const users: Record<string, object> = {
    '000000000000000000000001': { role: 'admin', status: 'active', isDeleted: false },
    '000000000000000000000002': { role: 'student', status: 'active', isDeleted: false },
    '000000000000000000000003': { role: 'mentor', status: 'active', isDeleted: false },
    '000000000000000000000004': { role: 'editor', status: 'active', isDeleted: false },
};
const [ADMIN, STUDENT, MENTOR, EDITOR] = Object.keys(users);

type Write = { model: string; filter?: unknown; fields?: Record<string, unknown> };
let writes: Write[] = [];

const stub = (target: unknown, methods: Record<string, unknown>) => Object.assign(target as object, methods);

stub(User, { findById: async (id: string) => users[id] ?? null });
stub(Design, {
    findBySection: async (section: string) => ({ section }),
    find: async () => [],
    findOne: async () => null,
    findOneAndUpdate: async (filter: unknown, update: { $set: Record<string, unknown> }) => {
        writes.push({ model: 'Design', filter, fields: update.$set });
        return update.$set;
    },
    create: async (doc: Record<string, unknown>) => {
        writes.push({ model: 'Design', fields: doc });
        return doc;
    },
});
stub(PageContent, {
    find: async () => [],
    findOne: async () => ({ isActive: true, save: async () => undefined }),
    findByPageAndSection: async () => ({ content: {} }),
    countDocuments: async () => 0,
    findOneAndUpdate: async (filter: unknown, update: { $set: Record<string, unknown> }) => {
        writes.push({ model: 'PageContent', filter, fields: update.$set });
        return update.$set;
    },
});

// ==================== Server ====================
const app = express();
app.use(express.json());
app.use('/api/design', DesignRoutes);
app.use('/api/page-content', PageContentRoutes);
app.use(globalErrorHandler);

let server: Server;
let base: string;

before(async () => {
    await new Promise<void>((resolve) => {
        server = app.listen(0, () => resolve());
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
    server.close();
});
beforeEach(() => {
    writes = [];
});

const tokenFor = (userId: string, role = 'student') =>
    jwt.sign({ userId, email: 'test@example.com', role }, config.jwt.access_secret);

const call = async (method: string, path: string, opts: { token?: string; body?: unknown } = {}) => {
    const res = await fetch(`${base}${path}`, {
        method,
        headers: {
            ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
            ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        },
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    return { status: res.status, json: (await res.json()) as { success: boolean; data: unknown } };
};

// ==================== Route table ====================
// Read from the routers, not typed out, so a route added later is covered here without anyone remembering to add it.
type RouterLayer = { route?: { path: string; methods: Record<string, boolean> } };

const routesOf = (mount: string, router: unknown) =>
    ((router as { stack: RouterLayer[] }).stack)
        .filter((layer) => layer.route)
        .flatMap((layer) =>
            Object.keys(layer.route!.methods).map((method) => ({
                method: method.toUpperCase(),
                pattern: `${mount}${layer.route!.path}`,
            }))
        );

const PUBLIC_ROUTES = ['GET /api/design/:section', 'GET /api/page-content/public/:pageKey'];

// A body that passes validation for each write, so an admin reaches the controller.
const VALID_BODY: Record<string, unknown> = {
    'POST /api/design/': { section: 'hero', heroContent: {} },
    'PATCH /api/design/:section': { isActive: true },
    'PATCH /api/page-content/:pageKey/:sectionKey': { content: { title: 'x' } },
    'PATCH /api/page-content/:pageKey': { sections: [{ sectionKey: 'hero', content: { title: 'x' } }] },
};

const allRoutes = [...routesOf('/api/design', DesignRoutes), ...routesOf('/api/page-content', PageContentRoutes)].map(
    ({ method, pattern }) => ({
        method,
        pattern,
        name: `${method} ${pattern}`,
        // /:pageKey -> /home, /:sectionKey -> /hero, /:section -> /hero
        path: pattern.replace(':pageKey', 'home').replace(/:section(Key)?/, 'hero').replace(/\/$/, ''),
        body: VALID_BODY[`${method} ${pattern}`],
    })
);
const adminRoutes = allRoutes.filter((route) => !PUBLIC_ROUTES.includes(route.name));

test('the route table is what we expect', () => {
    assert.equal(allRoutes.length, 12);
    assert.equal(adminRoutes.length, 10);
    for (const route of allRoutes.filter((r) => r.method !== 'GET')) {
        assert.ok(adminRoutes.includes(route), `${route.name} is a write and must not be public`);
    }
});

// ==================== Access ====================
for (const route of adminRoutes) {
    test(`${route.name}: anonymous gets 401`, async () => {
        const { status } = await call(route.method, route.path, { body: route.body });
        assert.equal(status, 401);
        assert.deepEqual(writes, []);
    });

    test(`${route.name}: a bad token gets 401`, async () => {
        const forged = jwt.sign({ userId: ADMIN, role: 'admin' }, 'not-the-real-secret');
        const { status } = await call(route.method, route.path, { token: forged, body: route.body });
        assert.equal(status, 401);
        assert.deepEqual(writes, []);
    });

    for (const [role, userId] of [['student', STUDENT], ['mentor', MENTOR], ['editor', EDITOR]]) {
        test(`${route.name}: ${role} gets 403`, async () => {
            const { status } = await call(route.method, route.path, { token: tokenFor(userId, role), body: route.body });
            assert.equal(status, 403);
            assert.deepEqual(writes, []);
        });
    }

    test(`${route.name}: admin succeeds`, async () => {
        const { status, json } = await call(route.method, route.path, { token: tokenFor(ADMIN, 'admin'), body: route.body });
        assert.equal(status, route.method === 'POST' ? 201 : 200, JSON.stringify(json));
    });
}

test('the role comes from the database: a token claiming admin for a student gets 403', async () => {
    const { status } = await call('PATCH', '/api/design/contact', {
        token: tokenFor(STUDENT, 'admin'),
        body: { contactContent: {} },
    });
    assert.equal(status, 403);
    assert.deepEqual(writes, []);
});

test('public reads still answer without a login', async () => {
    assert.equal((await call('GET', '/api/design/contact')).status, 200);
    assert.equal((await call('GET', '/api/page-content/public/contact')).status, 200);
});

// ==================== Admin pages keep saving ====================
// The exact body each dashboard page sends.
for (const [section, field] of [
    ['hero', 'heroContent'],
    ['digitalProducts', 'digitalProductsContent'],
    ['whatWeProvide', 'whatWeProvideContent'],
    ['contact', 'contactContent'],
    ['aboutHero', 'aboutHeroContent'],
    ['aboutMission', 'aboutMissionContent'],
    ['aboutStats', 'aboutStatsContent'],
    ['aboutFeatures', 'aboutFeaturesContent'],
    ['aboutFounder', 'aboutFounderContent'],
    ['aboutGlobal', 'aboutGlobalContent'],
    ['aboutCTA', 'aboutCTAContent'],
]) {
    test(`admin saving ${section} writes ${field}`, async () => {
        const { status } = await call('PATCH', `/api/design/${section}`, {
            token: tokenFor(ADMIN, 'admin'),
            body: { [field]: { badge: { text: 'x' } } },
        });
        assert.equal(status, 200);
        assert.deepEqual(writes, [{ model: 'Design', filter: { section }, fields: { [field]: { badge: { text: 'x' } } } }]);
    });
}

// ==================== Whitelist ====================
test('PATCH /api/design/:section writes only that section\'s fields', async () => {
    const { status } = await call('PATCH', '/api/design/hero', {
        token: tokenFor(ADMIN, 'admin'),
        body: {
            heroContent: { badge: { text: 'x' } },
            isActive: false,
            section: 'navbar',
            contactContent: { hero: {} },
            _id: '000000000000000000000009',
            createdAt: '2000-01-01',
            somethingElse: true,
        },
    });
    assert.equal(status, 200);
    assert.deepEqual(writes, [
        { model: 'Design', filter: { section: 'hero' }, fields: { heroContent: { badge: { text: 'x' } }, isActive: false } },
    ]);
});

test('POST /api/design stores only the whitelisted fields', async () => {
    const { status } = await call('POST', '/api/design', {
        token: tokenFor(ADMIN, 'admin'),
        body: { section: 'hero', heroContent: {}, _id: '000000000000000000000009', createdAt: '2000-01-01' },
    });
    assert.equal(status, 201);
    assert.deepEqual(writes, [{ model: 'Design', fields: { heroContent: {}, section: 'hero' } }]);
});

test('a body with nothing for this section is refused, not saved', async () => {
    const { status } = await call('PATCH', '/api/design/hero', {
        token: tokenFor(ADMIN, 'admin'),
        body: { contactContent: { hero: {} } },
    });
    assert.equal(status, 400);
    assert.deepEqual(writes, []);
});

for (const section of ['nonsense', 'constructor', '__proto__']) {
    test(`an unknown section (${section}) is refused, not upserted`, async () => {
        const { status } = await call('PATCH', `/api/design/${section}`, {
            token: tokenFor(ADMIN, 'admin'),
            body: { isActive: true },
        });
        assert.equal(status, 404);
        assert.deepEqual(writes, []);
    });
}

test('content that is not an object is refused', async () => {
    const token = tokenFor(ADMIN, 'admin');
    assert.equal((await call('PATCH', '/api/design/contact', { token, body: { contactContent: 'x' } })).status, 400);
    assert.equal((await call('PATCH', '/api/design/aboutStats', { token, body: { aboutStatsContent: [] } })).status, 400);
    assert.equal((await call('PATCH', '/api/page-content/home/hero', { token, body: {} })).status, 400);
    assert.equal((await call('PATCH', '/api/page-content/home/hero', { token, body: { content: 'x' } })).status, 400);
    assert.equal((await call('PATCH', '/api/page-content/home', { token, body: { sections: 'x' } })).status, 400);
    assert.deepEqual(writes, []);
});

test('sectionKey cannot be a query operator', async () => {
    const { status } = await call('PATCH', '/api/page-content/home', {
        token: tokenFor(ADMIN, 'admin'),
        body: { sections: [{ sectionKey: { $ne: null }, content: {} }] },
    });
    assert.equal(status, 400);
    assert.deepEqual(writes, []);
});
