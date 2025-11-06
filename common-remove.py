import json

# Load JSON data
with open('fake.json', 'r') as f:
    fake_list = json.load(f)
with open('real.json', 'r') as f:
    real_list = json.load(f)

def extract_filename(path, key):
    # Extract filename after /real/ or /fake/
    parts = path.split(f'/{key}/')
    if len(parts) > 1:
        return parts[1]
    return None

# Get filenames from both lists
fake_filenames = set(extract_filename(p, 'fake') for p in fake_list if extract_filename(p, 'fake'))
real_filenames = set(extract_filename(p, 'real') for p in real_list if extract_filename(p, 'real'))

# Find common filenames
common_filenames = fake_filenames & real_filenames

# Remove common filenames from both lists
filtered_fake = [p for p in fake_list if extract_filename(p, 'fake') not in common_filenames]
filtered_real = [p for p in real_list if extract_filename(p, 'real') not in common_filenames]

# Save filtered lists
with open('fake_filtered.json', 'w') as f:
    json.dump(filtered_fake, f, indent=2)
with open('real_filtered.json', 'w') as f:
    json.dump(filtered_real, f, indent=2)