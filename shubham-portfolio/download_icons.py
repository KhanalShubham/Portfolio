import urllib.request
import io
import os
from PIL import Image

os.makedirs('src/icons', exist_ok=True)

# Important XP icons and their shell32.dll icon index or well-known IDs
# 16: My Computer
# 17: Audio / Speaker
# 18: Sound / Audio CD
# 22: Audio CD
# 23: Help / Question
# 24: Search / Find
# 25: Settings / Control Panel
# 32: Recycle Bin Empty
# 33: Recycle Bin Full
# 35: System / Properties
# 36: Key / Security
# 44: Star / Favorites
# 4: Folder Closed
# 5: Folder Open
# 9: Hard Disk Drive C:
# 14: Network Neighborhood / Globe
# 152: Text Document / Notepad
# 221: Display / Desktop
# 235: My Documents / Folder
# 238: Favorites folder
# 245: Run / Terminal

ids = [4, 5, 9, 14, 15, 16, 17, 18, 22, 23, 24, 25, 32, 33, 35, 36, 44, 152, 221, 235, 238, 245]

for icon_id in ids:
    filename = f'src/icons/shell32_{icon_id}.png'
    if os.path.exists(filename):
        continue
    url = f'https://raw.githubusercontent.com/bartekl1/windows-ui-assets/main/Icons/Windows%20XP/ico/shell32.dll/ICON{icon_id}_1.ico'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=5).read()
        im = Image.open(io.BytesIO(data))
        # Seek to the largest icon size in the ICO file
        best_frame = None
        max_dim = 0
        try:
            for frame in range(0, 10):
                im.seek(frame)
                dim = im.size[0] * im.size[1]
                if dim > max_dim:
                    max_dim = dim
                    best_frame = im.copy()
        except EOFError:
            pass
        if best_frame:
            best_frame.save(filename, format='PNG')
        else:
            im.save(filename, format='PNG')
        print(f"Downloaded shell32_{icon_id}.png ({im.size})")
    except Exception as e:
        print(f"Failed {icon_id}: {e}")
