import os
import json

set1_dir = 'set-1'
set2_dir = 'set-2'
set1_files = sorted([f for f in os.listdir(set1_dir) if f.startswith('image-')])
set2_files = sorted([f for f in os.listdir(set2_dir) if f.startswith('image-')])

num_sets = min(len(set1_files) // 3, len(set2_files) // 7)
sets = []
used_set1 = set()
used_set2 = set()

for set_id in range(1, num_sets + 1):
    set1_imgs = []
    set2_imgs = []
    # Pick 3 unused from set-1
    for f in set1_files:
        if f not in used_set1:
            set1_imgs.append(f)
            used_set1.add(f)
        if len(set1_imgs) == 3:
            break
    # Pick 7 unused from set-2
    for f in set2_files:
        if f not in used_set2:
            set2_imgs.append(f)
            used_set2.add(f)
        if len(set2_imgs) == 7:
            break
    # Compose set
    images = [{"path": f"set-1/{img}", "type": "set-1"} for img in set1_imgs] + \
             [{"path": f"set-2/{img}", "type": "set-2"} for img in set2_imgs]
    sets.append({"id": set_id, "images": images})

with open('image-sets.json', 'w') as f:
    json.dump({"sets": sets}, f, indent=2)

print(f"Generated {len(sets)} sets in image-sets.json")