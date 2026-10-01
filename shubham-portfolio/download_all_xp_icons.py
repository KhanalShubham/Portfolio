import urllib.request
import io
import os
import re
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

os.makedirs('src/icons', exist_ok=True)

# Fetch markdown table to get all icon IDs
url = 'https://raw.githubusercontent.com/bartekl1/windows-ui-assets/main/Tables/Windows%20XP%20Icons.md'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
text = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
ids = sorted(list(set(re.findall(r'ICON(\d+)_1\.ico', text))), key=lambda x: int(x))
print(f"Found {len(ids)} Windows XP shell32 icon IDs.")

def fetch_and_save(icon_id):
    png_path = f'src/icons/xp_{icon_id}.png'
    if os.path.exists(png_path):
        return icon_id, "cached"
    ico_url = f'https://raw.githubusercontent.com/bartekl1/windows-ui-assets/main/Icons/Windows%20XP/ico/shell32.dll/ICON{icon_id}_1.ico'
    try:
        r = urllib.request.Request(ico_url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(r, timeout=10).read()
        im = Image.open(io.BytesIO(data))
        best_frame = None
        max_dim = 0
        try:
            for f in range(12):
                im.seek(f)
                d = im.size[0] * im.size[1]
                if d > max_dim:
                    max_dim = d
                    best_frame = im.copy()
        except EOFError:
            pass
        target = best_frame if best_frame else im
        target.save(png_path, format='PNG')
        return icon_id, "saved"
    except Exception as e:
        return icon_id, str(e)

with ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(fetch_and_save, ids))

saved_count = sum(1 for r in results if r[1] in ('saved', 'cached'))
print(f"Successfully processed {saved_count} / {len(ids)} XP icons!")
