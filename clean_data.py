import json
import unicodedata
import os

os.makedirs('src/data', exist_ok=True)

def clean_text(text):
    if not isinstance(text, str):
        return text
    # Remove junk characters
    junk = "!\"#$%&'()%"
    for j in junk:
        text = text.replace(j, '')
    # Normalize CJK Compatibility characters
    text = unicodedata.normalize('NFKC', text)
    return text.strip()

# 1. Clean words
with open('legacy/hsk_words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

clean_words = {}
for key, data in words.items():
    if not key or key.strip() == "":
        continue
        
    new_key = clean_text(key)
    if new_key == "中国語": # filter out header artifact
        continue
        
    clean_words[new_key] = {
        "pinyin": clean_text(data.get("pinyin", "")),
        "display_pinyin": clean_text(data.get("display_pinyin", "")),
        "meaning": clean_text(data.get("meaning", ""))
    }

with open('src/data/hsk_words.json', 'w', encoding='utf-8') as f:
    json.dump(clean_words, f, ensure_ascii=False, indent=2)

# 2. Clean sentences
with open('legacy/hsk_sentences.json', 'r', encoding='utf-8') as f:
    sentences = json.load(f)

clean_sentences = []
for s in sentences:
    new_s = {}
    for k, v in s.items():
        if isinstance(v, str):
            new_s[k] = clean_text(v)
        elif isinstance(v, list):
            new_s[k] = [clean_text(i) for i in v]
        else:
            new_s[k] = v
    clean_sentences.append(new_s)

with open('src/data/hsk_sentences.json', 'w', encoding='utf-8') as f:
    json.dump(clean_sentences, f, ensure_ascii=False, indent=2)

print(f"Cleaned {len(clean_words)} words and {len(clean_sentences)} sentences.")
