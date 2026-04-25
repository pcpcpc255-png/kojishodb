let allData = [];
let currentSource = "";

// データ読み込み
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    // 五十音順ソート
    data.sort((a, b) => a.reading.localeCompare(b.reading, "ja"));
    allData = data;
    createSourceButtons(data);
    updateDisplay();
  });

// 正規化関数（ひらがな化 + 濁点分離・削除）
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .replace(/[ァ-ン]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0x60)) // カタカナ -> ひらがな
    .normalize("NFD")                                                     // 濁点分離
    .replace(/[\u0300-\u036f]/g, "");                                      // 濁点記号のみ削除
};

// 出典フィルタボタン
function createSourceButtons(data) {
  const container = document.getElementById("filters");
  container.innerHTML = "";

  const sources = [...new Set(data.map(d => d.source))];

  const allBtn = document.createElement("button");
  allBtn.textContent = "すべて";
  allBtn.className = "active";
  allBtn.onclick = (e) => {
    currentSource = "";
    updateActiveBtn(e.target);
    updateDisplay();
  };
  container.appendChild(allBtn);

  sources.forEach(src => {
    const btn = document.createElement("button");
    btn.textContent = src;
    btn.onclick = (e) => {
      currentSource = src;
      updateActiveBtn(e.target);
      updateDisplay();
    };
    container.appendChild(btn);
  });
}

function updateActiveBtn(target) {
  document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"));
  target.classList.add("active");
}

// 表示更新
function updateDisplay() {
  const keywordInput = document.getElementById("search").value.trim();
  const isIgnore = document.getElementById("ignore-diacritics").checked;

  const keyword = isIgnore ? normalizeText(keywordInput) : keywordInput.toLowerCase();

  let filtered = allData.filter(item => {
    const rawText = `${item.word}${item.reading}${item.source}${item.note || ""}`;
    const target = isIgnore ? normalizeText(rawText) : rawText.toLowerCase();
    return target.includes(keyword);
  });

  if (currentSource) {
    filtered = filtered.filter(item => item.source === currentSource);
  }

  document.getElementById("count").innerHTML = `該当件数: <strong>${filtered.length}</strong> 件`;
  display(filtered);
}

// 同一語でグループ化
function groupByWord(data) {
  const groups = {};
  data.forEach(item => {
    if (!groups[item.word]) groups[item.word] = [];
    groups[item.word].push(item);
  });
  return groups;
}

// 表示生成
function display(data) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  const groups = groupByWord(data);

  Object.keys(groups).forEach(word => {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("div");
    title.className = "word";
    title.textContent = word;
    card.appendChild(title);

    groups[word].forEach(item => {
      const entry = document.createElement("div");
      entry.className = "entry";
      entry.innerHTML = `
        <div class="entry-main">
          <span class="reading">（${item.reading}）</span>
          <span class="source">${item.source}</span>
          ${item.image_url ? `<a href="${item.image_url}" target="_blank" class="link">原本</a>` : ""}
        </div>
        <div class="note">${item.note || ""}</div>
      `;
      card.appendChild(entry);
    });

    container.appendChild(card);
  });
}

// イベント
document.getElementById("search").addEventListener("input", updateDisplay);
document.getElementById("ignore-diacritics").addEventListener("change", updateDisplay);
