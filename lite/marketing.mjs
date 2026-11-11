// Weekly marketing snapshot: the numbers an AI (or the team) needs to decide the next content pack.
// AGGREGATES ONLY — no names, phone numbers, device ids or message text ever leave this module.
// Weeks run Saturday → Friday in Tehran time (the Iranian week). Instagram numbers are typed in by the team
// on /admin/marketing (the app cannot read Instagram) and kept in DATA/marketing-ig.jsonl.
import fs from 'node:fs';
import path from 'node:path';

const DAY = 864e5;
const tehDate = (t) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date(t));
// Saturday that starts the Tehran week containing time t, as YYYY-MM-DD
function weekOf(t) {
  const d = tehDate(t); const [y, m, dd] = d.split('-').map(Number);
  const utc = Date.UTC(y, m - 1, dd); const dow = new Date(utc).getUTCDay(); // 0 Sun … 6 Sat
  const back = (dow + 1) % 7; // days since Saturday
  return new Date(utc - back * DAY).toISOString().slice(0, 10);
}
// funnel steps in order (event names from lite/server.mjs EVENTS)
export const FUNNEL = [
  ['app_open', 'باز شدن اپ'],
  ['wel_check', 'خوش‌آمد: بسنجم'], ['wel_calm', 'خوش‌آمد: پوستم به هم ریخته'], ['wel_care', 'خوش‌آمد: مراقبت روزانه'], ['wel_chat', 'خوش‌آمد: حرف بزنیم'],
  ['register', 'ثبت‌نام با شماره'],
  ['calm_open', 'دیدن «پوستم به هم ریخته»'], ['calm_start', 'شروع برنامه'], ['calm_reveal_ready', 'رسیدن به نتیجه‌ی تست'],
  ['today_tick', 'تیک روتین در صفحه‌ی امروز'], ['today_done', 'روتین کامل امروز'],
  ['gem_msg', 'پیام به دستیار'], ['chat_paywall', 'رسیدن به سقف پیام هدیه'], ['chat_unlock', 'ادامه‌ی گفت‌وگو با الماس'],
  ['paywall_view', 'دیدن صفحه‌ی الماس'], ['checkout_open', 'باز کردن تسویه'], ['checkout_go', '«ادامه و پرداخت»'],
  ['native_open', 'باز شدن اپ اندروید'], ['native_granted', 'روشن کردن یادآور اندروید'], ['ios_nudge_go', 'آیفون: راهنمای نصب'],
];
const IG_FIELDS = [
  ['saves', 'ذخیره'], ['shares', 'اشتراک‌گذاری'], ['keyword', 'کامنت «پوستم»'], ['dms', 'دایرکت جواب‌داده‌شده'],
  ['forum', 'جواب در انجمن'], ['followers', 'فالوئر (آخر هفته)'], ['reach', 'دسترسی (reach)'],
];

export function makeMarketing({ DATA, readJsonl, getUsers, getReqStatus, L2 }) {
  const IG = path.join(DATA, 'marketing-ig.jsonl');
  const igRows = () => readJsonl(IG);
  function saveIg(f) {
    const week = /^\d{4}-\d{2}-\d{2}$/.test(f.week || '') ? weekOf(Date.parse(f.week + 'T12:00:00Z')) : weekOf(Date.now());
    const row = { at: new Date().toISOString(), week };
    for (const [k] of IG_FIELDS) { const n = Number(String(f[k] ?? '').replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[^\d]/g, '')); if (Number.isFinite(n) && String(f[k] ?? '').trim() !== '') row[k] = Math.min(n, 1e9); }
    row.top = String(f.top || '').replace(/[\u0000-\u001f<>]/g, '').slice(0, 120);
    row.note = String(f.note || '').replace(/[\u0000-\u001f<>]/g, ' ').slice(0, 400);
    fs.appendFileSync(IG, JSON.stringify(row) + '\n');
    return row;
  }
  function snapshot(weeks = 8) {
    const now = Date.now(), cur = weekOf(now);
    const list = []; for (let i = weeks - 1; i >= 0; i--) list.push(weekOf(Date.parse(cur + 'T12:00:00Z') - i * 7 * DAY));
    const W = Object.fromEntries(list.map((w) => [w, { week: w, newUsers: 0, active: new Set(), events: {}, people: {}, orders: 0, proofs: 0, approved: 0, revenue: 0, ig: null }]));
    const ev = readJsonl(path.join(DATA, 'events.jsonl'));
    for (const e of ev) { const w = W[weekOf(e.at)]; if (!w) continue; if (e.d && e.d !== 'anon') w.active.add(e.d); w.events[e.t] = (w.events[e.t] || 0) + 1; (w.people[e.t] ||= new Set()).add(e.d || 'anon'); }
    const users = Object.values(getUsers() || {});
    for (const u of users) { const w = W[weekOf(u.first)]; if (w) w.newUsers++; }
    const st = getReqStatus() || {};
    for (const r of readJsonl(path.join(DATA, 'purchase-requests.jsonl'))) {
      if (r.method !== 'card') continue; const w = W[weekOf(r.at)]; if (!w) continue; w.orders++;
      const s = (st[r.ref] || {}).status; if (s === 'proof' || s === 'done') w.proofs++; if (s === 'done') { w.approved++; w.revenue += Number(r.price) || 0; }
    }
    const ig = {}; for (const r of igRows()) ig[r.week] = { ...(ig[r.week] || {}), ...r }; // the latest entry for a week wins
    const out = list.map((k) => { const w = W[k]; const people = {}; for (const [t] of FUNNEL) people[t] = w.people[t] ? w.people[t].size : 0;
      const i = ig[k]; return { week: k, newUsers: w.newUsers, activeDevices: w.active.size, funnelPeople: people, eventCounts: w.events, orders: w.orders, proofs: w.proofs, approved: w.approved, revenueToman: w.revenue,
        instagram: i ? Object.fromEntries([...IG_FIELDS.map(([f]) => [f, i[f] ?? null]), ['top', i.top || ''], ['note', i.note || '']]) : null }; });
    let l2 = null; try { const s = L2 && L2.summary ? L2.summary() : null; if (s) { const { last, topSellers, ...rest } = s; l2 = rest; } } catch {}
    return {
      generatedAt: new Date().toISOString(), weekStartsOn: 'Saturday (Asia/Tehran)', privacy: 'aggregates only: no names, phones, device ids or texts',
      totals: { users: users.length, installed: users.filter((u) => u.installed).length, verified: users.filter((u) => u.verified).length,
        seen7d: users.filter((u) => u.last && now - Date.parse(u.last) < 7 * DAY).length, seen30d: users.filter((u) => u.last && now - Date.parse(u.last) < 30 * DAY).length },
      funnelLabels: Object.fromEntries(FUNNEL), weeks: out, layer2: l2,
    };
  }
  return { snapshot, saveIg, igRows, weekOf, IG_FIELDS };
}
