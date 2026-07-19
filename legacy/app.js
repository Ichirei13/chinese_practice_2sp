// ==========================================
// HSK4 Practice App Logic V3.5
// ==========================================

let wordsData = [];
let sentencesData = [];
let masteryData = JSON.parse(localStorage.getItem('hsk_mastery') || '{}');
let appStats = JSON.parse(localStorage.getItem('hsk_stats') || '{"sessions":0,"correct":0,"total":0,"lastDate":"","streak":0}');

let currentMode = 'pinyin'; // default
let currentQueue = [];
let currentQuestionIndex = 0;
let sessionCorrect = 0;
let sessionMistakes = [];
let startTime = 0;
let isAnswered = false;

// Audio synth
const synth = window.speechSynthesis;
let chineseVoice = null;
synth.onvoiceschanged = () => {
  const voices = synth.getVoices();
  chineseVoice = voices.find(v => v.lang.includes('zh') || v.name.includes('Chinese') || v.name.includes('Ting-Ting')) || null;
};

// Elements
const screens = {
  home: document.getElementById('screen-home'),
  quiz: document.getElementById('screen-quiz'),
  result: document.getElementById('screen-result'),
  dashboard: document.getElementById('screen-dashboard')
};

function switchScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
}

// ----------------------------------------------------
// Initialization
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  updateHomeStats();
  setupEventListeners();
  
  // Setup theme
  const theme = localStorage.getItem('hsk_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
});

async function loadData() {
  try {
    const [wRes, sRes] = await Promise.all([
      fetch('hsk_words.json'),
      fetch('hsk_sentences.json').catch(() => ({ json: () => [] })) // Fallback if doesn't exist
    ]);
    const rawWords = await wRes.json();
    wordsData = Object.entries(rawWords).map(([hanzi, data]) => ({
      hanzi: hanzi,
      pinyin: data.display_pinyin || data.pinyin,
      meaning: data.meaning
    }));
    sentencesData = (await sRes.json()) || [];
    const weakItems = Object.values(masteryData).filter(m => m.correct < m.total && m.correct / m.total < 0.8);
    if (weakItems.length > 0) {
      document.getElementById('btn-quick-retry').style.display = 'block';
    }
  } catch (e) {
    console.error("Data load error:", e);
    alert("データの読み込みに失敗しました。");
  }
}

function updateHomeStats() {
  const totalStudied = Object.keys(masteryData).length;
  document.getElementById('stat-total-studied').textContent = totalStudied;
  
  const acc = appStats.total > 0 ? Math.round((appStats.correct / appStats.total) * 100) : 0;
  document.getElementById('stat-accuracy').textContent = acc > 0 ? acc + '%' : '—';
  
  // Streak check
  const today = new Date().toDateString();
  if (appStats.lastDate) {
    const lastDate = new Date(appStats.lastDate);
    const diff = Math.floor((new Date(today) - lastDate) / (1000*60*60*24));
    if (diff > 1) { appStats.streak = 0; } // broken streak
  }
  document.getElementById('stat-streak').textContent = `🔥 ${appStats.streak}`;
  saveStats();
}

// ----------------------------------------------------
// Event Listeners
// ----------------------------------------------------
function setupEventListeners() {
  // Nav
  document.getElementById('btn-home-nav').onclick = () => { switchScreen('screen-home'); updateHomeStats(); };
  document.getElementById('btn-dashboard').onclick = showDashboard;
  document.getElementById('btn-theme').onclick = () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('hsk_theme', next);
  };

  // Home
  document.querySelectorAll('.mode-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentMode = card.dataset.mode;
    };
  });

  const toggleWeak = document.getElementById('toggle-weak');
  toggleWeak.onclick = () => {
    const isOn = toggleWeak.classList.contains('on');
    toggleWeak.classList.toggle('on', !isOn);
    toggleWeak.setAttribute('aria-checked', !isOn);
  };

  document.getElementById('btn-start').onclick = () => startSession();
  
  document.getElementById('btn-quick-retry').onclick = () => {
    // Quick Retry weak words
    document.getElementById('toggle-weak').classList.add('on');
    document.getElementById('toggle-weak').setAttribute('aria-checked', 'true');
    // Prefer vocab_full for weak words review if pinyin was selected
    if (currentMode === 'pinyin') {
      currentMode = 'vocab_full';
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      document.querySelector('[data-mode="vocab_full"]').classList.add('selected');
    }
    startSession();
  };

  // Quiz
  document.getElementById('btn-quit').onclick = () => { switchScreen('screen-home'); updateHomeStats(); };
  document.getElementById('btn-next').onclick = nextQuestion;
  document.getElementById('btn-skip').onclick = skipQuestion;
  
  // Pinyin input
  const pInp = document.getElementById('pinyin-input');
  pInp.addEventListener('keypress', (e) => { if(e.key === 'Enter') checkPinyinAnswer(); });
  
  // Vocab Full input
  const vPinyin = document.getElementById('vocab-pinyin-input');
  const vHanzi = document.getElementById('vocab-hanzi-input');
  vPinyin.addEventListener('keypress', (e) => { if(e.key === 'Enter') vHanzi.focus(); });
  vHanzi.addEventListener('keypress', (e) => { if(e.key === 'Enter') checkVocabFullAnswer(); });
  document.getElementById('btn-vocab-submit').onclick = checkVocabFullAnswer;

  // Rearrange
  document.getElementById('btn-rearrange-submit').onclick = checkRearrangeAnswer;

  // Listening Mode
  document.getElementById('btn-listen-big').onclick = playCurrentAudio;
  document.getElementById('btn-listen-inline').onclick = playCurrentAudio;

  // Multiple choice
  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.onclick = () => checkChoiceAnswer(parseInt(btn.dataset.index));
  });

  // Result
  document.getElementById('btn-retry').onclick = () => startSession(false);
  document.getElementById('btn-retry-wrong').onclick = () => startSession(true); // retry only wrong
  document.getElementById('btn-result-home').onclick = () => { switchScreen('screen-home'); updateHomeStats(); };

  // Dashboard
  document.getElementById('btn-reset-data').onclick = () => {
    if(confirm("学習データを全てリセットしますか？")) {
      masteryData = {};
      appStats = {sessions:0, correct:0, total:0, lastDate:"", streak:0};
      saveMastery(); saveStats();
      showDashboard();
    }
  };
}

// ----------------------------------------------------
// Session Logic
// ----------------------------------------------------
function startSession(onlyWrong = false) {
  const isSentenceMode = ['rearrange', 'fillin'].includes(currentMode);
  let pool = isSentenceMode ? [...sentencesData] : [...wordsData];
  
  if (pool.length === 0) {
    alert("対象のデータがありません。");
    return;
  }

  // Filter by tags or alphabetical range
  if (isSentenceMode) {
    const tag = document.getElementById('setting-tag').value;
    if (tag !== 'all') {
      pool = pool.filter(q => q.tags && q.tags.includes(tag));
    }
    // Filter by type if mode specifies it
    if (currentMode === 'rearrange') pool = pool.filter(q => q.type === 'rearrange');
    if (currentMode === 'fillin') pool = pool.filter(q => q.type === 'fillin');
  } else {
    const range = document.getElementById('setting-range').value;
    if (range !== 'all') {
      pool = pool.filter(w => {
        const firstChar = w.pinyin.charAt(0).toLowerCase();
        if (range === 'a-f') return firstChar >= 'a' && firstChar <= 'f';
        if (range === 'g-l') return firstChar >= 'g' && firstChar <= 'l';
        if (range === 'm-r') return firstChar >= 'm' && firstChar <= 'r';
        if (range === 's-z') return firstChar >= 's' && firstChar <= 'z';
        return true;
      });
    }
  }

  // Weak filtering
  const isWeakMode = document.getElementById('toggle-weak').classList.contains('on');
  if (onlyWrong) {
    // Session retrying mistakes
    pool = sessionMistakes.map(m => m.item);
  } else if (isWeakMode) {
    pool.sort((a, b) => {
      const idA = a.id || a.hanzi;
      const idB = b.id || b.hanzi;
      const mA = masteryData[idA] ? (masteryData[idA].correct / masteryData[idA].total) : 0.5;
      const mB = masteryData[idB] ? (masteryData[idB].correct / masteryData[idB].total) : 0.5;
      return mA - mB;
    });
  } else {
    pool.sort(() => Math.random() - 0.5);
  }

  // Count
  const countSet = document.getElementById('setting-count').value;
  let count = pool.length;
  if (countSet !== 'all' && !onlyWrong) {
    count = Math.min(parseInt(countSet), pool.length);
  }
  
  if (count === 0) {
    alert("条件に一致する問題がありません。");
    return;
  }

  currentQueue = isWeakMode && !onlyWrong ? pool.slice(0, count).sort(() => Math.random() - 0.5) : pool.slice(0, count);
  currentQuestionIndex = 0;
  sessionCorrect = 0;
  sessionMistakes = [];
  startTime = Date.now();

  const titles = {
    pinyin: 'ピンイン入力', meaning: '意味クイズ', hanzi: '漢字クイズ', 
    listening: 'リスニング', vocab_full: 'フル単語テスト',
    rearrange: '並び替え', fillin: '穴埋め'
  };
  document.getElementById('quiz-mode-badge').textContent = titles[currentMode];

  switchScreen('screen-quiz');
  renderQuestion();
}

function renderQuestion() {
  if (currentQuestionIndex >= currentQueue.length) {
    endSession();
    return;
  }

  isAnswered = false;
  const item = currentQueue[currentQuestionIndex];
  
  // Progress UI
  document.getElementById('quiz-counter').textContent = `${currentQuestionIndex + 1} / ${currentQueue.length}`;
  document.getElementById('quiz-progress').style.width = `${(currentQuestionIndex / currentQueue.length) * 100}%`;
  document.getElementById('wrong-tally').textContent = `❌ ${sessionMistakes.length} ミス`;

  // Hide all areas
  document.getElementById('pinyin-area').style.display = 'none';
  document.getElementById('vocab-full-area').style.display = 'none';
  document.getElementById('choices-area').style.display = 'none';
  document.getElementById('listening-area').style.display = 'none';
  document.getElementById('rearrange-area').style.display = 'none';
  document.getElementById('fillin-options-area').style.display = 'none';
  
  document.getElementById('display-char').style.display = 'block';
  document.getElementById('display-meaning').style.display = 'block';
  document.getElementById('display-pinyin-hint').style.display = 'block';
  document.getElementById('display-fillin').style.display = 'none';
  
  document.getElementById('btn-listen-inline').style.display = 'none';
  document.getElementById('btn-next').style.display = 'none';
  document.getElementById('btn-skip').style.display = 'block';
  document.getElementById('feedback-text').textContent = '';
  document.getElementById('feedback-text').className = 'feedback-text';

  // Render based on mode
  if (['rearrange', 'fillin'].includes(currentMode)) {
    renderSentenceMode(item);
  } else {
    renderWordMode(item);
  }
}

function renderWordMode(item) {
  const charEl = document.getElementById('display-char');
  const meanEl = document.getElementById('display-meaning');
  const pyEl = document.getElementById('display-pinyin-hint');

  charEl.textContent = item.hanzi;
  meanEl.textContent = item.meaning;
  pyEl.textContent = "";

  if (currentMode === 'pinyin') {
    document.getElementById('pinyin-area').style.display = 'block';
    const inp = document.getElementById('pinyin-input');
    inp.value = ''; inp.className = 'input'; inp.disabled = false;
    document.getElementById('input-status').textContent = '';
    setTimeout(() => inp.focus(), 100);
  } 
  else if (currentMode === 'vocab_full') {
    charEl.textContent = "???"; // hide hanzi
    pyEl.textContent = "漢字とピンインを入力してください";
    document.getElementById('vocab-full-area').style.display = 'block';
    const vp = document.getElementById('vocab-pinyin-input');
    const vh = document.getElementById('vocab-hanzi-input');
    vp.value = ''; vh.value = '';
    vp.className = 'input'; vh.className = 'input';
    vp.disabled = false; vh.disabled = false;
    document.getElementById('btn-vocab-submit').disabled = false;
    setTimeout(() => vp.focus(), 100);
  }
  else if (currentMode === 'listening') {
    charEl.textContent = "???";
    meanEl.textContent = "クリックして音声を再生";
    document.getElementById('listening-area').style.display = 'flex';
    document.getElementById('pinyin-area').style.display = 'block';
    const inp = document.getElementById('pinyin-input');
    inp.value = ''; inp.className = 'input'; inp.disabled = false;
    document.getElementById('input-status').textContent = '';
    playCurrentAudio();
    setTimeout(() => inp.focus(), 100);
  }
  else if (currentMode === 'meaning') {
    charEl.textContent = item.hanzi;
    meanEl.textContent = "意味はどれ？";
    document.getElementById('choices-area').style.display = 'grid';
    setupChoices(item, 'meaning');
  }
  else if (currentMode === 'hanzi') {
    charEl.textContent = "???";
    meanEl.textContent = item.meaning;
    pyEl.textContent = item.pinyin;
    document.getElementById('choices-area').style.display = 'grid';
    setupChoices(item, 'hanzi');
  }
}

function renderSentenceMode(item) {
  const charEl = document.getElementById('display-char');
  const meanEl = document.getElementById('display-meaning');
  const pyEl = document.getElementById('display-pinyin-hint');
  
  charEl.style.display = 'none';
  pyEl.textContent = '';
  meanEl.textContent = item.meaning;

  if (currentMode === 'rearrange') {
    document.getElementById('rearrange-area').style.display = 'block';
    const bank = document.getElementById('word-bank');
    const zone = document.getElementById('answer-zone');
    bank.innerHTML = ''; zone.innerHTML = '';
    
    // Shuffle words
    const shuffled = [...item.words].sort(() => Math.random() - 0.5);
    shuffled.forEach((w, i) => {
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      chip.textContent = w;
      chip.onclick = () => moveChip(chip, 'to-answer');
      bank.appendChild(chip);
    });
    document.getElementById('btn-rearrange-submit').disabled = false;
  }
  else if (currentMode === 'fillin') {
    document.getElementById('display-fillin').style.display = 'block';
    document.getElementById('display-fillin').innerHTML = item.sentence.replace('___', '<span class="fillin-blank" id="fillin-blank">&emsp;&emsp;</span>');
    document.getElementById('fillin-options-area').style.display = 'block';
    
    const optsArea = document.getElementById('fillin-options');
    optsArea.innerHTML = '';
    const shuffled = [...item.options].sort(() => Math.random() - 0.5);
    shuffled.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'fillin-option';
      btn.textContent = opt;
      btn.onclick = () => checkFillinAnswer(opt, btn, item);
      optsArea.appendChild(btn);
    });
  }
}

// ----------------------------------------------------
// Mode Checkers
// ----------------------------------------------------

function moveChip(chip, dir) {
  if (isAnswered) return;
  const bank = document.getElementById('word-bank');
  const zone = document.getElementById('answer-zone');
  if (dir === 'to-answer') {
    zone.appendChild(chip);
    chip.onclick = () => moveChip(chip, 'to-bank');
    chip.classList.add('selected');
  } else {
    bank.appendChild(chip);
    chip.onclick = () => moveChip(chip, 'to-answer');
    chip.classList.remove('selected');
  }
}

function checkRearrangeAnswer() {
  if (isAnswered) return;
  const item = currentQueue[currentQuestionIndex];
  const zone = document.getElementById('answer-zone');
  const chips = zone.querySelectorAll('.word-chip');
  if (chips.length === 0) return;
  
  const userAnswer = Array.from(chips).map(c => c.textContent).join('').replace(/[\s]/g, '');
  const isCorrect = userAnswer === item.answer.replace(/[，。？！\s,\.\?!]/g, '');

  handleAnswerResult(isCorrect, item.answer);
  document.getElementById('btn-rearrange-submit').disabled = true;
}

function checkFillinAnswer(selectedWord, btnEl, item) {
  if (isAnswered) return;
  const blank = document.getElementById('fillin-blank');
  blank.textContent = selectedWord;
  
  const isCorrect = selectedWord === item.answer;
  
  document.querySelectorAll('.fillin-option').forEach(b => {
    b.classList.add('disabled');
    if (b === btnEl) b.classList.add('selected');
  });

  if (isCorrect) {
    blank.classList.add('filled');
  } else {
    blank.classList.add('wrong');
  }

  handleAnswerResult(isCorrect, item.answer);
}

function checkVocabFullAnswer() {
  if (isAnswered) return;
  const item = currentQueue[currentQuestionIndex];
  const vp = document.getElementById('vocab-pinyin-input');
  const vh = document.getElementById('vocab-hanzi-input');
  
  const uPinyin = normalizePinyin(vp.value);
  const uHanzi = vh.value.trim();
  const aPinyin = normalizePinyin(item.pinyin);
  
  const pinyinCorrect = uPinyin === aPinyin;
  const hanziCorrect = uHanzi === item.hanzi;
  const isCorrect = pinyinCorrect && hanziCorrect;

  if (pinyinCorrect) vp.classList.add('correct'); else vp.classList.add('wrong');
  if (hanziCorrect) vh.classList.add('correct'); else vh.classList.add('wrong');
  
  vp.disabled = true; vh.disabled = true;
  document.getElementById('btn-vocab-submit').disabled = true;
  
  document.getElementById('display-char').textContent = item.hanzi;
  document.getElementById('display-pinyin-hint').textContent = item.pinyin;

  handleAnswerResult(isCorrect, `${item.hanzi} (${item.pinyin})`);
}

function checkPinyinAnswer() {
  if(isAnswered) return;
  const item = currentQueue[currentQuestionIndex];
  const inp = document.getElementById('pinyin-input');
  const val = normalizePinyin(inp.value);
  const target = normalizePinyin(item.pinyin);

  const isCorrect = val === target;
  
  inp.disabled = true;
  if(isCorrect) {
    inp.classList.add('correct');
    document.getElementById('input-status').textContent = '✅';
  } else {
    inp.classList.add('wrong');
    document.getElementById('input-status').textContent = '❌';
  }
  
  document.getElementById('display-char').textContent = item.hanzi;
  document.getElementById('display-meaning').textContent = item.meaning;
  document.getElementById('display-pinyin-hint').textContent = item.pinyin;
  
  handleAnswerResult(isCorrect, item.pinyin);
}

function setupChoices(item, type) {
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.className = 'choice-btn';
    b.disabled = false;
  });
  
  let pool = [...wordsData].filter(w => w.hanzi !== item.hanzi).sort(() => Math.random() - 0.5).slice(0, 3);
  let options = [item, ...pool].sort(() => Math.random() - 0.5);

  options.forEach((opt, idx) => {
    const btn = document.getElementById(`choice-${idx}`);
    btn.dataset.correct = (opt.hanzi === item.hanzi) ? 'true' : 'false';
    
    if(type === 'meaning') {
      document.getElementById(`choice-text-${idx}`).textContent = opt.meaning;
      document.getElementById(`choice-pinyin-${idx}`).textContent = '';
    } else {
      document.getElementById(`choice-text-${idx}`).textContent = opt.hanzi;
      document.getElementById(`choice-pinyin-${idx}`).textContent = '';
    }
  });
}

function checkChoiceAnswer(idx) {
  if(isAnswered) return;
  const item = currentQueue[currentQuestionIndex];
  const btn = document.getElementById(`choice-${idx}`);
  const isCorrect = btn.dataset.correct === 'true';

  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    if(b.dataset.correct === 'true') b.classList.add('correct');
  });

  if(!isCorrect) btn.classList.add('wrong');
  
  document.getElementById('display-char').textContent = item.hanzi;
  document.getElementById('display-meaning').textContent = item.meaning;
  document.getElementById('display-pinyin-hint').textContent = item.pinyin;

  handleAnswerResult(isCorrect, currentMode === 'meaning' ? item.meaning : item.hanzi);
}

// ----------------------------------------------------
// Shared Logic
// ----------------------------------------------------
function normalizePinyin(p) {
  return p.toLowerCase().replace(/\s+/g, '').trim();
}

function handleAnswerResult(isCorrect, correctAnswerText) {
  isAnswered = true;
  const item = currentQueue[currentQuestionIndex];
  const fb = document.getElementById('feedback-text');

  if(isCorrect) {
    sessionCorrect++;
    fb.innerHTML = '✅ 正解！';
    fb.className = 'feedback-text correct correct-pop';
    playCurrentAudio(); // Auto play audio on correct
  } else {
    sessionMistakes.push({item, mode: currentMode});
    fb.innerHTML = `❌ 不正解 <span class="correct-answer">${correctAnswerText}</span>`;
    fb.className = 'feedback-text wrong shake';
    document.getElementById('wrong-tally').textContent = `❌ ${sessionMistakes.length} ミス`;
  }

  // Show inline listen button
  document.getElementById('btn-listen-inline').style.display = 'inline-flex';
  
  // Track mastery
  const id = item.id || item.hanzi;
  if(!masteryData[id]) masteryData[id] = { correct: 0, total: 0, item: item };
  masteryData[id].total++;
  if(isCorrect) masteryData[id].correct++;
  saveMastery();

  document.getElementById('btn-skip').style.display = 'none';
  document.getElementById('btn-next').style.display = 'block';
  document.getElementById('btn-next').focus();
}

function skipQuestion() {
  if(isAnswered) return;
  const item = currentQueue[currentQuestionIndex];
  handleAnswerResult(false, item.answer || item.pinyin || item.hanzi);
}

function nextQuestion() {
  currentQuestionIndex++;
  renderQuestion();
}

// ----------------------------------------------------
// Audio
// ----------------------------------------------------
function playCurrentAudio() {
  const item = currentQueue[currentQuestionIndex];
  if(!item) return;
  
  let text = item.hanzi;
  if (item.type === 'fillin') text = item.sentence.replace('___', item.answer);
  else if (item.answer) text = item.answer;
  
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.9;
  if(chineseVoice) utter.voice = chineseVoice;

  const btnBig = document.getElementById('btn-listen-big');
  const btnInline = document.getElementById('btn-listen-inline');
  
  utter.onstart = () => {
    btnBig.classList.add('playing');
    btnInline.classList.add('playing');
  };
  utter.onend = () => {
    btnBig.classList.remove('playing');
    btnInline.classList.remove('playing');
  };

  synth.cancel();
  synth.speak(utter);
}

// ----------------------------------------------------
// End Session & Dashboard
// ----------------------------------------------------
function endSession() {
  const timeSec = Math.floor((Date.now() - startTime) / 1000);
  const m = Math.floor(timeSec / 60);
  const s = timeSec % 60;
  
  document.getElementById('result-time') ? document.getElementById('result-time').textContent = `${m}:${s.toString().padStart(2,'0')}` : null;
  document.getElementById('res-time').textContent = `${m}:${s.toString().padStart(2,'0')}`;
  
  const acc = Math.round((sessionCorrect / currentQueue.length) * 100);
  document.getElementById('result-score').textContent = `${acc}%`;
  document.getElementById('res-correct').textContent = sessionCorrect;
  document.getElementById('res-wrong').textContent = sessionMistakes.length;
  document.getElementById('result-subtitle').textContent = `${currentQueue.length}問中 ${sessionCorrect}問正解`;

  const title = document.getElementById('result-title');
  const emoji = document.getElementById('result-emoji');
  if(acc === 100) { title.textContent = "パーフェクト！"; emoji.textContent = "🏆"; }
  else if(acc >= 80) { title.textContent = "素晴らしい！"; emoji.textContent = "🌟"; }
  else { title.textContent = "あと一歩！"; emoji.textContent = "💪"; }

  // App Stats update
  appStats.sessions++;
  appStats.correct += sessionCorrect;
  appStats.total += currentQueue.length;
  
  const today = new Date().toDateString();
  if(appStats.lastDate !== today) {
    appStats.streak++;
    appStats.lastDate = today;
  }
  saveStats();

  // Render mistakes
  const wwContainer = document.getElementById('wrong-words-container');
  wwContainer.innerHTML = '';
  if(sessionMistakes.length > 0) {
    document.getElementById('wrong-words-section').style.display = 'block';
    document.getElementById('btn-retry-wrong').style.display = 'inline-flex';
    
    sessionMistakes.forEach(m => {
      const it = m.item;
      const el = document.createElement('div');
      el.className = 'wrong-word-item';
      const isSent = !!it.answer;
      let displayTitle = it.hanzi;
      if (it.type === 'fillin') displayTitle = it.sentence.replace('___', `[${it.answer}]`);
      else if (it.type === 'rearrange') displayTitle = it.answer;
      
      el.innerHTML = `
        <div class="ww-char" style="${isSent ? 'font-size:1.1rem; line-height:1.4;' : ''}">${displayTitle}</div>
        <div class="ww-info">
          <div class="ww-pinyin">${isSent ? (it.type === 'fillin' ? '空欄選択' : '並び替え') : it.pinyin}</div>
          <div class="ww-meaning">${it.meaning}</div>
        </div>
      `;
      wwContainer.appendChild(el);
    });
  } else {
    document.getElementById('wrong-words-section').style.display = 'none';
    document.getElementById('btn-retry-wrong').style.display = 'none';
  }

  switchScreen('screen-result');
}

function showDashboard() {
  switchScreen('screen-dashboard');
  
  const acc = appStats.total > 0 ? Math.round((appStats.correct / appStats.total) * 100) : 0;
  document.getElementById('db-accuracy').textContent = acc > 0 ? acc + '%' : '—';
  document.getElementById('db-accuracy-bar').style.width = `${acc}%`;
  document.getElementById('db-streak').textContent = appStats.streak;
  document.getElementById('db-sessions').textContent = appStats.sessions;

  renderMasteryList('all');

  document.getElementById('db-filter-all').onclick = () => renderMasteryList('all');
  document.getElementById('db-filter-weak').onclick = () => renderMasteryList('weak');
  document.getElementById('db-filter-mastered').onclick = () => renderMasteryList('mastered');
}

function renderMasteryList(filter) {
  const container = document.getElementById('mastery-list');
  container.innerHTML = '';

  let list = Object.values(masteryData);
  if(filter === 'weak') list = list.filter(m => (m.correct / m.total) < 0.8 || m.correct < m.total);
  if(filter === 'mastered') list = list.filter(m => (m.correct / m.total) >= 0.8 && m.total >= 3);

  list.sort((a,b) => (a.correct/a.total) - (b.correct/b.total));

  if(list.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">データがありません</div>';
    return;
  }

  list.forEach(m => {
    const it = m.item;
    const pct = Math.round((m.correct / m.total) * 100);
    const isSent = !!it.answer;
    
    let displayTitle = it.hanzi;
    if (it.type === 'fillin') displayTitle = it.sentence.replace('___', '...').substring(0, 10) + '...';
    else if (it.type === 'rearrange') displayTitle = it.answer.substring(0, 10) + '...';

    const el = document.createElement('div');
    el.className = 'mastery-item';
    el.innerHTML = `
      <div class="mastery-char" style="${isSent ? 'font-size:0.9rem' : ''}">${displayTitle}</div>
      <div class="mastery-info">
        <div class="mastery-pinyin">${isSent ? '文法・文章' : it.pinyin}</div>
        <div class="mastery-meaning">${isSent ? it.meaning.substring(0,12) + '...' : it.meaning}</div>
      </div>
      <div class="mastery-bar-wrap">
        <div class="mastery-pct">${pct}% (${m.correct}/${m.total})</div>
        <div class="progress-bar"><div class="progress-fill ${pct>=80?'green':''}" style="width:${pct}%"></div></div>
      </div>
    `;
    container.appendChild(el);
  });
}

function saveMastery() { localStorage.setItem('hsk_mastery', JSON.stringify(masteryData)); }
function saveStats() { localStorage.setItem('hsk_stats', JSON.stringify(appStats)); }
