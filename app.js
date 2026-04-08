const state = { chapters: [], order: [] };
function $(id){ return document.getElementById(id); }
function escapeHtml(str){ return (str||"").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c])); }
function getSlug(){ return (location.hash||"").replace(/^#\/?/, "") || null; }

// Sanitizace HTML - odstraní nebezpečné tagy a atributy
function sanitizeHtml(html){
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  // Odstranění nebezpečných elementů
  doc.querySelectorAll("script,iframe,object,embed,form,input,button,style,link,meta,base").forEach(el => el.remove());
  // Odstranění event handlerů a nebezpečných atributů
  doc.querySelectorAll("*").forEach(el => {
    for (const attr of [...el.attributes]){
      if (attr.name.startsWith("on") || attr.name === "href" && attr.value.trim().toLowerCase().startsWith("javascript:"))
        el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
}

function renderNav(list){
  const nav = $("nav"); nav.innerHTML = "";
  // Dvouúrovňové seskupení: group → section → kapitoly
  const groups = new Map();
  for (const ch of list){
    const g = ch.group || "Kapitoly";
    const s = ch.section || "";
    if (!groups.has(g)) groups.set(g, new Map());
    const secMap = groups.get(g);
    if (!secMap.has(s)) secMap.set(s, []);
    secMap.get(s).push(ch);
  }
  for (const [gName, secMap] of groups){
    const gEl = document.createElement("div");
    gEl.className = "group"; gEl.textContent = gName;
    nav.appendChild(gEl);
    for (const [sName, items] of secMap){
      if (sName){
        const secEl = document.createElement("div");
        secEl.className = "section"; secEl.textContent = sName;
        nav.appendChild(secEl);
      }
      for (const ch of items){
        const a = document.createElement("a");
        a.href = `#/${ch.slug}`;
        a.dataset.slug = ch.slug;
        a.innerHTML = `<div><span class="knum">${escapeHtml(ch.number)}</span><span class="ktitle">${escapeHtml(ch.title)}</span></div>
          ${ch.description ? `<div class="kdesc">${escapeHtml(ch.description)}</div>` : ""}`;
        nav.appendChild(a);
      }
    }
  }
  highlight();
}

function highlight(){
  const slug = getSlug();
  document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("active", a.dataset.slug === slug));
}

function findChapter(slug){ return state.chapters.find(c => c.slug === slug) || null; }

function enhanceCodeBlocks(){
  document.querySelectorAll(".article pre").forEach(pre => {
    if (pre.dataset.enhanced) return;
    pre.dataset.enhanced = "1";
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.style.float = "right";
    btn.style.margin = "6px 0 0 6px";
    btn.textContent = "Kopírovat";
    btn.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(pre.innerText);
        const old = btn.textContent; btn.textContent = "Zkopírováno";
        setTimeout(()=>btn.textContent=old, 1200);
      }catch(e){ console.error("Clipboard error:", e); alert("Nepodařilo se zkopírovat. Označ text ručně."); }
    });
    pre.insertAdjacentElement("beforebegin", btn);
  });
}

function updatePrevNext(slug){
  const idx = state.order.indexOf(slug);
  const prevSlug = idx > 0 ? state.order[idx-1] : null;
  const nextSlug = idx >= 0 && idx < state.order.length-1 ? state.order[idx+1] : null;

  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");

  prevBtn.disabled = !prevSlug;
  nextBtn.disabled = !nextSlug;

  prevBtn.onclick = () => { if (prevSlug) location.hash = `#/${prevSlug}`; };
  nextBtn.onclick = () => { if (nextSlug) location.hash = `#/${nextSlug}`; };
}

function render(ch){
  const article = $("article");
  if (!ch){
    $("breadcrumbs").textContent = "Domů";
    article.innerHTML = `<h1>Microsoft 365 Copilot – Příručka pro zaměstnance E.ON</h1>
      <p class="kicker">Dvě knihy v jedné. Vlevo si vyber, kam jít.</p>
      <div class="callout"><strong>📖 Referenční příručka</strong> — Rychle zjistíš, co Copilot umí ve Wordu, Excelu, PowerPointu, Outlooku, Teams a jak fungují agenti (Researcher, Analyst). Dobré pro <em>„jak to udělat tam a tam"</em>.</div>
      <div class="callout"><strong>🎓 Naučit se používat</strong> — Cvičební materiál: jak dobře promptovat (metoda 5K), 12 základních promptů, cvičení, 7denní plán a knihovna šablon. Dobré pro <em>„chci se v tom zlepšit"</em>.</div>
      <p class="kicker" style="margin-top:24px">Většina zaměstnanců E.ON má dnes základní Copilot Chat. Pokročilé funkce (Researcher, plný M365 Copilot) jsou na vyžádání — u každé kapitoly uvidíš, co ke které funkci potřebuješ.</p>`;
    $("prevBtn").disabled = true;
    $("nextBtn").disabled = true;
    return;
  }
  $("breadcrumbs").textContent = `${ch.number} · ${ch.title}`;
  article.innerHTML = sanitizeHtml(ch.html) || "<p>Obsah chybí.</p>";
  enhanceCodeBlocks();
  highlight();
  updatePrevNext(ch.slug);
}

function normalize(s){ return (s||"").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, ""); }
function applySearch(q){
  q = normalize((q||"").trim());
  if (!q){ renderNav(state.chapters); return; }
  const filtered = state.chapters.filter(ch => normalize(`${ch.number} ${ch.title} ${ch.description||""} ${ch.plain||""}`).includes(q));
  renderNav(filtered.length ? filtered : state.chapters);
}

function onRoute(){
  const slug = getSlug();
  render(slug ? findChapter(slug) : null);
}

async function init(){
  const res = await fetch("chapters.json", {cache:"no-store"});
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const data = await res.json();
  state.chapters = data.chapters || [];
  state.order = (data.order && data.order.length) ? data.order : state.chapters.map(c => c.slug);
  renderNav(state.chapters);

  $("searchInput").addEventListener("input", e => applySearch(e.target.value));
  $("copyLinkBtn").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(location.href);
      const b = $("copyLinkBtn"); const o = b.textContent; b.textContent = "Zkopírováno";
      setTimeout(()=>b.textContent=o, 1200);
    }catch(e){ console.error("Clipboard error:", e); alert("Nepodařilo se zkopírovat odkaz."); }
  });
  $("printBtn").addEventListener("click", () => window.print());
  $("menuToggle").addEventListener("click", () => {
    $("sidebar").classList.toggle("open");
    $("menuToggle").textContent = $("sidebar").classList.contains("open") ? "Zavřít" : "Menu";
  });

  window.addEventListener("hashchange", onRoute);
  onRoute();
}
init().catch((e) => {
  console.error("Init error:", e);
  $("article").innerHTML = "<h1>Chyba</h1><p>Nepodařilo se načíst chapters.json. Spusť stránku přes lokální server (ne file://).</p>";
});
