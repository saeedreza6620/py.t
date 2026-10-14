import {database} from '../db/raw';

export const KNOWLEDGE_RELEASE = '2026-09-27.1';
const NOW = '2026-09-27T00:00:00.000Z';

type Source = {
  id:string; title:string; publisher:string; type:string; url:string; region:string;
  evidence:string; topics:string[]; summary:string; publishedAt:string|null; version:string;
};
type Rule = {
  id:string; key:string; version:number; title:string; triggers:string[];
  recommendation:string; safety:string; evidence:string; sources:string[];
};

export const CURATED_SOURCES:Source[] = [
  {id:'sccs-guidance-12',title:'SCCS Notes of Guidance for Cosmetic Ingredient Safety Evaluation 12th revision',publisher:'European Commission SCCS',type:'official_guidance',url:'https://health.ec.europa.eu/system/files/2023-12/sccs_o_273_final.pdf',region:'EU',evidence:'regulatory_guidance',topics:['ingredient safety','cosmetics','risk assessment'],summary:'چارچوب رسمی ارزیابی ایمنی مواد آرایشی؛ منبع تشخیص پزشکی یا تأیید خودکار یک محصول نیست.',publishedAt:'2023-12-22',version:'12'},
  {id:'cosing-registry',title:'CosIng Cosmetic Ingredient Database',publisher:'European Commission',type:'official_database',url:'https://single-market-economy.ec.europa.eu/sectors/cosmetics/cosmetic-ingredient-database_en',region:'EU',evidence:'regulatory_database',topics:['INCI','ingredient function','regulation'],summary:'مرجع نام INCI، نقش مواد و پیوندهای مقرراتی؛ وجود نام ماده در CosIng به‌تنهایی مجوز یا تضمین ایمنی نیست.',publishedAt:null,version:'live'},
  {id:'aad-acne-2024',title:'AAD Acne Clinical Guideline',publisher:'American Academy of Dermatology',type:'clinical_guideline',url:'https://www.aad.org/member/clinical-quality/guidelines/acne',region:'global',evidence:'clinical_guideline',topics:['acne','topical actives','medical boundary'],summary:'راهنمای مبتنی بر شواهد مدیریت آکنه؛ برای مرزبندی مراقبت عمومی و ارجاع حرفه‌ای استفاده می‌شود، نه نسخه‌نویسی.',publishedAt:'2024-01-31',version:'2024'},
  {id:'aad-pregnancy',title:'Pregnancy skin care guidance',publisher:'American Academy of Dermatology',type:'professional_guidance',url:'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/pregnancy-skin-care',region:'global',evidence:'professional_guidance',topics:['pregnancy','retinoids','hydroquinone'],summary:'در بارداری و اقدام به بارداری، برخی ترکیبات و درمان‌ها نیازمند پرهیز یا بررسی حرفه‌ای‌اند.',publishedAt:null,version:'reviewed-2025'},
  {id:'aad-sunscreen',title:'How to apply sunscreen',publisher:'American Academy of Dermatology',type:'professional_guidance',url:'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',region:'global',evidence:'professional_guidance',topics:['sunscreen','SPF','reapplication'],summary:'راهنمای عمومی انتخاب و استفاده از ضدآفتاب طیف‌گسترده و مقاوم به آب با SPF حداقل ۳۰.',publishedAt:null,version:'live'},
  {id:'nih-ods',title:'Dietary Supplement Fact Sheets',publisher:'NIH Office of Dietary Supplements',type:'official_fact_sheets',url:'https://ods.od.nih.gov/factsheets/list-all/',region:'US',evidence:'government_evidence_summary',topics:['supplements','safety','drug interactions'],summary:'فکت‌شیت‌های رسمی مکمل‌ها شامل ایمنی، شواهد و تداخل‌های دارویی؛ جایگزین بررسی داروساز یا پزشک نیست.',publishedAt:null,version:'live'},
  {id:'iran-ecommerce-1403',title:'گزارش تجارت الکترونیکی ایران سال ۱۴۰۳',publisher:'مرکز توسعه تجارت الکترونیکی',type:'official_market_report',url:'https://ecommerce.gov.ir/uploads/Gozaresh/SalanehTejElectronic/ec_report1403.pdf',region:'IR',evidence:'official_market_report',topics:['Iran ecommerce','payments','online trust'],summary:'مرجع رسمی شناخت ساختار تجارت الکترونیکی ایران؛ منبع قیمت یا موجودی لحظه‌ای محصول نیست.',publishedAt:'2025-06-01',version:'1403'},
  {id:'digikala-1403',title:'گزارش سالانه دیجی‌کالا ۱۴۰۳',publisher:'دیجی‌کالا',type:'company_market_report',url:'https://about.digikala.com/reports/digikala1403/digikala-report-1403.pdf',region:'IR',evidence:'company_report',topics:['Iran shoppers','sellers','market behavior'],summary:'داده دست‌اول یک پلتفرم بزرگ ایرانی؛ فقط نماینده اکوسیستم همان پلتفرم است و به کل بازار تعمیم داده نمی‌شود.',publishedAt:'2025-09-07',version:'1403'},
];

export const CURATED_RULES:Rule[] = [
  {id:'rule-emergency-allergy-v1',key:'emergency-allergy',version:1,title:'واکنش شدید و ارجاع فوری',triggers:['تنگی نفس','تورم زبان','تورم گلو','آلرژی شدید'],recommendation:'اگر تنگی نفس یا تورم زبان یا گلو گزارش شد، گفت‌وگوی خرید و روتین را متوقف کن و دریافت فوری خدمات پزشکی را در اولویت قرار بده.',safety:'urgent',evidence:'safety_boundary',sources:['aad-acne-2024']},
  {id:'rule-pregnancy-actives-v1',key:'pregnancy-actives',version:1,title:'بارداری و اکتیوهای پرریسک',triggers:['باردار','بارداری','اقدام به بارداری','رتینوئید','رتینول','هیدروکینون'],recommendation:'در بارداری یا اقدام به بارداری، درباره رتینوئیدها و هیدروکینون تأیید مصرف صادر نکن و بررسی محصول دقیق با پزشک یا داروساز را پیشنهاد بده.',safety:'high',evidence:'professional_guidance',sources:['aad-pregnancy']},
  {id:'rule-acne-medical-boundary-v1',key:'acne-medical-boundary',version:1,title:'مرز مراقبت عمومی و درمان آکنه',triggers:['آکنه','جوش دردناک','جای جوش','ایزوترتینوئین','آنتی‌بیوتیک'],recommendation:'برای آکنه دردناک، اسکاردهنده، ماندگار یا درمان تجویزی، تشخیص و نسخه ارائه نکن؛ مراقبت عمومی را از درمان پزشکی جدا و ارجاع متناسب بده.',safety:'high',evidence:'clinical_guideline',sources:['aad-acne-2024']},
  {id:'rule-sunscreen-basic-v1',key:'sunscreen-basic',version:1,title:'قاعده پایه ضدآفتاب',triggers:['ضدآفتاب','spf','آفتاب','تمدید'],recommendation:'برای راهنمای عمومی، طیف‌گسترده بودن، SPF حداقل ۳۰، مقاومت در آب و تجدید متناسب با حضور بیرون و دستور برچسب را بررسی کن.',safety:'guidance',evidence:'professional_guidance',sources:['aad-sunscreen']},
  {id:'rule-supplement-interaction-v1',key:'supplement-interaction',version:1,title:'مکمل و تداخل دارویی',triggers:['مکمل','بیوتین','زینک','روی','ویتامین','آهن','منیزیم','امگا'],recommendation:'برای مکمل، مقدار مصرف، داروهای هم‌زمان، بارداری و بیماری زمینه‌ای را جداگانه بررسی کن؛ تداخل یا ایمنی را بدون فکت‌شیت دقیق و بررسی حرفه‌ای قطعی اعلام نکن.',safety:'high',evidence:'government_evidence_summary',sources:['nih-ods']},
  {id:'rule-product-identity-v1',key:'product-identity',version:1,title:'هویت دقیق محصول پیش از تصمیم',triggers:['این محصول','بخرم','خرید','ترکیبات','اصل','تقلبی','نسخه'],recommendation:'پیش از تصمیم قطعی درباره محصول، نام دقیق، نسخه، حجم، GTIN یا IRC و فهرست ترکیبات همان بسته را بررسی کن؛ نام برند یا شباهت ظاهری کافی نیست.',safety:'decision_guard',evidence:'regulatory_database',sources:['cosing-registry','sccs-guidance-12']},
  {id:'rule-market-freshness-v1',key:'market-freshness',version:1,title:'تازگی و قابلیت اثبات داده بازار',triggers:['قیمت','تخفیف','موجودی','فروشنده','اقساط','ارسال','لینک خرید'],recommendation:'قیمت، تخفیف، موجودی و اقساط را فقط با فروشنده، URL مستقیم و زمان بررسی گزارش کن. داده منقضی یا ناقص نباید مبنای تصمیم قطعی یا محاسبه بودجه شود.',safety:'decision_guard',evidence:'product_policy',sources:['iran-ecommerce-1403']},
];

let registryReady = false;
const json = (value:unknown) => JSON.stringify(value);

export async function ensureKnowledgeRegistry(force=false){
  if(registryReady&&!force)return;
  const db=database();
  const statements = [
    ...CURATED_SOURCES.map(source=>db.prepare(`INSERT INTO assistant_knowledge_sources
      (source_id,title,publisher,source_type,url,region,evidence_level,topics_json,summary,published_at,checked_at,expires_at,status,content_fingerprint,version,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(source_id) DO UPDATE SET title=excluded.title,publisher=excluded.publisher,source_type=excluded.source_type,url=excluded.url,region=excluded.region,evidence_level=excluded.evidence_level,topics_json=excluded.topics_json,summary=excluded.summary,published_at=excluded.published_at,version=excluded.version,updated_at=excluded.updated_at`)
      .bind(source.id,source.title,source.publisher,source.type,source.url,source.region,source.evidence,json(source.topics),source.summary,source.publishedAt,NOW,null,'published','',source.version,NOW,NOW)),
    ...CURATED_RULES.map(rule=>db.prepare(`INSERT INTO assistant_knowledge_rules
      (rule_id,rule_key,version,title,trigger_terms_json,conditions_json,recommendation,safety_level,evidence_level,source_ids_json,status,reviewed_by,reviewed_at,valid_from,expires_at,superseded_by,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(rule_id) DO UPDATE SET title=excluded.title,trigger_terms_json=excluded.trigger_terms_json,conditions_json=excluded.conditions_json,recommendation=excluded.recommendation,safety_level=excluded.safety_level,evidence_level=excluded.evidence_level,source_ids_json=excluded.source_ids_json,updated_at=excluded.updated_at`)
      .bind(rule.id,rule.key,rule.version,rule.title,json(rule.triggers),'{}',rule.recommendation,rule.safety,rule.evidence,json(rule.sources),'published','BeautyWallet source review',NOW,NOW,null,null,NOW,NOW)),
    db.prepare(`INSERT INTO assistant_knowledge_releases(version,status,source_ids_json,rule_ids_json,notes,published_at,created_at)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(version) DO NOTHING`)
      .bind(KNOWLEDGE_RELEASE,'published',json(CURATED_SOURCES.map(x=>x.id)),json(CURATED_RULES.map(x=>x.id)),'منابع پایه رسمی و قواعد محافظ تصمیم؛ بدون آموزش خودکار از متن کاربر.',NOW,NOW),
  ];
  await db.batch(statements);
  registryReady=true;
}

const parseArray=(value:unknown)=>{try{const x=JSON.parse(String(value||'[]'));return Array.isArray(x)?x.map(String):[]}catch{return []}};
const normalized=(value:string)=>value.toLowerCase().replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').replace(/\s+/g,' ').trim();

export async function knowledgeContext(message:string){
  try{
    await ensureKnowledgeRegistry();
    const db=database(),now=new Date().toISOString();
    const [rules,sources]=await Promise.all([
      db.prepare(`SELECT rule_id,title,trigger_terms_json,recommendation,safety_level,evidence_level,source_ids_json
        FROM assistant_knowledge_rules WHERE status='published' AND valid_from<=? AND (expires_at IS NULL OR expires_at>?) AND superseded_by IS NULL`).bind(now,now).all<Record<string,unknown>>(),
      db.prepare(`SELECT source_id,title,publisher,url,evidence_level,summary,checked_at,status
        FROM assistant_knowledge_sources WHERE status='published' AND (expires_at IS NULL OR expires_at>?)`).bind(now).all<Record<string,unknown>>(),
    ]);
    const q=normalized(message);
    const matched=rules.results.filter(rule=>parseArray(rule.trigger_terms_json).some(term=>q.includes(normalized(term)))).slice(0,6);
    const sourceIds=[...new Set(matched.flatMap(rule=>parseArray(rule.source_ids_json)))];
    const sourceRows=sources.results.filter(source=>sourceIds.includes(String(source.source_id)));
    const text=matched.length?[
      'قواعد منتشرشده مرتبط:',
      ...matched.map(rule=>`- [${rule.rule_id}] ${rule.title}: ${rule.recommendation} (سطح: ${rule.safety_level}; شواهد: ${rule.evidence_level})`),
      'منابع تأییدشده مرتبط:',
      ...sourceRows.map(source=>`- [${source.source_id}] ${source.title} — ${source.publisher}: ${source.summary} ${source.url}`),
    ].join('\n'):'برای این پرسش قاعده منتشرشده اختصاصی پیدا نشد؛ از ادعای قطعی علمی خودداری کن و فقط اطلاعات لازم را بپرس.';
    return {text,sourceIds,rules:matched.map(x=>String(x.rule_id)),version:KNOWLEDGE_RELEASE};
  }catch{
    return {text:'سامانه بازیابی دانش موقتاً در دسترس نیست؛ ادعای علمی یا ایمنی قطعی نکن و پاسخ را به راهنمای عمومی کم‌ریسک محدود کن.',sourceIds:[],rules:[],version:KNOWLEDGE_RELEASE};
  }
}

export async function verifiedMarketContext(message:string){
  try{
    const now=new Date().toISOString(),db=database();
    const rows=await db.prepare(`SELECT p.product_id,p.gtin,p.irc,p.brand,p.name_fa,p.variant,p.volume,
      o.seller,o.cash_price,o.discount_price,o.stock_status,o.shipping_cost,o.down_payment,o.installment_count,o.installment_amount,o.total_fee,o.final_installment_cost,o.direct_product_url,o.observed_at,o.expires_at
      FROM assistant_verified_offers o JOIN assistant_products p ON p.product_id=o.product_id
      WHERE p.verification_status='verified' AND o.verification_status='verified' AND o.expires_at>? ORDER BY o.observed_at DESC LIMIT 40`).bind(now).all<Record<string,unknown>>();
    const q=normalized(message);
    const matches=rows.results.filter(row=>{
      const identities=[row.name_fa,row.brand,row.gtin,row.irc].map(x=>normalized(String(x||''))).filter(x=>x.length>2);
      return identities.some(x=>q.includes(x));
    }).slice(0,8);
    return matches;
  }catch{return []}
}

export async function registryStatus(){
  await ensureKnowledgeRegistry();
  const db=database(),reviewBefore=new Date(Date.now()-180*86400000).toISOString(),now=new Date().toISOString();
  const row=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM assistant_knowledge_sources WHERE status='published') AS published_sources,
    (SELECT COUNT(*) FROM assistant_knowledge_sources WHERE status!='published' OR checked_at<?) AS review_due,
    (SELECT COUNT(*) FROM assistant_knowledge_rules WHERE status='published' AND (expires_at IS NULL OR expires_at>?)) AS published_rules,
    (SELECT COUNT(*) FROM assistant_products WHERE verification_status='verified') AS verified_products,
    (SELECT COUNT(*) FROM assistant_verified_offers WHERE verification_status='verified' AND expires_at>?) AS fresh_offers,
    (SELECT COUNT(*) FROM assistant_decisions) AS decisions,
    (SELECT COUNT(*) FROM assistant_feedback) AS feedback,
    (SELECT COUNT(*) FROM assistant_decisions WHERE outcome_status!='') AS outcomes,
    (SELECT COUNT(*) FROM assistant_feedback WHERE adverse_signal=1) AS adverse_signals`).bind(reviewBefore,now,now).first<Record<string,number>>();
  return {version:KNOWLEDGE_RELEASE,...row};
}
