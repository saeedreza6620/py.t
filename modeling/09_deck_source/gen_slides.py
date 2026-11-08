import re, json, os
P = "deck4/project/slides/"
LOGO = "/_blob/2e56699f96a9b7d8a1bf2382522ffd63"
IMG = dict(steps="/_blob/678e09062f31898ff772d7fcf802615c", rmse="/_blob/b50a6e4d13ec8439c0193d9073dc0d16", resp="/_blob/d156aa7f3c1544135378524143502275",
           fields="/_blob/588cff55b33dfe69139c6a7a74a67b95", hu="/_blob/0aa2283dcfb3b3dfb321ccb2860c468f", mlad="/_blob/15c1eed871715a0a5310274df0303fd6")
TOTAL = 25
def rtl(t): return "&#8235;&#8207;" + t + "&#8207;&#8236;"
def head(id_, kicker, title, trans="push"):
    return (f'<section id="{id_}" data-transition="{trans}" style="background:#F6F8FD;color:#3A4560;font-family:\'Vazirmatn\', Tahoma, sans-serif">\n'
    '<div style="position:absolute;right:56px;top:40px;width:124px;height:124px;background:#FFFFFF;border-radius:50%;box-shadow:0 6px 24px rgba(14,27,77,0.12)"></div>\n'
    f'<img src="{LOGO}" alt="لوگوی دانشگاه صنعتی شریف" style="position:absolute;right:64px;top:48px;width:108px;height:108px;object-fit:contain">\n'
    f'<p style="position:absolute;right:220px;top:52px;width:1400px;text-align:right;font-size:26px;font-weight:700;color:#2F5CF0">{rtl(kicker)}</p>\n'
    f'<h2 style="position:absolute;right:220px;top:92px;width:1450px;text-align:right;font-size:52px;font-weight:800;color:#0E1B4D;line-height:1.2">{rtl(title)}</h2>\n')
def foot(n, note, en=None):
    s = ('<div style="position:absolute;left:96px;right:96px;bottom:96px;height:2px;background:#E1E6F3"></div>\n'
    f'<p style="position:absolute;left:96px;bottom:44px;width:300px;text-align:left;font-size:24px;color:#6B7590">{n} / {TOTAL}</p>\n'
    f'<p style="position:absolute;right:96px;bottom:44px;width:1000px;text-align:right;font-size:24px;color:#8A93AB">{rtl("از فیک تا تخریب · سعیدرضا برزکار")}</p>\n')
    if en: s += f'<p style="position:absolute;left:96px;right:96px;top:944px;direction:ltr;unicode-bidi:isolate;text-align:left;font-size:16px;line-height:1.3;color:#9AA3BA;font-family:\'Times New Roman\', serif">{en}</p>\n'
    return s + f'<aside>{rtl(note)}</aside>\n</section>\n'
def card(x, y, w, h, build=None, border=None, bg="#FFFFFF", side="right"):
    b = f' data-build-in="{build}"' if build else ""
    bd = f"border-{side}:10px solid {border};" if border and side != "top" else (f"border-top:10px solid {border};" if border else "")
    return f'<div{b} style="position:absolute;{x};top:{y}px;width:{w}px;height:{h}px;background:{bg};border-radius:20px;{bd}box-shadow:0 10px 30px rgba(14,27,77,0.08)"></div>\n'
def txt(x, y, w, t, size=30, color="#0E1B4D", weight=600, build=None, align="right", lh=1.45, font=None):
    b = f' data-build-in="{build}"' if build else ""; f = f"font-family:{font};" if font else ""
    return f'<p{b} style="position:absolute;{x};top:{y}px;width:{w}px;text-align:{align};font-size:{size}px;font-weight:{weight};line-height:{lh};color:{color};{f}">{rtl(t) if font is None else t}</p>\n'
def banner(y, t, build="rise 3"):
    return (f'<div data-build-in="{build}" style="position:absolute;right:128px;top:{y}px;width:1664px;height:96px;background:#0E1B4D;border-radius:20px"></div>\n'
            f'<p data-build-in="{build}" style="position:absolute;right:176px;top:{y+22}px;width:1568px;text-align:right;font-size:30px;font-weight:700;color:#F3F6FD">{rtl(t)}</p>\n')
def write(id_, s): open(P + id_ + ".html", "w").write(s)

# ---------- 15 doe-design ----------
s = head("doe-design", "بخش ۶ · طراحی آزمایش", "ژلاتین: داده Kodra 2026، عامل طراحی = زمان اتصال عرضی")
s += card("left:96", 236, 1728, 80) 
s += txt("right:128", 252, 1664, "کتوپروفن (داروی منفی) در میکروسفر ژلاتین با اتصال عرضی تانیک اسید · سه سطح: ۴ ساعت، ۲ ساعت، ۰٫۵ ساعت", 28, "#3A4560", 600)
cols = ["کمیت اندازه‌گیری‌شده", "K-1 (۴ ساعت)", "K-2 (۲ ساعت)", "K-3 (۰٫۵ ساعت)", "نقش در مدل"]
rows = [["بازده درگیری EE (٪)", "38.9", "22.5", "15.2", "ظرفیت اتصال"],
        ["حداکثر تورم (٪)", "1942", "1700", "920", "D و شعاع"],
        ["تخریب در ۶ ساعت (٪)", "93.2", "89.9", "0", "g(t)"],
        ["رهایش ۲۴ ساعت (٪)", "62.3", "100", "100", "داده سنجش"],
        ["زمان ۵۰٪ رهایش (ساعت)", "15.3", "3.4", "1.4", "پاسخ طراحی"]]
s += card("right:128", 340, 1664, 440, "rise 1")
s += '<table data-build-in="rise 1" style="position:absolute;right:160px;top:360px;width:1600px;font-size:30px;color:#0E1B4D">\n'
s += "<tr>" + "".join(f'<th style="text-align:{"right" if i in (0,4) else "center"}">{rtl(c)}</th>' for i, c in enumerate(cols)) + "</tr>\n"
for r in rows: s += "<tr>" + "".join(f'<td style="text-align:{"right" if i in (0,4) else "center"}">{rtl(c) if i in (0,4) else c}</td>' for i, c in enumerate(r)) + "</tr>\n"
s += "</table>\n"
s += banner(806, "همه ورودی‌ها از همان مقاله و همان فرمول؛ تنها مجهول: ثابت جدا شدن دارو k_off")
s += foot(15, "داده این بخش از مقاله Kodra سال دو هزار و بیست‌وشش است. عامل طراحی آزمایش، زمان اتصال عرضی است در سه سطح: چهار ساعت، دو ساعت و نیم ساعت. برای هر فرمول، تورم، تخریب، بازده درگیری و منحنی رهایش در همان مقاله اندازه‌گیری شده؛ پس هیچ عددی از فرمول یا مقاله دیگر قرض نگرفته‌ایم. فقط یک مجهول داریم: ثابت جدا شدن دارو از شبکه. آن را فقط روی فرمول اول و فقط برای پنج ساعت اول برازش کردیم، و برای دو فرمول دیگر با نسبت بازده درگیری مقیاس دادیم؛ این مقیاس‌دهی یک فرض است، نه اندازه‌گیری.",
 "Kodra et al., Polymers 18 (2026) 1807: ketoprofen in tannic-acid-crosslinked gelatin microspheres; k_off fitted on MS/K-1, t ≤ 5 h only")
write("doe-design", s)

# ---------- 16 doe-eqs ----------
s = head("doe-eqs", "بخش ۶ · معادله‌های تخریب", "دارو سه حالت دارد؛ تخریب شبکه، دارو را آزاد می‌کند")
for i, (x, col, t1, t2, bg) in enumerate([("right:128", "#2F5CF0", "M · آزاد", "نفوذ می‌کند؛ نفوذ در کسری از ثانیه تمام می‌شود", "#FFFFFF"),
                                          ("right:700", "#EB6834", "S · چسبیده به شبکه", "با نرخ k_off جدا می‌شود", "#FFFFFF"),
                                          ("right:1272", "#8A8F99", "I · آزادنشدنی", "با شبکه می‌ماند (در K-1 حدود ۳۸٪)", "#FFFFFF")]):
    s += card(x, 236, 520, 190, f"rise {i+1}", col, bg)
    s += txt(f"{x.split(':')[0]}:{int(x.split(':')[1])+36}", 260, 456, t1, 32, col, 800, f"rise {i+1}")
    s += txt(f"{x.split(':')[0]}:{int(x.split(':')[1])+36}", 322, 456, t2, 24, "#3A4560", 500, f"rise {i+1}", lh=1.4)
eq = ["dM/dt = − M/τ_D + k_off·S + r·S", "dS/dt = − (k_off + r)·S", "r(t) = − g′(t) / g(t)"]
s += card("right:128", 456, 1664, 270, "rise 4", "#0E1B4D")
for i, e in enumerate(eq):
    s += f'<p data-build-in="rise 4" style="position:absolute;left:176px;top:{476+i*76}px;width:1500px;direction:ltr;unicode-bidi:isolate;text-align:left;font-size:40px;font-weight:600;color:#0E1B4D;font-family:\'Times New Roman\', serif">{e}</p>\n'
s += txt("right:176", 476 + 0, 0, "", 1)  # spacer
s += txt("right:128", 756, 1664, "g(t) = جرم باقی‌مانده ژلاتین (اندازه‌گیری‌شده) · r = سرعت تخریب · τ_D = زمان نفوذ", 26, "#6B7590", 500)
s += banner(806, "دو بار آزموده شد: معادله جزئی کامل و فرم ساده، رهایش حداکثر ۰٫۱٪ اختلاف")
s += foot(16, "دارو سه حالت دارد. آزاد، که نفوذ می‌کند و در کسری از ثانیه خارج می‌شود. چسبیده به شبکه، که با یک نرخ ثابت جدا می‌شود. و آزادنشدنی، که با شبکه می‌ماند. تخریب شبکه، که از منحنی اندازه‌گیری‌شده جرم می‌آید، داروی چسبیده را هم آزاد می‌کند. همین سه معادله را یک بار با معادله دیفرانسیل جزئی کامل و یک بار با فرم ساده حل کردیم؛ رهایش آن‌ها در یک تا بیست‌وچهار ساعت حداکثر یک‌دهم درصد فرق دارد.",
 "M: free drug · S: bound drug · I: non-releasable pool; τ_D = R²/(π²D); r(t) = −g′(t)/g(t) from the measured degradation g(t)")
write("doe-eqs", s)

# ---------- 17 doe-ladder ----------
s = head("doe-ladder", "بخش ۶ · نردبان پنج‌مرحله‌ای", "هر قدم یک چیز اضافه می‌کند؛ برچسب هر قدم صادقانه است")
cols = ["قدم", "K-1", "K-2", "K-3", "میانگین", "وضعیت"]
rows = [("۱. فیک خالص", "69.8", "59.4", "49.5", "59.6", "رد شد", "#FDECEC"),
        ("۲. + تورم", "69.8", "59.4", "49.5", "59.6", "رد شد", "#FDECEC"),
        ("۳. + اتصال دارو به شبکه", "14.1", "14.8", "31.4", "20.1", "بخشی (k_off برازش‌شده)", "#FFF4DC"),
        ("۴. + تخریب اندازه‌گیری‌شده", "17.7", "12.5", "12.4", "14.2", "پیش‌بینی معتبر برای K-2 و K-3", "#EAF6EF"),
        ("۵. + بخش آزادنشدنی", "10.3", "12.5", "12.4", "11.7", "توصیفی، نه پیش‌بینی", "#EEF3FD")]
s += card("right:128", 236, 1664, 530, "rise 1")
s += '<table data-build-in="rise 1" style="position:absolute;right:160px;top:256px;width:1600px;font-size:28px;color:#0E1B4D">\n'
s += "<tr>" + "".join(f'<th style="text-align:{"right" if i in (0,5) else "center"}">{rtl(c)}</th>' for i, c in enumerate(cols)) + "</tr>\n"
for r in rows:
    s += f'<tr style="background:{r[6]}">' + "".join(f'<td style="text-align:{"right" if i in (0,5) else "center"}">{rtl(c) if i in (0,5) else c}</td>' for i, c in enumerate(r[:6])) + "</tr>\n"
s += "</table>\n"
s += txt("right:160", 676, 1600, "خطا = ریشه میانگین مربعات رهایش (٪ از دارو)", 24, "#6B7590", 500, "rise 1")
s += banner(790, "فیک و تورم رد می‌شوند · اتصال به شبکه خطا را به ۱۴ تا ۳۱ می‌رساند · تخریب، K-3 را به ۱۲")
s += foot(17, "این جدول مثل نردبان قبلی است، ولی برای ژلاتین. قدم یک و دو، فیک و تورم، هر دو رد می‌شوند، چون دارو هنوز آزاد فرض می‌شود. قدم سه اتصال دارو به شبکه را اضافه می‌کند و خطا را از پنجاه تا هفتاد به چهارده تا سی‌ویک می‌رساند؛ این قدم بخشی است چون ثابت جدا شدن از روی فرمول اول برازش شده. قدم چهار تخریب اندازه‌گیری‌شده را اضافه می‌کند و برای فرمول دوم و سوم پیش‌بینی معتبر است. برای فرمول اول قدم چهار از قدم سه بدتر است، چون بخشی از دارو با تخریب آزاد نمی‌شود. قدم پنج این بخش را اضافه می‌کند، ولی مقدارش از نقطه انتهای همان منحنی گرفته شده، پس توصیفی است و پیش‌بینی نیست.",
 "RMSE (% release) for MS/K-1, K-2, K-3; step 5 f_irr = 0.38 for K-1 (from the curve end point), 0 for K-2 and K-3")
write("doe-ladder", s)

# ---------- 18 doe-curves ----------
s = head("doe-curves", "بخش ۶ · منحنی‌ها در برابر داده", "هر سه زمان اتصال عرضی: مدل شکل و ترتیب را می‌گیرد")
s += card("left:96", 236, 1728, 530)
s += f'<img data-build-in="fade 1" src="{IMG["steps"]}" alt="سه نمودار رهایش برای K-1 و K-2 و K-3 با پنج قدم مدل و نقطه‌های داده" style="position:absolute;left:112px;top:246px;width:1696px;height:510px;object-fit:contain">\n'
s += banner(790, "کندتر از داده: K-2 در ۵ ساعت (۵۷ در برابر ۸۵) و K-3 در ۱ و ۳ ساعت (۲۴ در برابر ۳۷؛ ۷۶ در برابر ۹۹٫۶)", "rise 2")
s += foot(18, "این سه نمودار پنج قدم را روی داده Kodra نشان می‌دهند. خط‌های خاکستری و بنفش، فیک و تورم، روی صد درصد می‌چسبند. خط آبی اتصال به شبکه است. خط نارنجی و سبز، تخریب و بخش آزادنشدنی. مدل شکل منحنی و ترتیب فرمول‌ها را می‌گیرد. ولی روی فرمول دوم در پنج ساعت و روی فرمول سوم در یک و سه ساعت کندتر از داده است؛ این را بنویسید تا کسی از شما نپرسد.",
 "Kodra 2026 release data (open squares) against the five model steps; in MS/K-2 and K-3 step 5 coincides with step 4")
write("doe-curves", s)

# ---------- 19 doe-response ----------
s = head("doe-response", "بخش ۶ · پاسخ طراحی آزمایش", "اتصال عرضی کمتر، رهایش سریع‌تر؛ مدل همین را نشان می‌دهد")
s += card("right:128", 236, 1000, 530)
s += f'<img data-build-in="fade 1" src="{IMG["resp"]}" alt="زمان ۵۰٪ رهایش و رهایش ۲۴ ساعت بر حسب زمان اتصال عرضی؛ داده و مدل" style="position:absolute;right:140px;top:246px;width:976px;height:510px;object-fit:contain">\n'
s += card("left:96", 236, 620, 530, "rise 2", "#EB6834", side="top")
s += txt("left:124", 290, 564, "زمان ۵۰٪ رهایش (ساعت)", 28, "#EB6834", 700, "rise 2")
s += '<table data-build-in="rise 2" style="position:absolute;left:124px;top:350px;width:564px;font-size:28px;color:#0E1B4D">\n'
s += "<tr>" + "".join(f'<th style="text-align:center">{rtl(c)}</th>' for c in ["زمان اتصال", "داده", "مدل"]) + "</tr>\n"
for a, b_, c_ in [("۴ ساعت", "15.3", "11.9"), ("۲ ساعت", "3.4", "4.0"), ("۰٫۵ ساعت", "1.4", "1.8")]:
    s += f'<tr><td style="text-align:center">{rtl(a)}</td><td style="text-align:center">{b_}</td><td style="text-align:center">{c_}</td></tr>\n'
s += "</table>\n"
s += txt("left:124", 600, 564, "ترتیب درست، اندازه نزدیک", 26, "#3A4560", 600, "rise 2")
s += banner(790, "از ۴ ساعت به ۰٫۵ ساعت اتصال عرضی: زمان ۵۰٪ از ۱۵٫۳ به ۱٫۴ ساعت (داده) و از ۱۱٫۹ به ۱٫۸ (مدل)", "rise 3")
s += foot(19, "این نمودار پاسخ طراحی آزمایش است. هر چه زمان اتصال عرضی کمتر، رهایش سریع‌تر. در داده، زمان پنجاه درصد رهایش از پانزده ساعت به یک و چهار دهم ساعت می‌رسد. مدل همین روند را نشان می‌دهد: از یازده و نه دهم به یک و هشت دهم. ترتیب درست است و اندازه نزدیک، ولی برای فرمول اول مدل زودتر از داده است و برای فرمول دوم و سوم دیرتر.",
 "t50 and 24-h release versus crosslinking time; squares = Kodra 2026 data, circles = step 4, triangles = step 5")
write("doe-response", s)

# ---------- 20 doe-fields ----------
s = head("doe-fields", "بخش ۶ · میدان غلظت، سبک کامسول", "داخل دانه: یکنواخت خالی می‌شود، هر چه اتصال کمتر، سریع‌تر")
s += card("left:96", 226, 1728, 580)
s += f'<img data-build-in="fade 1" src="{IMG["fields"]}" alt="میدان غلظت کل دارو در دانه برای سه زمان اتصال عرضی در پنج لحظه" style="position:absolute;left:300px;top:234px;width:1320px;height:564px;object-fit:contain">\n'
s += banner(826, "سطر بالا: ۴ ساعت · وسط: ۲ ساعت · پایین: ۰٫۵ ساعت اتصال عرضی. رنگ یکنواخت یعنی کنترل با جدا شدن دارو و تخریب، نه نفوذ", "rise 2")
s += foot(20, "این همان تصویر کامسول‌گونه برای سه فرمول است. هر نیم‌دایره مقطع دانه است و رنگ، مقدار داروی باقی‌مانده. سطر بالا چهار ساعت اتصال عرضی، وسط دو ساعت، پایین نیم ساعت. در هر سه، دانه یکنواخت خالی می‌شود و هسته پر یا پوسته خالی دیده نمی‌شود، چون نفوذ سریع است و کنترل‌کننده سرعت، جدا شدن دارو از شبکه و تخریب شبکه است. فرمولی که اتصال عرضی کمتری دارد، زودتر خالی می‌شود.",
 "Full PDE model (40 radial finite-volume shells), total drug (C+S+P+I)/C₀ in %, columns t = 1, 3, 5, 12, 24 h", )
write("doe-fields", s)

# ---------- 21 ext-mlad ----------
s = head("ext-mlad", "بخش ۷ · آزمون بیرونی ۱", "Mladenovska 2002: رهایش از تخریب عقب می‌ماند")
s += card("left:96", 236, 1000, 520)
s += f'<img data-build-in="fade 1" src="{IMG["mlad"]}" alt="رهایش اندازه‌گیری‌شده در برابر فیک، کاهش جرم و کاهش جرم با تأخیر" style="position:absolute;left:108px;top:246px;width:976px;height:500px;object-fit:contain">\n'
s += card("right:128", 236, 620, 520, "rise 2", "#EB6834", side="top")
for i, (a, b_, col) in enumerate([("فیک", "خطا ۴۰ تا ۶۳٪", "#B4531F"), ("رهایش = کاهش جرم", "خطا ۲۲ تا ۳۱٪", "#B4531F"), ("کاهش جرم با تأخیر τ = R/v", "خطا ۳٫۶ تا ۶٫۵٪", "#13804F")]):
    s += txt("right:160", 270 + i * 150, 556, a, 28, "#0E1B4D", 700, "rise 2")
    s += txt("right:160", 318 + i * 150, 556, b_, 34, col, 800, "rise 2")
s += banner(790, "v ≈ ۰٫۶۲ میکرون بر ساعت فقط از اندازه A؛ اندازه‌های B تا F بدون تنظیم مجدد پیش‌بینی شدند", "rise 3")
s += foot(21, "اولین آزمون بیرونی روی مقاله Mladenovska، آلبومین در ژلاتین با آنزیم، شش اندازه دانه. فیک رهایش را در چند دقیقه تمام می‌کند و خطای چهل تا شصت‌وسه درصد دارد. اگر رهایش را برابر کاهش جرم بگیریم، خطا بیست‌ودو تا سی‌ویک درصد است. ولی رهایش از کاهش جرم عقب می‌ماند، با تأخیر شعاع تقسیم بر سرعت. سرعت را فقط از اندازه اول گرفتیم و بقیه اندازه‌ها با خطای سه و شش دهم تا شش و نیم درصد پیش‌بینی شدند. این قانون فقط روی محیط آنزیمی آزموده شده و هنوز به محیط بدون آنزیم منتقل نشده.",
 "Mladenovska et al., Int. J. Pharm. 242 (2002) 247: BSA in glutaraldehyde-crosslinked gelatin microspheres, collagenase; lag law τ = R/v, v calibrated on size A only")
write("ext-mlad", s)

# ---------- 22 ext-hu ----------
s = head("ext-hu", "بخش ۷ · آزمون بیرونی ۲", "Hu 2024: سطح ۲۴ ساعته درست، یک تا هشت ساعت اول سریع‌تر")
s += card("left:96", 236, 1000, 520)
s += f'<img data-build-in="fade 1" src="{IMG["hu"]}" alt="پیش‌بینی بدون تنظیم در برابر داده Hu 2024" style="position:absolute;left:108px;top:246px;width:976px;height:500px;object-fit:contain">\n'
s += card("right:128", 236, 620, 520, "rise 2", "#2F5CF0", side="top")
for i, (a, b_, col) in enumerate([("رهایش ۲۴ ساعت", "مدل ۸۳٪ · داده ۸۴٪", "#13804F"), ("خطای میانگین بعد از روز اول", "۹٫۱٪", "#13804F"), ("۱ تا ۸ ساعت اول", "مدل سریع‌تر از داده", "#B4531F")]):
    s += txt("right:160", 270 + i * 150, 556, a, 28, "#0E1B4D", 700, "rise 2")
    s += txt("right:160", 318 + i * 150, 556, b_, 34, col, 800, "rise 2")
s += banner(790, "هیچ عددی تنظیم نشد · احتمال: دانه‌ها اول باید دوباره آب بگیرند (هنوز آزمون نشده)", "rise 3")
s += foot(22, "دومین آزمون بیرونی روی مقاله Hu، جنتامایسین. بخش آزاد دارو را از مقاله Chang گرفتیم و تخریب را از اندازه‌گیری وزن در همان مقاله Hu. سطح رهایش در بیست‌وچهار ساعت هشتاد‌وسه درصد شد، در برابر هشتادوچهار درصد داده، و خطای میانگین بعد از روز اول نه و یک دهم درصد. ولی در یک تا هشت ساعت اول مدل سریع‌تر از داده است. دلیل احتمالی آب‌گیری اولیه دانه‌هاست؛ این را هنوز آزمون نکرده‌ایم.",
 "Hu et al. 2024: gentamicin, free fraction 0.83 taken from Chang 2023, degradation from measured weight loss; no parameter tuned")
write("ext-hu", s)

# ---------- 23 limits ----------
s = head("limits", "بخش ۷ · محدودیت‌ها", "آنچه هنوز باز است")
items = [("k_off برازش شده", "فقط روی یک منحنی (K-1، ۵ ساعت اول)؛ برای مستقل شدن، مقاله Singh یا Song 2015 لازم است", "#EB6834"),
         ("بخش آزادنشدنی از داده گرفته شده", "تا آن را از ساختار شبکه پیش‌بینی نکنیم، قدم ۵ توصیفی است", "#EB6834"),
         ("قانون تأخیر τ = R/v فقط در محیط آنزیمی آزموده شده", "به محیط بدون آنزیم (Chang، Kodra) منتقل نشده", "#2F5CF0"),
         ("Hu: ۱ تا ۸ ساعت اول · Zhang 2023 آزمون نشده · Lan 2017 فقط کیفی", "همچنین هنوز در دست نیست: Cheng 2011، Choy 2008، Singh، Song 2015", "#2F5CF0")]
for i, (t1, t2, col) in enumerate(items):
    y = 236 + i * 148
    s += card("right:128", y, 1664, 130, f"rise {i+1}", col)
    s += txt("right:176", y + 16, 1560, t1, 30, "#0E1B4D", 800, f"rise {i+1}")
    s += txt("right:176", y + 70, 1560, t2, 26, "#3A4560", 500, f"rise {i+1}")
s += foot(23, "این اسلاید صادقانه می‌گوید چه چیزی هنوز باز است. اول، ثابت جدا شدن دارو فقط روی یک منحنی برازش شده. دوم، بخش آزادنشدنی از نقطه انتهای همان منحنی گرفته می‌شود. سوم، قانون تأخیر فقط روی محیط آنزیمی آزموده شده. چهارم، چند آزمون و چند مقاله هنوز مانده: ابتدای رهایش در مقاله Hu، آزمون Zhang، و مقاله‌هایی که هنوز در دست ما نیست.")
write("limits", s)

# ---------- 24 conclusion (rewrite) ----------
s = head("conclusion", "بخش ۸ · جمع‌بندی", "چهار پیام اصلی")
msgs = [("#2F5CF0", "۱", "فیک غلط نبود، ناقص بود: D ما با D مقاله یکی است (3.24 و 3.21)، ولی فیک خالص هم سطح جذب و هم سرعت را غلط می‌داد"),
        ("#EB6834", "۲", "علت، چسبیدن دارو به شبکه بود: با اتصال عرضی و لانگمیر، خطا از ۰٫۶۹ به ۰٫۰۵ رسید؛ به داده نزدیک شد، نه کامل (K_ads و پارامترهای تعادلی)"),
        ("#1BAF7A", "۳", "در ژلاتین، تخریب شبکه را هم اضافه کردیم: روی داده Kodra، خطای میانگین از ۵۹٫۵ به ۱۴٫۲٪ رسید و اثر زمان اتصال عرضی درست درآمد"),
        ("#8A8F99", "۴", "دو قید صادقانه: k_off برازش شده و بخش آزادنشدنی از داده گرفته شده؛ قدم بعد: مقاله‌های کم‌مانده و آزمون Zhang")]
for i, (col, n, t) in enumerate(msgs):
    y = 236 + i * 150
    s += card("right:128", y, 1664, 132, f"rise {i+1}", col)
    s += txt("right:170", y + 22, 90, n, 64, col, 800, f"rise {i+1}")
    s += txt("right:290", y + 24, 1460, t, 28, "#0E1B4D", 600, f"rise {i+1}", lh=1.4)
s += foot(24, "چهار پیام. یک، فیک غلط نبود، ناقص بود؛ ضریب نفوذ ما با مقاله یکی است. دو، علت چسبیدن دارو به شبکه بود؛ با اتصال عرضی و لانگمیر خطا از صفر و شصت‌ونه صدم به صفر و پنج صدم رسید؛ به داده نزدیک شد ولی کامل روی هم نیفتاد. سه، در ژلاتین تخریب شبکه را هم اضافه کردیم؛ روی داده Kodra خطای میانگین از پنجاه‌ونه و نیم به چهارده درصد رسید و اثر زمان اتصال عرضی درست درآمد. چهار، دو قید صادقانه داریم: ثابت جدا شدن برازش شده و بخش آزادنشدنی از داده گرفته شده. سپاسگزارم.")
write("conclusion", s)

# ---------- references update ----------
r = open(P + "references.html").read()
r = r.replace("16 / 16", f"25 / {TOTAL}")
r = r.replace("5. Drug diffusion from a microsphere – COMSOL simulation (2024): visual style of the concentration fields.",
 "5. Drug diffusion from a microsphere – COMSOL simulation (2024): visual style of the concentration fields.<br>6. Kodra et al., Polymers 18 (2026) 1807 · Mladenovska et al., Int. J. Pharm. 242 (2002) 247 · Hu et al. (2024) · Chang et al. (2023).")
r = r.replace("Code: abd06_sync.py · comsol_lib.py · abd06_sync_results.json", "Code: abd06_sync.py · kodra_doe.py · kodra_fields.py · comsol_lib.py · gelatin_routes_model.py")
r = r.replace("از فیک تا لانگمیر · سعیدرضا برزکار", "از فیک تا تخریب · سعیدرضا برزکار")
open(P + "references.html", "w").write(r)

# ---------- gelatin (bridge) rewrite of step 3 card and notes ----------
g = open(P + "gelatin.html").read()
g = g.replace("&#8235;&#8207;۳. تخریب شبکه&#8207;&#8236;", "&#8235;&#8207;۳. تخریب شبکه ✔&#8207;&#8236;")
g = g.replace("&#8235;&#8207;قدم بعد؛ در گزارش بعدی&#8207;&#8236;", "&#8235;&#8207;روی داده Kodra آزموده شد (بخش ۶)&#8207;&#8236;")
g = g.replace('background:#FFF4EC;border-radius:20px;border-right:10px solid #EB6834', 'background:#EEF7F2;border-radius:20px;border-right:10px solid #1BAF7A')
g = g.replace("font-size:30px;font-weight:800;color:#B4531F", "font-size:30px;font-weight:800;color:#13804F")
g = g.replace("روی داده عبدخدایی هم‌خوان شد", "به داده عبدخدایی نزدیک شد")
g = g.replace("نتایج تخریب را در گزارش بعدی ارائه می‌کنم.", "نتایج تخریب را در بخش بعد نشان می‌دهم.")
g = g.replace("که روی داده عبدخدایی هم‌خوان شد", "که به داده عبدخدایی نزدیک شد")
open(P + "gelatin.html", "w").write(g)

# ---------- soften wording in other slides + footers ----------
for f in os.listdir(P):
    t = open(P + f).read()
    t = t.replace("از فیک تا لانگمیر · سعیدرضا برزکار", "از فیک تا تخریب · سعیدرضا برزکار")
    t = re.sub(r"(\d+) / 16<", lambda m: f"{m.group(1)} / {TOTAL}<", t)
    open(P + f, "w").write(t)
print(sorted(os.listdir(P)))
