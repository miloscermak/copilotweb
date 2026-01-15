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
  const grouped = new Map();
  for (const ch of list){
    const sec = ch.section || "Kapitoly";
    if (!grouped.has(sec)) grouped.set(sec, []);
    grouped.get(sec).push(ch);
  }
  for (const [sec, items] of grouped){
    const secEl = document.createElement("div");
    secEl.className = "section"; secEl.textContent = sec;
    nav.appendChild(secEl);
    for (const ch of items){
      const a = document.createElement("a");
      a.href = `#/${ch.slug}`;
      a.dataset.slug = ch.slug;
      a.innerHTML = `<div><span class="knum">${escapeHtml(ch.number)}</span><span class="ktitle">${escapeHtml(ch.title)}</span></div>
        ${ch.description ? `<div class="kdesc">${escapeHtml(ch.description)}</div>` : ""}`;
      nav.appendChild(a);
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
    article.innerHTML = `<h1>Copilot • Cvičební příručka</h1>
      <p class="kicker">Vyber kapitolu vlevo. (Na mobilu otevři přes odkaz #/slug.)</p>
      <div class="callout"><strong>Tip:</strong> Začni kapitolou „Rychlý start: 12 promptů“ a ulož si 3 prompty do AI kufříku.</div>`;
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

  window.addEventListener("hashchange", onRoute);
  onRoute();
}
init().catch((e) => {
  console.error("Init error:", e);
  $("article").innerHTML = "<h1>Chyba</h1><p>Nepodařilo se načíst chapters.json. Spusť stránku přes lokální server (ne file://).</p>";
});
