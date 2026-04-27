let allData = [];
let currentSource = "";
let currentCategory = "";

// データ読み込み
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    data.sort((a, b) => (a.reading || "").localeCompare(b.reading || "", "ja"));
    allData = data;
    // フィルタボタンの生成
    createFilters(data, "source", "source-filters");
    createFilters(data, "category", "category-filters");
    updateDisplay();
  })
  .catch(err => console.error("データの読み込みに失敗しました:", err));

// 正規化処理
const normalize = (text) => {
  if (!text) return "";
  return text
    .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// フィルタボタンをJSONから動的に作成する汎用関数
function createFilters(data, key, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const values = [...new Set(data.map(d => d[key]).filter(v => v))];

  const createBtn = (text, val) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    // 初期状態の「すべて」をアクティブに
    if (val === "") btn.classList.add("active");
    
    btn.onclick = () => {
      if (key === "source") currentSource = val;
      if (key === "category") currentCategory = val;
      
      // 同じコンテナ内のボタンのアクティブ状態を切り替え
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateDisplay();
    };
    return btn;
  };

  container.appendChild(createBtn("すべて", ""));
  values.forEach(v => container.appendChild(createBtn(v, v)));
}

// 検索・表示更新
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
    const mCategory = !currentCategory || item.category === currentCategory;
    
    return mWord && mReading && mNote && mSource && mCategory;
  });

  document.getElementById("count").textContent = filtered.length;
  render(filtered);
}

// 描画
function render(data) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = '<div class="no-results">条件に合うデータがありません。</div>';
    return;
  }

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
          ${item.category ? `<span class="category-tag">${item.category}</span>` : ""}
          ${item.image_url ? `<a href="${item.image_url}" target="_blank" class="image-link">原本</a>` : ""}
        </div>
        <div class="note-text">${item.note || ""}</div>
      </div>
    `).join("");

    card.innerHTML = `<div class="word-title">${word}</div>${entriesHtml}`;
    container.appendChild(card);
  });
}

// イベントリスナー
document.getElementById("search-btn").addEventListener("click", updateDisplay);
["s-word", "s-reading", "s-note"].forEach(id => {
  document.getElementById(id).addEventListener("keypress", (e) => {
    if (e.key === "Enter") updateDisplay();
  });
});
document.getElementById("ignore-diacritics").addEventListener("change", updateDisplay);
