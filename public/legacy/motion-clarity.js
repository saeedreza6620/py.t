(function(){
 'use strict';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 function entrance(panel,initial=false){
  if(!panel||reduced.matches)return;
  if(!initial){panel.classList.remove('bw-page-enter');void panel.offsetWidth;panel.classList.add('bw-page-enter');return;}
  const items=panel.querySelectorAll('.section-head,.pf-profile-start,.decision-entry,.assistant-hub,.pf-supplements');
  items.forEach((item,index)=>{item.style.setProperty('--bw-delay',Math.min(index*45,180)+'ms');item.classList.add('bw-enter')});
 }
 function init(){
  document.querySelectorAll('.hub-link small, .section-head small:not([id])').forEach(node=>node.remove());
  document.querySelectorAll('.supp-intro>p').forEach(node=>{
   const details=document.createElement('details'),summary=document.createElement('summary');details.className='bw-inline-note';summary.textContent='پیش از مصرف بدان';node.before(details);details.append(summary,node);
  });
  entrance(document.querySelector('section.panel.active'),true);
  window.addEventListener('bw:tab',event=>entrance(document.getElementById(event.detail)));
  // Remove only the decorative overlay; no loading or API state depends on it.
  const overlay=document.querySelector('.bw-opening');if(overlay)setTimeout(()=>overlay.remove(),1100);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
