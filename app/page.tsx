/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";

type Stage =
  | "login"
  | "setup"
  | "grow"
  | "workers"
  | "quality"
  | "cold"
  | "sales"
  | "result";

type Choice = [
  label: string,
  description: string,
  cost: number,
  managementMultiplier: number,
  brandDelta: number,
  riskDelta: number,
];

type GameEvent = {
  at: number;
  title: string;
  icon: string;
  text: string;
  choices: Choice[];
};

type Modal =
  | GameEvent
  | {
      kind: "spin";
      title: string;
      text: string;
    };

type State = {
  version: number;
  stage: Stage;
  nickname: string;
  farmName: string;
  classCode: string;
  area: number;
  cash: number;
  revenue: number;
  cost: number;
  brand: number;
  green: number;
  risk: number;
  growth: number;
  clicks: number;
  week: number;
  handled: number[];
  loss: number;
  management: number;
  workers: number;
  harvest: number;
  a: number;
  b: number;
  process: number;
  reject: number;
  cold: string;
  channel: string;
  note: string;
  lastCheerIndex: number;
  lastSavedAt: string;
};

const STORAGE_KEY = "farmverse-v1";
const SAVE_VERSION = 2;
const EVENT_STEPS = [20, 40, 60, 80, 100];
const STAGES: Stage[] = [
  "login",
  "setup",
  "grow",
  "workers",
  "quality",
  "cold",
  "sales",
  "result",
];

const initial: State = {
  version: SAVE_VERSION,
  stage: "login",
  nickname: "",
  farmName: "",
  classCode: "",
  area: 1,
  cash: 1000000,
  revenue: 0,
  cost: 0,
  brand: 10,
  green: 50,
  risk: 50,
  growth: 0,
  clicks: 0,
  week: 1,
  handled: [],
  loss: 0,
  management: 1,
  workers: 3,
  harvest: 0,
  a: 0,
  b: 0,
  process: 0,
  reject: 0,
  cold: "",
  channel: "",
  note: "準備播下第一顆種子",
  lastCheerIndex: -1,
  lastSavedAt: "",
};

const events: GameEvent[] = [
  {
    at: 20,
    title: "幼苗定植",
    icon: "💧",
    text: "番茄幼苗需要穩定水分，你怎麼做？",
    choices: [
      ["滴灌定植", "節水、穩定生長", 18000, 1.04, 3, 4],
      ["人工澆灌", "成本較低", 9000, 1, 0, 0],
      ["大量灌水", "快速但易傷根", 6000, 0.94, 0, -3],
      ["暫不處理", "保留現金、承擔風險", 0, 0.88, 0, -6],
    ],
  },
  {
    at: 40,
    title: "整枝與支架",
    icon: "🪴",
    text: "植株快速長高，枝葉開始交疊。",
    choices: [
      ["完整立架整枝", "品質與管理最佳", 26000, 1.07, 4, 3],
      ["簡易竹架", "平衡成本與效果", 13000, 1.03, 1, 1],
      ["只做整枝", "通風改善但支撐不足", 7000, 0.99, 0, 0],
      ["自然生長", "省錢但倒伏風險高", 0, 0.9, 0, -6],
    ],
  },
  {
    at: 60,
    title: "病蟲害輪盤",
    icon: "🎡",
    text: "葉面出現疑似夜蛾取食痕跡，請轉動災害輪盤確認影響。",
    choices: [],
  },
  {
    at: 80,
    title: "極端天氣",
    icon: "⛈️",
    text: "午後豪雨將至，成熟果實面臨裂果風險。",
    choices: [
      ["加強排水與覆蓋", "損失最低", 48000, 1.03, 2, 5],
      ["開溝排水", "務實的中等方案", 26000, 0.98, 0, 2],
      ["提前採部分果實", "保住產量但品質略降", 16000, 0.94, -1, 1],
      ["相信天氣轉好", "零成本、高風險", 0, 0.76, 0, -10],
    ],
  },
  {
    at: 100,
    title: "採收時刻",
    icon: "🍅",
    text: "番茄成熟了！先安排採收人力。",
    choices: [],
  },
];

const cheers = [
  "你是最棒的！",
  "凡事皆正面！",
  "每一次努力都會有收穫！",
  "你的農場正在茁壯成長！",
  "穩穩前進，就是最好的策略！",
  "你正在成為真正的農場經營高手！",
];

const disasterOptions: [string, number][] = [
  ["🌤️ 風調雨順", 0],
  ["🌧️ 豪雨", 0.06],
  ["🔥 高溫", 0.08],
  ["🐛 蟲害", 0.1],
  ["✨ 市場利多", -0.03],
];

const coldOptions = [
  ["不使用冷鏈", "零成本・損耗較高"],
  ["租用冷鏈", "品質穩定・彈性佳"],
  ["自建冷鏈", "長期設備・高投資"],
];

const channelOptions = [
  ["批發市場", "價格穩定"],
  ["網路品牌直售", "高售價、需包裝物流"],
  ["日本精品外銷", "高報酬、高物流成本"],
];

const money = (n: number) =>
  new Intl.NumberFormat("zh-TW").format(Math.round(n));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const uniqueHandled = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (step): step is number =>
              typeof step === "number" && EVENT_STEPS.includes(step),
          ),
        ),
      )
    : [];

const hydrateState = (raw: string | null): State => {
  if (!raw) return initial;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return initial;

    const stage = STAGES.includes(parsed.stage as Stage)
      ? (parsed.stage as Stage)
      : initial.stage;

    return {
      ...initial,
      version: SAVE_VERSION,
      stage,
      nickname: asString(parsed.nickname, initial.nickname),
      farmName: asString(parsed.farmName, initial.farmName),
      classCode: asString(parsed.classCode, initial.classCode),
      area: [0.5, 1, 2, 3].includes(asNumber(parsed.area, initial.area))
        ? asNumber(parsed.area, initial.area)
        : initial.area,
      cash: asNumber(parsed.cash, initial.cash),
      revenue: asNumber(parsed.revenue, initial.revenue),
      cost: asNumber(parsed.cost, initial.cost),
      brand: asNumber(parsed.brand, initial.brand),
      green: asNumber(parsed.green, initial.green),
      risk: asNumber(parsed.risk, initial.risk),
      growth: clamp(asNumber(parsed.growth, initial.growth), 0, 100),
      clicks: Math.max(0, asNumber(parsed.clicks, initial.clicks)),
      week: Math.max(1, asNumber(parsed.week, initial.week)),
      handled: uniqueHandled(parsed.handled),
      loss: clamp(asNumber(parsed.loss, initial.loss), 0, 0.95),
      management: Math.max(0, asNumber(parsed.management, initial.management)),
      workers: clamp(Math.round(asNumber(parsed.workers, initial.workers)), 1, 5),
      harvest: Math.max(0, asNumber(parsed.harvest, initial.harvest)),
      a: Math.max(0, asNumber(parsed.a, initial.a)),
      b: Math.max(0, asNumber(parsed.b, initial.b)),
      process: Math.max(0, asNumber(parsed.process, initial.process)),
      reject: Math.max(0, asNumber(parsed.reject, initial.reject)),
      cold: asString(parsed.cold, initial.cold),
      channel: asString(parsed.channel, initial.channel),
      note: asString(parsed.note, initial.note),
      lastCheerIndex: Math.trunc(
        asNumber(parsed.lastCheerIndex, initial.lastCheerIndex),
      ),
      lastSavedAt: asString(parsed.lastSavedAt, initial.lastSavedAt),
    };
  } catch {
    return initial;
  }
};

const getPendingEvent = (state: State) =>
  events.find(
    (event) =>
      event.at === state.growth &&
      !state.handled.includes(event.at) &&
      state.stage === "grow",
  );

const nextCheerIndex = (lastIndex: number) =>
  cheers.length <= 1 ? 0 : (lastIndex + 1) % cheers.length;

const hasEventModal = (modal: Modal | null): modal is GameEvent =>
  Boolean(modal && !("kind" in modal));

export default function Home() {
  const [g, setG] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<Modal | null>(null);
  const [float, setFloat] = useState(0);
  const [cheer, setCheer] = useState("");
  const [cool, setCool] = useState(false);
  const [tab, setTab] = useState("任務");

  useEffect(() => {
    setG(hydrateState(localStorage.getItem(STORAGE_KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...g, version: SAVE_VERSION, lastSavedAt: new Date().toISOString() }),
      );
    } catch {
      // localStorage may be unavailable in private mode or full storage.
    }
  }, [g, ready]);

  const nextEvent = useMemo(() => getPendingEvent(g), [g]);
  const cropStage =
    g.growth < 20
      ? "🌱"
      : g.growth < 40
        ? "🌿"
        : g.growth < 60
          ? "🪴"
          : g.growth < 80
            ? "🌼"
            : g.growth < 100
              ? "🍅"
              : "🧺";
  const profit = g.revenue - g.cost;
  const processDisabled =
    (g.stage === "cold" && !g.cold) || (g.stage === "sales" && !g.channel);

  const act = () => {
    if (cool) return;

    let cheerMessage = "";
    setG((current) => {
      if (current.stage !== "grow" || getPendingEvent(current)) return current;

      const growth = Math.min(100, current.growth + 1);
      const clicks = current.clicks + 1;
      const nextState: State = {
        ...current,
        growth,
        clicks,
        note:
          growth === 100
            ? "作物成熟，準備採收！"
            : `番茄生長進度 ${growth}%`,
      };

      if (clicks % 30 === 0) {
        const cheerIndex = nextCheerIndex(current.lastCheerIndex);
        nextState.lastCheerIndex = cheerIndex;
        cheerMessage = cheers[cheerIndex];
      }

      return nextState;
    });

    setCool(true);
    setTimeout(() => setCool(false), 320);
    setFloat((value) => value + 1);
    setTimeout(() => setFloat(0), 650);

    if (cheerMessage) {
      setCheer(cheerMessage);
      setTimeout(() => setCheer(""), 4200);
    }
  };

  const choose = (choice: Choice, at: number) => {
    setG((current) => {
      if (current.stage !== "grow" || current.handled.includes(at)) {
        return current;
      }
      if (current.growth !== at) return current;

      return {
        ...current,
        cash: current.cash - choice[2] * current.area,
        cost: current.cost + choice[2] * current.area,
        management: current.management * choice[3],
        brand: current.brand + choice[4],
        green: Math.max(0, current.green + choice[4]),
        risk: Math.max(0, current.risk + choice[5]),
        handled: [...current.handled, at],
        week: current.week + 1,
        note: `已完成：${choice[0]}`,
      };
    });
    setModal(null);
  };

  const spinDisaster = () => {
    let resultTitle = "";
    let resultRate = 0;
    let hasResult = false;

    setG((current) => {
      if (
        current.stage !== "grow" ||
        current.growth !== 60 ||
        current.handled.includes(60)
      ) {
        return current;
      }

      const [title, rate] =
        disasterOptions[Math.floor(Math.random() * disasterOptions.length)];
      resultTitle = title;
      resultRate = rate;
      hasResult = true;

      return {
        ...current,
        loss: clamp(current.loss + rate, 0, 0.95),
        handled: [...current.handled, 60],
        week: current.week + 1,
        note: `災害輪盤：${title}`,
      };
    });

    if (!hasResult) return;

    setModal({
      kind: "spin",
      title: resultTitle,
      text:
        resultRate > 0
          ? `預估產量損失 ${Math.round(resultRate * 100)}%`
          : resultRate < 0
            ? "好消息！管理效益提升 3%"
            : "作物平安度過本週",
    });
  };

  const completeHarvestEvent = () => {
    setG((current) => {
      if (
        current.stage !== "grow" ||
        current.growth !== 100 ||
        current.handled.includes(100)
      ) {
        return current;
      }

      return {
        ...current,
        stage: "workers",
        handled: [...current.handled, 100],
        note: "番茄成熟，請安排採收人力",
      };
    });
  };

  const hire = () => {
    setG((current) => {
      if (current.stage !== "workers") return current;

      const base = 65000 * current.area;
      const workerCost = current.workers * 1200 * 4;
      const completion = [0, 0.76, 0.84, 0.91, 0.96, 1][current.workers] ?? 0.84;
      const harvest = Math.max(
        0,
        60000 * current.area * current.management * (1 - current.loss) * completion,
      );

      return {
        ...current,
        stage: "quality",
        cash: current.cash - base - workerCost,
        cost: current.cost + base + workerCost,
        harvest,
        note: "採收完成，進入品質分級",
      };
    });
  };

  const grade = () => {
    setG((current) => {
      if (current.stage !== "quality") return current;

      const aRate = [0.4, 0.6, 0.8][Math.floor(Math.random() * 3)];
      const remainderAfterA = 1 - aRate;
      const bRate = remainderAfterA * 0.5;
      const processRate = (remainderAfterA - bRate) * 0.6;
      const rejectRate = Math.max(0, 1 - aRate - bRate - processRate);

      return {
        ...current,
        a: current.harvest * aRate,
        b: current.harvest * bRate,
        process: current.harvest * processRate,
        reject: current.harvest * rejectRate,
        stage: "cold",
        brand: current.brand + (aRate >= 0.6 ? 5 : 2),
        note: `A級品占 ${Math.round(aRate * 100)}%，請選擇冷鏈方案`,
      };
    });
  };

  const finish = () => {
    setG((current) => {
      if (current.stage !== "sales" || !current.channel) return current;

      const coldCost =
        current.cold === "自建冷鏈"
          ? 350000
          : current.cold === "租用冷鏈"
            ? 48000 * current.area
            : 0;
      const coldLoss =
        current.cold === "自建冷鏈"
          ? 0.02
          : current.cold === "租用冷鏈"
            ? 0.04
            : 0.12;
      const channelMultiplier =
        current.channel === "日本精品外銷"
          ? 1.55
          : current.channel === "網路品牌直售"
            ? 1.3
            : 1;
      const logistics =
        current.channel === "日本精品外銷"
          ? 150000 * current.area
          : current.channel === "網路品牌直售"
            ? 45000 * current.area
            : 18000 * current.area;
      const saleableRate = 1 - coldLoss;
      const revenue =
        (current.a * 55 + current.b * 32 + current.process * 14) *
        saleableRate *
        channelMultiplier;

      return {
        ...current,
        stage: "result",
        revenue,
        cash: current.cash - coldCost - logistics + revenue,
        cost: current.cost + coldCost + logistics,
        brand: current.brand + (current.channel === "日本精品外銷" ? 8 : 3),
        note: "本季經營結算完成",
      };
    });
  };

  const reset = () => {
    if (confirm("確定要開始新的農場嗎？目前進度會清除。")) {
      localStorage.removeItem(STORAGE_KEY);
      setG(initial);
      setModal(null);
      setCheer("");
    }
  };

  if (!ready) return null;

  if (g.stage === "login") {
    return (
      <main className="landing">
        <div className="cloud c1">☁️</div>
        <div className="cloud c2">☁️</div>
        <section className="loginPlate">
          <div className="brand">
            <span className="sprout">🌱</span>
            <div>
              <small>AI 農業推演式學習</small>
              <h1>
                AIAKOS
                <br />
                <b>農場宇宙</b>
              </h1>
              <em>FARMVERSE</em>
            </div>
          </div>
          <div className="welcome">
            <span>👩‍🌾</span>
            <div>
              <b>歡迎，未來農場主！</b>
              <p>每一個選擇，都會改變你的收成。</p>
            </div>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!g.nickname.trim()) return;
              setG((current) => ({
                ...current,
                stage: "setup",
                farmName: current.farmName || `${current.nickname}的希望農場`,
              }));
            }}
          >
            <label>
              你的暱稱
              <input
                value={g.nickname}
                onChange={(event) =>
                  setG((current) => ({ ...current, nickname: event.target.value }))
                }
                placeholder="例如：阿澤老師"
                required
              />
            </label>
            <label>
              農場名稱（可選填）
              <input
                value={g.farmName}
                onChange={(event) =>
                  setG((current) => ({ ...current, farmName: event.target.value }))
                }
                placeholder="我的希望農場"
              />
            </label>
            <label>
              課堂代碼（可選填）
              <input
                value={g.classCode}
                onChange={(event) =>
                  setG((current) => ({ ...current, classCode: event.target.value }))
                }
                placeholder="例如：AGRI01"
              />
            </label>
            <button className="primary">
              建立我的農場 <span>➜</span>
            </button>
          </form>
          <p className="save">✓ 進度自動儲存在這部裝置</p>
        </section>
        <div className="land">🌾　🌻　🐄　🌳　🚜　🌾</div>
      </main>
    );
  }

  if (g.stage === "setup") {
    return (
      <main className="setup">
        <header className="miniHead">
          <div>
            🌱 <b>AIAKOS 農場宇宙</b>
            <small> FARMVERSE</small>
          </div>
          <span>農場主：{g.nickname}</span>
        </header>
        <section className="selectBox">
          <p className="eyebrow">STEP 1 / 2　選擇本季作物</p>
          <h2>你想種什麼？</h2>
          <div className="crops">
            <button className="crop active">
              <i>🍅</i>
              <b>番茄</b>
              <small>高投入・高管理・高報酬</small>
              <span>本版可玩</span>
            </button>
            {[
              ["🌾", "水稻"],
              ["🥬", "高麗菜"],
              ["🍌", "香蕉"],
              ["🍍", "鳳梨"],
              ["🥭", "芒果"],
            ].map((crop) => (
              <button className="crop locked" key={crop[1]}>
                <i>{crop[0]}</i>
                <b>{crop[1]}</b>
                <small>即將開放</small>
              </button>
            ))}
          </div>
          <p className="eyebrow areaTitle">STEP 2 / 2　決定種植面積</p>
          <div className="areas">
            {[0.5, 1, 2, 3].map((area) => (
              <button
                className={g.area === area ? "active" : ""}
                onClick={() => setG((current) => ({ ...current, area }))}
                key={area}
              >
                <b>{area}</b> 公頃
                <small>
                  預估種植成本
                  <br />
                  NT$ {money(120000 * area)}
                </small>
              </button>
            ))}
          </div>
          <div className="setupBottom">
            <p>
              💰 起始資金 <b>NT$ 1,000,000</b>
              <br />
              <small>面積越大，潛在收穫與風險也越高。</small>
            </p>
            <button
              className="primary"
              onClick={() =>
                setG((current) => ({
                  ...current,
                  stage: "grow",
                  cash: current.cash - 120000 * current.area,
                  cost: current.cost + 120000 * current.area,
                  note: "番茄完成播種，開始照顧吧！",
                }))
              }
            >
              開始種植 🍅 ➜
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game">
      <header className="gameHead">
        <div className="gameLogo">
          🌱 <b>AIAKOS 農場宇宙</b>
          <small> FARMVERSE</small>
        </div>
        <div className="season">
          ☀️ 本季　<span>第 {Math.min(g.week, 5)} 週</span>
        </div>
        <button className="sound" aria-label="音效">
          🔊
        </button>
      </header>
      <div className="metrics">
        <span>
          💰 現金 <b>NT$ {money(g.cash)}</b>
        </span>
        <span>
          📈 營收 <b>{money(g.revenue)}</b>
        </span>
        <span>
          📉 成本 <b>{money(g.cost)}</b>
        </span>
        <span>
          ⭐ 品牌 <b>{g.brand}</b>
        </span>
        <span>
          🌱 永續 <b>{g.green}</b>
        </span>
        <span>
          🛡️ 風險 <b>{g.risk}</b>
        </span>
      </div>
      <div className="board">
        <aside className="profile plate">
          <div className="plateTitle">農場檔案</div>
          <div className="avatar">👨‍🌾</div>
          <h3>{g.farmName}</h3>
          <p>{g.nickname} 農場主</p>
          <hr />
          <dl>
            <div>
              <dt>本季作物</dt>
              <dd>🍅 番茄</dd>
            </div>
            <div>
              <dt>種植面積</dt>
              <dd>{g.area} 公頃</dd>
            </div>
            <div>
              <dt>預估產量</dt>
              <dd>{money(60000 * g.area)} kg</dd>
            </div>
          </dl>
          <button onClick={reset} className="tiny">
            ↻ 重新開始
          </button>
        </aside>
        <section className="farm plate">
          <div className="scene">
            <div className="sky">☀️　☁️</div>
            <div className="hills" />
            <div className="barn">🏡</div>
            <div className={`plant p${Math.ceil(g.growth / 20)}`}>{cropStage}</div>
            <div className="rows">╱╲╱╲╱╲╱╲╱╲</div>
            <span className="sign">🍅 番茄田</span>
          </div>
          <div className="progressLabel">
            <b>生長進度</b>
            <span>{g.growth} / 100</span>
          </div>
          <div className="progress">
            <i style={{ width: `${g.growth}%` }} />
            {[20, 40, 60, 80].map((step) => (
              <b style={{ left: `${step}%` }} key={step}>
                {g.handled.includes(step) ? "✓" : ""}
              </b>
            ))}
          </div>
          {g.stage === "grow" && (
            <button className="care" disabled={Boolean(nextEvent) || cool} onClick={act}>
              🌱 照顧農場
              {float > 0 && <span key={float}>+1</span>}
              <small>{nextEvent ? "請先完成本週事件" : "點一下，讓作物向前生長"}</small>
            </button>
          )}
          {g.stage !== "grow" && g.stage !== "result" && (
            <button
              className="care processBtn"
              disabled={processDisabled}
              onClick={() => {
                if (g.stage === "workers") hire();
                if (g.stage === "quality") grade();
                if (g.stage === "sales") finish();
              }}
            >
              {g.stage === "workers"
                ? "👷 確認採收人力"
                : g.stage === "quality"
                  ? "🎡 轉動品質輪盤"
                  : g.stage === "cold"
                    ? "請在右側選擇冷鏈"
                    : g.stage === "sales"
                      ? "💰 完成銷售與結算"
                      : "繼續"}
            </button>
          )}
          {g.stage === "result" && (
            <div className="result">
              <span>本季淨利</span>
              <strong className={profit >= 0 ? "plus" : "minus"}>
                NT$ {money(profit)}
              </strong>
              <small>
                實際採收 {money(g.harvest)} kg・A 級品 {money(g.a)} kg
              </small>
              <button onClick={reset}>再挑戰一次</button>
            </div>
          )}
        </section>
        <aside className="mission plate">
          <div className="tabs">
            {["任務", "日誌", "決策"].map((item) => (
              <button
                onClick={() => setTab(item)}
                className={tab === item ? "active" : ""}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "任務" && (
            <>
              <p className="week">WEEK {Math.min(g.week, 5)}</p>
              <h3>
                {g.stage === "grow"
                  ? nextEvent
                    ? `${nextEvent.icon} ${nextEvent.title}`
                    : "🌱 照顧番茄田"
                  : g.stage === "workers"
                    ? "👷 安排採收"
                    : g.stage === "quality"
                      ? "🎡 品質分級"
                      : g.stage === "cold"
                        ? "❄️ 冷鏈決策"
                        : g.stage === "sales"
                          ? "🛒 銷售通路"
                          : "🏆 本季完成"}
              </h3>
              <p>{g.note}</p>
              {nextEvent && (
                <button
                  className="eventBtn"
                  onClick={() => {
                    if (nextEvent.at === 60) spinDisaster();
                    else if (nextEvent.at === 100) completeHarvestEvent();
                    else setModal(nextEvent);
                  }}
                >
                  處理本週事件 ➜
                </button>
              )}
              {g.stage === "workers" && (
                <div className="choiceStack">
                  <label>
                    採收工人：<b>{g.workers} 人</b>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={g.workers}
                    onChange={(event) =>
                      setG((current) => ({
                        ...current,
                        workers: Number(event.target.value),
                      }))
                    }
                  />
                  <small>4 天工資：NT$ {money(g.workers * 1200 * 4)}</small>
                </div>
              )}
              {g.stage === "cold" && (
                <div className="choiceStack">
                  {coldOptions.map((option) => (
                    <button
                      className={g.cold === option[0] ? "selected" : ""}
                      onClick={() =>
                        setG((current) => ({ ...current, cold: option[0] }))
                      }
                      key={option[0]}
                    >
                      <b>{option[0]}</b>
                      <small>{option[1]}</small>
                    </button>
                  ))}
                  <button
                    className="eventBtn"
                    disabled={!g.cold}
                    onClick={() =>
                      setG((current) => ({
                        ...current,
                        stage: "sales",
                        note: `已選擇${current.cold}，請決定銷售通路`,
                      }))
                    }
                  >
                    確認冷鏈決策 ➜
                  </button>
                </div>
              )}
              {g.stage === "sales" && (
                <div className="choiceStack">
                  {channelOptions.map((option) => (
                    <button
                      className={g.channel === option[0] ? "selected" : ""}
                      onClick={() =>
                        setG((current) => ({ ...current, channel: option[0] }))
                      }
                      key={option[0]}
                    >
                      <b>{option[0]}</b>
                      <small>{option[1]}</small>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {tab === "日誌" && (
            <div className="journal">
              <b>最新農場紀錄</b>
              <p>
                第 {g.week} 週｜{g.note}
              </p>
              <p>累積照顧 {g.clicks} 次</p>
              <p>完成事件 {g.handled.length} 項</p>
            </div>
          )}
          {tab === "決策" && (
            <div className="journal">
              <b>經營表現</b>
              <p>管理係數 {g.management.toFixed(2)}</p>
              <p>災害損失 {(g.loss * 100).toFixed(0)}%</p>
              <p>目前淨利 NT$ {money(profit)}</p>
            </div>
          )}
          <div className="encourage">
            <small>農場鼓勵站</small>
            <strong>{cheer || "每一次照顧，都是收成的開始！"}</strong>
            <span>🐥</span>
          </div>
        </aside>
      </div>
      <nav className="dock">
        {[
          ["📒", "日誌"],
          ["💼", "成本"],
          ["👷", "工人"],
          ["❄️", "冷鏈"],
          ["🌍", "外銷"],
          ["🎡", "輪盤"],
        ].map((item) => (
          <button
            onClick={() => setTab(item[1] === "日誌" ? "日誌" : "決策")}
            key={item[1]}
          >
            <i>{item[0]}</i>
            {item[1]}
          </button>
        ))}
      </nav>
      {modal && (
        <div className="overlay">
          <div className="modal">
            <button className="close" onClick={() => setModal(null)}>
              ×
            </button>
            {"kind" in modal ? (
              <>
                <div className="wheel">🎡</div>
                <p className="eyebrow">災害輪盤結果</p>
                <h2>{modal.title}</h2>
                <p>{modal.text}</p>
                <button className="primary" onClick={() => setModal(null)}>
                  接受結果，繼續經營
                </button>
              </>
            ) : (
              <>
                <span className="modalIcon">{modal.icon}</span>
                <p className="eyebrow">第 {g.week} 週農事決策</p>
                <h2>{modal.title}</h2>
                <p>{modal.text}</p>
                <div className="modalChoices">
                  {hasEventModal(modal) &&
                    modal.choices.map((choice) => (
                      <button
                        onClick={() => choose(choice, modal.at)}
                        key={choice[0]}
                      >
                        <b>{choice[0]}</b>
                        <span>{choice[1]}</span>
                        <small>成本 NT$ {money(choice[2] * g.area)}</small>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
