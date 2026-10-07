'use client';
import { useEffect, useRef, useState } from 'react';
export function DemoNotice({ message, onClose }: { message: string; onClose: () => void }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(() => { const el = ref.current; if (message && el && !el.open) el.showModal(); }, [message]);
 return <dialog ref={ref} id="demo-notice" className="demo-dialog" onCancel={onClose} onClose={onClose}><span className="eyebrow">LOCAL DEMONSTRATION</span><h2>{message}</h2><p>This action is a visual demo. No request has been sent, no record has changed and no external service is connected.</p><button className="lime-button" onClick={() => { ref.current?.close(); onClose(); }}>Close</button></dialog>;
}
export function WebsiteInteractions() {
 const [notice, setNotice] = useState('');
 const [menu, setMenu] = useState(false);
 useEffect(() => {
  const click = (e: MouseEvent) => {
   const el = (e.target as Element).closest<HTMLElement>('[data-demo]');
   if (el) { e.preventDefault(); setNotice(el.dataset.demo || 'Demo action'); }
  };
  const scroll = () => document.querySelector('.site-nav')?.classList.toggle('scrolled', window.scrollY > 40);
  const roi = () => {
   const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-roi-index]'));
   const vals = inputs.map(i => Number(i.value));
   inputs.forEach((i, n) => {
    const value = document.querySelector(`[data-roi-value="${n}"]`);
    if(value) value.textContent = `${i.value}${['','h','','×'][n]}`;
    const pct = (Number(i.value)-Number(i.min))/(Number(i.max)-Number(i.min))*100;
    i.style.background = `linear-gradient(to right, #050505 ${pct}%, #ccc ${pct}%)`;
   });
   const hours = vals[0]*vals[1]*vals[3], cost = hours*vals[2];
   const hoursEl = document.querySelector('[data-roi-output="hours"]');
   const costEl = document.querySelector('[data-roi-output="cost"]');
   if(hoursEl) hoursEl.textContent = hours.toLocaleString('en-NZ');
   if(costEl) costEl.textContent = 'NZ$'+cost.toLocaleString('en-NZ',{maximumFractionDigits:0});
   const bar = document.querySelector<HTMLElement>('[data-roi-score]');
   if(bar) bar.style.width = Math.min(100,cost/200000*100)+'%';
  };
  document.addEventListener('click',click); window.addEventListener('scroll',scroll,{passive:true});
  const ranges = document.querySelectorAll('[data-roi-index]'); ranges.forEach(i=>i.addEventListener('input',roi)); scroll();
  return () => { document.removeEventListener('click',click); window.removeEventListener('scroll',scroll); ranges.forEach(i=>i.removeEventListener('input',roi)); };
 }, []);
 return <><button className="mobile-menu-toggle" aria-expanded={menu} aria-controls="mobile-navigation" onClick={()=>setMenu(!menu)}>{menu?'Close':'Menu'}</button>{menu && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation">{[['Solutions','services'],['AI & ML','capabilities'],['Industries','industries'],['Case Studies','case-studies'],['Pricing','pricing'],['Insights','insights']].map(([label,id])=><a key={id} href={'#'+id} onClick={()=>setMenu(false)}>{label}</a>)}<a href="/admin">Admin demo</a></nav>}{notice && <DemoNotice message={notice} onClose={()=>setNotice('')}/>}</>;
}
