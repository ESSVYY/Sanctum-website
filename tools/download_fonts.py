from pathlib import Path
import urllib.request,re
folder=Path('public/fonts');folder.mkdir(exist_ok=True)
css=''
for family in ['Space+Grotesk:wght@300;400;500;600;700','Inter:wght@300;400;500;600;700','JetBrains+Mono:wght@400;500;700']:
 req=urllib.request.Request('https://fonts.googleapis.com/css2?family='+family+'&display=swap',headers={'User-Agent':'Mozilla/5.0'})
 text=urllib.request.urlopen(req).read().decode()
 for url in dict.fromkeys(re.findall(r'url\((https[^)]+)\)',text)):
  name=url.split('/')[-1];dest=folder/name
  if not dest.exists():dest.write_bytes(urllib.request.urlopen(url).read())
  text=text.replace(url,'/fonts/'+name)
 css+=text+'\n'
Path('app/fonts.css').write_text(css,encoding='utf-8')
p=Path('app/reference.css');text=p.read_text(encoding='utf-8');text=re.sub(r'@import url\([^\n]+\);','',text);p.write_text(text,encoding='utf-8')
p=Path('app/layout.tsx');text=p.read_text(encoding='utf-8').replace("import './reference.css';","import './fonts.css';\nimport './reference.css';");p.write_text(text,encoding='utf-8')
print('Downloaded fonts:',len(list(folder.iterdir())))
