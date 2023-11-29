 # Converts "Wallpaper Engine project.json" to "Lively Wallpaper LivelyProperties.json"
 # Copyright: gpt4
 
import json
import re

# Choose a localization (e.g., 'en-us')
chosen_localization = 'en-us'

remove_fields = ['editable', 'order', 'condition']
replace_string = 'ui_ao'
replace_fields = ['text', 'value', 'label']

checkbox_to_string = 'HDR'

remove_keys = ['schemecolor', 'HDR_NO_AUDIO', 'HDR_IMGS', 'SPCR_20', 'img_overlay', 'img_background', 'SPCR_21', 'mirror_invalid_val']

replacements = {
    '=======================': '========================================',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~': '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
}

def remove_html_tags(text):
    text = re.sub('<[^>]*>', '', text)  # Remove HTML tags
    text = re.sub(' +', ' ', text)      # Replace double spaces with single spaces
    text = text.strip()                 # Trim the string
    if text in replacements:
        text = replacements[text]
    return text

def rgb_to_hex(rgb_str):
    rgb_float = list(map(float, rgb_str.split()))
    return '#{:02x}{:02x}{:02x}'.format(int(rgb_float[0]*255), int(rgb_float[1]*255), int(rgb_float[2]*255))

# Load JSON file A (translations)
with open('../public/project.json', 'r', encoding='utf-8') as file:
    file_a = json.load(file)
    file_b = file_a['general']['properties']

# Iterate through the keys and values in file B
for key in list(file_b.keys()):
    value = file_b[key]
    # Remove Key
    if key in remove_keys:
        del file_b[key]
        continue
    
    # Remove Ordering & Conditions
    for field in remove_fields:
        if field in value:
            del value[field]
            
    # make Headers to strings
    if key.startswith(checkbox_to_string):
        value['type'] = 'text'
        if 'value' in value:
            del value['value']
    
    # Replace the "type" field's value "text" with "label"
    if 'type' in value and value['type'] == 'text':
        value['type'] = 'label'
        if 'text' in value:
            value['value'] = value['text']
            del value['text']
        
    # Replace the "type" field's value "bool" with "checkbox"
    if 'type' in value and value['type'] == 'bool':
        value['type'] = 'checkbox'
        
    # Replace the "type" field's value "combo" with "dropdown"
    if 'type' in value and value['type'] == 'combo':
        value['type'] = 'dropdown'
        
    # Convert the "value" field's color from RGB floating format to hex color code
    if 'type' in value and value['type'] == 'color':
        value['value'] = rgb_to_hex(value['value'])
        
    # Iterate over the fields "text" and "value"
    for field in replace_fields:
        # Check if the value has the required field and the corresponding localization
        if field in value and isinstance(value[field], str) and value[field].startswith(replace_string) and value[field] in file_a['general']['localization'][chosen_localization]:
            # Replace the field with the corresponding localization string
            value[field] = remove_html_tags(file_a['general']['localization'][chosen_localization][value[field]])

    # Check if the value has the "options" field
    if 'options' in value:
        # Create a new list for the items
        items = []

        # Iterate over the options list
        for option in value['options']:
            # Check if the option has the "label" field and the corresponding localization
            if 'label' in option and isinstance(option['label'], str) and option['label'].startswith(replace_string) and option['label'] in file_a['general']['localization'][chosen_localization]:
                # Replace the label with the corresponding localization string
                option['label'] = remove_html_tags(file_a['general']['localization'][chosen_localization][option['label']])
            # Add the label to the items list
            items.append(option['label'])
        
        # Update the value with the new items list
        value['items'] = items
        # Remove the "options" field
        del value['options']

        
        
# Save the modified file B to a new JSON file
with open('./public/LivelyProperties.json', 'w', encoding='utf-8') as file:
    json.dump(file_b, file, ensure_ascii=False, indent=2)