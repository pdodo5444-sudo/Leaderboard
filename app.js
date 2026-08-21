const TRACKS = [
  {
    name: "Mt.Otsuki",
    image: "assets/mt-otsuki.webp",
    events: [
      { name: "Otsuki Death Trial", image: "assets/mt-otsuki-death-trial.webp" },
      { name: "Uphill Battle", image: "assets/mt-otsuki-uphill.webp" },
      { name: "Downhill Battle", image: "assets/mt-otsuki-downhill.webp" }
    ]
  },
  {
    name: "Ichikawa",
    image: "assets/ichikawa.webp",
    events: [
      { name: "Goliath's Marathon", image: "assets/ichikawa-goliaths-marathon.webp" },
      { name: "Ichikawa Taikyu Stage", image: "assets/ichikawa-taikyu-stage.webp" }
    ]
  },
  {
    name: "Shuto Expressway",
    image: "assets/shuto-expressway.webp",
    events: [
      { name: "Clockwise Loop", image: "assets/shuto-clockwise-loop.webp" },
      { name: "Counter Clockwise Loop", image: "assets/shuto-counter-clockwise-loop.webp" }
    ]
  },
  {
    name: "Tokyo Bay Area",
    image: "assets/tokyo-bay-area.webp",
    events: [
      { name: "Fujigawa Cannon Run", image: "assets/tokyo-bay-fujigawa-cannon-run.webp" },
      { name: "Midnight Marathon", image: "assets/tokyo-bay-midnight-marathon.webp" }
    ]
  },
  {
    name: "Tsukuba Circuit",
    image: "assets/tsukuba-circuit.webp",
    events: [
      { name: "Laptime", image: "assets/tsukuba-laptime.webp" }
    ]
  },
  {
    name: "Shirosato Racing Center",
    image: "assets/shirosato-racing-center.webp",
    events: [
      { name: "Shirosato Trial", image: "assets/shirosato-trial.webp" },
      { name: "Shirosato touge uphill", image: "assets/shirosato-touge-uphill.webp" },
      { name: "Shirosato touge downhill", image: "assets/shirosato-touge-downhill.webp" }
    ]
  }
];

const CLASSES = ["T1", "T2", "T3", "T4"];
let records = [];
let currentTrack = null;
let currentEvent = null;
let currentClass = "T1";

const $ = (id) => document.getElementById(id);
const views = {
  home: $("homeView"),
  events: $("eventsView"),
  leaderboard: $("leaderboardView"),
  error: $("errorView")
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some(v => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some(v => v.trim() !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(values => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (values[i] ?? "").trim());
    return obj;
  }).filter(r => r.track || r.event || r.player || r.time);
}

function timeToMs(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw || ["DNF", "DSQ", "DNS", "N/A"].includes(raw)) return Infinity;

  const parts = raw.split(":");
  const nums = parts.map(Number);
  if (nums.some(Number.isNaN)) return Infinity;

  if (parts.length === 2) return nums[0] * 60000 + nums[1] * 1000;
  if (parts.length === 1) return nums[0] * 1000;
  if (parts.length === 3) return nums[0] * 3600000 + nums[1] * 60000 + nums[2] * 1000;
  return Infinity;
}

function showView(name) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getTrack(name) {
  return TRACKS.find(t => t.name === name);
}

function getEvent(trackName, eventName) {
  const track = getTrack(trackName);
  return track?.events.find(e => e.name === eventName);
}

function setHash(track, event, cls) {
  const params = new URLSearchParams();
  if (track) params.set("track", track);
  if (event) params.set("event", event);
  if (cls) params.set("class", cls);
  location.hash = params.toString();
}

function renderHome() {
  $("trackGrid").innerHTML = TRACKS.map(track => `
    <button class="track-card" type="button" data-track="${escapeHtml(track.name)}">
      <img class="card-image" src="${track.image}" alt="${escapeHtml(track.name)}">
      <div class="card-body">
        <span class="card-arrow">→</span>
        <h3>${escapeHtml(track.name)}</h3>
        <div class="card-meta">${track.events.length} ${track.events.length === 1 ? "event" : "events"}</div>
      </div>
    </button>
  `).join("");

  document.querySelectorAll("[data-track]").forEach(btn => {
    btn.addEventListener("click", () => setHash(btn.dataset.track));
  });
}

function renderEvents(trackName) {
  const track = getTrack(trackName);
  if (!track) return showHome();

  currentTrack = trackName;
  $("eventsTitle").textContent = track.name;
  $("eventsCount").textContent = `${track.events.length} 個賽事`;

  $("trackHero").innerHTML = `
    <img src="${track.image}" alt="${escapeHtml(track.name)}">
  `;

  $("eventGrid").innerHTML = track.events.map(event => `
    <button class="event-card" type="button"
      data-track="${escapeHtml(track.name)}"
      data-event="${escapeHtml(event.name)}">
      <img class="card-image" src="${event.image}" alt="${escapeHtml(event.name)}">
      <div class="card-body">
        <span class="card-arrow">→</span>
        <h3>${escapeHtml(event.name)}</h3>
        <div class="card-meta">查看 T1 / T2 / T3 / T4</div>
      </div>
    </button>
  `).join("");

  document.querySelectorAll("[data-event]").forEach(btn => {
    btn.addEventListener("click", () => setHash(btn.dataset.track, btn.dataset.event, "T1"));
  });

  showView("events");
}

function renderClassButtons() {
  $("classSwitcher").innerHTML = CLASSES.map(cls => `
    <button class="class-btn ${cls === currentClass ? "active" : ""}" type="button" data-class="${cls}">
      ${cls}
    </button>
  `).join("");

  document.querySelectorAll("[data-class]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentClass = btn.dataset.class;
      setHash(currentTrack, currentEvent, currentClass);
    });
  });
}

function renderLeaderboard(trackName, eventName, cls) {
  const track = getTrack(trackName);
  const event = getEvent(trackName, eventName);
  if (!track || !event) return showHome();

  currentTrack = trackName;
  currentEvent = eventName;
  currentClass = CLASSES.includes(cls) ? cls : "T1";

  $("leaderboardHero").innerHTML = `
    <img src="${event.image}" alt="${escapeHtml(event.name)}">
  `;

  $("leaderboardTitle").textContent = event.name;
  $("leaderboardMeta").textContent = `${track.name} · ${currentClass}`;

  renderClassButtons();

  const filtered = records
    .filter(r =>
      r.track === trackName &&
      r.event === eventName &&
      r.class === currentClass
    )
    .sort((a, b) => timeToMs(a.time) - timeToMs(b.time));

  $("leaderboardBody").innerHTML = filtered.map((r, i) => `
    <tr>
      <td class="rank ${i < 3 ? "top" : ""}">#${i + 1}</td>
      <td class="driver">${escapeHtml(r.player || "Unknown")}</td>
      <td class="car">${escapeHtml(r.car || "—")}</td>
      <td class="time">${escapeHtml(r.time || "—")}</td>
      <td class="date">${escapeHtml(r.date || "—")}</td>
    </tr>
  `).join("");

  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("leaderboardBody").closest(".table-wrap").classList.toggle("hidden", filtered.length === 0);

  showView("leaderboard");
}

function showHome() {
  currentTrack = null;
  currentEvent = null;
  currentClass = "T1";
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  showView("home");
}

function route() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  const track = params.get("track");
  const event = params.get("event");
  const cls = params.get("class") || "T1";

  if (!track) return showView("home");
  if (!event) return renderEvents(track);
  return renderLeaderboard(track, event, cls);
}

async function loadCSV() {
  try {
    const response = await fetch(`leaderboard.csv?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    records = parseCSV(text);
    route();
  } catch (error) {
    $("errorText").textContent =
      "無法讀取 leaderboard.csv。請確認 CSV 與 index.html 放在同一層，並透過 GitHub Pages 開啟網站。";
    showView("error");
  }
}

$("brandHome").addEventListener("click", showHome);
$("backHomeBtn").addEventListener("click", showHome);
$("backEventsBtn").addEventListener("click", () => setHash(currentTrack));
$("refreshBtn").addEventListener("click", loadCSV);
$("errorRetryBtn").addEventListener("click", loadCSV);
window.addEventListener("hashchange", route);

renderHome();
loadCSV();
