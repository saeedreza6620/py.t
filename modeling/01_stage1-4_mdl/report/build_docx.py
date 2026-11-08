"""Build the Persian RTL Word report (editable OMML equations via pandoc) from report_fa.md."""
import re, subprocess, zipfile
from lxml import etree
subprocess.run(["pandoc", "report_fa.md", "-f", "markdown+tex_math_dollars", "-t", "docx",
                "--reference-doc=reference_rtl.docx", "--resource-path=.:../figures", "-o", "raw.docx"], check=True)
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'; M = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
q = lambda t: '{%s}%s' % (W, t)
arab = re.compile('[؀-ۿﭐ-﷿ﹰ-﻿]'); latin = re.compile('[A-Za-z0-9]')
z = zipfile.ZipFile('raw.docx'); files = [(it, z.read(it.filename)) for it in z.infolist()]; z.close()
root = etree.fromstring(dict((it.filename, d) for it, d in files)['word/document.xml'])
for p in root.iter(q('p')):
    ppr = p.find(q('pPr'))
    if ppr is None: ppr = etree.Element(q('pPr')); p.insert(0, ppr)
    if ppr.find(q('bidi')) is None:
        b = etree.Element(q('bidi')); ps = ppr.find(q('pStyle'))
        ps.addnext(b) if ps is not None else ppr.insert(0, b)
    for r in p.findall(q('r')):
        t = ''.join(x.text or '' for x in r.findall(q('t'))); rpr = r.find(q('rPr'))
        if arab.search(t):
            if rpr is None: rpr = etree.Element(q('rPr')); r.insert(0, rpr)
            if rpr.find(q('rtl')) is None: rpr.append(etree.Element(q('rtl')))
        elif rpr is not None and latin.search(t) and rpr.find(q('rtl')) is not None:
            rpr.remove(rpr.find(q('rtl')))
for tbl in root.iter(q('tbl')):
    tp = tbl.find(q('tblPr'))
    if tp.find(q('bidiVisual')) is None:
        bv = etree.Element(q('bidiVisual')); ts = tp.find(q('tblStyle')); ts.addnext(bv) if ts is not None else tp.insert(0, bv)
    if tp.find(q('tblBorders')) is None:
        bd = etree.SubElement(tp, q('tblBorders'))
        for side in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
            e = etree.SubElement(bd, q(side)); e.set(q('val'), 'single'); e.set(q('sz'), '4'); e.set(q('color'), 'A6A6A6')
    tw = tp.find(q('tblW')) if tp.find(q('tblW')) is not None else etree.SubElement(tp, q('tblW'))
    tw.set(q('type'), 'pct'); tw.set(q('w'), '5000')
    first = tbl.find(q('tr'))
    for tc in first.findall(q('tc')):
        tcp = tc.find(q('tcPr'))
        if tcp is None: tcp = etree.Element(q('tcPr')); tc.insert(0, tcp)
        sh = etree.SubElement(tcp, q('shd')); sh.set(q('val'), 'clear'); sh.set(q('color'), 'auto'); sh.set(q('fill'), 'DCE6F2')
out = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
zo = zipfile.ZipFile('Report_Stage1-4_fa.docx', 'w', zipfile.ZIP_DEFLATED)
for it, d in files: zo.writestr(it, out if it.filename == 'word/document.xml' else d)
zo.close(); print("ok")
