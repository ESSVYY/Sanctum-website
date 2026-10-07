from pathlib import Path
import urllib.request
for name in ['inter','spacegrotesk','jetbrainsmono']:
 text=urllib.request.urlopen(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{name}/OFL.txt').read()
 Path(f'public/fonts/LICENSE-{name}.txt').write_bytes(text)
print('Bundled three font licenses.')
