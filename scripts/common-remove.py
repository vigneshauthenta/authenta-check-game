import os
import json

# 1. Rename files in set-1
folder = './showcase'
files = sorted(os.listdir(folder))
name_map = {}

for idx, filename in enumerate(files, 1):
    ext = os.path.splitext(filename)[1]
    new_name = f'showcase-{idx}{ext}'
    src = os.path.join(folder, filename)
    dst = os.path.join(folder, new_name)
    os.rename(src, dst)
    name_map[filename] = new_name

# 2. Update authenta-data.json
with open('authenta-data.json', 'r') as f:
    data = json.load(f)

def update_path(path):
    # Only update if path contains set-1 and old filename
    if folder in path:
        for old, new in name_map.items():
            if old in path:
                return path.replace(old, new)
    return path

# Update all paths in the JSON (assuming it's a list of dicts or strings)
def recursive_update(obj):
    if isinstance(obj, dict):
        return {k: recursive_update(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [recursive_update(i) for i in obj]
    elif isinstance(obj, str):
        return update_path(obj)
    else:
        return obj

updated_data = recursive_update(data)

with open('authenta-data.json', 'w') as f:
    json.dump(updated_data, f, indent=2)

print("Renaming and JSON update complete.")