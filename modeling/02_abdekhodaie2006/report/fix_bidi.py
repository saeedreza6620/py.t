import sys, zipfile, shutil, re, os
p = sys.argv[1]; tmp = p + '.tmp'
zin = zipfile.ZipFile(p); zout = zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED)
for it in zin.infolist():
    data = zin.read(it.filename)
    if it.filename == 'word/document.xml':
        s = data.decode('utf8')
        s = re.sub(r'<w:sectPr>', '<w:sectPr>', s)
        s = re.sub(r'(<w:pgNumType/>)', r'\1', s)
        s = s.replace('<w:docGrid ', '<w:bidi/><w:docGrid ')
        data = s.encode('utf8')
    zout.writestr(it, data)
zout.close(); zin.close(); shutil.move(tmp, p)
