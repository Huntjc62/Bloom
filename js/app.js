const KEY = "bloom_phase1_state";

const defaultState = {
  loggedIn: false,
  user: null,
  partner: { connected: true, name: "Alex" },
  pregnancy: { dueDate: "2026-11-28" },
  sharing: { mood: true, symptoms: true, sleep: true },
  checkIns: [],
  notifications: [
    {id:1, text:"Welcome to Bloom. Your shared family space is ready.", time:"Today", icon:"🌱", read:false}
  ],
  page: "dashboard"
};

let state = load();

function load(){
  try { return {...defaultState, ...JSON.parse(localStorage.getItem(KEY))}; }
  catch(e){ return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function esc(v){ return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function dateObj(){ return new Date(); }
function formatDate(d){ return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric"}).format(d); }
function daysUntil(date){ return Math.ceil((new Date(date+"T12:00:00")-dateObj())/86400000); }
function pregnancyWeeks(due){
  const days = 280 - daysUntil(due);
  const week = Math.max(1, Math.min(40, Math.floor(days/7)+1));
  const day = Math.max(0, Math.min(6, days%7));
  return {week,day};
}
function pageTitle(){
  return {dashboard:"Today", checkin:"How are you feeling?", updates:"Shared updates", timeline:"Pregnancy timeline", settings:"Settings"}[state.page] || "Today";
}
function notify(text,icon="🔔"){
  state.notifications.unshift({id:Date.now(),text,time:"Just now",icon,read:false});
  save();
}
function toast(msg){
  const el=document.createElement("div"); el.className="toast"; el.textContent=msg;
  document.body.appendChild(el); setTimeout(()=>el.remove(),2800);
}

function render(){
  document.getElementById("app").innerHTML = state.loggedIn ? shell() : login();
  if(state.loggedIn) bindApp();
  else bindLogin();
}

function login(){
  return `<main class="login-screen">
    <section class="login-card">
      <div class="logo-large">B</div>
      <div class="eyebrow">Bloom</div>
      <h1>Pregnancy, wellbeing & family — together.</h1>
      <p class="subtitle">A shared space for mum and partner from pregnancy onwards.</p>
      <div class="divider"></div>
      <div class="form-group"><label>Your name</label><input id="loginName" placeholder="e.g. Sarah" value="Sarah"></div>
      <label>I'm using Bloom as...</label>
      <div class="role-picker">
        <button class="role selected" data-role="mum">🤰 Mum</button>
        <button class="role" data-role="partner">❤️ Partner</button>
      </div>
      <button id="loginBtn" class="btn btn-primary" style="width:100%">Enter Bloom</button>
      <p class="mini" style="margin-top:14px">Demo mode: data is stored only in this browser.</p>
    </section>
  </main>`;
}

function shell(){
  const initials=(state.user?.name||"S").slice(0,1).toUpperCase();
  return `<div class="app-shell">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">B</span> Bloom</div>
      <div class="user-pill"><span>${esc(state.user?.role==="mum"?"Mum":"Partner")}</span><span class="avatar">${initials}</span></div>
    </header>
    <div class="layout">
      <aside class="sidebar">${nav()}</aside>
      <main class="main">${content()}</main>
    </div>
    <nav class="mobile-nav">${mobileNav()}</nav>
  </div>`;
}
function nav(){
  const items=[["dashboard","⌂","Today"],["checkin","❤","Check-in"],["updates","↗","Updates"],["timeline","◷","Timeline"],["settings","⚙","Settings"]];
  return items.map(x=>`<button class="nav-btn ${state.page===x[0]?"active":""}" data-page="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join("");
}
function mobileNav(){
  const items=[["dashboard","⌂","Home"],["checkin","❤","Check-in"],["updates","↗","Updates"],["settings","⚙","Settings"]];
  return items.map(x=>`<button class="${state.page===x[0]?"active":""}" data-page="${x[0]}"><span style="font-size:20px">${x[1]}</span>${x[2]}</button>`).join("");
}

function content(){
  if(state.page==="checkin") return checkin();
  if(state.page==="updates") return updates();
  if(state.page==="timeline") return timeline();
  if(state.page==="settings") return settings();
  return dashboard();
}

function dashboard(){
  const p=pregnancyWeeks(state.pregnancy.dueDate);
  const pct=Math.round((p.week/40)*100);
  const last=state.checkIns[0];
  return `<div class="page-title"><div><h1>Good morning, ${esc(state.user.name)} 👋</h1><p class="subtitle">${formatDate(dateObj())} · ${state.partner.connected?"Connected with "+esc(state.partner.name):"Partner not connected yet"}</p></div><button class="btn btn-secondary" id="bell">🔔 ${state.notifications.filter(n=>!n.read).length}</button></div>
    <section class="card hero">
      <div class="hero-inner">
        <div><div class="eyebrow">Pregnancy</div><div class="big-week">${p.week}<span style="font-size:20px"> weeks</span></div><p class="subtitle">${p.day} days · ${daysUntil(state.pregnancy.dueDate)} days until due date</p>
        <div class="progress"><span style="width:${pct}%"></span></div><span class="mini">${pct}% of the way there · Due ${formatDate(new Date(state.pregnancy.dueDate+"T12:00:00"))}</span></div>
        <div style="font-size:80px">🤰</div>
      </div>
    </section>
    <div style="height:18px"></div>
    <div class="grid grid-2">
      <section class="card"><h2>How are you feeling?</h2><p class="subtitle">Your partner can see what you choose to share.</p>
        <div class="mood-grid" style="margin:15px 0">
          ${moodButtons()}
        </div>
        <button class="btn btn-primary" id="openCheckin">Complete check-in</button>
      </section>
      <section class="card"><h2>Partner connection</h2>
        <div class="notice success">❤️ ${esc(state.partner.name)} is connected</div>
        <div class="setting-row"><div><b>Mood updates</b><div class="mini">Share your selected mood</div></div><span>${state.sharing.mood?"✓":"—"}</span></div>
        <div class="setting-row"><div><b>Symptom updates</b><div class="mini">Share selected symptoms</div></div><span>${state.sharing.symptoms?"✓":"—"}</span></div>
        <button class="btn btn-secondary" id="manageSharing">Manage sharing</button>
      </section>
    </div>
    <div style="height:18px"></div>
    <div class="grid grid-2">
      <section class="card"><h2>Latest check-in</h2>${last?checkinSummary(last):`<div class="empty">No check-in yet today.<br><button class="btn btn-secondary" id="openCheckin2" style="margin-top:10px">Check in now</button></div>`}</section>
      <section class="card"><h2>Recent shared activity</h2>${recentUpdates()}</section>
    </div>`;
}

function moodButtons(){
  const moods=[["😊","Great"],["🙂","Good"],["😐","Okay"],["😫","Exhausted"],["😰","Anxious"],["😤","Stressed"],["😭","Emotional"],["😔","Low"]];
  return moods.map(m=>`<button class="mood-btn" data-mood="${m[1]}"><span class="emoji">${m[0]}</span><span class="label">${m[1]}</span></button>`).join("");
}
function checkin(){
  const symptoms=["Nausea","Cramping","Headache","Backache","Heartburn","Swelling","Tired","Poor sleep"];
  return `<div class="page-title"><div><h1>How are you feeling?</h1><p class="subtitle">A quick daily check-in for you and your partner.</p></div></div>
    <div class="grid grid-2">
      <section class="card"><h2>Choose your mood</h2><div class="mood-grid">${moodButtons()}</div></section>
      <section class="card"><h2>Any symptoms today?</h2><p class="mini">Select all that apply.</p><div class="symptom-grid">${symptoms.map(s=>`<button class="symptom-btn" data-symptom="${s}">${s}</button>`).join("")}</div></section>
    </div>
    <div style="height:18px"></div>
    <section class="card"><h2>Anything else?</h2><textarea id="checkNote" rows="4" style="width:100%;border:1px solid var(--border);border-radius:12px;padding:12px;resize:vertical" placeholder="Optional note for yourself or your partner..."></textarea>
      <div class="setting-row"><div><b>Share this check-in with ${esc(state.partner.name)}</b><div class="mini">You control what your partner receives.</div></div><label class="switch"><input id="shareCheck" type="checkbox" checked><span class="slider"></span></label></div>
      <button class="btn btn-primary" id="saveCheckin">Save check-in</button>
    </section>`;
}
function updates(){
  const items=state.notifications;
  return `<div class="page-title"><div><h1>Shared updates</h1><p class="subtitle">A simple view of what has been shared between you.</p></div></div>
    <section class="card"><h2>Notifications</h2>${items.length?items.map(n=>`<div class="update"><div class="update-icon">${n.icon}</div><div><b>${esc(n.text)}</b><div class="update-meta">${esc(n.time)} ${n.read?"· Read":"· New"}</div></div></div>`).join(""):`<div class="empty">No updates yet.</div>`}</section>
    <div style="height:18px"></div>
    <section class="card"><h2>Demo: partner update</h2><p class="subtitle">Use this to test the shared family feed in Phase 1.</p>
      <div class="action-row" style="margin-top:14px">
        <button class="btn btn-secondary" data-demo="support">❤️ Send support message</button>
        <button class="btn btn-secondary" data-demo="baby">👶 Add baby note</button>
      </div>
    </section>`;
}
function timeline(){
  const p=pregnancyWeeks(state.pregnancy.dueDate);
  const milestones=[
    [4,"Pregnancy begins","A new chapter starts."],[8,"Early development","The pregnancy is progressing."],[12,"First trimester","Many early symptoms may begin to settle."],
    [20,"Halfway point","You are around halfway through pregnancy."],[28,"Third trimester approaching","Baby is growing quickly."],[32,"Third trimester","Rest, support and preparation become increasingly important."],
    [36,"Getting close","Start thinking about final preparations."],[40,"Due date","Your estimated due date."]
  ];
  return `<div class="page-title"><div><h1>Pregnancy timeline</h1><p class="subtitle">You're currently around week ${p.week}.</p></div></div>
    <section class="card"><div class="timeline">${milestones.map(m=>`<div class="timeline-item"><span class="dot"></span><h3>Week ${m[0]} · ${m[1]}</h3><p class="subtitle">${m[2]}</p></div>`).join("")}</div><div class="notice warn">This timeline is a product prototype and should not be treated as medical guidance.</div></section>`;
}
function settings(){
  return `<div class="page-title"><div><h1>Settings</h1><p class="subtitle">Control your account, pregnancy details and sharing.</p></div></div>
    <div class="grid grid-2">
      <section class="card"><h2>Pregnancy details</h2><div class="form-group"><label>Estimated due date</label><input type="date" id="dueDate" value="${esc(state.pregnancy.dueDate)}"></div><button class="btn btn-primary" id="saveDue">Save due date</button></section>
      <section class="card"><h2>Partner</h2><div class="notice success">❤️ Connected to ${esc(state.partner.name)}</div><div class="form-group" style="margin-top:15px"><label>Partner name</label><input id="partnerName" value="${esc(state.partner.name)}"></div><button class="btn btn-secondary" id="savePartner">Save partner</button></section>
    </div>
    <div style="height:18px"></div>
    <section class="card"><h2>What should your partner see?</h2>
      ${setting("mood","Mood updates","Share your selected mood with your partner.")}
      ${setting("symptoms","Symptom updates","Share selected physical and emotional symptoms.")}
      ${setting("sleep","Sleep updates","Share sleep-related information.")}
    </section>
    <div style="height:18px"></div><section class="card"><h2>Account</h2><button class="btn btn-danger" id="logout">Sign out</button><button class="btn btn-ghost" id="reset" style="margin-left:8px">Reset demo data</button></section>`;
}
function setting(key,title,desc){
  return `<div class="setting-row"><div><b>${title}</b><div class="mini">${desc}</div></div><label class="switch"><input class="share-toggle" data-key="${key}" type="checkbox" ${state.sharing[key]?"checked":""}><span class="slider"></span></label></div>`;
}
function checkinSummary(c){
  return `<div class="notice">${c.moodEmoji||"🙂"} <b>${esc(c.mood)}</b> · ${formatDate(new Date(c.date))}</div>
  <div style="margin-top:14px"><b>Symptoms</b><p class="subtitle">${c.symptoms?.length?c.symptoms.map(esc).join(" · "):"None selected"}</p></div>
  ${c.note?`<div style="margin-top:12px"><b>Note</b><p class="subtitle">${esc(c.note)}</p></div>`:""}
  ${c.shared?`<div class="mini" style="margin-top:10px">✓ Shared with ${esc(state.partner.name)}</div>`:`<div class="mini" style="margin-top:10px">Private check-in</div>`}`;
}
function recentUpdates(){
  const items=state.notifications.slice(0,4);
  return items.map(n=>`<div class="update"><div class="update-icon">${n.icon}</div><div><b>${esc(n.text)}</b><div class="update-meta">${esc(n.time)}</div></div></div>`).join("") || `<div class="empty">No shared activity yet.</div>`;
}

function bindLogin(){
  let role="mum";
  document.querySelectorAll(".role").forEach(b=>b.onclick=()=>{role=b.dataset.role;document.querySelectorAll(".role").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  document.getElementById("loginBtn").onclick=()=>{
    const name=document.getElementById("loginName").value.trim()||"Sarah";
    state.loggedIn=true; state.user={name,role}; save(); render();
  };
}
function bindApp(){
  document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>{state.page=b.dataset.page;save();render()});
  const open=()=>{state.page="checkin";save();render()};
  document.getElementById("openCheckin")?.addEventListener("click",open);
  document.getElementById("openCheckin2")?.addEventListener("click",open);
  document.getElementById("manageSharing")?.addEventListener("click",()=>{state.page="settings";save();render()});
  document.getElementById("bell")?.addEventListener("click",()=>{state.notifications.forEach(n=>n.read=true);save();state.page="updates";render()});
  document.querySelectorAll(".mood-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".mood-btn").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");window.selectedMood=b.dataset.mood});
  document.querySelectorAll(".symptom-btn").forEach(b=>b.onclick=()=>b.classList.toggle("selected"));
  document.getElementById("saveCheckin")?.addEventListener("click",()=>{
    const mood=window.selectedMood || "Okay";
    const moodEmoji={Great:"😊",Good:"🙂",Okay:"😐",Exhausted:"😫",Anxious:"😰",Stressed:"😤",Emotional:"😭",Low:"😔"}[mood];
    const symptoms=[...document.querySelectorAll(".symptom-btn.selected")].map(x=>x.dataset.symptom);
    const shared=document.getElementById("shareCheck").checked;
    const note=document.getElementById("checkNote").value.trim();
    const c={id:Date.now(),date:new Date().toISOString(),mood,moodEmoji,symptoms,note,shared};
    state.checkIns.unshift(c);
    if(shared){
      const parts=[`${mood}`,...symptoms.slice(0,2)].join(" · ");
      notify(`${state.user.name} shared a check-in: ${parts}.`,"❤️");
    }
    save(); window.selectedMood=null; toast(shared?`Check-in saved and shared with ${state.partner.name}.`:"Private check-in saved."); state.page="dashboard"; render();
  });
  document.getElementById("saveDue")?.addEventListener("click",()=>{state.pregnancy.dueDate=document.getElementById("dueDate").value;save();toast("Due date updated.");render()});
  document.getElementById("savePartner")?.addEventListener("click",()=>{state.partner.name=document.getElementById("partnerName").value.trim()||"Alex";save();toast("Partner details updated.");render()});
  document.querySelectorAll(".share-toggle").forEach(t=>t.onchange=()=>{state.sharing[t.dataset.key]=t.checked;save();toast("Sharing preference updated.")});
  document.getElementById("logout")?.addEventListener("click",()=>{state.loggedIn=false;save();render()});
  document.getElementById("reset")?.addEventListener("click",()=>{if(confirm("Reset the demo data?")){localStorage.removeItem(KEY);state=load();render()}});
  document.querySelectorAll("[data-demo]").forEach(b=>b.onclick=()=>{
    if(b.dataset.demo==="support") notify(`${state.partner.name} sent: "I've got you. I'll take over for a bit ❤️"`,"❤️");
    else notify("Baby note added: Baby was a little unsettled this afternoon.","👶");
    save();toast("Demo update added.");render();
  });
}
render();
