let allData = [];
let currentSource = "";

// データ読み込み
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    allData = data;
    createSourceButtons(data);
    display(data);
  });

// 出典ボタン自動生成
function createSourceButtons(data) {
  const container = document.getElementById("filters");

  const sources = [...new Set(data.map(d => d.source))];

  // 「すべて」ボタン
  const allBtn = document.createElement("button");
  allBtn.textContent = "すべて";
  allBtn.onclick = () => {
    currentSource = "";
    updateDisplay();
  };
  container.appendChild(allBtn);

  // 各出典ボタン
  sources.forEach(src => {
    const btn = document.createElement("button");
    btn.textContent = src;
    btn.onclick = () => {
      currentSource = src;
      updateDisplay();
    };
    container.appendChild(btn);
  });
}

// 表示更新（検索＋フィルタ統合）
function updateDisplay() {
  const keyword = document.getElementById("search").value;

  let filtered = allData.filter(item =>
    item.word.includes(keyword) ||
    item.reading.includes(keyword) ||
    item.source.includes(keyword) ||
    (item.note && item.note.includes(keyword))
  );

  if (currentSource) {
    filtered = filtered.filter(item => item.source === currentSource);
  }

  display(filtered);
}

// 同一語でグループ化
function groupByWord(data) {
  const groups = {};

  data.forEach(item => {
    if (!groups[item.word]) {
      groups[item.word] = [];
    }
    groups[item.word].push(item);
  });

  return groups;
}

// 表示処理
function display(data) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  const groups = groupByWord(data);

  Object.keys(groups).forEach(word => {
    const groupDiv = document.createElement("div");
    groupDiv.className = "group";

    const title = document.createElement("div");
    title.className = "word";
    title.textContent = word;
    groupDiv.appendChild(title);

    groups[word].forEach(item => {
      const entry = document.createElement("div");
      entry.className = "entry";

      entry.innerHTML = `
        <span class="reading">(${item.reading})</span>
        <span class="source">[${item.source}]</span>
        <div class="note">${item.note || ""}</div>
      `;

      groupDiv.appendChild(entry);
    });

    container.appendChild(groupDiv);
  });
}

// 検索イベント
document.getElementById("search").addEventListener("input", () => {
  updateDisplay();
});