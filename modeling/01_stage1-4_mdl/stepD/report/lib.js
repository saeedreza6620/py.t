const fs = require('fs');
const D = require('docx');
const { Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
        ImageRun, Footer, PageNumber, MathRun: MR, MathFraction, MathSubScript, MathSuperScript, MathRoundBrackets, MathSum, MathRadical } = D;
const FA = 'B Nazanin', LAT_FONT = 'Times New Roman';
const NAVY = '0E1B4D', BLUE = '2F5CF0', GREY = '6B7590';
const LAT = /([A-Za-z0-9_^°Åµα-ωΔ⁰-₟²³¹×·∂∞=+\/\-–−≅≈<>]([A-Za-z0-9_^°Åµα-ωΔ⁰-₟²³¹×·∂∞=+\/\-–−≅≈<>.,:()% ]*[A-Za-z0-9°Åµα-ω⁰-₟²³¹)%∞])?)/g;
function runs(text, o = {}) {
  const sz = o.size || 26, out = []; let last = 0, m; LAT.lastIndex = 0;
  const base = { size: sz, sizeComplexScript: sz, bold: o.bold, boldComplexScript: o.bold, italics: o.italics, color: o.color || '1F2433' };
  const fa = t => new TextRun({ ...base, text: t, rightToLeft: true, font: { ascii: LAT_FONT, hAnsi: LAT_FONT, cs: FA } });
  const lr = (t, x = {}) => new TextRun({ ...base, ...x, text: t, rightToLeft: false, font: { ascii: LAT_FONT, hAnsi: LAT_FONT, cs: FA }, size: Math.round(sz * 0.88) });
  const la = t => {   // LTR embedding + _sub and ^sup / ^(sup)
    const parts = []; const re = /(?<=(?:^|[^A-Za-z])[A-Za-zα-ωΔ])_([A-Za-z0-9,]+)|\^\(([^)]*)\)|\^([0-9.\-−]+)/g; let k = 0, mm;
    while ((mm = re.exec(t)) !== null) {
      if (mm.index > k) parts.push([t.slice(k, mm.index), {}]);
      if (mm[1] !== undefined) parts.push([mm[1], { subScript: true }]); else parts.push([mm[2] ?? mm[3], { superScript: true }]);
      k = mm.index + mm[0].length;
    }
    if (k < t.length) parts.push([t.slice(k), {}]);
    parts[0][0] = '\u202A' + parts[0][0]; parts[parts.length - 1][0] += '\u202C';
    return parts.map(([x, o]) => lr(x, o));
  };
  while ((m = LAT.exec(text)) !== null) {
    if (m.index > last) out.push(fa(text.slice(last, m.index)));
    out.push(...la(m[0])); last = m.index + m[0].length;
  }
  if (last < text.length) out.push(fa(text.slice(last)));
  return out;
}
const P = (text, o = {}) => new Paragraph({ bidirectional: true, alignment: o.align || AlignmentType.JUSTIFIED, heading: o.heading,
  spacing: { after: o.after ?? 120, line: o.line || 340, before: o.before }, keepNext: o.keepNext,
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  indent: o.indent, children: Array.isArray(text) ? text : runs(text, o) });
const H1 = t => P(t, { heading: HeadingLevel.HEADING_1, size: 32, bold: true, color: NAVY, after: 140, before: 280, keepNext: true, align: AlignmentType.RIGHT });
const H2 = t => P(t, { heading: HeadingLevel.HEADING_2, size: 28, bold: true, color: BLUE, after: 100, before: 200, keepNext: true, align: AlignmentType.RIGHT });
const BUL = t => P('• ' + t, { indent: { right: 300 }, after: 80 });
const NOTE = t => P(t, { fill: 'EEF3FD', after: 160 });
const KEY = t => P(t, { fill: 'EEF7F2', bold: true, color: '13603F', after: 160 });
// math helpers
const r = t => new MR(t);
const A = x => typeof x === 'string' ? [new MR(x)] : (Array.isArray(x) ? x : [x]);
const sub = (b, s) => new MathSubScript({ children: A(b), subScript: A(s) });
const sup = (b, s) => new MathSuperScript({ children: A(b), superScript: A(s) });
const frac = (n, d) => new MathFraction({ numerator: A(n), denominator: A(d) });
const par = c => new MathRoundBrackets({ children: A(c) });
const EQ = (children, num) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 140 },
  children: [new D.Math({ children }), new TextRun({ text: `\t(${num})`, font: 'Cambria Math', size: 24 })] });
function table(head, rows, widths, o = {}) {
  const tot = widths.reduce((a, b) => a + b, 0);
  const cell = (t, i, hd) => new TableCell({ width: { size: widths[i], type: WidthType.DXA },
    shading: hd ? { type: ShadingType.CLEAR, color: 'auto', fill: 'DCE4F7' } : undefined,
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [P(String(t), { size: o.size || 19, bold: hd, align: AlignmentType.CENTER, after: 0, line: 260 })] });
  return new Table({ width: { size: tot, type: WidthType.DXA }, columnWidths: widths, visuallyRightToLeft: true,
    rows: [new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, i, true)) }), ...rows.map(rw => new TableRow({ children: rw.map((t, i) => cell(t, i, false)) }))] });
}
function img(path, w, caption) {
  const buf = fs.readFileSync(path);
  const pw = buf.readUInt32BE(16), ph = buf.readUInt32BE(20);
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: 'png', data: buf, transformation: { width: w, height: Math.round(w * ph / pw) } })] }),
    P(caption, { size: 21, color: GREY, align: AlignmentType.CENTER, after: 200 })];
}
function doc(children, out) {
  const d = new D.Document({ styles: { default: { document: { run: { font: { ascii: LAT_FONT, hAnsi: LAT_FONT, cs: FA }, size: 26 } } } },
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1100, right: 1100 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, color: GREY })] })] }) },
      children }] });
  return D.Packer.toBuffer(d).then(b => { fs.writeFileSync(out, b); console.log('wrote', out); });
}
module.exports = { runs, P, H1, H2, BUL, NOTE, KEY, r, sub, sup, frac, par, EQ, table, img, doc, MathSum, MathRadical, AlignmentType, TextRun, Paragraph, NAVY, GREY };
