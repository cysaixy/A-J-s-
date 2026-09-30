/* Shared behaviour for redesigned pages: mobile nav + footer year. Replaces global.js (no theme injection). */
document.addEventListener('DOMContentLoaded',()=>{
  const y=document.getElementById('year');if(y)y.textContent=new Date().getFullYear();
  const t=document.getElementById('navToggle'),n=document.getElementById('siteNav');if(!t||!n)return;
  const set=o=>{n.classList.toggle('open',o);t.classList.toggle('open',o);t.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':''};
  t.addEventListener('click',e=>{e.stopPropagation();set(!n.classList.contains('open'))});
  n.addEventListener('click',e=>{if(e.target.closest('a'))set(false)});
  addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
});
