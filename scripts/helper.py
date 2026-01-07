import os
import json

folder = './showcase'
files = sorted(os.listdir(folder))
output = []

for idx, filename in enumerate(files, 1):
    ext = os.path.splitext(filename)[1]
    output.append(f"{folder}/showcase-{idx}{ext}")

with open('showcase-images.json', 'w') as f:
    json.dump(output, f, indent=2)

print("JSON with showcase image paths written to showcase-images.json.")