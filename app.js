const TRACKS = [
  { name: "Mt.Otsuki", image: "assets/mt-otsuki.webp", events: [
    { name: "Otsuki Death Trial", image: "assets/mt-otsuki-death-trial.webp" },
    { name: "Uphill Battle", image: "assets/mt-otsuki-uphill.webp" },
    { name: "Downhill Battle", image: "assets/mt-otsuki-downhill.webp" }
  ]},
  { name: "Ichikawa", image: "assets/ichikawa.webp", events: [
    { name: "Goliath's Marathon", image: "assets/ichikawa-goliaths-marathon.webp" },
    { name: "Ichikawa Taikyu Stage", image: "assets/ichikawa-taikyu-stage.webp" }
  ]},
  { name: "Shuto Expressway", image: "assets/shuto-expressway.webp", events: [
    { name: "Clockwise Loop", image: "assets/shuto-clockwise-loop.webp" },
    { name: "Counter Clockwise Loop", image: "assets/shuto-counter-clockwise-loop.webp" }
  ]},
  { name: "Tokyo Bay Area", image: "assets/tokyo-bay-area.webp", events: [
    { name: "Fujigawa Cannon Run", image: "assets/tokyo-bay-fujigawa-cannon-run.webp" },
    { name: "Midnight Marathon", image: "assets/tokyo-bay-midnight-marathon.webp" }
  ]},
  { name: "Tsukuba Circuit", image: "assets/tsukuba-circuit.webp", events: [
    { name: "Laptime", image: "assets/tsukuba-laptime.webp" }
  ]},
  { name: "Shirosato Racing Center", image: "assets/shirosato-racing-center.webp", events: [
    { name: "Shirosato Trial", image: "assets/shirosato-trial.webp" },
    { name: "Shirosato touge uphill", image: "assets/shirosato-touge-uphill.webp" },
    { name: "Shirosato touge downhill", image: "assets/shirosato-touge-downhill.webp" }
  ]}
];

const CLASSES = ["T1", "T2", "T3", "T4"];
let records = [];
let currentTrack = null;
let currentEvent = null;
let currentClass = "T1";
let selectedTrackIndex = 0;

const $ = id => document.getElementById(id);
const views = { home: $("homeView"), events: $("eventsView"), leaderboard: $("leaderboardView"), error: $("errorView") };

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));
}

function parseCSV(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let i=0; i<text.length; i++) {
    const ch=text[i], next=text[i+1];
    if (ch==='"' && quoted && next==='"') { cell+='"'; i++; }
    else if (ch==='"') quoted=!quoted;
    else if (ch===',' && !quoted) { row.push(cell); cell=""; }
    else if ((ch==='\n'||ch==='\r') && !quoted) {
      if (ch==='\r' && next==='\n') i++;
      row.push(cell); cell=""; if(row.some(v=>v.trim()!=="")) rows.push(row); row=[];
    } else cell+=ch;
  }
  if(cell.length||row.length){row.push(cell);if(row.some(v=>v.trim()!==""))rows.push(row);}
  if(!rows.length)return[];
  const headers=rows[0].map(h=>h.trim().toLowerCase());
  return rows.slice(1).map(vals=>{const o={};headers.forEach((h,i)=>o[h]=(vals[i]??"").trim());return o;})
    .filter(r=>r.track||r.event||r.player||r.time);
}

function timeToMs(value) {
  const raw=String(value||"").trim().toUpperCase();
  if(!raw||["DNF","DSQ","DNS","N/A"].includes(raw))return Infinity;
  const p=raw.split(":").map(Number); if(p.some(Number.isNaN))return Infinity;
  if(p.length===2)return p[0]*60000+p[1]*1000;
  if(p.length===1)return p[0]*1000;
  if(p.length===3)return p[0]*3600000+p[1]*60000+p[2]*1000;
  return Infinity;
}

function showView(name){Object.values(views).forEach(v=>v.classList.add("hidden"));views[name].classList.remove("hidden");window.scrollTo({top:0,behavior:"smooth"});}

function localFlash(el){
  if(!el)return;
  el.classList.remove("is-selecting"); void el.offsetWidth; el.classList.add("is-selecting");
  setTimeout(()=>el.classList.remove("is-selecting"),520);
}

function setHash(track,event,cls){
  const p=new URLSearchParams(); if(track)p.set("track",track); if(event)p.set("event",event); if(cls)p.set("class",cls);
  location.hash=p.toString();
}
function getTrack(name){return TRACKS.find(t=>t.name===name);}
function getEvent(track,event){return getTrack(track)?.events.find(e=>e.name===event);}

function renderHome(){
  const grid=$("trackGrid");
  grid.innerHTML=`<button class="carousel-arrow left" id="trackPrev" aria-label="上一個賽道">‹</button>`+
    `<div class="track-viewport"><div class="track-row">`+
    TRACKS.map((t,i)=>`<button class="track-card ${i===selectedTrackIndex?'selected':''}" data-index="${i}" type="button" aria-label="${escapeHtml(t.name)}">
      <img src="${t.image}" alt="${escapeHtml(t.name)}">
      <div class="card-shade"></div><div class="card-scan"></div>
      <div class="track-number">0${i+1}</div>
      <div class="track-name">${escapeHtml(t.name)}</div>
      <div class="track-events-count">${t.events.length} EVENT${t.events.length===1?'':'S'}</div>
      <div class="select-mark">▶</div>
    </button>`).join("")+
    `</div></div><button class="carousel-arrow right" id="trackNext" aria-label="下一個賽道">›</button>`;

  $("trackPrev").onclick=()=>moveTrack(-1);
  $("trackNext").onclick=()=>moveTrack(1);
  grid.querySelectorAll(".track-card").forEach(card=>{
    card.onclick=()=>{
      const idx=Number(card.dataset.index);
      if(idx!==selectedTrackIndex){selectedTrackIndex=idx;updateTrackSelection();localFlash(card);return;}
      localFlash(card);
      setTimeout(()=>setHash(TRACKS[idx].name),250);
    };
  });
  updateTrackSelection();
}

function moveTrack(delta){
  selectedTrackIndex=(selectedTrackIndex+delta+TRACKS.length)%TRACKS.length;
  updateTrackSelection(true);
}
function updateTrackSelection(animate=false){
  const viewport=document.querySelector(".track-viewport");
  const row=viewport?.querySelector(".track-row");
  const cards=[...document.querySelectorAll(".track-card")];
  cards.forEach((c,i)=>c.classList.toggle("selected",i===selectedTrackIndex));
  const selected=cards[selectedTrackIndex];

  if(selected && viewport && row){
    // 左右補上「半個可視區域」的空間，讓第一個與最後一個項目也能真正滑到正中央。
    // 原本單純使用 scrollIntoView({inline:"center"}) 時，兩端會受到 scrollLeft 邊界限制。
    const sidePad=Math.max(0,(viewport.clientWidth-selected.offsetWidth)/2);
    row.style.paddingLeft=`${sidePad}px`;
    row.style.paddingRight=`${sidePad}px`;

    // 用「實際畫面上的中心點」校正，而不是只靠 offsetLeft。
    // 這會把卡片的視覺中心精準對到 viewport 的幾何中心，
    // 也能正確處理 selected 的 scale(1.08) 以及左右 padding。
    const alignSelectedToCenter = () => {
      const viewportRect = viewport.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;
      const selectedCenter = selectedRect.left + selectedRect.width / 2;
      const correction = selectedCenter - viewportCenter;

      viewport.scrollTo({
        left: viewport.scrollLeft + correction,
        behavior: animate ? "smooth" : "auto"
      });
    };

    // 等瀏覽器完成 selected scale / layout 後再量測，避免 1~2px 的視覺偏差。
    requestAnimationFrame(alignSelectedToCenter);

    if(animate)localFlash(selected);
  }

  const t=TRACKS[selectedTrackIndex];
  const selectedName = $("selectedTrackName");
  const selectedMeta = $("selectedTrackMeta");
  if (selectedName) selectedName.textContent = t.name;
  if (selectedMeta) selectedMeta.textContent = `${t.events.length} EVENTS  //  SELECTED COURSE`;
  $("homeBackdrop").style.backgroundImage=`url("${t.image}")`;
}

function renderEvents(trackName){
  const track=getTrack(trackName); if(!track)return showHome();
  currentTrack=trackName;
  $("eventsBackdrop").style.backgroundImage=`url("${track.image}")`;
  $("eventsTitle").textContent=track.name;
  $("eventsCount").textContent=`${track.events.length} EVENTS`;
  $("eventGrid").innerHTML=track.events.map((e,i)=>`<button class="event-option" type="button" data-event="${escapeHtml(e.name)}">
    <img class="event-option-image" src="${e.image}" alt="${escapeHtml(e.name)}">
    <span class="event-option-shade"></span>
    <span class="event-index">0${i+1}</span>
    <span class="event-name">${escapeHtml(e.name)}</span>
    <span class="event-arrow">▶</span>
  </button>`).join("");
  $("eventGrid").querySelectorAll(".event-option").forEach(btn=>btn.onclick=()=>{
    localFlash(btn); setTimeout(()=>setHash(track.name,btn.dataset.event,"T1"),260);
  });
  showView("events");
}

function renderClassButtons(){
  $("classSwitcher").innerHTML=CLASSES.map(c=>`<button class="class-btn ${c===currentClass?'active':''}" type="button" data-class="${c}">${c}</button>`).join("");
  $("classSwitcher").querySelectorAll(".class-btn").forEach(btn=>btn.onclick=()=>{
    localFlash(btn); setTimeout(()=>{currentClass=btn.dataset.class;setHash(currentTrack,currentEvent,currentClass);},180);
  });
}

function renderLeaderboard(trackName,eventName,cls){
  const track=getTrack(trackName), event=getEvent(trackName,eventName); if(!track||!event)return showHome();
  currentTrack=trackName; currentEvent=eventName; currentClass=CLASSES.includes(cls)?cls:"T1";
  $("leaderboardBackdrop").style.backgroundImage=`url("${track.image}")`;
  $("leaderboardTitle").textContent=event.name;
  $("leaderboardMeta").textContent=`${track.name}  //  ${currentClass}`;
  renderClassButtons();
  const filtered=records.filter(r=>r.track===trackName&&r.event===eventName&&r.class===currentClass).sort((a,b)=>timeToMs(a.time)-timeToMs(b.time));
  $("leaderboardBody").innerHTML=filtered.map((r,i)=>`<tr><td class="rank ${i<3?'top':''}">${String(i+1).padStart(2,'0')}</td><td class="driver">${escapeHtml(r.player||'Unknown')}</td><td class="car">${escapeHtml(r.car||'—')}</td><td class="time">${escapeHtml(r.time||'—')}</td><td class="date">${escapeHtml(r.date||'—')}</td></tr>`).join("");
  $("emptyState").classList.toggle("hidden",filtered.length!==0);
  $("leaderboardTableWrap").classList.toggle("hidden",filtered.length===0);
  showView("leaderboard");
}

function showHome(){currentTrack=null;currentEvent=null;currentClass="T1";if(location.hash)history.replaceState(null,"",location.pathname+location.search);showView("home");}
function route(){
  const p=new URLSearchParams(location.hash.replace(/^#/,"")); const track=p.get("track"),event=p.get("event"),cls=p.get("class")||"T1";
  if(!track)return showView("home"); if(!event)return renderEvents(track); return renderLeaderboard(track,event,cls);
}

async function loadCSV(){
  try{const res=await fetch(`leaderboard.csv?v=${Date.now()}`,{cache:"no-store"});if(!res.ok)throw new Error();records=parseCSV(await res.text());route();}
  catch(e){$("errorText").textContent="無法讀取 leaderboard.csv。請確認 CSV 與 index.html 位於同一層，並透過 GitHub Pages 開啟。";showView("error");}
}

$("globalHomeBtn").onclick=()=>{ showHome(); };
$("brandHome")?.addEventListener("click", showHome);
$("refreshBtn").onclick=loadCSV;
$("backHomeBtn").onclick=()=>showHome();
$("backEventsBtn").onclick=()=>setHash(currentTrack);
$("errorRetryBtn").onclick=loadCSV;
window.addEventListener("hashchange",route);
window.addEventListener("resize",()=>updateTrackSelection(false));

renderHome();
loadCSV();
