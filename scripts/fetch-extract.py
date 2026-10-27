# Runs on GitHub Actions: fetches every URL in a job file and keeps only what the catalog needs
# (title, og tags, JSON-LD, ingredient blocks, INCIDecoder ingredient list, API JSON). Never prices.
import json,re,sys,html,time,urllib.request,urllib.error,gzip
job=json.load(open(sys.argv[1]));out=[]
UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36','Accept-Language':'fa-IR,fa;q=0.9,en;q=0.8','Accept':'text/html,application/json;q=0.9,*/*;q=0.8'}
def get(u):
  try:
    r=urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30);raw=r.read(3000000)
    if r.headers.get('Content-Encoding')=='gzip':raw=gzip.decompress(raw)
    return r.status,r.geturl(),r.headers.get('Content-Type',''),raw.decode('utf8','ignore')
  except urllib.error.HTTPError as e:return e.code,u,'',''
  except Exception as e:return 0,u,'',str(e)[:200]
def strip(t):return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',t))).strip()
for it in job['urls']:
  u=it['url'] if isinstance(it,dict) else it;s,f,ct,b=get(u);o={'url':u,'status':s,'final':f,'ctype':ct}
  if 'json' in ct or b[:1] in '{[':
    try:
      j=json.loads(b);keep=job.get('keep_json',200000);o['json']=j if len(b)<keep else None;o['json_trunc']=b[:keep] if len(b)>=keep else None
    except Exception:o['text']=b[:3000]
  else:
    m=re.search(r'<title[^>]*>([^<]*)',b);o['title']=html.unescape(m.group(1)).strip() if m else ''
    o['og']={k:html.unescape(v) for k,v in re.findall(r'<meta[^>]+property=["\']og:([a-z:_]+)["\'][^>]+content=["\']([^"\']*)',b)}
    o['ldjson']=[x[:20000] for x in re.findall(r'<script[^>]+application/ld\+json[^>]*>(.*?)</script>',b,re.S)][:6]
    o['inci_links']=[html.unescape(x).strip() for x in re.findall(r'href="/ingredients/[^"]+"[^>]*>([^<]+)</a>',b)]
    o['product_links']=list(dict.fromkeys(re.findall(r'href="(/products/[a-z0-9\-]+)"',b)))[:40]
    t=strip(re.sub(r'<(script|style)[^>]*>.*?</\1>',' ',b,flags=re.S))
    blocks=[]
    for mm in re.finditer(r'(ingredients?|ترکیبات|اجزای تشکیل|INCI|Aqua|Water,)',t,re.I):
      a=max(0,mm.start()-200);blocks.append(t[a:a+2500])
      if len(blocks)>=4:break
    o['blocks']=blocks;o['next_data']=None
    nd=re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',b,re.S)
    if nd:o['next_data']=nd.group(1)[:job.get('keep_next',150000)]
  out.append(o);time.sleep(job.get('sleep',0.5))
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False)
print('::notice title=fetched::%d urls, ok %d'%(len(out),sum(1 for o in out if o['status']==200)))
