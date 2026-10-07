from PIL import Image,ImageDraw
from pathlib import Path
ids=['hero','problems','founder','transformation','services','workflows','analytics','roi','capabilities','pricing','case-studies','industries','process','faq','insights','contact']
canvas=Image.new('RGB',(1600,1600),'#333')
for n,id in enumerate(ids):
 im=Image.open(f'reference/section-{id}.png');im.thumbnail((400,365));x=n%4*400;y=n//4*400;canvas.paste(im,(x,y));ImageDraw.Draw(canvas).text((x+8,y+375),id,fill='white')
canvas.save('reference/implementation-contact.jpg')
im=Image.open('reference/home-375.png');h=im.height;canvas=Image.new('RGB',(1600,1800),'#333')
for n in range(16):
 y=int(n*h/16); crop=im.crop((0,y,375,min(y+int(h/16),h)));crop.thumbnail((400,420));x=n%4*400;cy=n//4*450;canvas.paste(crop,(x,cy));ImageDraw.Draw(canvas).text((x+8,cy+430),f'mobile segment {n+1}',fill='white')
canvas.save('reference/mobile-contact.jpg')
