const game = {
  started: false,
  awaitingChoice: false,
  decisionUsed: false,
  round: 1,
  maxRound: 30,
  position: 0,
  money: 1200000,
  reputation: 350,
  sustainability: 55,
  happiness: 80,
  risk: 20,
  xp: 350,
  land: 3,
  cropLevel: 5,
  loan: 200000,
  landValue: 720000,
  aiCoachTurns: 0
};

const landTypes = [
  { id: "business", name: "都市商業區", icon: "商", owned: 1, value: 320000, bonus: "市場收益高，風險中" },
  { id: "plain", name: "平原農田區", icon: "田", owned: 1, value: 180000, bonus: "穩定收成，永續易提升" },
  { id: "hill", name: "山坡地", icon: "山", owned: 0, value: 150000, bonus: "低價擴張，氣象風險高" },
  { id: "forest", name: "大型森林區", icon: "森", owned: 0, value: 220000, bonus: "永續高，開發限制多" },
  { id: "coast", name: "海邊漁港區", icon: "港", owned: 0, value: 260000, bonus: "漁港收益，颱風風險高" },
  { id: "leisure", name: "休閒農場區", icon: "遊", owned: 1, value: 240000, bonus: "幸福與聲望提升快" }
];

const nodes = [
  { name: "台北", x: 58, y: 18, type: "market", icon: "市", land: "business" },
  { name: "桃園", x: 49, y: 25, type: "subsidy", icon: "補", land: "plain" },
  { name: "新竹", x: 45, y: 34, type: "chance", icon: "機", land: "business" },
  { name: "台中", x: 42, y: 45, type: "market", icon: "場", land: "plain" },
  { name: "嘉義", x: 50, y: 55, type: "pest", icon: "蟲", land: "plain" },
  { name: "台南", x: 38, y: 62, type: "fate", icon: "命", land: "leisure" },
  { name: "高雄", x: 35, y: 76, type: "market", icon: "港", land: "coast" },
  { name: "屏東", x: 48, y: 82, type: "weather", icon: "風", land: "coast" },
  { name: "台東", x: 63, y: 70, type: "chance", icon: "機", land: "leisure" },
  { name: "花蓮", x: 70, y: 53, type: "weather", icon: "雨", land: "hill" },
  { name: "宜蘭", x: 69, y: 36, type: "pest", icon: "病", land: "plain" },
  { name: "南投", x: 55, y: 40, type: "subsidy", icon: "政", land: "forest" }
];

const eventDecks = {
  chance: {
    label: "機會卡",
    cards: [
      eventCard("智慧農機試辦", "縣市政府邀請你導入自走農機，若管理得宜可提升效率。", [
        choice("A", "立即導入", { money: -120000, reputation: 35, sustainability: 8, risk: -4, landValue: 50000 }, "短期支出，長期價值提升。"),
        choice("B", "小規模試用", { money: -50000, reputation: 18, sustainability: 4, risk: -2, landValue: 20000 }, "保守投入，穩定改善。"),
        choice("C", "暫緩採購", { money: 30000, reputation: -8, happiness: -2, risk: 3 }, "保留現金，但錯失曝光。")
      ]),
      eventCard("青年返鄉合作", "在地團隊希望與你共同打造智慧農業示範場。", [
        choice("A", "成立合作社", { money: -70000, reputation: 28, happiness: 8, sustainability: 5, landValue: 30000 }, "社群支持提高。"),
        choice("B", "簽短期合作", { money: -20000, reputation: 14, happiness: 3 }, "低風險建立關係。"),
        choice("C", "維持單打獨鬥", { money: 20000, reputation: -6, risk: 4 }, "省下成本，但韌性下降。")
      ])
    ]
  },
  fate: {
    label: "命運卡",
    cards: [
      eventCard("通路合約延遲", "大型通路延後付款，現金流吃緊。", [
        choice("A", "啟用備用金", { money: -80000, reputation: 6, risk: -5 }, "穩住信用。"),
        choice("B", "和銀行展延", { loan: 80000, money: 60000, risk: 5, happiness: -2 }, "取得現金但增加負債。"),
        choice("C", "延後供貨", { money: -20000, reputation: -20, happiness: -4, risk: 8 }, "成本較低但名聲受損。")
      ]),
      eventCard("關鍵員工離職", "農場管理人員突然離職，需要調整作業。", [
        choice("A", "提高待遇留才", { money: -90000, happiness: 10, risk: -6 }, "團隊穩定。"),
        choice("B", "導入排班系統", { money: -40000, sustainability: 4, risk: -2 }, "用系統補管理缺口。"),
        choice("C", "暫時縮減營運", { money: 30000, reputation: -10, happiness: -8 }, "省成本但影響士氣。")
      ])
    ]
  },
  weather: {
    label: "氣象卡",
    cards: [
      eventCard("豪雨鋒面", "連日強降雨，低窪農田排水壓力升高。", [
        choice("A", "啟動 AI 排水預警", { money: -60000, sustainability: 8, risk: -12, landValue: 25000 }, "減災效果最好。"),
        choice("B", "人工巡田", { money: -30000, happiness: -2, risk: -5 }, "成本較低但人力吃緊。"),
        choice("C", "等雨勢停止", { money: -10000, reputation: -8, risk: 12, landValue: -30000 }, "可能造成土地價值下降。")
      ]),
      eventCard("高溫乾旱", "灌溉需求提高，作物水分壓力增加。", [
        choice("A", "投資滴灌系統", { money: -100000, sustainability: 12, risk: -10, landValue: 40000 }, "永續提升明顯。"),
        choice("B", "調整作物排程", { money: -30000, sustainability: 5, risk: -4 }, "控制損失。"),
        choice("C", "維持原計畫", { money: 10000, happiness: -5, risk: 10 }, "短期省錢，風險升高。")
      ])
    ]
  },
  market: {
    label: "市場卡",
    cards: [
      eventCard("有機蔬菜價格上揚", "消費者需求增加，品牌農產可取得更高價格。", [
        choice("A", "擴大供貨", { money: 160000, reputation: 18, risk: 4 }, "收益高但作業壓力增加。"),
        choice("B", "維持品質優先", { money: 90000, reputation: 25, happiness: 4 }, "品牌穩定成長。"),
        choice("C", "囤貨等待高點", { money: 40000, risk: 9, reputation: -3 }, "有機會，但價格風險高。")
      ]),
      eventCard("進口農產競爭", "市場價格受到壓力，需要重新定位。", [
        choice("A", "推產地故事", { money: -40000, reputation: 26, happiness: 4 }, "提高差異化。"),
        choice("B", "短期降價", { money: -70000, reputation: 8, risk: -2 }, "保住訂單。"),
        choice("C", "不調整策略", { money: -30000, reputation: -12, risk: 6 }, "被動承受市場波動。")
      ])
    ]
  },
  pest: {
    label: "病蟲害卡",
    cards: [
      eventCard("秋行軍蟲警戒", "鄰近農區通報蟲害，需快速決策。", [
        choice("A", "AI 影像巡檢", { money: -70000, sustainability: 7, reputation: 8, risk: -10 }, "精準防治，減少藥劑。"),
        choice("B", "傳統防治", { money: -40000, sustainability: -4, risk: -6 }, "有效但永續下降。"),
        choice("C", "觀察一週", { money: 10000, reputation: -8, risk: 14, landValue: -20000 }, "可能延誤防治。")
      ]),
      eventCard("溫室病害擴散", "濕度過高導致葉斑病風險上升。", [
        choice("A", "升級環控設備", { money: -90000, sustainability: 8, risk: -12, landValue: 30000 }, "根本改善環境。"),
        choice("B", "增加通風班次", { money: -30000, happiness: -3, risk: -5 }, "人力負擔增加。"),
        choice("C", "減少採收批次", { money: -50000, reputation: -5, risk: -3 }, "控制擴散但收入下降。")
      ])
    ]
  },
  subsidy: {
    label: "政策補助卡",
    cards: [
      eventCard("淨零農業補助", "你的低碳計畫符合補助資格。", [
        choice("A", "提交完整計畫", { money: 180000, reputation: 18, sustainability: 12, risk: -3 }, "最大化補助與形象。"),
        choice("B", "只申請設備項目", { money: 100000, sustainability: 5 }, "快速取得資金。"),
        choice("C", "放棄申請", { money: 0, reputation: -5 }, "不花行政成本，但錯失資源。")
      ]),
      eventCard("地方創生專案", "休閒農場與食農教育可納入地方創生。", [
        choice("A", "舉辦農遊活動", { money: 60000, reputation: 24, happiness: 8, landValue: 25000 }, "提升人氣與土地價值。"),
        choice("B", "開放校外教學", { money: 30000, reputation: 15, happiness: 4 }, "穩定增加聲望。"),
        choice("C", "專注生產", { money: 50000, reputation: -4, happiness: -2 }, "收益較直接。")
      ])
    ]
  }
};

const aiTips = [
  "風險高於 60 時，優先用 AI 氣象教練或設備投資降風險。",
  "永續會影響政策補助與長期評價，不要只看現金。",
  "土地價值下降時，購買土地前要先判斷事件類型。",
  "貸款能解決現金流，但風險與負債會拖累結算。",
  "休閒農場能穩定拉高幸福度與聲望，適合中後期經營。"
];

const deckMeta = [
  ["chance", "機會卡", "合作、科技、通路機會"],
  ["fate", "命運卡", "營運壓力與突發狀況"],
  ["weather", "氣象卡", "豪雨、乾旱與寒害"],
  ["market", "市場卡", "價格與需求波動"],
  ["pest", "病蟲害卡", "蟲害、病害與防治"],
  ["subsidy", "政策補助卡", "政府補助與地方創生"]
];

const mapEl = document.getElementById("taiwanMap");
const routePath = document.getElementById("routePath");
const rollBtn = document.getElementById("rollBtn");
const diceFace = document.getElementById("diceFace");
const diceText = document.getElementById("diceText");
const choicePanel = document.getElementById("choicePanel");
const token = document.createElement("div");
token.className = "player-token";
token.textContent = "農";

function eventCard(title, desc, choices) {
  return { title, desc, choices };
}

function choice(key, label, effects, note) {
  return { key, label, effects, note };
}

function formatMoney(value) {
  return Math.round(value).toLocaleString("zh-TW");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function totalLandOwned() {
  return landTypes.reduce((sum, land) => sum + land.owned, 0);
}

function syncDerivedState() {
  game.land = totalLandOwned();
  game.money = Math.max(0, Math.round(game.money));
  game.reputation = Math.max(0, Math.round(game.reputation));
  game.sustainability = clamp(Math.round(game.sustainability), 0, 100);
  game.happiness = clamp(Math.round(game.happiness), 0, 100);
  game.risk = clamp(Math.round(game.risk), 0, 100);
  game.landValue = Math.max(0, Math.round(game.landValue));
  game.loan = Math.max(0, Math.round(game.loan));
  game.xp = clamp(Math.round(game.xp), 0, 1000);
}

function updateUI() {
  syncDerivedState();
  document.getElementById("money").textContent = formatMoney(game.money);
  document.getElementById("reputation").textContent = game.reputation.toLocaleString("zh-TW");
  document.getElementById("sustainability").textContent = game.sustainability;
  document.getElementById("happiness").textContent = `${game.happiness}%`;
  document.getElementById("risk").textContent = game.risk;
  document.getElementById("round").textContent = game.round;
  document.getElementById("assetCash").textContent = formatMoney(game.money);
  document.getElementById("assetLand").textContent = `${game.land} 筆`;
  document.getElementById("assetCrops").textContent = `${game.cropLevel} 級`;
  document.getElementById("assetLoan").textContent = formatMoney(game.loan);
  document.getElementById("landValue").textContent = formatMoney(game.landValue);
  document.getElementById("xpBar").style.width = `${game.xp / 10}%`;
  document.getElementById("xpText").textContent = `${game.xp} / 1000`;
  document.querySelectorAll(".decision-button").forEach((button) => {
    button.disabled = !game.started || game.awaitingChoice || game.decisionUsed;
  });
  renderLands();
}

function applyEffects(effects) {
  game.money += effects.money || 0;
  game.reputation += effects.reputation || 0;
  game.sustainability += effects.sustainability || 0;
  game.happiness += effects.happiness || 0;
  game.risk += effects.risk || 0;
  game.landValue += effects.landValue || 0;
  game.loan += effects.loan || 0;
  game.xp += effects.xp || 30;
  if (effects.cropLevel) game.cropLevel += effects.cropLevel;
  if (effects.aiCoachTurns) game.aiCoachTurns += effects.aiCoachTurns;
  updateUI();
}

function effectSummary(effects) {
  const labels = {
    money: "資金",
    reputation: "聲望",
    sustainability: "永續",
    happiness: "幸福",
    risk: "風險",
    landValue: "土地價值",
    loan: "貸款",
    cropLevel: "作物",
    aiCoachTurns: "AI 教練"
  };
  return Object.entries(effects)
    .map(([key, value]) => `${labels[key] || key} ${value > 0 ? "+" : ""}${key === "money" || key === "landValue" || key === "loan" ? formatMoney(value) : value}`)
    .join(" / ");
}

function setEvent(type, title, desc, effect) {
  document.getElementById("eventType").textContent = type;
  document.getElementById("eventTitle").textContent = title;
  document.getElementById("eventDesc").textContent = desc;
  document.getElementById("eventEffect").textContent = effect;
}

function drawRoute() {
  const first = nodes[0];
  const commands = nodes
    .map((node, index) => `${index === 0 ? "M" : "L"} ${node.x} ${node.y}`)
    .join(" ");
  routePath.setAttribute("d", `${commands} L ${first.x} ${first.y}`);
}

function initMap() {
  drawRoute();
  document.querySelectorAll(".map-node").forEach((node) => node.remove());
  nodes.forEach((node, index) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `map-node ${node.type}`;
    el.style.left = `${node.x}%`;
    el.style.top = `${node.y}%`;
    el.innerHTML = `${node.icon}<span class="node-label">${node.name}</span>`;
    el.setAttribute("aria-label", `${node.name} ${eventDecks[node.type].label}`);
    el.addEventListener("click", () => showNodeInfo(node));
    mapEl.appendChild(el);
  });
  mapEl.appendChild(token);
  moveToken(false);
}

function moveToken(animated = true) {
  const node = nodes[game.position];
  token.style.left = `${node.x}%`;
  token.style.top = `${node.y}%`;
  document.querySelectorAll(".map-node").forEach((el, index) => {
    el.classList.toggle("active", index === game.position);
  });
  if (animated) {
    token.classList.remove("hopping");
    void token.offsetWidth;
    token.classList.add("hopping");
  }
}

function renderLands() {
  const list = document.getElementById("landList");
  list.innerHTML = "";
  landTypes.forEach((land) => {
    const item = document.createElement("div");
    item.className = "land-item";
    item.innerHTML = `
      <span>${land.icon}</span>
      <span>${land.name}<small>${land.bonus}</small></span>
      <span class="land-owned">${land.owned} 筆</span>
    `;
    list.appendChild(item);
  });
}

function renderDecks() {
  const list = document.getElementById("deckList");
  list.innerHTML = "";
  deckMeta.forEach(([type, label, desc]) => {
    const item = document.createElement("div");
    item.className = "deck-item";
    item.innerHTML = `<span class="deck-dot ${type}"></span><span>${label}<small>${desc}</small></span><span>${eventDecks[type].cards.length}</span>`;
    list.appendChild(item);
  });
}

function renderChoices(card, node, deck) {
  choicePanel.innerHTML = "";
  game.awaitingChoice = true;
  rollBtn.disabled = true;
  card.choices.forEach((item) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.innerHTML = `${item.key}. ${item.label}<span>${item.note}<br>${effectSummary(item.effects)}</span>`;
    button.addEventListener("click", () => resolveChoice(item, node, deck));
    choicePanel.appendChild(button);
  });
  updateUI();
}

function resolveChoice(item, node, deck) {
  const land = landTypes.find((entry) => entry.id === node.land);
  const ownedBonus = land && land.owned > 0 ? 1 : 0;
  const adjustedEffects = { ...item.effects };
  if (ownedBonus && adjustedEffects.reputation) adjustedEffects.reputation += 4;
  if (game.aiCoachTurns > 0 && (deck === "weather" || deck === "pest")) {
    adjustedEffects.risk = (adjustedEffects.risk || 0) - 6;
    game.aiCoachTurns -= 1;
  }

  applyEffects(adjustedEffects);
  game.awaitingChoice = false;
  game.decisionUsed = false;
  choicePanel.innerHTML = "";
  setEvent(
    `${eventDecks[deck].label}已處理`,
    `${node.name}｜${item.key}. ${item.label}`,
    item.note,
    effectSummary(adjustedEffects)
  );

  game.round += 1;
  if (game.round > game.maxRound) {
    finishGame();
  } else {
    rollBtn.disabled = false;
    diceText.textContent = "下一回合：可先決策，再擲骰";
    document.getElementById("phaseText").textContent = "本回合尚未決策，可擇一執行。";
  }
  updateUI();
}

function triggerCurrentNode() {
  const node = nodes[game.position];
  const deck = node.type;
  const card = pick(eventDecks[deck].cards);
  const land = landTypes.find((entry) => entry.id === node.land);
  setEvent(
    eventDecks[deck].label,
    `${node.name}｜${card.title}`,
    `你抵達 ${node.name}（${land.name}）。${card.desc}`,
    "請選擇 A/B/C 處理方式"
  );
  renderChoices(card, node, deck);
}

function rollDice() {
  if (!game.started || game.awaitingChoice || game.round > game.maxRound) return;
  const dice = Math.floor(Math.random() * 6) + 1;
  diceFace.textContent = dice;
  diceText.textContent = `前進 ${dice} 步`;
  rollBtn.disabled = true;

  let steps = 0;
  const timer = window.setInterval(() => {
    game.position = (game.position + 1) % nodes.length;
    moveToken();
    steps += 1;
    if (steps >= dice) {
      window.clearInterval(timer);
      triggerCurrentNode();
    }
  }, 330);
}

function startGame() {
  if (game.started) return;
  game.started = true;
  game.decisionUsed = false;
  rollBtn.disabled = false;
  diceText.textContent = "可先做一次決策，也可直接擲骰";
  setEvent("經營階段", "遊戲開始", "每回合先決策，再擲骰移動。事件發生後必須選擇 A/B/C 處理方式。", "準備第一回合");
  document.getElementById("phaseText").textContent = "本回合尚未決策，可擇一執行。";
  updateUI();
}

function resetGame() {
  Object.assign(game, {
    started: false,
    awaitingChoice: false,
    decisionUsed: false,
    round: 1,
    maxRound: 30,
    position: 0,
    money: 1200000,
    reputation: 350,
    sustainability: 55,
    happiness: 80,
    risk: 20,
    xp: 350,
    land: 3,
    cropLevel: 5,
    loan: 200000,
    landValue: 720000,
    aiCoachTurns: 0
  });
  landTypes.forEach((land) => {
    land.owned = ["business", "plain", "leisure"].includes(land.id) ? 1 : 0;
  });
  diceFace.textContent = "?";
  diceText.textContent = "點擊開始遊戲後可擲骰";
  rollBtn.disabled = true;
  choicePanel.innerHTML = "";
  setEvent("準備階段", "等待開局", "按下開始遊戲，擲骰後會依落點觸發分級事件卡。", "目標：資金、聲望、永續與幸福度共同成長");
  document.getElementById("phaseText").textContent = "開局後，每回合擲骰前可執行 1 次決策。";
  document.getElementById("aiAdvice").textContent = aiTips[0];
  moveToken(false);
  updateUI();
}

function finishGame() {
  game.started = false;
  game.awaitingChoice = false;
  rollBtn.disabled = true;
  choicePanel.innerHTML = "";
  const score = game.money / 10000 + game.reputation * 1.5 + game.sustainability * 8 + game.happiness * 6 + game.landValue / 20000 - game.risk * 5 - game.loan / 30000;
  const rank = score >= 1100 ? "永續智慧農業王" : score >= 800 ? "穩健農場經營者" : "持續成長青農";
  setEvent("結算", "遊戲結束", `最終資金 ${formatMoney(game.money)}，聲望 ${game.reputation}，永續 ${game.sustainability}，風險 ${game.risk}。`, `稱號：${rank}`);
  diceText.textContent = "已完成 30 回合";
  updateUI();
}

function runDecision(action) {
  if (!game.started || game.awaitingChoice || game.decisionUsed) return;
  const actions = {
    equipment: {
      title: "投資設備",
      desc: "升級感測器、灌溉與環控設備。",
      effects: { money: -120000, sustainability: 8, risk: -8, landValue: 35000 }
    },
    loan: {
      title: "申請貸款",
      desc: "取得營運資金，但提高負債與風險。",
      effects: { money: 220000, loan: 220000, risk: 6, happiness: -2 }
    },
    land: {
      title: "購買土地",
      desc: "購買目前持有最少的土地類型。",
      effects: { money: -180000, landValue: 170000, reputation: 6, risk: 3 },
      buyLand: true
    },
    crop: {
      title: "升級作物",
      desc: "改良品種與栽培 SOP，提升市場競爭力。",
      effects: { money: -80000, cropLevel: 1, reputation: 12, sustainability: 3 }
    },
    coach: {
      title: "啟動 AI 農業氣象教練",
      desc: "未來 2 次氣象或病蟲害事件額外降低風險。",
      effects: { money: -50000, risk: -6, aiCoachTurns: 2 }
    }
  };
  const selected = actions[action];
  if (!selected) return;
  if (selected.buyLand) {
    const target = [...landTypes].sort((a, b) => a.owned - b.owned || a.value - b.value)[0];
    target.owned += 1;
    selected.desc = `購入 ${target.name} 1 筆。${target.bonus}`;
  }
  applyEffects(selected.effects);
  game.decisionUsed = true;
  setEvent("決策完成", selected.title, selected.desc, effectSummary(selected.effects));
  document.getElementById("phaseText").textContent = "本回合已完成決策，請擲骰前進。";
  document.getElementById("aiAdvice").textContent = pick(aiTips);
  updateUI();
}

function showDialog(title, body) {
  const dialog = document.getElementById("infoDialog");
  document.getElementById("dialogTitle").textContent = title;
  document.getElementById("dialogBody").textContent = body;
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    window.alert(`${title}\n\n${body}`);
  }
}

function showNodeInfo(node) {
  const land = landTypes.find((entry) => entry.id === node.land);
  showDialog(node.name, `節點類型：${eventDecks[node.type].label}。土地：${land.name}。${land.bonus}`);
}

document.getElementById("startBtn").addEventListener("click", startGame);
rollBtn.addEventListener("click", rollDice);
document.getElementById("resetBtn").addEventListener("click", resetGame);
document.querySelectorAll(".decision-button").forEach((button) => {
  button.addEventListener("click", () => runDecision(button.dataset.action));
});
document.getElementById("guideBtn").addEventListener("click", () => {
  showDialog("遊戲說明", "每回合可先執行 1 次經營決策，再擲骰移動。抵達節點後會觸發分級事件卡，必須選擇 A/B/C 處理方式才會結算。");
});
document.getElementById("characterBtn").addEventListener("click", () => {
  showDialog("選擇角色", "目前角色為阿澤青農。此版本聚焦單一角色的經營深度，後續可擴充角色技能。");
});
document.getElementById("mapBtn").addEventListener("click", () => {
  showDialog("臺灣地圖", "地圖包含都市商業區、平原農田區、山坡地、大型森林區、海邊漁港區與休閒農場區。不同節點會觸發不同分級事件。");
});

initMap();
renderDecks();
renderLands();
updateUI();
