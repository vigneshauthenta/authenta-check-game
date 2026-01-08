import os
from PIL import Image
INPUT_DIR = "./set-2"        #Src dir folder
OUTPUT_DIR = "./set-2-cropped"      #Dest dir folder
# Watermark crop ratios (safe defaults for Gemini)
CROP_RIGHT_RATIO = 0.12   # 12% from right
CROP_BOTTOM_RATIO = 0.08  # 8% from bottom
SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")
os.makedirs(OUTPUT_DIR, exist_ok=True)
def crop_gemini_watermark(image_path, output_path):
    img = Image.open(image_path)
    width, height = img.size
    # Calculate dynamic crop boundaries
    crop_right = int(width * (1 - CROP_RIGHT_RATIO))
    crop_bottom = int(height * (1 - CROP_BOTTOM_RATIO))
    # Crop box: (left, top, right, bottom)
    crop_box = (0, 0, crop_right, crop_bottom)
    cropped_img = img.crop(crop_box)
    cropped_img.save(output_path)
    print(f"Cropped: {os.path.basename(image_path)}")
def process_folder():
    for filename in os.listdir(INPUT_DIR):
        if filename.lower().endswith(SUPPORTED_EXTENSIONS):
            input_path = os.path.join(INPUT_DIR, filename)
            output_path = os.path.join(OUTPUT_DIR, filename)
            crop_gemini_watermark(input_path, output_path)
    print("\n All images processed...")
if __name__ == "__main__":
    process_folder()