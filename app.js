const $ = (sel)=>document.querySelector(sel);
const listEl = $("#list");
const searchEl = $("#search");
const filterStateEl = $("#filter-state");
const filterTypeEl = $("#filter-type");
const btnRefresh = $("#btn-refresh");
const dlg = $("#settings");
const btnSettings = $("#btn-settings");
const registryUrlInput = $("#registry-url");
const lastCheckEl = $("#last-check");

const STORE = "rd.registry.v1";
const SETTINGS = "rd.settings.v1";
const CORE_REGISTRY_URL = null; // optional hardcoded override

let registry = null;
let settings = loadSettings();

function loadSettings(){
  try { return JSON.parse(localStorage.getItem(SETTINGS)) || {}; }
  catch(e){ return {}; }
}
function saveSettings(){ localStorage.setItem(SETTINGS, JSON.stringify(settings)); }

async function loadLocalRegistry(){
  const res = await fetch("content/registry.json", {cache:"no-cache"});
  return res.json();
}

async function loadRemoteRegistry(url){
  const res = await fetch(url, {cache:"no-cache"});
  if(!res.ok) throw new Error("Registry nicht erreichbar");
  return res.json();
}

function saveRegistry(data){
  registry = data;
  localStorage.setItem(STORE, JSON.stringify(data));
}

function loadSavedRegistry(){
  try { return JSON.parse(localStorage.getItem(STORE)) || null; }
  catch(e){ return null; }
}

function uniqStates(items){
  return [...new Set(items.map(x=>x.state).filter(Boolean))].sort();
}

function render(){
  const q = (searchEl.value||"").toLowerCase().trim();
  const fs = filterStateEl.value;
  const ft = filterTypeEl.value;
  const items = registry?.sources || [];

  const filtered = items.filter(x => {
    const okS = !fs || x.state === fs;
    const okT = !ft || x.type === ft;
    const okQ = !q || (x.title + " " + x.publisher).toLowerCase().includes(q);
    return okS && okT && okQ;
  }).sort((a,b) => (b.updated||"").localeCompare(a.updated||""));

  listEl.innerHTML = "";
  if(filtered.length === 0){
    const div = document.createElement("div");
    div.className = "card";
    div.textContent = "Keine Treffer.";
    listEl.appendChild(div);
    return;
  }

  for(const it of filtered){
    const li = document.createElement("li");
    li.className = "card";
    const hd = document.createElement("header");
    const h2 = document.createElement("h2"); h2.textContent = it.title;
    const right = document.createElement("div"); right.className = "row";
    const updated = document.createElement("small"); updated.className = "dim"; updated.textContent = it.updated ? ("Stand: " + it.updated) : "";
    const btnOpen = document.createElement("a"); btnOpen.href = it.url; btnOpen.target = "_blank"; btnOpen.rel = "noopener"; btnOpen.textContent = "Öffnen"; btnOpen.className = "btn";
    const btnOffline = document.createElement("button"); btnOffline.className = "iconbtn"; btnOffline.textContent = it.offline ? "Offline gespeichert ✓" : "Für offline speichern";
    btnOffline.addEventListener("click", ()=> toggleOffline(it, btnOffline));

    right.append(updated, btnOpen, btnOffline);
    hd.append(h2, right);

    const tags = document.createElement("div"); tags.className = "tags";
    for(const t of [it.state, it.type, it.publisher].filter(Boolean)){
      const span = document.createElement("span"); span.className = "tag"; span.textContent = t;
      tags.append(span);
    }

    const p = document.createElement("p"); p.className="dim"; p.textContent = it.notes || "";

    li.append(hd, tags, p);
    listEl.append(li);
  }
}

async function toggleOffline(item, btn){
  if(!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const action = item.offline ? "uncache" : "cache";
  const {success} = await reg.active.postMessage({action, url: item.url});
  // The above postMessage doesn't return a promise; implement via messagechannel:
}

navigator.serviceWorker?.addEventListener("message", (event)=>{
  const msg = event.data || {};
  if(msg.type === "cache-status"){
    const {url, cached} = msg;
    const it = registry.sources.find(s => s.url === url);
    if(it){ it.offline = !!cached; saveRegistry(registry); render(); }
  }
  if(msg.type === "last-check"){
    lastCheckEl.textContent = msg.when || "–";
  }
});

function statesToSelect(){
  const list = uniqStates(registry.sources);
  filterStateEl.innerHTML = '<option value="">Alle Bundesländer</option>' + list.map(s=>`<option value="${s}">${s}</option>`).join("");
}

async function bootstrap(){
  // load saved first for fast startup
  registry = loadSavedRegistry();
  if(!registry){
    registry = await loadLocalRegistry();
    saveRegistry(registry);
  }
  statesToSelect();
  render();

  // check for remote registry update if configured
  const url = CORE_REGISTRY_URL || settings.registryUrl;
  if(url){
    try{
      const remote = await loadRemoteRegistry(url);
      if(remote.version && (!registry.version || remote.version > registry.version)){
        saveRegistry(remote);
        statesToSelect();
        render();
      }
    }catch(e){
      console.warn("Remote Registry nicht erreichbar:", e.message);
    }
  }

  // ask SW to report last check time
  if (navigator.serviceWorker?.controller){
    navigator.serviceWorker.controller.postMessage({action:"report-last-check"});
  }
}

btnRefresh.addEventListener("click", bootstrap);
searchEl.addEventListener("input", render);
filterStateEl.addEventListener("change", render);
filterTypeEl.addEventListener("change", render);

btnSettings.addEventListener("click", ()=> dlg.showModal());
$("#save-settings").addEventListener("click", (e)=>{
  e.preventDefault();
  settings.registryUrl = registryUrlInput.value.trim() || null;
  saveSettings();
  dlg.close();
  bootstrap();
});
dlg.addEventListener("close", ()=>{
  registryUrlInput.value = settings.registryUrl || "";
});

bootstrap();
