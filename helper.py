import glob
import os
import json

# Get all image files in /real/ directory
image_files = glob.glob("./fake/*")

# Filter only image files (common extensions)
valid_extensions = (".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp")
image_files = [f for f in image_files if f.lower().endswith(valid_extensions)]

# Convert absolute paths to relative ones (e.g. "real/image1.png")
image_files = [os.path.relpath(f, start="/") for f in image_files]

# Optional: sort the list alphabetically
image_files.sort()

# Store the array into a JSON file
with open("fake.json", "w") as outfile:
    json.dump(image_files, outfile, indent=4)

print("✅ Image list saved to images.json")
