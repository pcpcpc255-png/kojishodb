let allData = [];
let currentSource = "";

// データ読み込み
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    // 読み順にソート（データが空の場合の考慮を追加）
    data.sort((a, b) => (a.reading || "").localeCompare(b.reading || "", "ja"));
    allData = data;
    createSourceFilters(data);
    updateDisplay(); // 初期表示
  })
  .catch(err => console.error("データの読み込みに失敗しました:", err));

// 正規化処理（ひらがな化＋濁点除去）
const normalize = (text) => {
  if (!text) return "";
  return text
    .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60)) // カタカナをひらがなへ
    .normalize("NFD")                                                     // 濁点を分解
    .replace(/[\u0300-\u036f]/g, "");                                      // 濁点記号のみ削除
};

// 出典ボタンをJSONから作成
function createSourceFilters(data) {
  const container = document.getElementById("source-filters");
  container.innerHTML = ""; // 念のため初期化
  const sources = [...new Set(data.map(d => d.source))];

  const createBtn = (text, filterVal) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    if (filterVal === currentSource) btn.classList.add("active");
    btn.onclick = () => {
      currentSource = filterVal;
      document.querySelectorAll("#source-filters button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateDisplay(); // フィルタ切り替え時は即時実行
    };
    return btn;
  };

  container.appendChild(createBtn("すべて", ""));
  sources.forEach(s => container.appendChild(createBtn(s, s)));
}

// 検索実行メインロジック
function updateDisplay() {
  const qWord = document.getElementById("s-word").value.trim();
  const qReading = document.getElementById("s-reading").value.trim();
  const qNote = document.getElementById("s-note").value.trim();
  const isIgnore = document.getElementById("ignore-diacritics").checked;

  const checkMatch = (target, query) => {
    if (!query) return true;
    const t = isIgnore ? normalize(target) : (target || "").toLowerCase();
    const q = isIgnore ? normalize(query) : query.toLowerCase();
    return t.includes(q);
  };

  const filtered = allData.filter(item => {
    const mWord = checkMatch(item.word, qWord);
    const mReading = checkMatch(item.reading, qReading);
    const mNote = checkMatch(item.note || "", qNote);
    const mSource = !currentSource || item.source === currentSource;
    return mWord && mReading && mNote && mSource;
  });

  document.getElementById("count").textContent = filtered.length;
  render(filtered);
}

// 描画処理
function render(data) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<div class="no-results">該当するデータが見つかりませんでした。</div>';
    return;
  }

  // 語彙ごとにグループ化
  const groups = data.reduce((acc, item) => {
    if (!acc[item.word]) acc[item.word] = [];
    acc[item.word].push(item);
    return acc;
  }, {});

  Object.keys(groups).forEach(word => {
    const card = document.createElement("div");
    card.className = "card";
    
    let entriesHtml = groups[word].map(item => `
      <div class="entry">
        <div class="entry-meta">
          <span class="reading">（${item.reading}）</span>
          <span class="source-tag">${item.source}</span>
          ${item.image_url ? `<a href="${item.image_url}" target="_blank" class="image-link">原本</a>` : ""}
        </div>
        <div class="note-text">${item.note || ""}</div>
      </div>
    `).join("");

    card.innerHTML = `<div class="word-title">${word}</div>${entriesHtml}`;
    container.appendChild(card);
  });
}

// イベント設定
// 1. 検索ボタンのクリック
document.getElementById("search-btn").addEventListener("click", updateDisplay);

// 2. 入力欄でのEnterキー対応
["s-word", "s-reading", "s-note"].forEach(id => {
  document.getElementById(id).addEventListener("keypress", (e) => {
    if (e.key === "Enter") updateDisplay();
  });
});

// 3. オプション変更時は即時反映（利便性のため）
document.getElementById("ignore-diacritics").addEventListener("change", updateDisplay);
