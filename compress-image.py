import os
from PIL import Image

input_folder = 'showcase'  # Change to your folder
output_folder = 'showcase-compressed'
os.makedirs(output_folder, exist_ok=True)

for filename in os.listdir(input_folder):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, filename)
        try:
            with Image.open(input_path) as img:
                # Resize if larger than 1024px (optional)
                max_size = (1024, 1024)
                img.thumbnail(max_size, Image.LANCZOS)

                # For JPEG: compress to quality=60
                if filename.lower().endswith(('.jpg', '.jpeg')):
                    img.save(output_path, 'JPEG', quality=60, optimize=True)
                # For PNG: compress and reduce quality
                elif filename.lower().endswith('.png'):
                    img.save(output_path, 'PNG', optimize=True)
            print(f"Compressed: {filename}")
        except Exception as e:
            print(f"Error compressing {filename}: {e}")

print("Compression complete. Compressed images are in:", output_folder)