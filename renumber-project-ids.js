// ===================================================================
// এককালীন ডেটা সংশোধন — সব প্রজেক্টের নম্বর ১ থেকে টানা বসায়
//
// কী করে:
//   ১. request/rejected রেকর্ড থেকে নম্বর সরায় (ওগুলো প্রজেক্ট নয়, শুধু নম্বর আটকে রেখেছিল)
//   ২. চালু প্রজেক্টগুলোকে বর্তমান নম্বরের ক্রমেই সাজিয়ে ১, ২, ৩... করে বসায় — কোনো ফাঁক থাকে না
//   ৩. মাসের কোড প্রতিটা প্রজেক্টের নিজের orderDate থেকেই আসে (জুন=06, জুলাই=07, আগস্ট=08)
//   ৪. domain registry-র linkedProjectId নতুন আইডিতে মিলিয়ে দেয়, নইলে লিংক ভেঙে যেত
//
// চালানোর আগে পুরো projectclients ও domains কালেকশন JSON এ ব্যাকআপ হয়।
// দ্বিতীয়বার চালালে কিছু বদলাবে না (নম্বর আগে থেকেই টানা থাকবে)।
//
// কানেকশন স্ট্রিং .env এর DATABASE_URL থেকে আসে (স্ক্রিপ্টে পাসওয়ার্ড রাখা হয় না)।
//
//   node renumber-project-ids.js
// ===================================================================

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('DATABASE_URL পাওয়া যায়নি — .env ফাইলে সেট করুন (.env.example দেখুন)');
    process.exit(1);
}

const BACKUP = process.argv[2] || path.join(__dirname, 'renumber-backup.json');

// "EXP2608042" → 42 ; প্রথম ৪ ডিজিট YYMM, বাকিটা serial। প্রিফিক্স যা-ই হোক কাজ করে।
const serialOf = (id) => {
    const d = String(id || '').replace(/\D/g, '');
    return d.length >= 5 ? Number(d.slice(4)) || 0 : 0;
};
const makeId = (serial, date) => {
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `EXP${yy}${mm}${String(serial).padStart(3, '0')}`;
};

(async () => {
    await mongoose.connect(DATABASE_URL, { serverSelectionTimeoutMS: 20000 });
    const db = mongoose.connection.db;
    const PC = db.collection('projectclients');
    const DM = db.collection('domains');

    // ---------- ব্যাকআপ ----------
    const backup = { projectclients: await PC.find({}).toArray(), domains: await DM.find({}).toArray() };
    fs.writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
    console.log('ব্যাকআপ:', BACKUP,
        `(${backup.projectclients.length} project, ${backup.domains.length} domain)\n`);

    const all = backup.projectclients;
    const isActive = (p) => p.status !== 'request' && p.status !== 'rejected';

    // ---------- ১. request/rejected থেকে নম্বর সরানো ----------
    const stale = all.filter((p) => !isActive(p) && p.projectId);
    stale.forEach((p) => console.log(`  নম্বর সরছে: ${p.projectId} (${p.status}) — ${p.clientName}`));
    if (stale.length) {
        await PC.updateMany(
            { _id: { $in: stale.map((p) => p._id) } },
            { $unset: { projectId: '', projectSerial: '' } }
        );
    }
    console.log(`✓ ${stale.length}টি request/rejected রেকর্ড থেকে নম্বর সরানো হলো\n`);

    // ---------- ২. চালু প্রজেক্ট ১..N ----------
    // বর্তমান নম্বরের ক্রমই ধরে রাখি — শুধু ফাঁকগুলো বন্ধ হয়, কেউ আগে-পিছে হয় না
    const active = all.filter(isActive)
        .sort((a, b) => (serialOf(a.projectId) - serialOf(b.projectId)) || (a.slNo || 0) - (b.slNo || 0));

    const rename = new Map(); // পুরনো আইডি → নতুন আইডি (domain remap এর জন্য)
    let changed = 0;

    for (let i = 0; i < active.length; i++) {
        const p = active[i];
        const serial = i + 1;
        const newId = makeId(serial, p.orderDate ? new Date(p.orderDate) : new Date());
        if (p.projectId === newId && p.projectSerial === serial) continue;

        if (p.projectId && p.projectId !== newId) {
            rename.set(p.projectId, newId);
            console.log(`  ${String(serial).padStart(3)}  ${p.projectId} → ${newId}   ${p.clientName}`);
            changed++;
        }
        await PC.updateOne({ _id: p._id }, { $set: { projectId: newId, projectSerial: serial } });
    }
    console.log(`✓ ${active.length}টি প্রজেক্ট ১–${active.length} নম্বরে বসানো হলো (${changed}টির আইডি বদলাল)\n`);

    // ---------- ৩. domain registry ----------
    // প্রতিটা domain কে তার নিজের _id ধরে আপডেট করি — পরপর updateMany করলে
    // একটার নতুন আইডি আরেকটার পুরনো আইডির সাথে মিলে গিয়ে ভুল হতে পারত।
    let domFixed = 0;
    for (const d of backup.domains) {
        const to = rename.get(d.linkedProjectId);
        if (!to) continue;
        await DM.updateOne({ _id: d._id }, { $set: { linkedProjectId: to } });
        console.log(`  ${d.domainName}: ${d.linkedProjectId} → ${to}`);
        domFixed++;
    }
    console.log(`✓ ${domFixed}টি domain লিংক আপডেট হলো\n`);

    // ---------- যাচাই ----------
    const after = await PC.find({ projectId: { $nin: [null, ''] } })
        .project({ projectId: 1, projectSerial: 1, orderDate: 1, status: 1 }).toArray();
    const serials = after.map((p) => serialOf(p.projectId)).sort((a, b) => a - b);
    const expected = serials.length === after.length && serials.every((s, i) => s === i + 1);
    console.log('নম্বরওয়ালা প্রজেক্ট :', after.length);
    console.log('১ থেকে টানা?        :', expected ? `হ্যাঁ, ১–${serials.length} ✓` : 'না — ' + serials.join(','));

    const dupes = after.reduce((m, p) => m.set(p.projectId, (m.get(p.projectId) || 0) + 1), new Map());
    const dupList = [...dupes].filter(([, n]) => n > 1);
    console.log('ডুপ্লিকেট আইডি      :', dupList.length ? JSON.stringify(dupList) : 'নেই ✓');

    const wrongMonth = after.filter((p) => {
        const d = new Date(p.orderDate);
        return p.projectId.slice(3, 7) !== String(d.getFullYear()).slice(-2) + String(d.getMonth() + 1).padStart(2, '0');
    });
    console.log('মাসের কোড ভুল       :', wrongMonth.length ? wrongMonth.map((p) => p.projectId).join(', ') : 'নেই ✓');

    const ids = new Set(after.map((p) => p.projectId));
    const broken = (await DM.find({ linkedProjectId: { $nin: [null, ''] } }).toArray())
        .filter((d) => !ids.has(d.linkedProjectId));
    console.log('ভাঙা domain লিংক    :', broken.length ? broken.map((d) => `${d.domainName}(${d.linkedProjectId})`).join(', ') : 'নেই ✓');
    console.log('পরের অর্ডার পাবে    :', after.length + 1);

    process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
