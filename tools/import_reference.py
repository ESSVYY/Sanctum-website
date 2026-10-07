from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag
import json,re
SOURCE=Path(r'C:\Users\hails\.codex\attachments\268b4bd2-4818-4889-8c2b-cf2a39901b9d\Pasted text.txt')
s=BeautifulSoup(SOURCE.read_text(encoding='utf-8'),'html5lib')
root=s.find(id='root').div
styles='\n'.join((t.string or '') for t in s.find_all('style'))
styles=re.sub(r'@import url\([^\n]+\);','',styles)
Path('app/reference.css').write_text(styles,encoding='utf-8')
ids=['hero','problems','founder','transformation','services','workflows','analytics','roi','capabilities','pricing','case-studies','industries','process','faq','insights','contact']
sections=root.find_all('section',recursive=False)
for sec,id in zip(sections,ids):
 sec['id']=id
 sec['aria-label']=id.replace('-',' ').title()
 for el in sec.find_all(style=True):
  st=el['style']
  if 'display: grid' in st:
   el['class']=el.get('class',[])+['reference-grid']
  if 'max-width: 1320px' in st: el['class']=el.get('class',[])+['section-container']
sections[0].select('.reference-grid')[0]['class']+=['hero-layout']
sections[0].select('.hero-layout')[0].find_all('div',recursive=False)[-1]['class']=['hero-art']
for el in sections[12].find_all(style=True):
 if 'grid-template-columns: 200px 1fr' in el['style']:
  el['style']=el['style'].replace('200px 1fr','280px 1fr')
  el['class']=el.get('class',[])+['process-row']
sections[3].find(style='display: flex; align-items: flex-start; gap: 0px;')['class']=['transformation-after']
nav=root.nav
nav['class']=['site-nav']
nav.find_all('div',recursive=False)[0]['class']=['nav-container']
nav.select('.hidden-mobile')[0]['class']+=['nav-links']
nav.find_all('div',recursive=False)[0].find_all('div',recursive=False)[-1]['class']=['nav-actions']
nav.find_all('button')[-1].name='a';nav.find_all('a')[-1]['href']='/admin'
nav.find_all('a')[-1]['style']+=' text-decoration: none;'
links={'solutions':'services','ai & ml':'capabilities','industries':'industries','case studies':'case-studies','pricing':'pricing','insights':'insights'}
for a in root.find_all('a'):
 if a.get('href')!='#':continue
 text=a.get_text(' ',strip=True).lower()
 if text in links:a['href']='#'+links[text]
 elif 'sanctum' in text:a['href']='#hero'
 else:
  a['data-demo']=a.get_text(' ',strip=True)
  a['href']='#demo-notice'
for b in sections[13].find_all('button'):
 parent=b.parent
 details=s.new_tag('details'); details['class']=['faq-item']
 summary=s.new_tag('summary'); summary['style']=b['style']
 for child in list(b.contents):summary.append(child.extract())
 details.append(summary)
 p=s.new_tag('p');p['class']=['faq-answer'];p.string='Answer placeholder — approved answer copy was not supplied. This demo does not define business policies or commitments.'
 details.append(p);parent.clear();parent.append(details)
# All captured dashboard graphics are illustrative, including their original LIVE badges.
sections[0].find_all('div',recursive=False)[-1].append(BeautifulSoup('<p class="hero-demo-label">ILLUSTRATIVE SYSTEM PREVIEW · DEMO DATA</p>','html.parser').p)
roi=sections[7]
for i,input in enumerate(roi.find_all('input')):
 input['aria-label']=input.parent.find('span').get_text()
 input['data-roi-index']=str(i)
 input.parent.find('div').find_all('span')[-1]['data-roi-value']=str(i)
for text,key in [('1,040','hours'),('NZ$36,400','cost')]:
 el=roi.find(string=text).parent;el['data-roi-output']=key;el['aria-live']='polite'
bar=roi.find(style=re.compile('width: 18.2%'))
bar['data-roi-score']='true'
bar.parent['aria-label']='Illustrative opportunity score'
footer=root.footer;footer['id']='footer'
# Pure JSX; escape strings, retain SVG casing, convert inline CSS to React style objects.
attrmap={'class':'className','for':'htmlFor','tabindex':'tabIndex','stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','stroke-dasharray':'strokeDasharray','stroke-dashoffset':'strokeDashoffset','stop-color':'stopColor','stop-opacity':'stopOpacity','fill-rule':'fillRule','clip-rule':'clipRule','fill-opacity':'fillOpacity','stroke-opacity':'strokeOpacity'}
def camel(k):return re.sub(r'-([a-z])',lambda m:m[1].upper(),k)
def jsx(el):
 if isinstance(el,NavigableString):return '{'+json.dumps(str(el),ensure_ascii=False)+'}' if str(el) else ''
 if not isinstance(el,Tag):return ''
 attrs=[]
 for k,v in el.attrs.items():
  if k.startswith('on') or k.startswith('data-scribe'):continue
  if k=='style':
   props={}
   for pair in v.split(';'):
    if ':' in pair:
     key,val=pair.split(':',1);props[camel(key.strip())]=val.strip()
   attrs.append('style={'+json.dumps(props,ensure_ascii=False)+'}')
  else:
   if isinstance(v,list):v=' '.join(v)
   if k=='value' and el.name=='input':k='defaultValue'
   attrs.append(attrmap.get(k,k)+'={'+json.dumps(v,ensure_ascii=False)+'}')
 if el.name=='svg':attrs.append('aria-hidden="true"')
 a=' '.join(attrs)
 if el.name in ['input','br','hr','img']:return f'<{el.name} {a} />'
 return f'<{el.name} {a}>'+''.join(jsx(c) for c in el.children)+f'</{el.name}>'
exports=[('ReferenceHeader',nav),('ServiceTicker',root.find_all(recursive=False)[2])]+[(camel(id.replace('-','_')).title().replace('_','')+'Section',sec) for id,sec in zip(ids,sections)]+[('ReferenceFooter',footer)]
content='// Generated from the supplied rendered homepage. See tools/import_reference.py.\n'
for name,el in exports:content+=f'export function {name}() {{ return ({jsx(el)}); }}\n\n'
Path('components/reference-sections.tsx').write_text(content,encoding='utf-8')
print([n for n,_ in exports])
