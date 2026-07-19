import fitz

doc = fitz.open("中国語単語hsk4.pdf")
page = doc[0]
print(repr(page.get_text("text")[:1000]))
