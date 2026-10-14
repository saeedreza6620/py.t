"""Read reviewed BeautyWallet workbook; never upgrade status or invent INCI.
Usage: python workbook-to-dataset.py workbook.xlsx output.json
Requires openpyxl in the operator's environment. Does not call APIs.
"""
import json,sys,datetime
import openpyxl
w=openpyxl.load_workbook(sys.argv[1],data_only=False)
def text(v): return '' if v is None else str(v).strip()
def parts(v,sep='|'): return [s.strip() for s in text(v).split(sep) if s.strip()]
def date(v): return v.date().isoformat() if isinstance(v,datetime.datetime) else v.isoformat() if isinstance(v,datetime.date) else text(v)
products=[]
for r in w['محصولات'].iter_rows(min_row=4,values_only=True):
 if not r[0]: continue
 products.append(dict(product_id=text(r[0]),brand=text(r[1]),name=text(r[3]),variant=text(r[3]),market_version=text(r[8]),size_ml=r[5] if isinstance(r[5],(int,float)) else None,inci_raw=text(r[9]),sources=[text(v) for v in [r[12],r[14]] if v],verified_by=text(r[16]),verified_date=date(r[17]),status={'تأییدشده':'verified','مسدود':'blocked'}.get(r[18],'needs_check'),source_match=len(r)>21 and r[21]=='بله',formula_version=text(r[24]) if len(r)>24 else ''))
ingredients=[]
for r in w['ترکیبات'].iter_rows(min_row=3,values_only=True):
 if r[0]: ingredients.append(dict(ingredient_id=text(r[0]),inci_name=text(r[1]),aliases=parts(r[2]),classes=parts(r[3]),source=text(r[8]),status='verified' if r[9]=='بازبینی‌شده' and r[10] else 'draft'))
rules=[]
for r in w['قواعد'].iter_rows(min_row=3,values_only=True):
 if r[0]: rules.append(dict(rule_id=text(r[0]),classes=parts(r[2],'+'),message=text(r[9]),source=text(r[11]),reviewed_by=text(r[13]),status='verified' if r[12]=='بازبینی‌شده' else 'draft',severity=text(r[8]),conditions=dict(type=r[1],all=r[2],any=r[3],min=r[4],none=r[5],time=r[6],user=r[7])))
with open(sys.argv[2],'w',encoding='utf-8') as f:json.dump(dict(products=products,ingredients=ingredients,rules=rules),f,ensure_ascii=False,indent=2)
print('Exported',len(products),'products; statuses preserved')
