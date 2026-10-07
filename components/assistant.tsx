'use client';
import { useEffect, useRef, useState } from 'react';
const topics = ['CRM Automation','Lead Generation','Reporting','WhatsApp','Custom AI','Ecommerce','Restaurant','Data Entry'];
const replies: Record<string,string> = {
 'CRM Automation':'Sample opportunity: capture an enquiry, qualify it and prepare a CRM entry for review.',
 'Lead Generation':'Sample opportunity: route incoming enquiries and prepare a follow-up for your team.',
 Reporting:'Sample opportunity: collect sample metrics and prepare a weekly reporting draft.',
 WhatsApp:'Sample opportunity: prepare a follow-up message after an enquiry. This demo sends no WhatsApp messages.',
 'Custom AI':'Sample opportunity: build an assistant around a specific repetitive business task.',
 Ecommerce:'Sample opportunity: organise product enquiries and draft customer support replies.',
 Restaurant:'Sample opportunity: organise booking enquiries and prepare a daily operations summary.',
 'Data Entry':'Sample opportunity: extract document fields and prepare structured records for human review.'
};
export function Assistant() {
 const [open,setOpen] = useState(false), [input,setInput] = useState('');
 const [messages,setMessages] = useState<{role:string;text:string}[]>([]);
 const field=useRef<HTMLInputElement>(null), launcher=useRef<HTMLButtonElement>(null), thread=useRef<HTMLDivElement>(null);
 useEffect(()=>{ if(open) field.current?.focus(); },[open]);
 useEffect(()=>{ if(thread.current) thread.current.scrollTop=thread.current.scrollHeight; },[messages]);
 function close(){setOpen(false);launcher.current?.focus();}
 function send(text:string){
  if(!text.trim())return;
  const topic=topics.find(t=>text.toLowerCase().includes(t.toLowerCase()));
  setMessages(m=>[...m,{role:'user',text:text.trim().slice(0,500)},{role:'assistant',text:(topic?replies[topic]:'Sample response: start by describing the repetitive task, its frequency and the tools involved. The ROI calculator can help estimate the time spent.')+' This is a local canned reply.'}]);setInput('');
 }
 return <aside className="assistant" aria-label="Sanctum AI help"><section className="chat-panel" hidden={!open} aria-labelledby="assistant-title" onKeyDown={e=>{if(e.key==='Escape')close();}}><header><span className="chat-logo">S</span><div><h2 id="assistant-title">SANCTUM AI ASSISTANT</h2><span className="chat-status">● LOCAL DEMO</span></div></header><div className="chat-messages" ref={thread} role="log" aria-live="polite"><p className="chat-bubble">What part of your business takes too much time? I can help identify automation opportunities for your specific situation.</p>{messages.map((m,i)=><p className={'chat-bubble '+m.role} key={i}><span className="sr-only">{m.role}: </span>{m.text}</p>)}</div><div className="chat-topics">{topics.map(t=><button key={t} onClick={()=>send(t)}>{t}</button>)}</div><form onSubmit={e=>{e.preventDefault();send(input);}}><input ref={field} aria-label="Message the assistant" placeholder="Ask about automation..." value={input} maxLength={500} onChange={e=>setInput(e.target.value)}/><button className="lime-button" aria-label="Send message" disabled={!input.trim()}>→</button></form></section><button ref={launcher} className="chat-launcher" aria-label={open?'Close assistant':'Open assistant'} aria-expanded={open} aria-controls="assistant-title" onClick={()=>{if(open)close();else setOpen(true);}}>{open?'×':<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="2"/><path d="M7 10h7M7 14h4" stroke="currentColor" strokeWidth="2"/></svg>}</button></aside>;
}
