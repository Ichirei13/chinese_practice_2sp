import json
import subprocess
import sys

try:
    import fitz
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz

def remove_tones(pinyin_str):
    tone_marks = {
        'ā': 'a', 'á': 'a', 'ǎ': 'a', 'à': 'a',
        'ē': 'e', 'é': 'e', 'ě': 'e', 'è': 'e',
        'ī': 'i', 'í': 'i', 'ǐ': 'i', 'ì': 'i',
        'ō': 'o', 'ó': 'o', 'ǒ': 'o', 'ò': 'o',
        'ū': 'u', 'ú': 'u', 'ǔ': 'u', 'ù': 'u',
        'ǖ': 'u', 'ǘ': 'u', 'ǚ': 'u', 'ǜ': 'u', 'ü': 'u',
        'a': 'a', 'e': 'e', 'i': 'i', 'o': 'o', 'u': 'u'
    }
    res = []
    for char in pinyin_str:
        res.append(tone_marks.get(char, char))
    return ''.join(res)

def main():
    pdf_path = "中国語単語hsk4.pdf"
    doc = fitz.open(pdf_path)
    
    words_dict = {}
    
    all_lines = []
    for page in doc:
        text = page.get_text("text")
        all_lines.extend([line.strip() for line in text.split('\n')])
        
    i = 0
    while i < len(all_lines):
        line = all_lines[i]
        
        if line.isdigit() and 1 <= int(line) <= 600:
            if i + 3 < len(all_lines):
                chinese = all_lines[i+1].replace('\x01', '').strip()
                display_pinyin = all_lines[i+2].replace('\x01', '').strip()
                meaning = all_lines[i+3].replace('\x01', '').strip()
                
                # Special cases where the meaning might be split across lines or there are extra lines
                # But since the pattern is exactly 4 lines per entry, let's check if the next line after meaning is another number or end
                # Actually, sometimes meanings wrap, let's check
                next_index = i + 4
                while next_index < len(all_lines):
                    next_line = all_lines[next_index]
                    if next_line == "" or next_line == "中国語" or next_line.startswith("HSK"):
                        next_index += 1
                        continue
                    if next_line.isdigit():
                        break
                    if "ピンイン" in next_line or "日本語" in next_line:
                        next_index += 1
                        continue
                    # It's an extra meaning line
                    meaning += next_line
                    next_index += 1
                
                pinyin_no_tones = remove_tones(display_pinyin).replace(" ", "")
                
                words_dict[chinese] = {
                    "pinyin": pinyin_no_tones,
                    "display_pinyin": display_pinyin,
                    "meaning": meaning
                }
                i = next_index - 1 # will be incremented by 1 at the end of loop
        i += 1

    with open("hsk_words.json", "w", encoding="utf-8") as f:
        json.dump(words_dict, f, ensure_ascii=False, indent=4)
        
    print(f"Successfully processed {len(words_dict)} words and saved to hsk_words.json")

if __name__ == "__main__":
    main()
