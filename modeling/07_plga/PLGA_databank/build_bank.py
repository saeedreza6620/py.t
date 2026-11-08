import json, pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

F = "Arial"; HDR = PatternFill("solid", fgColor="0E1B4D"); YEL = PatternFill("solid", fgColor="FFF2B3")
GRN = PatternFill("solid", fgColor="E3F4EA"); GRY = PatternFill("solid", fgColor="F1F3F8")
thin = Side(style="thin", color="C9CFDD"); BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
def sheet(wb, name, head, rows, widths, rtl=True, input_cols=()):
    ws = wb.create_sheet(name); ws.sheet_view.rightToLeft = rtl
    ws.append(head)
    for c in ws[1]: c.font = Font(name=F, bold=True, color="FFFFFF", size=10); c.fill = HDR; c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center"); c.border = BOX
    for r in rows: ws.append(r)
    for row in ws.iter_rows(min_row=2):
        for c in row:
            c.font = Font(name=F, size=10); c.alignment = Alignment(wrap_text=True, vertical="top"); c.border = BOX
            if c.column in input_cols: c.fill = YEL
    for i, w in enumerate(widths, 1): ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "B2"; ws.row_dimensions[1].height = 34
    return ws

wb = Workbook(); wb.remove(wb.active)

# ---------- 1. guide ----------
ws = wb.create_sheet("راهنما"); ws.sheet_view.rightToLeft = True; ws.column_dimensions["A"].width = 120
guide = [
 ("بانک داده مدل‌سازی رهایش از میکروسفرهای PLGA", True),
 ("هدف: هر مجموعه داده فقط وقتی وارد مدل می‌شود که پارامترهای اصلی‌اش از همان فرمولاسیون و همان مقاله آمده باشد؛ نه اینکه یک پارامتر را از یک مقاله و بقیه را از جای دیگر بگذاریم.", False),
 ("قانون ۱ (مجموعه کامل): برای هر فرمولاسیون، شعاع یا توزیع اندازه، بارگذاری، نوع و Mw پلیمر، نسبت LA:GA، انتهای زنجیر، محیط رهایش و منحنی رهایش باید از خود همان مقاله باشد.", False),
 ("قانون ۲ (کمبود شفاف): اگر پارامتری گزارش نشده، فقط به‌صورت بازه با برچسب «گزارش نشده» وارد می‌شود و هرگز با منحنی رهایش برازش نمی‌شود.", False),
 ("قانون ۳ (داده‌های جانبی همان ذرات): داده‌های Mw(t)، کاهش جرم، جذب آب، تخلخل و pH اگر برای همان ذرات اندازه‌گیری شده‌اند، اولویت دارند؛ این‌ها همان چیزی‌اند که گام‌های ۲ تا ۴ را بدون برازش ممکن می‌کنند.", False),
 ("برگه «مقالات»: فهرست مقاله‌ها، اولویت، و دقیقاً کدام شکل و جدول باید استخراج شود. ستون زرد «ارسال شد؟» را خودت پر کن.", False),
 ("برگه «ماتریس پارامترها»: برای هر مقاله، هر پارامتر در کدام گام مدل لازم است. پس از استخراج، خانه‌ها با «دارد / ندارد / بازه» پر می‌شوند.", False),
 ("برگه «فرهنگ پارامترها»: معنی، واحد، گام مصرف، روش اندازه‌گیری و قاعده جایگزینی هر پارامتر.", False),
 ("برگه «LNG 2022 (نمونه کامل)»: یک ردیف کامل استخراج‌شده از مقاله‌ای که داریم، به‌عنوان الگوی پر کردن.", False),
 ("برگه «دیتاست LAI (Bannigan)»: ۱۸۱ منحنی رهایش با Mw، LA:GA، بارگذاری و اندازه، از مخزن متن‌باز (MIT). منبع هر گروه باید از Supplementary همان مقاله پیدا شود تا قانون ۱ رعایت شود.", False),
 ("رنگ‌ها: زرد = خانه‌ای که تو پر می‌کنی · سبز = داده‌ای که الان در دست است · خاکستری = مرجع نظری (داده آزمایشی ندارد).", False),
]
for i, (t, b) in enumerate(guide, 1):
    c = ws.cell(row=i, column=1, value=t); c.font = Font(name=F, size=13 if b else 10.5, bold=b, color="0E1B4D" if b else "222222")
    c.alignment = Alignment(wrap_text=True, vertical="top"); ws.row_dimensions[i].height = 30 if b else 32
r = len(guide) + 2
ws.cell(row=r, column=1, value="تعداد مقاله‌های ارسال‌شده (خودکار):").font = Font(name=F, bold=True)
ws.cell(row=r + 1, column=1, value="=COUNTIF('مقالات'!L:L,\"بله\")&\" از \"&COUNTA('مقالات'!A:A)-1").font = Font(name=F, bold=True, color="13603F")

# ---------- 2. papers ----------
H = ["کد", "اولویت", "وضعیت فعلی", "مقاله (نویسندگان، سال، مجله، جلد:صفحه)", "DOI / لینک", "سیستم (دارو / پلیمر / شکل)",
     "چرا لازم است", "چه چیزی استخراج شود (شکل و جدول)", "داده‌های جانبی همان ذرات", "گام‌های مدل", "نیاز به SI؟", "ارسال شد؟"]
P = [
 ["P01", "A", "داریم (متن کامل)", "Sivasankaran S., Jonnalagadda S. 2022, Int. J. Pharm. 624:121994", "10.1016/j.ijpharm.2022.121994",
  "لوونورژسترل / PLLA / میکروذره اسپری‌درای ۴–۵.۵ µm", "تنها داده میکروذره فعلی؛ بارگذاری ۶ تا ۵۱٪", "شکل 7 (انجام شد)، جدول‌های 1، 3، 5، 6، 7", "Tg و بلورینگی؛ Mw و تخلخل ندارد", "1", "خیر", "بله"],
 ["P02", "A", "پیش‌نمایش داریم", "Chen H., Hu G., Ouyang D. 2026, Adv. Appl. Math. Mech. 18(3):897–922", "10.4208/aamm.OA-2024-0219",
  "پروژسترون / PLGA / میکروسفر (مدل سه‌بعدی FEM)", "مقاله پایه پایان‌نامه؛ بخش عددی", "معادلات، شرایط مرزی، جدول پارامترها، شکل مقایسه پروژسترون و منبع داده آن", "؟ (احتمالاً از Busatto 2018)", "1", "خیر", ""],
 ["P03", "A", "داریم (بدون SI)", "Mittapelly N. et al. 2024, ACS Appl. Bio Mater. 7:7453–7465", "10.1021/acsabm.4c01054",
  "بوسرلین، افاملانوتاید، بریمونیدین، نافارلین / PLGA / ایمپلنت", "مدل مکانیستی صنعتی (Certara) با همه CQAها", "جدول‌های S1 تا S4 (ابعاد، Mw، تخلخل، بارگذاری)، شکل‌های 5، 7، 8، 9", "Mw، LA:GA و تخلخل در SI", "1 تا 4", "بله، حتماً", ""],
 ["P04", "A", "باید بفرستی", "Busatto C., Pesoa J., Helbling I., Luna J., Estenoz D. 2018, Int. J. Pharm. 536(1):360–369 — Effect of particle size, polydispersity and polymer degradation on progesterone release from PLGA microparticles", "ri.conicet.gov.ar/handle/11336/34433",
  "پروژسترون / PLGA / میکروسفر، چند کسر اندازه", "هم‌دارو با مقاله پایه؛ اندازه، توزیع اندازه و تخریب هم‌زمان", "منحنی‌های رهایش هر کسر اندازه، توزیع اندازه، Mw(t)، جدول مشخصات پلیمر", "Mw(t) و توزیع اندازه همان ذرات", "1 تا 3", "اگر دارد", ""],
 ["P05", "A", "باید بفرستی", "Busatto C. et al. 2017, J. Appl. Polym. Sci. 134(43):45464 — heterogeneous hydrolytic degradation of PLGA microspheres", "",
  "PLGA بدون دارو / میکروسفر", "ثابت‌های هیدرولیز همان پلیمر P04، مستقل از داده رهایش", "Mw(t)، کاهش جرم، pH، اندازه", "همه داده‌ها تخریب است", "3", "اگر دارد", ""],
 ["P06", "A", "باید بفرستی", "Siepmann J., Elkharraz K., Siepmann F., Klose D. 2005, Biomacromolecules 6:2312–2319 — How autocatalysis accelerates drug release from PLGA-based microparticles", "",
  "لیدوکائین / PLGA / میکروذره، چند اندازه", "اثر اندازه بر خودکاتالیز؛ رهایش و Mw هم‌زمان", "رهایش هر اندازه، Mw(t)، pH داخلی، مشخصات پلیمر", "Mw(t) همان ذرات", "1 تا 3", "اگر دارد", ""],
 ["P07", "A", "باید بفرستی", "Klose D., Siepmann F., Elkharraz K., Krenzlin S., Siepmann J. 2006, Int. J. Pharm. 314:198–206 — How porosity and size affect the drug release mechanisms from PLGA-based microparticles", "",
  "لیدوکائین / PLGA / میکروذره", "تخلخل اندازه‌گیری‌شده؛ کلید گام ۲", "رهایش، تخلخل اولیه، توزیع اندازه، تصاویر SEM", "تخلخل همان ذرات", "1، 2", "اگر دارد", ""],
 ["P08", "A", "باید بفرستی", "Faisant N., Siepmann J., Benoit J.P. 2002, Eur. J. Pharm. Sci. 15:355–366 — PLGA-based microparticles: elucidation of mechanisms and a new, simple mathematical model", "",
  "5-فلوئورواوراسیل / PLGA / میکروذره، چند کسر اندازه", "مدل کلاسیک D وابسته به Mw؛ همین داده در دیتاست LAI هست (5-FU-PLGA)", "رهایش هر اندازه، Mw(t)، جدول اندازه‌ها", "Mw(t)", "1، 3", "خیر", ""],
 ["P09", "A", "باید بفرستی", "Raman C., Berkland C., Kim K., Pack D.W. 2005, J. Control. Release 103:149–158 — Modeling small-molecule release from PLG microspheres: effects of polymer degradation and nonuniform drug distribution", "",
  "پیروکسیکام (و رودامین) / PLG / میکروسفر تک‌اندازه", "ذرات تک‌اندازه: اثر R بدون خطای توزیع", "رهایش هر اندازه، Mw(t)، توزیع دارو در ذره", "Mw(t)", "1، 3", "خیر", ""],
 ["P10", "A", "باید بفرستی", "Berkland C., Kim K., Pack D.W. 2003, Pharm. Res. 20:1055–1062 — PLG microsphere size controls drug release rate through several competing factors", "",
  "پیروکسیکام، رودامین / PLG / میکروسفر تک‌اندازه", "همان ذرات P09 با اندازه‌های بیشتر", "منحنی‌های رهایش برای ۴ تا ۵ اندازه", "", "1", "خیر", ""],
 ["P11", "A", "باید بفرستی", "Gasmi H., Danede F., Siepmann J., Siepmann F. 2015, J. Control. Release 213:120–127 — Does PLGA microparticle swelling control drug release? New insight based on single particle swelling studies", "",
  "دگزامتازون / PLGA / میکروذره", "تورم تک‌ذره اندازه‌گیری‌شده: ورودی مستقل برای گام ۲ (همان روش ژلاتین)", "قطر ذره در زمان، رهایش، Mw(t)", "تورم و Mw(t) همان ذرات", "1 تا 3", "اگر دارد", ""],
 ["P12", "A", "باید بفرستی", "Andhariya J.V. et al. (Burgess lab) 2017, J. Control. Release 255:27–35 — In vitro–in vivo correlation of parenteral naltrexone-loaded PLGA microspheres", "",
  "نالترکسون / PLGA / میکروسفر (هم‌ارز Vivitrol)", "سویه صنعتی: ژنریک LAI و IVIVC", "رهایش، اندازه، تخلخل، Mw، Tg، بارگذاری هر فرمولاسیون", "تخلخل و Mw", "1 تا 4", "بله", ""],
 ["P13", "B", "باید بفرستی", "Berchane N.S., Carson K.H., Rice-Ficht A.C., Andrews M.J. 2007, Int. J. Pharm. 337:118–126", "",
  "پیروکسیکام / PLG / میکروسفر", "اثر قطر میانگین و پراکندگی اندازه", "رهایش، توزیع اندازه", "", "1", "خیر", ""],
 ["P14", "B", "باید بفرستی", "Casalini T., Rossi F., Lazzari S., Perale G., Masi M. 2014, Mol. Pharm. 11:4036–4048 — Mathematical modeling of PLGA microparticles: from polymer degradation to drug release", "",
  "چند دارو / PLGA / میکروذره (مدل)", "مدل کامل تخریب تا رهایش؛ جدول ثابت‌ها", "معادلات و جدول پارامترها، منبع داده‌ها", "", "3، 4", "اگر دارد", ""],
 ["P15", "B", "دسترسی آزاد", "Ford Versypt A.N., Arendt P.D., Pack D.W., Braatz R.D. 2015, PLoS ONE 10(8):e0135506", "pmc.ncbi.nlm.nih.gov/articles/PMC4540565",
  "PLGA / میکروسفر (حل تحلیلی واکنش–نفوذ)", "حل تحلیلی خودکاتالیز برای صحت‌سنجی کد گام ۳", "معادلات، ثابت‌ها، داده‌های مقایسه", "", "3", "خیر", ""],
 ["P16", "B", "داریم", "Ford Versypt A.N., Pack D.W., Braatz R.D. 2013, J. Control. Release 165:29–37 (مرور)", "dspace.mit.edu/handle/1721.1/101153",
  "مرور مدل‌های PLGA", "نقشه مدل‌ها و فهرست داده‌های منتشرشده", "جدول‌ها و فهرست مقالات داده", "", "همه", "خیر", "بله"],
 ["P17", "B", "داریم (متن‌باز)", "Bannigan P. et al. 2023, Nat. Commun. 14:35 + دیتاست MDF/GitHub (MIT)", "github.com/aspuru-guzik-group/long-acting-injectables",
  "۱۸۱ منحنی، ۴۳ ترکیب دارو–پلیمر", "بانک بزرگ برای آزمون عمومی و یادگیری ماشین", "Supplementary: جدول منبع هر گروه داده", "Mw، LA:GA، بارگذاری، SA/V", "1 تا 4، ML", "بله، SI", ""],
 ["P18", "C", "نظری", "Siepmann J., Siepmann F. 2012, J. Control. Release 161:351–362 — Modeling of diffusion controlled drug delivery", "pubmed.ncbi.nlm.nih.gov/22019555",
  "نظری", "حل‌های فیک برای داروی حل‌شده و پراکنده (گام ۱)", "معادلات کره", "", "1", "خیر", ""],
 ["P19", "C", "نظری", "Fredenberg S., Wahlgren M., Reslow M., Axelsson A. 2011, Int. J. Pharm. 415:34–52 (مرور سازوکارهای رهایش PLGA)", "",
  "نظری", "طبقه‌بندی سازوکارها و پارامترها", "—", "", "همه", "خیر", ""],
]
ws = sheet(wb, "مقالات", H, P, [6, 7, 15, 48, 30, 30, 34, 40, 26, 10, 10, 11], input_cols=(12,))
dv = DataValidation(type="list", formula1='"بله,خیر,در دسترس نیست"', allow_blank=True); ws.add_data_validation(dv); dv.add("L2:L200")
for row in ws.iter_rows(min_row=2):
    st = row[2].value or ""
    if st.startswith("داریم") or st.startswith("دسترسی آزاد"): 
        for c in row[:11]: c.fill = GRN
    elif st == "نظری":
        for c in row[:11]: c.fill = GRY
    row[11].fill = YEL

# ---------- 3. parameter matrix ----------
PARS = ["R یا توزیع اندازه", "بارگذاری دارو", "Cs در محیط", "MW و حجم مولی دارو", "LA:GA", "Mw0 و PDI", "انتهای زنجیر",
        "Tg", "بلورینگی", "تخلخل ε0", "جذب آب / تورم", "Mw(t)", "کاهش جرم(t)", "pH داخلی", "محیط (pH، T، حجم، همزدن)", "منحنی رهایش"]
STEP = ["1", "1", "1b", "1", "3", "3", "3", "2–3", "3", "2", "2", "3", "4", "3", "1", "همه"]
Hm = ["کد", "مقاله کوتاه"] + [f"{p}\n[گام {s}]" for p, s in zip(PARS, STEP)]
known = {"P01": ["دارد (D10/50/90)", "دارد", "فقط کف ≥0.02", "دارد", "100:0", "ندارد", "ندارد", "دارد", "دارد (جزئی)", "ندارد", "ندارد", "ندارد", "ندارد", "ندارد", "دارد (۵۰٪ اتانول)", "دارد"]}
short = {r[0]: r[3].split(" — ")[0][:60] for r in P}
rows = [[c, short[c]] + known.get(c, [""] * len(PARS)) for c in short]
ws = sheet(wb, "ماتریس پارامترها", Hm, rows, [6, 34] + [13] * len(PARS), input_cols=tuple(range(3, 3 + len(PARS))))
for row in ws.iter_rows(min_row=2):
    if row[0].value == "P01":
        for c in row[2:]: c.fill = GRN
ws.row_dimensions[1].height = 46

# ---------- 4. parameter dictionary ----------
Hd = ["پارامتر", "نماد", "واحد", "گام", "نقش در مدل", "روش اندازه‌گیری در مقاله", "اگر گزارش نشده بود"]
D = [
 ["شعاع ذره و توزیع آن", "R, D10/D50/D90", "µm", "1", "مقیاس زمان R²/D؛ با توزیع، میانگین‌گیری روی کسرها", "پراش لیزری، SEM، الک", "بدون آن مقاله وارد نمی‌شود"],
 ["بارگذاری واقعی دارو", "w, C0", "% w/w ؛ mg/ml", "1", "C0 در ذره؛ با Cs تعیین می‌کند دارو حل‌شده است یا پراکنده", "استخراج و UV/HPLC", "بدون آن وارد نمی‌شود"],
 ["حلالیت دارو در محیط رهایش", "Cs", "mg/ml", "1b", "سرعت جبهه انحلال: t50 ∝ C0R²/(D·Cs)", "شیک‌فلاسک در همان محیط", "بازه از منابع داروشناسی، با برچسب"],
 ["اندازه مولکول دارو", "MW, V_LeBas, r_s", "g/mol ؛ cm³/mol", "1", "D در آب با ویلکی–چنگ", "از ساختار شیمیایی", "همیشه قابل محاسبه"],
 ["نسبت لاکتید به گلیکولید", "LA:GA", "—", "3", "سرعت هیدرولیز؛ GA بیشتر = سریع‌تر", "برگه مشخصات پلیمر، NMR", "بدون آن گام ۳ ممکن نیست"],
 ["وزن مولکولی اولیه و پراکندگی", "Mw0, PDI", "kDa", "3", "زمان رسیدن به آستانه انحلال الیگومرها", "GPC", "از ویسکوزیته ذاتی با رابطه سازنده (با برچسب)"],
 ["انتهای زنجیر", "acid / ester", "—", "3", "غلظت اولیه کاتالیزور اسیدی (خودکاتالیز)", "برگه مشخصات (مثلاً RG 502H در برابر 502)", "بدون آن گام ۳ با برچسب «نامعلوم»"],
 ["دمای انتقال شیشه‌ای", "Tg", "°C", "2–3", "اگر Tg کمتر از ۳۷ درجه شود، شبکه نرم و حفره‌ها بسته یا باز می‌شوند", "DSC", "بازه از نوع پلیمر"],
 ["بلورینگی پلیمر و دارو", "χc", "—", "3", "نواحی بلوری کندتر تخریب می‌شوند؛ داروی بلوری دیرتر حل می‌شود", "DSC، XRD", "صفر برای PLGA بی‌شکل"],
 ["تخلخل اولیه", "ε0", "—", "2", "D مؤثر = D_w·f(ε)؛ مسیر آب‌پر", "پیکنومتری جیوه، BET، تحلیل تصویر SEM", "بازه با برچسب (مثل φ در ژلاتین)"],
 ["جذب آب و تورم", "Q یا قطر(t)", "—", "2", "ورود آب و باز شدن حفره‌ها", "وزن‌سنجی، اندازه تک‌ذره", "بدون آن گام ۲ فقط با بازه"],
 ["وزن مولکولی در زمان", "Mw(t)", "kDa", "3", "ثابت‌های هیدرولیز را مستقل از رهایش می‌دهد", "GPC روی نمونه‌های رهایش", "مهم‌ترین داده جانبی؛ نبودش یعنی برازش اجباری"],
 ["کاهش جرم در زمان", "m(t)", "%", "4", "فرسایش و آستانه انحلال الیگومرها", "وزن‌سنجی", "گام ۴ با برچسب"],
 ["pH داخل ذره", "pH_micro", "—", "3", "شدت خودکاتالیز", "پروب فلورسنت، EPR", "از مدل محاسبه می‌شود"],
 ["شرایط محیط رهایش", "pH, T, V, rpm, surfactant", "—", "1", "حلالیت، شرط sink، ویسکوزیته", "روش آزمون", "بدون آن وارد نمی‌شود"],
 ["منحنی رهایش", "M_t/M_∞ (t)", "%", "همه", "داده اعتبارسنجی؛ هرگز برای برازش D استفاده نمی‌شود", "UV/HPLC", "—"],
]
sheet(wb, "فرهنگ پارامترها", Hd, D, [26, 18, 14, 7, 46, 30, 34])

# ---------- 5. LNG example ----------
lng = json.load(open("/home/claude/PLGA_step1/plga_step1_LNG_results.json"))
He = ["بچ", "بارگذاری (w/w)", "D50 (µm)", "C0 (mg/ml)", "Tg (°C)", "بلورینگی دارو", "D مدل ε=0.1 (cm²/s)", "t50 گام 1a (s)", "t50 گام 1b (s)", "t50 داده (h)", "منبع"]
tg = [58.14, 56.68, 54.49, 54.13, 56.07]; cr = [0.0, 0.13, 0.33, 0.39, 0.59]; d50 = [5.52, 5.16, 4.91, 4.11, 4.31]
E = [[r["batch"], r["loading"], d50[i], round(r["C0_mg_ml"], 1), tg[i], cr[i], float(f"{r['D_mid']:.3g}"), float(f"{r['t50_1a_s']:.3g}"),
      float(f"{r['t50_1b_s']:.3g}"), (("< " if r["data_upper_bound"] else "") + f"{r['t50_data_h']:.3g}"), "جدول‌های 1، 3، 5، 6؛ شکل 7؛ این کار"] for i, r in enumerate(lng)]
ws = sheet(wb, "LNG 2022 (نمونه کامل)", He, E, [7, 12, 10, 11, 9, 11, 16, 13, 13, 12, 30])
for row in ws.iter_rows(min_row=2):
    for c in row: c.fill = GRN

# ---------- 6. LAI dataset groups ----------
d = pd.read_csv("/tmp/claude-0/-home-claude/a11b49a0-bef8-5992-ab58-10b375fbbd31/scratchpad/lai/few_shot_models/Dataset_17_feat.csv")
g = d.groupby("DP_Group").agg(n=("Experimental_index", "nunique"), LAGA=("LA/GA", "first"), Mw=("Polymer_MW", "first"),
                              DLC=("DLC", "first"), SAV=("SA-V", "first"), tmax=("Time", "max")).reset_index()
g["plga"] = g.DP_Group.str.endswith("-PLGA") | g.DP_Group.str.endswith("-PLA")
g = g.sort_values(["plga", "n"], ascending=[False, False])
Hl = ["گروه دارو–پلیمر", "تعداد منحنی", "LA/GA", "Mw پلیمر (Da)", "بارگذاری (DLC، نمونه اول)", "SA/V", "حداکثر زمان (روز)", "PLGA/PLA؟", "منبع اصلی (از SI مقاله Bannigan پر شود)"]
Lr = [[r.DP_Group, int(r.n), r.LAGA, r.Mw, r.DLC, r.SAV, round(r.tmax, 1), "بله" if r.plga else "خیر", ""] for r in g.itertuples()]
ws = sheet(wb, "دیتاست LAI (Bannigan)", Hl, Lr, [20, 10, 8, 13, 13, 9, 12, 10, 40], input_cols=(9,))
ws.cell(row=len(Lr) + 3, column=1, value="منبع: Bannigan et al. 2023, Nat. Commun. 14:35؛ داده از github.com/aspuru-guzik-group/long-acting-injectables (MIT). LA/GA = 0 برای پلیمرهای غیر PLGA. SA/V همان ستون مخزن است (واحد در مقاله).").font = Font(name=F, size=9, italic=True)
wb.save("PLGA_Data_Bank.xlsx"); print("saved")
