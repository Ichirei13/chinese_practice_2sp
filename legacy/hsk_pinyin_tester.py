import random
import sys
import json
import os
from datetime import datetime

# 外部の単語帳ファイル名とログファイル名
JSON_FILE = "hsk_words.json"
LOG_FILE = "wrong_words_log.txt"

# 初期データ（ファイルが存在しない場合に自動生成する用）
DEFAULT_WORDS = {
    "肯定": {"pinyin": "kending", "display_pinyin": "kěndìng", "meaning": "肯定する、間違いない"},
    "拒绝": {"pinyin": "jujue", "display_pinyin": "jùjué", "meaning": "拒絶する、断る"},
    "否则": {"pinyin": "fouze", "display_pinyin": "fǒuzé", "meaning": "さもなければ"},
    "引起": {"pinyin": "yinqi", "display_pinyin": "yǐnqǐ", "meaning": "引き起こす"},
    "交流": {"pinyin": "jiaoliu", "display_pinyin": "jiāoliú", "meaning": "交流する"},
    "随着": {"pinyin": "suizhe", "display_pinyin": "suíbiàn", "meaning": "～に伴って"},
    "既然": {"pinyin": "jiran", "display_pinyin": "jìrán", "meaning": "～である以上は"},
    "鼓励": {"pinyin": "guli", "display_pinyin": "gǔlì", "meaning": "励ます"},
    "证明": {"pinyin": "zhengming", "display_pinyin": "zhèngmíng", "meaning": "証明する"},
    "往往": {"pinyin": "wangwang", "display_pinyin": "wǎngwǎng", "meaning": "往々にして"},
    "甚至": {"pinyin": "shenzhi", "display_pinyin": "shènzhì", "meaning": "～でさえ"},
    "保证": {"pinyin": "baozheng", "display_pinyin": "bǎozhèng", "meaning": "保証する"},
    "偶尔": {"pinyin": "ouer", "display_pinyin": "ǒu'ěr", "meaning": "たまに"},
    "稍微": {"pinyin": "shaowei", "display_pinyin": "shāowēi", "meaning": "少し"},
    "随便": {"pinyin": "suibian", "display_pinyin": "suíbiàn", "meaning": "自由に、勝手に"}
}

def load_words():
    """単語データをJSONファイルからロードする。存在しない場合は初期データを作成する。"""
    if not os.path.exists(JSON_FILE):
        try:
            with open(JSON_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_WORDS, f, ensure_ascii=False, indent=4)
            print(f"💡 初期データとして '{JSON_FILE}' を自動生成しました。")
        except IOError as e:
            print(f"❌ ファイルの書き込みエラーが発生しました: {e}")
            sys.exit(1)
    
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"❌ JSONのパースエラー: '{JSON_FILE}' の形式が正しくありません。")
        sys.exit(1)
    except IOError as e:
        print(f"❌ ファイルの読み込みエラーが発生しました: {e}")
        sys.exit(1)

def save_wrong_words(wrong_counter, hsk_words):
    """間違えた単語のログをテキストファイルにタイムスタンプ付きで出力する。"""
    if not wrong_counter:
        print("
✨ 今回は誤り（バグ）ゼロです！パーフェクト！")
        return

    try:
        # 追記モード（a）で書き込み
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"=== HSK4級 苦手単語ログ [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] ===\n")
            for word, count in wrong_counter.items():
                data = hsk_words[word]
                f.write(f"単語: {word} | ピンイン: {data['display_pinyin']} | 意味: {data['meaning']} | 間違えた回数: {count}回\n")
            f.write("=" * 60 + "\n\n")
        print(f"📝 苦手単語（エラーログ）を '{LOG_FILE}' に保存しました。復習に活用してください。")
    except IOError as e:
        print(f"❌ ログファイルの書き込みエラーが発生しました: {e}")

def pinyin_typing_test():
    print("=" * 50)
    print(" 🚀 HSK4級 ピンイン強制入力テスト (Ver 2.0)")
    print("   〜 外部データロード ＆ エラーログ出力機能付き 〜")
    print(" ※ 終了するには 'exit' または 'quit' と入力")
    print("=" * 50)

    # 1. 外部ファイルからのデータロード（入力ストリーム操作）
    hsk_words = load_words()
    
    words = list(hsk_words.keys())
    random.shuffle(words)

    # 間違えた単語とその回数を記録するハッシュマップ（辞書型）
    wrong_counter = {}

    for word in words:
        data = hsk_words[word]
        correct_pinyin = data["display_pinyin"]
        
        while True:
            print(f"\n▶ 問題: 【 {word} 】 ({data['meaning']})")
            user_input = input("ピンインを入力 (声調記号あり): ").strip().lower()

            if user_input in ['exit', 'quit']:
                print("\nテストを中断します。そこまでの結果でログを出力します。")
                save_wrong_words(wrong_counter, hsk_words)
                sys.exit()

            if user_input == correct_pinyin:
                print(f" ✅ 正解！ 発音: [ {data['display_pinyin']} ]")
                break
            else:
                print(" ❌ 不正解... もう一度！")
                # カウンタのインクリメント処理
                wrong_counter[word] = wrong_counter.get(word, 0) + 1

    print("\n" + "=" * 50)
    print(" 🎉 全問クリア！お疲れ様でした。")
    print("=" * 50)
    
    # 2. テスト終了後のログ出力（出力ストリーム操作）
    save_wrong_words(wrong_counter, hsk_words)

if __name__ == "__main__":
    try:
        pinyin_typing_test()
    except KeyboardInterrupt:
        print("\n\nプログラムがシグナルを検知して強制終了されました。")
        sys.exit()
