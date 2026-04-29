let allData = [];
let filteredData = []; // 検索・フィルタ後の全データ
let currentSource = "";
let currentCategory = "";
let currentPage = 1;
const itemsPerPage = 30; // 1ページあたりの件数

// データ読み込み
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    data.sort((a, b) => (a.reading || "").localeCompare(b.reading || "", "ja"));
    allData = data;
    createFilters(data, "source", "source-filters");
    createFilters(data, "category", "category-filters");
    updateDisplay();
  })
  .catch(err => console.error("データの読み込みに失敗しました:", err));

const normalize = (text) => {
  if (!text) return "";
  return text
    .replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

function createFilters(data, key, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const values = [...new Set(data.map(d => d[key]).filter(v => v))];

  const createBtn = (text, val) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    if (val === "") btn.classList.add("active");
    
    btn.onclick = () => {
      if (key === "source") currentSource = val;
      if (key === "category") currentCategory = val;
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPage = 1; // フィルタ変更時は1ページ目に戻す
      updateDisplay();
    };
    return btn;
  };

  container.appendChild(createBtn("すべて", ""));
  values.forEach(v => container.appendChild(createBtn(v, v)));
}

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

  // 全データから絞り込み
  filteredData = allData.filter(item => {
    const mWord = checkMatch(item.word, qWord);
    const mReading = checkMatch(item.reading, qReading);
    const mNote = checkMatch(item.note || "", qNote);
    const mSource = !currentSource || item.source === currentSource;
    const mCategory = !currentCategory || item.category === currentCategory;
    return mWord && mReading && mNote && mSource && mCategory;
  });

  document.getElementById("count").textContent = filteredData.length;
  
  // ページネーションと描画の実行
  renderPagination();
  renderCurrentPage();
}

// ページネーションUIの生成
function renderPagination() {
  const container = document.getElementById("pagination");
  container.innerHTML = "";
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  if (totalPages <= 1) return; // 1ページしかない場合は非表示

  const prevBtn = document.createElement("button");
  prevBtn.textContent = "前へ";
  prevBtn.className = "pagination-btn";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    currentPage--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateUI();
  };
  container.appendChild(prevBtn);

  const pageInfo = document.createElement("span");
  pageInfo.className = "page-info";
  pageInfo.textContent = `${currentPage} / ${totalPages}`;
  container.appendChild(pageInfo);

  const nextBtn = document.createElement("button");
  nextBtn.textContent = "次へ";
  nextBtn.className = "pagination-btn";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    currentPage++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateUI();
  };
  container.appendChild(nextBtn);
}

// ページ番号変更時の描画更新用ヘルパー
function updateUI() {
  renderPagination();
  renderCurrentPage();
}

function renderCurrentPage() {
  const container = document.getElementById("list");
  container.innerHTML = "";

  if (filteredData.length === 0) {
    container.innerHTML = '<div class="no-results">条件に合うデータがありません。</div>';
    return;
  }

  // 表示範囲の切り出し
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const groups = pageItems.reduce((acc, item) => {
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

document.getElementById("search-btn").addEventListener("click", () => {
  currentPage = 1;
  updateDisplay();
});
["s-word", "s-reading", "s-note"].forEach(id => {
  document.getElementById(id).addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      currentPage = 1;
      updateDisplay();
    }
  });
});
document.getElementById("ignore-diacritics").addEventListener("change", () => {
  currentPage = 1;
  updateDisplay();
});
