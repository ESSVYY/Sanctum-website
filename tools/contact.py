from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
import re
inventory=Path(r'C:\Users\hails\Documents\Codex\2026-10-07\we-are-preparing-to-build-the\work\reference-inventory.md').read_text(encoding='utf-8')
ids=list(dict.fromkeys(re.findall(r'(?<![\w-])[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}(?![\w-])',inventory)))
ids=[i for i in ids if Path(r'C:\Users\hails\AppData\Local\Temp',f'codex-clipboard-{i}.png').exists()]
for batch in range(0,len(ids),9):
 canvas=Image.new('RGB',(1440,990),'#333333')
 for j,i in enumerate(ids[batch:batch+9]):
  im=Image.open(Path(r'C:\Users\hails\AppData\Local\Temp',f'codex-clipboard-{i}.png'))
  im.thumbnail((480,300)); x=(j%3)*480;y=(j//3)*330
  canvas.paste(im,(x,y)); ImageDraw.Draw(canvas).text((x+8,y+304),f'{batch+j+1}: {i[:8]}',fill='white')
 canvas.save(f'reference/contact-{batch//9}.jpg')
