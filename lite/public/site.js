/* BeautyWallet site — shared header, menu and helpers */
(function(){
'use strict';
var PAGES=[['/','داستان'],['/learn.html','آموزش پوست'],['/faq.html','سؤال‌ها و الماس'],['/join.html','عضویت و نظر'],['/install.html','نصب']];
var here=location.pathname.replace(/index\.html$/,'');
var head=document.createElement('header');head.className='bar';head.id='bar';
head.innerHTML='<div class="bar-in"><a class="brand" href="/"><img src="/legacy/bw-gem-192.png" alt="">بیوتی‌ولت</a>'+
  '<nav class="menu" id="menu" aria-label="صفحه‌های سایت">'+PAGES.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===here?' aria-current="page"':'')+'>'+p[1]+'</a>'}).join('')+'</nav>'+
  '<a class="btn open" href="/legacy/">باز کردن اپ</a><button class="burger" type="button" aria-label="منو" aria-expanded="false" aria-controls="menu">☰</button></div>';
document.body.prepend(head);
var menu=head.querySelector('#menu'),burger=head.querySelector('.burger');
burger.addEventListener('click',function(){var o=menu.classList.toggle('open');burger.setAttribute('aria-expanded',String(o));burger.textContent=o?'✕':'☰'});
addEventListener('scroll',function(){head.classList.toggle('scrolled',scrollY>8)},{passive:true});
var foot=document.createElement('footer');
foot.innerHTML='<div class="wrap"><nav>'+PAGES.map(function(p){return '<a href="'+p[0]+'">'+p[1]+'</a>'}).join('')+'<a href="/legacy/">اپ بیوتی‌ولت</a></nav><p style="margin:0">جواب‌های بیوتی‌ولت جای معاینه‌ی پزشک رو نمی‌گیرن. بیوتی‌ولت طرف خریداره و درآمد روی جواب «بخر یا نخر» اثر نداره.</p></div>';
document.body.append(foot);
window.BW={
  fa:function(n){return String(n).replace(/[0-9]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'[d]})},
  money:function(t){return window.BW.fa(Number(t||0).toLocaleString('en'))+' تومان'},
  get:function(k,d){try{var v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  dev:function(){var id='';try{id=localStorage.getItem('bw_device')||'';if(!/^[a-z0-9]{12,40}$/.test(id)){id=(Date.now().toString(36)+Math.random().toString(36).slice(2,12)).slice(0,24);localStorage.setItem('bw_device',id)}}catch(e){}return id},
  post:function(u,b){return fetch(u,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).then(function(r){return r.json().catch(function(){return {}}).then(function(j){if(!r.ok)throw Error(j.error||'نرسید؛ دوباره بزن');return j})})}
};
try{window.BW.post('/api/event',{type:'site_open',d:window.BW.dev(),page:'site'}).catch(function(){})}catch(e){}
})();
