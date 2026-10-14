/* BeautyWallet fresh layer for the Claude version: motion, less text, image fallbacks, install guide. */
(function(){'use strict';
var ON_CLAUDE=!!window.claude;var APP_URL=ON_CLAUDE?'https://claude.ai/artifact/W8fswnTudZWke1LEC3HCxs':location.origin+'/legacy/';
var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};

/* 1. panel entrance on every tab switch */
function animate(id){var panel=document.getElementById(id);if(!panel)return;panel.classList.remove('fr-enter');void panel.offsetWidth;panel.classList.add('fr-enter');fold(panel)}
if(typeof window.switchTab==='function'){var original=window.switchTab;window.switchTab=function(tab){var r=original.apply(this,arguments);animate(tab==='home'?'products':tab);return r}}

/* 2. less text: helper paragraphs longer than ~2 lines fold, with a small "بیشتر" */
var SKIP='form,#activeVerdict,.bw-catalog-check,#decisionSummary,.bw-readable-answer,#assistantChat,.assistant-chat,.bubble,dialog,.sheet,.install-dialog,details,.pf-answer,label,button';
function fold(root){$$('p',root).forEach(function(p){if(p.dataset.frFold||p.closest(SKIP))return;var text=p.textContent.trim();if(text.length<150)return;p.dataset.frFold='1';p.classList.add('fr-fold');var more=document.createElement('button');more.type='button';more.className='fr-more';more.textContent='بیشتر';more.onclick=function(){var open=p.classList.toggle('fr-fold');more.textContent=open?'بیشتر':'کمتر'};p.after(more)})}

/* 3. product tiles: brand monogram when the store photo cannot load inside Claude */
var cat={};try{(typeof PRODUCTS!=='undefined'?PRODUCTS:[]).forEach(function(p){cat[p.id]=p})}catch(e){}
function mono(media){if(media.querySelector('.fr-mono'))return;var card=media.closest('[data-id]');var p=card&&cat[card.dataset.id];var en=(p&&p.en)||'';var words=en.replace(/[^A-Za-z0-9 ]/g,' ').split(/\s+/).filter(Boolean);var initials=(words[0]||'B').slice(0,1).toUpperCase()+(words[1]||'W').slice(0,1).toUpperCase();var m=document.createElement('span');m.className='fr-mono';m.innerHTML='<b></b><small></small>';m.firstChild.textContent=initials;m.lastChild.textContent=(p&&p.cat)||'محصول';media.classList.add('img-error');media.append(m)}
function fixImages(root){$$('.product-media,.sheet-media',root).forEach(function(media){var img=media.querySelector('img');if(!img){if(!media.children.length||media.querySelector('.placeholder-mark'))mono(media);return}if(img.complete&&img.naturalWidth===0)mono(media);img.addEventListener('error',function(){img.hidden=true;mono(media)},{once:true})})}
new MutationObserver(function(list){list.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1){fixImages(n.parentElement||n);}})})}).observe(document.documentElement,{childList:true,subtree:true});

/* 4. install guide that matches the Claude link (home-screen shortcut on iPhone and Android) */
var STEPS={ios:['لینک بیوتی‌ولت را در Safari باز کن','دکمه اشتراک‌گذاری ⬆︎ پایین صفحه را بزن','«Add to Home Screen» را بزن و «Add» را تأیید کن'],android:['لینک بیوتی‌ولت را در Chrome باز کن','منوی ⋮ بالای صفحه را بزن','«Add to Home screen» یا «افزودن به صفحه اصلی» را بزن و تأیید کن']};
function guide(){var dialog=$('#installDialog');if(!dialog)return;var card=$('.install-dialog-card',dialog)||dialog;var os=/android/i.test(navigator.userAgent)?'android':'ios';
  var title=$('#installDialogTitle');if(title)title.textContent='بیوتی‌ولت روی گوشی';
  var intro=$('#installGuideIntro');if(intro)intro.textContent='یک لمس تا آیکن بیوتی‌ولت روی صفحه اصلی';
  var steps=$('#installGuideSteps');if(!steps)return;
  var tabs=$('.fr-os',card);if(!tabs){tabs=document.createElement('div');tabs.className='fr-os';tabs.innerHTML='<button type="button" data-os="ios">آیفون</button><button type="button" data-os="android">اندروید</button>';steps.before(tabs);tabs.addEventListener('click',function(e){var b=e.target.closest('[data-os]');if(b)render(b.dataset.os)})}
  var link=$('.fr-link',card);if(!link){link=document.createElement('div');link.className='fr-link';link.innerHTML='<button type="button">کپی لینک</button><span></span>';link.lastChild.textContent=APP_URL;steps.after(link);link.firstChild.onclick=function(){var b=link.firstChild;var done=function(){b.textContent='کپی شد'};try{navigator.clipboard.writeText(APP_URL).then(done,function(){select()})}catch(e){select()}function select(){var r=document.createRange();r.selectNodeContents(link.lastChild);var s=getSelection();s.removeAllRanges();s.addRange(r)}}}
  $$('#copyInstallLink').forEach(function(b){b.hidden=true});
  function render(which){$$('[data-os]',tabs).forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.os===which))});steps.className='fr-steps';steps.replaceChildren.apply(steps,STEPS[which].map(function(t){var li=document.createElement('li');li.textContent=t;return li}))}
  render(os);if(!dialog.open){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}}
// On its own site the real PWA install prompt (install-app.js) runs; inside Claude show the home-screen guide.
if(ON_CLAUDE)document.addEventListener('click',function(e){var b=e.target.closest('#installAppButton,#installHomeButton');if(!b)return;e.preventDefault();e.stopImmediatePropagation();guide()},true);

function ready(){$$('#installAppButton').forEach(function(b){b.hidden=false;b.classList.add('fr-install');b.textContent='نصب روی گوشی'});var active=$('section.panel.active');if(active)animate(active.id);fixImages(document)}
if(document.readyState==='complete')ready();else window.addEventListener('load',ready);
})();
