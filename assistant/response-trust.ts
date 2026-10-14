export function guardDecision(answer:string,decision:string,hold:boolean,reasons:string[],questions:string[],needsProductVerification:boolean,medical=false){let text=answer,label=decision;if(medical&&decision==='buy'){hold=true;reasons=[...reasons,'این سؤال درمانی است؛ توصیه خرید جای ارزیابی پزشک یا داروساز نیست'];}
 if(hold){label='wait';text='نتیجه: فعلاً صبر کن\n'+reasons.join('؛ ')+'\n'+(questions[0]||'این مورد را پیش از خرید یا تغییر مصرف بررسی کنیم')+'\nتأیید خرید در این مرحله صادر نشده';}
 else if(needsProductVerification&&label==='buy'){label='wait';text='نتیجه: فعلاً صبر کن\nفرمول همین نسخه هنوز تأیید نشده؛ نتیجه خرید قطعی صادر نمی‌کنیم\n\n'+text.replace(/^نتیجه\s*[:：].*$/gm,'').trim();}
 return {answer:text,decision:label};}
export function sourceEvidence(answer:string,sources:Array<{title:string;url:string}>){return sources.filter(s=>answer.includes(s.url));}
