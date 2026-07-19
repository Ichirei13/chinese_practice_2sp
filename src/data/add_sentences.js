const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hsk_sentences.json');

let existingData = [];
try {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  existingData = JSON.parse(fileContent);
} catch (error) {
  console.error('Error reading file:', error);
}

const newData = [
  {
    "id": "r6",
    "type": "rearrange",
    "tags": ["第4課"],
    "words": ["也", "要", "即使", "下雨", "去"],
    "answer": "即使下雨也要去",
    "meaning": "たとえ雨が降っても行かなければならない。"
  },
  {
    "id": "r7",
    "type": "rearrange",
    "tags": ["第4課"],
    "words": ["问题", "引起了", "大家", "这个", "的", "讨论"],
    "answer": "这个问题引起了大家的讨论",
    "meaning": "この問題はみんなの議論を引き起こした。"
  },
  {
    "id": "r8",
    "type": "rearrange",
    "tags": ["第4課"],
    "words": ["他", "连", "知道", "不", "都", "这件", "事"],
    "answer": "连他都不知道这件事",
    "meaning": "彼でさえこの事を知らない。"
  },
  {
    "id": "r9",
    "type": "rearrange",
    "tags": ["第4課"],
    "words": ["既然", "就", "生病了", "休息", "吧", "在家"],
    "answer": "既然生病了就在家休息吧",
    "meaning": "病気になったのだから、家で休みなさい。"
  },
  {
    "id": "r10",
    "type": "rearrange",
    "tags": ["第4課"],
    "words": ["无论", "还是", "去", "不", "去", "都", "随便", "你"],
    "answer": "无论去还是不去都随便你",
    "meaning": "行くか行かないかは、あなたの勝手だ。"
  },
  {
    "id": "f5",
    "type": "fillin",
    "tags": ["第4課"],
    "sentence": "___天气很冷,他还是坚持去跑步。",
    "options": ["因为", "尽管", "虽然", "所以", "如果"],
    "answer": "尽管",
    "meaning": "天気がとても寒いにもかかわらず、彼は依然として走りに行った。"
  },
  {
    "id": "f6",
    "type": "fillin",
    "tags": ["第4課"],
    "sentence": "你___要知道,这是一件非常重要的事情。",
    "options": ["千万", "一定", "必须", "竟然", "稍微"],
    "answer": "千万",
    "meaning": "これは非常に重要な事であることを、くれぐれも知っておくべきだ。"
  },
  {
    "id": "f7",
    "type": "fillin",
    "tags": ["第4課"],
    "sentence": "我昨天找了他___三个小时。",
    "options": ["左右", "大概", "差不多", "大约", "估计"],
    "answer": "差不多",
    "meaning": "私は昨日、彼をほぼ3時間探した。"
  },
  {
    "id": "f8",
    "type": "fillin",
    "tags": ["第4課"],
    "sentence": "你别___开玩笑,他会生气的。",
    "options": ["随便", "偶尔", "经常", "有时", "总是"],
    "answer": "随便",
    "meaning": "むやみに冗談を言ってはいけない、彼は怒るだろう。"
  },
  {
    "id": "f9",
    "type": "fillin",
    "tags": ["第4課"],
    "sentence": "___明天下雨,我们就不去爬山了。",
    "options": ["如果", "虽然", "尽管", "但是", "所以"],
    "answer": "如果",
    "meaning": "もし明日雨が降ったら、私たちは山登りに行きません。"
  },
  {
    "id": "r11",
    "type": "rearrange",
    "tags": ["第5課"],
    "words": ["只要", "努力", "会", "就", "成功", "一定"],
    "answer": "只要努力就一定会成功",
    "meaning": "努力さえすれば、必ず成功する。"
  },
  {
    "id": "r12",
    "type": "rearrange",
    "tags": ["第5課"],
    "words": ["只有", "能", "才", "坚持", "胜利", "到底"],
    "answer": "只有坚持到底才能胜利",
    "meaning": "最後までやり抜いてこそ、勝利することができる。"
  },
  {
    "id": "r13",
    "type": "rearrange",
    "tags": ["第5課"],
    "words": ["关于", "计划", "这个", "有", "什么", "你", "意见"],
    "answer": "关于这个计划你有什么意见",
    "meaning": "この計画について、あなたには何か意見がありますか。"
  },
  {
    "id": "r14",
    "type": "rearrange",
    "tags": ["第5課"],
    "words": ["我", "完全", "同意", "的", "对于", "这件事", "看法", "你"],
    "answer": "对于这件事我完全同意你的看法",
    "meaning": "この事に関して、私はあなたの考えに完全に同意します。"
  },
  {
    "id": "r15",
    "type": "rearrange",
    "tags": ["第5課"],
    "words": ["按照", "规定", "这", "不允许", "是", "的"],
    "answer": "按照规定这是不允许的",
    "meaning": "規定によれば、これは許可されていません。"
  },
  {
    "id": "f10",
    "type": "fillin",
    "tags": ["第5課"],
    "sentence": "他___没来参加会议,真是太奇怪了。",
    "options": ["突然", "竟然", "既然", "虽然", "忽然"],
    "answer": "竟然",
    "meaning": "彼が会議に参加しなかったなんて、本当に不思議だ。"
  },
  {
    "id": "f11",
    "type": "fillin",
    "tags": ["第5課"],
    "sentence": "这件衣服太贵了,___我不买了。",
    "options": ["可是", "于是", "还是", "所以", "但是"],
    "answer": "于是",
    "meaning": "この服は高すぎたので、私は買わなかった。"
  },
  {
    "id": "f12",
    "type": "fillin",
    "tags": ["第5課"],
    "sentence": "___你真的不知道这件事情的严重性吗?",
    "options": ["到底", "难道", "难道不", "究竟", "不知道"],
    "answer": "难道",
    "meaning": "まさかあなたは本当にこの事の深刻さを知らないのですか。"
  },
  {
    "id": "f13",
    "type": "fillin",
    "tags": ["第5課"],
    "sentence": "请你___快一点,我们要迟到了。",
    "options": ["稍微", "很", "非常", "特别", "太"],
    "answer": "稍微",
    "meaning": "少しだけ急いでください、遅刻してしまいます。"
  },
  {
    "id": "f14",
    "type": "fillin",
    "tags": ["第5課"],
    "sentence": "不管别人怎么说,我___要这样做。",
    "options": ["也", "还", "都", "总", "还是"],
    "answer": "都",
    "meaning": "他人が何と言おうと、私はこのようにします。"
  },
  {
    "id": "r16",
    "type": "rearrange",
    "tags": ["第6課"],
    "words": ["哪怕", "失败", "也", "要", "我", "尝试"],
    "answer": "哪怕失败我也要尝试",
    "meaning": "たとえ失敗しても、私は挑戦します。"
  },
  {
    "id": "r17",
    "type": "rearrange",
    "tags": ["第6課"],
    "words": ["往往", "越", "越", "努力", "幸运"],
    "answer": "往往越努力越幸运",
    "meaning": "往々にして、努力すればするほど幸運になる。"
  },
  {
    "id": "r18",
    "type": "rearrange",
    "tags": ["第6課"],
    "words": ["稍微", "等", "一下", "马上", "就", "他", "来"],
    "answer": "稍微等一下他马上就来",
    "meaning": "少し待ってください、彼はすぐに来ます。"
  },
  {
    "id": "r19",
    "type": "rearrange",
    "tags": ["第6課"],
    "words": ["反而", "批评", "了", "他", "没有", "表扬", "他"],
    "answer": "没有批评他反而表扬了他",
    "meaning": "彼を批判するどころか、逆に彼を褒めた。"
  },
  {
    "id": "r20",
    "type": "rearrange",
    "tags": ["第6課"],
    "words": ["到底", "想", "你", "什么", "干"],
    "answer": "你到底想干什么",
    "meaning": "あなたは一体何をしたいのですか。"
  },
  {
    "id": "f15",
    "type": "fillin",
    "tags": ["第6課"],
    "sentence": "他每天都在学习,___周末也不休息。",
    "options": ["甚至", "而且", "并且", "所以", "因为"],
    "answer": "甚至",
    "meaning": "彼は毎日勉強しており、週末でさえ休まない。"
  },
  {
    "id": "f16",
    "type": "fillin",
    "tags": ["第6課"],
    "sentence": "你要快点走,___就赶不上火车了。",
    "options": ["否则", "要不", "不然", "结果", "但是"],
    "answer": "否则",
    "meaning": "急いで歩かなければなりません、そうしないと列車に間に合いません。"
  },
  {
    "id": "f17",
    "type": "fillin",
    "tags": ["第6課"],
    "sentence": "我___以为他会同意,没想到他拒绝了。",
    "options": ["本来", "原来", "一直", "从来", "总是"],
    "answer": "本来",
    "meaning": "私はもともと彼が同意すると思っていましたが、意外にも彼は断りました。"
  },
  {
    "id": "f18",
    "type": "fillin",
    "tags": ["第6課"],
    "sentence": "他___是个聪明的孩子,就是不努力。",
    "options": ["倒", "却", "可", "也", "还"],
    "answer": "倒",
    "meaning": "彼は賢い子供ではあるが、ただ努力しないだけだ。"
  },
  {
    "id": "f19",
    "type": "fillin",
    "tags": ["第6課"],
    "sentence": "这种草药可以___头痛。",
    "options": ["发生", "引起", "成为", "解决", "制造"],
    "answer": "引起",
    "meaning": "この薬草は頭痛を引き起こす可能性がある。"
  }
];

// Combine and save
const allData = existingData.concat(newData);
fs.writeFileSync(filePath, JSON.stringify(allData, null, 2), 'utf8');
console.log('Successfully appended ' + newData.length + ' sentences. Total is now ' + allData.length);
