(function(){
"use strict";
const catalog=[
 {priority:1,gate:"A",passportId:"IRP-001",productId:"prd_ir_prime_cprime_fusion_water_spf50_40ml",name:"فلوئید ضدآفتاب بی‌رنگ پرایم C-Prime Fusion Water SPF50 حجم 40 میلی‌لیتر",category:"ضدآفتاب",brand:"پرایم",size:"40 میلی‌لیتر",verificationStatus:"remote_metadata_mapped_physical_pending",pilotEligible:true,price:{regular:1290000,discounted:null,seller:"بیزما",observedAt:"2026-09-03T16:30:00Z"},sourceUrl:"https://bizma.ir/product/prime-colorless-sunscreen-fluid-spf50-c-prime-fusion-water-40ml/",demand:{reviews:5266,ratings:10173,questions:259}},
 {priority:2,gate:"A",passportId:"IRP-002",productId:"prd_ir_lafarrerr_cleanser_01_oily_150ml",name:"ژل شست‌وشو و لایه‌بردار لافارر مدل 01 پوست چرب حجم 150 میلی‌لیتر",category:"شوینده",brand:"لافارر",size:"150 میلی‌لیتر",verificationStatus:"remote_metadata_mapped_physical_pending",pilotEligible:true,price:{regular:1094000,discounted:971700,seller:"دیجی‌کالا",observedAt:"2026-09-03T16:30:00Z"},sourceUrl:"https://www.digikala.com/product/dkp-515367/",demand:{reviews:10161,ratings:19428,questions:303}},
 {priority:3,gate:"A",passportId:"IRP-003",productId:"prd_ir_dermalift_hydralift_ac_50ml",name:"کرم مرطوب‌کننده درمالیفت Hydralift AC پوست چرب حجم 50 میلی‌لیتر",category:"مرطوب‌کننده",brand:"درمالیفت",size:"50 میلی‌لیتر",verificationStatus:"candidate_gtin_physical_pending",pilotEligible:true,gtinCandidate:"6269961600108",price:{regular:356650,discounted:null,seller:"گالری تانیا در دیجی‌کالا",observedAt:"2026-09-03T16:30:00Z"},sourceUrl:"https://www.digikala.com/product/dkp-1518148/",demand:{reviews:10375,ratings:19608,questions:279}},
 {priority:4,gate:"A",passportId:"IRP-004",productId:"prd_ir_vitalayer_activit_niacinamide_30ml",name:"سرم نیاسینامید اکتی‌ویت ویتالیر حجم 30 میلی‌لیتر",category:"سرم و اکتیو",brand:"ویتالیر",size:"30 میلی‌لیتر",verificationStatus:"claims_only_physical_pending",pilotEligible:true,price:{regular:894000,discounted:691600,seller:"دیجی‌کالا",observedAt:"2026-09-03T16:30:00Z"},sourceUrl:"https://www.digikala.com/product/dkp-12230709/",demand:{reviews:4874,ratings:9545,questions:922}},
 {priority:5,gate:"A",passportId:"IRP-005",productId:"prd_ir_vitalayer_hyaluronic_serum_30ml",name:"سرم هیالورونیک اسید ویتالیر حجم 30 میلی‌لیتر",category:"سرم و اکتیو",brand:"ویتالیر",size:"30 میلی‌لیتر",verificationStatus:"claims_only_physical_pending",pilotEligible:true,price:{regular:956000,discounted:764800,seller:"پوست من",observedAt:"2026-09-03T16:30:00Z"},sourceUrl:"https://poosteman.com/product/%D8%B3%D8%B1%D9%85-%D9%87%DB%8C%D8%A7%D9%84%D9%88%D8%B1%D9%88%D9%86%DB%8C%DA%A9-%D8%A7%D8%B3%DB%8C%D8%AF-%D9%88%DB%8C%D8%AA%D8%A7%D9%84%D8%A7%DB%8C%D8%B1-%D8%AD%D8%AC%D9%85-30ml/",demand:{reviews:4183,ratings:8773,questions:489}},
 {priority:6,gate:"B",name:"ضدآفتاب فلوئیدی بی‌رنگ درماتیپیک مناسب پوست چرب",category:"ضدآفتاب",verificationStatus:"candidate_from_editorial_shortlist",pilotEligible:false},
 {priority:7,gate:"B",name:"ضدآفتاب فاقد چربی اسکین وان مناسب پوست چرب و مختلط",category:"ضدآفتاب",verificationStatus:"candidate_from_editorial_shortlist",pilotEligible:false},
 {priority:8,gate:"B",name:"فلوئید ضدآفتاب مای؛ واریانت دقیق در انتظار تطبیق",category:"ضدآفتاب",verificationStatus:"variant_unresolved",pilotEligible:false},
 {priority:9,gate:"B",name:"سرم نیاسینامید تن برایت مکس؛ واریانت صفحه DKP-11874164",category:"سرم و اکتیو",verificationStatus:"candidate_product_page",pilotEligible:false},
 {priority:10,gate:"B",name:"سرم نیاسینامید گلاما 30 میلی‌لیتر؛ صفحه DKP-20881046",category:"سرم و اکتیو",verificationStatus:"candidate_product_page",pilotEligible:false},
 {priority:11,gate:"C",name:"ضدآفتاب ضدلک بی‌رنگ لافارر پوست چرب SPF50+ حجم 40 میلی‌لیتر",category:"ضدآفتاب",verificationStatus:"official_metadata_only",pilotEligible:false},
 {priority:12,gate:"C",name:"شوینده پوست چرب هیدرودرم؛ واریانت دقیق در انتظار تطبیق",category:"شوینده",verificationStatus:"variant_unresolved",pilotEligible:false},
 {priority:13,gate:"C",name:"ژل‌سرم ویتامین C ژیناژن؛ واریانت دقیق در انتظار تطبیق",category:"سرم و اکتیو",verificationStatus:"variant_unresolved",pilotEligible:false},
 {priority:14,gate:"C",name:"کرم روشن‌کننده درمالیفت Melalift حجم 40 میلی‌لیتر؛ صفحه DKP-1518217",category:"ضدلک",verificationStatus:"candidate_product_page",pilotEligible:false},
 {priority:15,gate:"C",name:"سرم نیاسینامید نوآکنه 30 میلی‌لیتر؛ صفحه DKP-18173806",category:"سرم و اکتیو",verificationStatus:"candidate_product_page",pilotEligible:false}
].map(x=>({...x,recommendationEligible:false,market:"IR"}));
const cities=[
 ["تهران","خشک‌تر و آلوده‌تر","ثبت حس کشیدگی و شست‌وشوی ملایم شب"],["کرج","خشک‌تر و آلوده‌تر","ثبت حس کشیدگی و شست‌وشوی ملایم شب"],["مشهد","خشک و زمستان‌های سرد","توجه به حس خشکی و ساده نگه‌داشتن روتین"],["اصفهان","خشک","توجه به حس خشکی و تحمل بافت"],["تبریز","سرد و خشک","ثبت خشکی و تغییرات فصلی"],["شیراز","نیمه‌خشک","پیگیری تحمل بافت و آفتاب روزانه"],["اهواز","گرم و همراه گردوغبار","ثبت تعریق، حس سنگینی و شست‌وشوی ملایم"],["بندرعباس","گرم و شرجی","ثبت برق، تعریق و حس سنگینی بافت"],["بوشهر","گرم و شرجی","ثبت برق، تعریق و حس سنگینی بافت"],["کیش","گرم و شرجی","ثبت برق، تعریق و حس سنگینی بافت"],["رشت","مرطوب","ثبت حس چسبندگی و دوام محصول"],["ساری","مرطوب","ثبت حس چسبندگی و دوام محصول"],["یزد","بسیار خشک و گرم","ثبت خشکی، کشیدگی و تحمل محصول"],["کرمان","خشک","ثبت خشکی و تغییرات فصلی"],["قم","خشک و گرم","ثبت خشکی، تعریق و حس محصول"],["سایر / نامشخص","زمینه محلی ثبت نشده","شرایط واقعی روزت را خودت ثبت کن"]
].map(([name,context,trackingHint])=>({name,context,trackingHint}));
const demoProfile={
 id:"demo_sara_tehran_v1",label:"روتین فرضی سارا — فقط دمو",source:"synthetic_demo",city:"تهران",
 skinBase:"مختلط",skinToday:"جوش فعال",sensitivity:"متوسط",barrier:"مشکوک",symptoms:["جوش فعال"],
 lastSkinChange:"داده فرضی برای نمایش مسیر؛ نه مشاهده واقعی",goal1:"کاهش جوش التهابی",goal2:"آبرسانی و حمایت از لایهٔ محافظ پوست",
 expectationWindow:"۶ تا ۱۲ هفته",dealbreaker:"قرمزی و سوزش",texture:"ژل سبک",fragrance:"بدون عطر",makeupFit:"روزانه آرایش می‌کنم",
 routineTime:"۳ تا ۷ دقیقه",sensoryAvoid:["چسبندگی","پیل‌شدن"],sun:"متوسط",makeup:"چند روز در هفته",sweat:"متوسط",
 productBudget:"900000",purchasePriority:"اصالت",brandPreference:"فرقی ندارد",economicAlternative:"بله، همیشه نشان بده",
 safetyFlags:[],safetyNote:"",serviceConsent:true,photoConsent:false,researchConsent:false,
 routine:[
  {name:"شوینده ملایم بدون اسکراب",time:"صبح و شب",weekly:"14",since:"",stage:"مرحله اول",adherence:"منظم",satisfaction:"راضی"},
  {name:"مرطوب‌کننده سبک",time:"صبح و شب",weekly:"14",since:"",stage:"بعد از شست‌وشو",adherence:"منظم",satisfaction:"راضی"},
  {name:"ضدآفتاب SPF50",time:"صبح",weekly:"7",since:"",stage:"مرحله آخر صبح",adherence:"گاهی فراموش می‌کنم",satisfaction:"هنوز نمی‌دانم"}
 ],
 history:[{product:"سرم نیاسینامید با نسخه نامشخص",experience:"سوزش/قرمزی",latency:"روز سوم",certainty:"احتمال می‌دهم"}]
};
window.BW_IRAN_DATASET={
 version:"2.5.0-pilot-ui-2026-09-04",asOf:"2026-09-04",status:"closed_pilot_unknown_product_ready_not_recommendation_eligible",catalog,cities,demoProfile,
 rules:{
  verifiedProductRequires:["نسخه دقیق بازار ایران","INCI کامل و مرتب از همان بسته","GTIN یا IRC تطبیق‌شده با لیبل","منبع و زمان مشاهده","رفع تعارض منابع","بازبینی داروساز یا متخصص پوست"],
  userContextRequires:["وضعیت امروز پوست","هدف و خط قرمز","حداقل یک محصول از روتین فعلی","تأیید به‌روز بودن روتین"],
  cityPolicy:"زمینه شهر فقط برای سؤال‌های پیگیری و ترجیح بافت استفاده می‌شود؛ نسخه درمانی یا ادعای پزشکی از شهر ساخته نمی‌شود.",
  pilotGate:{sessions:15,usableSessionsMin:10,decisionChangeOrRationalStopMin:0.30,medianSecondsMax:600,return14dMin:0.40,paymentsMin:2}
 }
};
})();
