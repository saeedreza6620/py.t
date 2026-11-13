// v147 gate: the calm routine («پوستم به هم ریخته») never names a product it told her not to use.
// Loads the real claude/calm.js in a tiny sandbox and checks calmPlan on the screenshot case + 3000 random routines
// built from the real catalog: every routine product lands in exactly one place (stop / aside / one routine step),
// suspects are never in a routine step, and a step with nothing safe gives guidance instead of a product.
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url).pathname;
const catSrc = fs.readFileSync(root + 'lite/public/legacy/catalog-routine.js', 'utf8');
const products = [];
for (const chunk of catSrc.split('{"id":"').slice(1)) {
  const m = chunk.match(/^([^"]+)","name":"([^"]+)"[^]*?"role":"([a-z_]+)"/);
  if (!m || !/"basis":"/.test(chunk)) continue;
  const block = chunk;
  const cls = [...block.matchAll(/"cls":"([A-Z_0-9]+)"/g)].map(x => x[1]);
  const fl = (block.match(/"flags":\[([^\]]*)\]/) || [, ''])[1].match(/[a-z_]+/g) || [];
  const filters = (block.match(/"filters":"([a-z]+)"/) || [])[1] || '';
  products.push({ id: m[1], name: m[2], role: m[3], actives: cls.map(c => ({ cls: c })), flags: fl, rinseOff: /"rinseOff":true/.test(block), filters });
}
if (products.length < 50) { console.error('catalog parse failed', products.length); process.exit(1); }
const byId = new Map(products.map(p => [p.id, p]));

const store = {};
const noop = () => {};
const el = () => null;
const ctx = {
  window: {}, console,
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v) } },
  document: { readyState: 'complete', addEventListener: noop, getElementById: el, querySelector: el, createElement: () => ({}), head: { appendChild: noop }, body: { append: noop, appendChild: noop } },
  setTimeout: noop, fetch: () => ({ then: () => ({ then: () => ({ catch: noop }) }) }),
  Intl, Date, Math, JSON, String, Object, Array, Number, RegExp,
};
ctx.window.BWCatalog = { formula: id => byId.get(id) };
ctx.window.PRODUCTS = products.map(p => ({ id: p.id, name: p.name }));
ctx.PRODUCTS = ctx.window.PRODUCTS;
ctx.addEventListener = noop;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + 'claude/calm.js', 'utf8').replace(/window\.addEventListener\(/g, 'void(').replace(/^\(function\(\)\{/m, '(function(){var window=this.window;'), ctx);
const calmPlan = ctx.window.BWCalmPlan;
if (typeof calmPlan !== 'function') { console.error('BWCalmPlan not exported'); process.exit(1); }

// info() as calm.js builds it (strong / flags), with optional recent / bad marks
const STRONG = /^(RETINOID|AHA|BHA|VITC_LAA)$/;
const info = (id, extra = {}) => { const f = byId.get(id); const cls = f.actives.map(a => a.cls); return { id, name: f.name, cls, fl: f.flags, rinse: f.rinseOff, role: f.role, filters: f.filters, strong: cls.some(c => STRONG.test(c)) || f.flags.includes('high_strength'), ...extra } };

let fail = 0;
const check = (name, ok, detail = '') => { if (!ok) { fail++; console.error('FAIL', name, detail) } };

function verify(label, L, sus, sym) {
  const P = calmPlan(L, sus, sym);
  const inSteps = [...P.am, ...P.pm].filter(r => r.p).map(r => r.p.id);
  const stopIds = P.stop.map(i => i.id), asideIds = P.aside.map(a => a.id);
  for (const id of sus) check(label + ': suspect in routine step', !inSteps.includes(id), id);
  for (const id of asideIds) check(label + ': aside in routine step', !inSteps.includes(id), id);
  for (const i of L) {
    const n = (stopIds.includes(i.id) ? 1 : 0) + (asideIds.includes(i.id) ? 1 : 0) + (new Set(inSteps).has(i.id) ? 1 : 0);
    check(label + ': product placed exactly once', n === 1, i.id + ' x' + n);
  }
  for (const r of [...P.am, ...P.pm]) {
    if (r.p) { const i = L.find(x => x.id === r.p.id); check(label + ': unsafe product named', !i.strong && !i.fl.includes('fragrance') && !i.fl.includes('essential_oil') && !i.recent && !i.bad, r.p.id) }
    check(label + ': every step has guidance', typeof r.how === 'string' && r.how.length > 10, r.step);
  }
  return P;
}

// 1) the reported case: suspects = the Beauty of Joseon sunscreen + Garnier micellar; they must not come back as «use this»
{
  const L = ['garnier-dry', 'boj-relief', 'dr-althea-345'].filter(id => byId.has(id)).map(id => info(id));
  const P = verify('screenshot', L, ['boj-relief', 'garnier-dry'], ['red', 'dry']);
  const named = [...P.am, ...P.pm].filter(r => r.p).map(r => r.p.id);
  check('screenshot: micellar not suggested', !named.includes('garnier-dry'));
  check('screenshot: sunscreen not suggested', !named.includes('boj-relief'));
  check('screenshot: sunscreen step explains mineral + shade', /مینرال/.test(P.am[2].how) && /سایه/.test(P.am[2].how));
  check('screenshot: cleanser step says suspect', /مظنون/.test(P.pm[0].how));
}
// 2) a recent product that was not ticked is put aside, never suggested
{
  const L = [info('dr-althea-345', { recent: true }), info('garnier-dry')];
  const P = verify('recent', L, [], ['burn']);
  check('recent: put aside', P.aside.some(a => a.id === 'dr-althea-345'));
}
// 3) random routines from the real catalog
let seed = 147; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const SYM = ['burn', 'red', 'bumps', 'deep', 'dry', 'hives'];
for (let t = 0; t < 3000; t++) {
  const n = 1 + Math.floor(rnd() * 7), ids = new Set();
  while (ids.size < n) ids.add(products[Math.floor(rnd() * products.length)].id);
  const L = [...ids].map(id => info(id, { recent: rnd() < 0.2, bad: rnd() < 0.1 }));
  const sus = L.filter(() => rnd() < 0.4).map(i => i.id);
  const sym = SYM.filter(() => rnd() < 0.35);
  verify('random#' + t, L, sus, sym);
}
if (process.env.SHOW) { const L = ["garnier-dry","boj-relief","dr-althea-345"].map(id=>info(id)); console.log(JSON.stringify(calmPlan(L,["boj-relief","garnier-dry"],["red","dry"]),null,1)) }
if (fail) { console.error(fail + ' failures'); process.exit(1) }
console.log('calm-plan: ok (screenshot case, recent case, 3000 random routines from ' + products.length + ' catalog products)');
