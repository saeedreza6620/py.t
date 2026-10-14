/* Comparison uses declared product names and known actives, not guessed full INCI. */
(function () {
  'use strict';

  const MAX_SELECTION = 8;
  const registry = {
    'somebymi-retinol': {tags: ['retinol'], leaveOn: true},
    'ordinary-salicylic': {tags: ['bha'], leaveOn: true},
    'axisy-ahabha': {tags: ['aha', 'bha'], leaveOn: true, provisional: true},
    'ordinary-azelaic': {tags: ['azelaic'], leaveOn: true},
    'medik8-toner': {tags: ['azelaic', 'niacinamide'], leaveOn: true},
    'ordinary-niacinamide': {tags: ['niacinamide'], leaveOn: true},
    'centella-teatree': {tags: ['bha'], leaveOn: false},
    'cerave-sa': {tags: ['bha'], leaveOn: false},
    'cerave-acne': {tags: ['bha'], leaveOn: false},
    'medicube-vita-c': {tags: ['vitamin-c'], leaveOn: true},
    'arencia-vitc': {tags: ['vitamin-c'], leaveOn: true, provisional: true}
  };
  // Prefer the shared catalog formulas (catalog-routine.js) over the hand list above;
  // this also covers Bright Max, Medicube and every other product in the catalog.
  if (window.BWCatalog) {
    const map = {RETINOID: 'retinol', BHA: 'bha', AHA: 'aha', AZELAIC: 'azelaic', VITAMIN_B3: 'niacinamide', VITC: 'vitamin-c', VITC_LAA: 'vitamin-c', VITC_DERIV: 'vitamin-c'};
    PRODUCTS.forEach(p => {
      const f = window.BWCatalog.formula(p.id); if (!f) return;
      const tags = [...new Set(f.actives.map(a => map[a.cls]).filter(Boolean))];
      if (tags.length) registry[p.id] = {tags, leaveOn: !f.rinseOff, provisional: f.basis === 'declared_name' || f.flags.includes('variant_unconfirmed')};
      else delete registry[p.id];
    });
  }
  const sourceLinks = '<div class="compare-foot">این بررسی سه چیز را جدا می‌کند: منع ایمنی، فشار تجمعی چند اکتیو و اطلاعات ناکافی. هم‌زمانی همیشه به معنی «ممنوع» نیست؛ نسخه، درصد و برچسب همان محصول را بررسی کن. <a href="https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids" target="_blank" rel="noopener noreferrer">FDA: AHA و حساسیت به آفتاب</a> · <a href="https://www.aad.org/public/everyday-care/skin-care-secrets/anti-aging/retinoid-retinol" target="_blank" rel="noopener noreferrer">AAD: شروع رتینوئید</a> · <a href="https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care" target="_blank" rel="noopener noreferrer">AAD: بارداری</a></div>';
  const index = Object.create(null);
  PRODUCTS.forEach(p => { index[p.id] = p; });
  let ids = readJSON('bw_check_products', []);
  if (!Array.isArray(ids)) ids = [];
  ids = ids.filter((id, pos) => typeof id === 'string' && index[id] && ids.indexOf(id) === pos).slice(0, MAX_SELECTION);
  let times = readJSON('bw_check_times', {});
  if (!times || typeof times !== 'object' || Array.isArray(times)) times = {};
  const search = document.getElementById('checkSearch');
  const choices = document.getElementById('checkCatalog');
  const selected = document.getElementById('selectedProducts');
  const results = document.getElementById('comparisonResult');
  if (!search || !choices || !selected || !results) return;

  function safe(text) { return formatMixed(text || ''); }
  function defaultTime(p) { return p.cat === 'ضد آفتاب' ? 'am' : 'pm'; }
  function timeFor(id) { return times[id] === 'am' || times[id] === 'pm' ? times[id] : defaultTime(index[id]); }
  function picture(p) {
    return p.image ? '<img loading="lazy" decoding="async" src="' + p.image + '" alt="" onerror="this.hidden=true" class="' + (p.id === 'dr-althea-345' ? 'photo-upright' : '') + '">' : '<span aria-hidden="true" style="width:42px;text-align:center;color:#8b806b">◇</span>';
  }
  function activeCaption(id) {
    if (window.BWCatalog && window.BWCatalog.formula(id)) return safe(window.BWCatalog.caption(id));
    const r = registry[id];
    if (!r) return 'ترکیبات کلیدی ثبت نشده';
    const names = {retinol: 'رتینول', bha: 'BHA', aha: 'AHA', azelaic: 'آزلائیک', niacinamide: 'نیاسینامید', 'vitamin-c': 'ویتامین C'};
    return r.tags.map(tag => names[tag]).join(' + ') + (r.provisional ? ' · نیاز به تطبیق مدل' : r.leaveOn ? '' : ' · شویندهٔ آبکشی');
  }
  function persist() { storage.setItem('bw_check_products', JSON.stringify(ids)); storage.setItem('bw_check_times', JSON.stringify(times)); }
  function active(id, tag, leaveOn) { const r = registry[id]; return !!r && r.tags.includes(tag) && (leaveOn === undefined || r.leaveOn === leaveOn); }
  function issue(type, title, body) { return {type, title, body}; }

  function analyzeSelection(selectedIds, selectedTimes, profile) {
    const notes = [];
    if (selectedIds.length < 2) return {issues: [], insufficient: true};
    const same = phase => selectedIds.filter(id => selectedTimes[id] === phase);
    ['am', 'pm'].forEach(phase => {
      const phaseIds = same(phase), phaseName = phase === 'am' ? 'صبح' : 'شب';
      const retinol = phaseIds.find(id => active(id, 'retinol', true));
      const acidSerums = phaseIds.filter(id => active(id, 'aha', true) || active(id, 'bha', true));
      if (retinol && acidSerums.length) {
        notes.push(issue('warn', 'رتینول و لایه‌بردار در یک ' + phaseName,
          safe(index[retinol].name) + ' + ' + acidSerums.map(id => safe(index[id].name)).join('، ') + '؛ این یک منع مطلق نیست، اما ممکن است خشکی، سوزش یا قرمزی را بیشتر کند. برای شروع، شب‌های جدا انتخاب کن.'));
      }
      if (acidSerums.length > 1) {
        notes.push(issue('warn', 'چند لایه‌بردارِ باقی‌ماندنی در یک ' + phaseName,
          acidSerums.map(id => safe(index[id].name)).join(' + ') + '؛ به‌جای روی‌هم گذاشتن، یکی را انتخاب کن و واکنش پوست را ببین.'));
      }
      const bhaCleanser = phaseIds.find(id => active(id, 'bha', false));
      const bhaSerum = phaseIds.find(id => active(id, 'bha', true));
      if (bhaCleanser && bhaSerum) {
        notes.push(issue('mild', 'BHA در شوینده و محصولِ باقی‌ماندنی',
          safe(index[bhaCleanser].name) + ' آبکشی می‌شود، اما کنار ' + safe(index[bhaSerum].name) + ' ممکن است برای پوست حساس زیاد باشد. از دفعات کمتر شروع کن.'));
      }
      ['شوینده', 'ضد آفتاب'].forEach(cat => {
        const repeated = phaseIds.filter(id => index[id].cat === cat);
        if (repeated.length > 1) notes.push(issue('mild', 'تکرار ' + cat + ' در ' + phaseName,
          'در یک نوبت معمولاً انتخاب یکی از این نقش کافی است؛ تکرار آن لزوماً تداخل اکتیو نیست.'));
      });
    });
    if (selectedIds.some(id => active(id, 'retinol') && selectedTimes[id] === 'am')) {
      notes.push(issue('mild', 'زمان مصرف رتینول', 'برای این بررسی، رتینول را در بخش شب بگذار و دستور همان محصول را دنبال کن.'));
    }
    const hasExfoliant = selectedIds.some(id => active(id, 'aha') || active(id, 'bha', true));
    const hasSpf = selectedIds.some(id => index[id].cat === 'ضد آفتاب' && selectedTimes[id] === 'am');
    if (hasExfoliant && !hasSpf) notes.push(issue('mild', 'ضد آفتاب در انتخاب‌های صبح دیده نمی‌شود',
      'در صورت استفاده از لایه‌بردار، محافظت در برابر آفتاب را در روتین روزانه نگه دار.'));
    const provisional = selectedIds.filter(id => registry[id] && registry[id].provisional);
    if (provisional.length) notes.push(issue('mild', 'مدل یا فرمول هنوز قطعی نیست',
      provisional.map(id => safe(index[id].name)).join('، ') + '؛ هشدار مربوط به این مورد فقط بر پایهٔ نام ارسالی است. لیست ترکیبات بسته را پیش از تصمیم نهایی چک کن.'));
    const unknown = selectedIds.filter(id => !registry[id] && !(window.BWCatalog && window.BWCatalog.formula(id)) && !['میسلار واتر', 'شوینده', 'آبرسان', 'مرطوب‌کننده', 'ضد آفتاب'].includes(index[id].cat));
    if (unknown.length) notes.push(issue('mild', 'اکتیو بعضی محصولات هنوز ثبت نشده',
      unknown.map(id => safe(index[id].name)).join('، ') + '؛ نبود هشدار برای این‌ها به معنی سازگاریِ تأییدشده نیست.'));
    if (profile && (profile.skin === 'حساس' || profile.concerns.includes('قرمزی/حساسیت')) &&
        selectedIds.filter(id => registry[id] && registry[id].leaveOn && registry[id].tags.some(tag => ['retinol', 'aha', 'bha'].includes(tag))).length > 1) {
      notes.push(issue('mild', 'پوست واکنش‌پذیر', 'چند اکتیو قوی انتخاب شده است؛ هر مورد را جدا و به‌تدریج وارد روتین کن.'));
    }
    return {issues: notes, insufficient: false};
  }

  function renderCheckCatalog() {
    const query = norm(search.value);
    const found = PRODUCTS.filter(p => !query || norm(p.name + ' ' + p.en + ' ' + p.cat).includes(query));
    choices.innerHTML = found.map(p => '<button type="button" class="check-option ' + (ids.includes(p.id) ? 'selected' : '') + '" data-check-id="' + p.id + '" aria-pressed="' + ids.includes(p.id) + '">' + picture(p) + '<span class="mini-label">' + safe(p.name) + '<small>' + safe(p.cat) + '</small></span><span class="marker">' + (ids.includes(p.id) ? '✓' : '+') + '</span></button>').join('') || '<div class="compare-empty">محصولی پیدا نشد</div>';
  }
  function renderComparison() {
    renderCheckCatalog();
    selected.innerHTML = ids.map(id => {
      const p = index[id], time = timeFor(id);
      return '<div class="compare-row">' + picture(p) + '<span class="label">' + safe(p.name) + '<small class="active-caption">' + activeCaption(id) + '</small></span><select data-time-id="' + id + '" aria-label="زمان استفاده از ' + p.name.replace(/"/g, '&quot;') + '"><option value="am" ' + (time === 'am' ? 'selected' : '') + '>صبح</option><option value="pm" ' + (time === 'pm' ? 'selected' : '') + '>شب</option></select><button type="button" data-remove-id="' + id + '" aria-label="حذف از بررسی">×</button></div>';
    }).join('') || '<div class="compare-empty">دو یا چند محصول را از فهرست بالا انتخاب کن.</div>';
    const plan = {};
    ids.forEach(id => { plan[id] = timeFor(id); });
    const report = analyzeSelection(ids, plan, state.profile);
    results.textContent = ids.length ? 'نتیجه کاتالوگ پایین همین بخش است؛ برای توضیح بیشتر «بررسی علمی روتین من» را بزن' : 'برای دیدن نتیجه متناسب با پوستت، محصول‌های روتینت را انتخاب کن';
    window.dispatchEvent(new CustomEvent('bw:comparison',{detail:{ids:[...ids],times:{...plan},report}}));
  }
  function addToCompare(id) {
    if (!index[id]) return;
    if (ids.includes(id)) { renderComparison(); return; }
    if (ids.length >= MAX_SELECTION) { toast('برای بررسی روشن‌تر، تا ۸ محصول انتخاب کن'); return; }
    ids.push(id); persist(); renderComparison();
  }
  window.addToCompare = addToCompare;
  window.renderComparison = renderComparison;
  window.analyzeBeautyWalletSelection = analyzeSelection;
  choices.addEventListener('click', e => {
    const button = e.target.closest('[data-check-id]'); if (!button) return;
    const id = button.dataset.checkId, pos = ids.indexOf(id);
    if (pos >= 0) { ids.splice(pos, 1); delete times[id]; persist(); renderComparison(); }
    else addToCompare(id);
  });
  selected.addEventListener('click', e => {
    const button = e.target.closest('[data-remove-id]'); if (!button) return;
    const id = button.dataset.removeId; ids = ids.filter(x => x !== id); delete times[id]; persist(); renderComparison();
  });
  selected.addEventListener('change', e => {
    if (!e.target.matches('[data-time-id]')) return;
    times[e.target.dataset.timeId] = e.target.value === 'am' ? 'am' : 'pm'; persist(); renderComparison();
  });
  search.addEventListener('input', renderCheckCatalog);
  document.getElementById('clearComparison').addEventListener('click', () => { ids = []; times = {}; persist(); renderComparison(); });
  document.getElementById('checkWalletAdd').addEventListener('click', () => {
    state.wallet.forEach(id => { if (index[id] && !ids.includes(id) && ids.length < MAX_SELECTION) ids.push(id); });
    persist(); renderComparison();
  });
  renderComparison();
})();
