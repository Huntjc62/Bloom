const KEY = "bloom_phase1_state";

const defaultState = {
  loggedIn: false,
  user: null,
  partner: { connected: true, name: "Alex" },
  pregnancy: { dueDate: "2026-11-28", status: "pregnancy" },
  baby: { arrived: false, name: "Baby", birthDate: "", birthWeight: "" },
  sharing: { mood: true, symptoms: true, sleep: true, babyActivity: true },
  babyLogs: [],
  babyTimeline: [],
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
  return {dashboard:"Today", checkin:"How are you feeling?", baby:"Baby tracker", updates:"Shared updates", timeline:state.pregnancy.status==="baby"?"Baby timeline":"Pregnancy timeline", settings:"Settings"}[state.page] || "Today";
}
function isBabyMode(){ return state.pregnancy.status==="baby" || state.baby.arrived; }
function dueDateReached(){ return new Date(state.pregnancy.dueDate+"T23:59:59") <= new Date(); }
function babyModePromptNeeded(){ return !isBabyMode() && dueDateReached() && !state.babyModePromptDismissed; }
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
  if(state.loggedIn && babyModePromptNeeded()) showBabyArrivalPrompt();
}


function showBabyArrivalPrompt(){
  const modal=document.createElement("div");
  modal.className="modal-backdrop";
  modal.innerHTML=`<div class="modal-card"><div class="modal-icon">👶</div><div class="eyebrow">Bloom milestone</div><h2>Is your baby here?</h2><p class="subtitle">Your due date has arrived. If your baby has been born, Bloom can switch from pregnancy mode to the new <b>Mum & Baby</b> experience.</p><div class="action-row"><button class="btn btn-primary" id="babyHere">Yes, baby is here 🎉</button><button class="btn btn-ghost" id="notYet">Not yet</button></div><p class="mini" style="margin-top:12px">You can change this later in Settings.</p></div>`;
  document.body.appendChild(modal);
  modal.querySelector("#babyHere").onclick=()=>{
    state.pregnancy.status="baby"; state.baby.arrived=true; state.baby.birthDate=new Date().toISOString().slice(0,10);
    state.babyModePromptDismissed=true; state.page="baby"; save(); modal.remove(); render();
  };
  modal.querySelector("#notYet").onclick=()=>{state.babyModePromptDismissed=true;save();modal.remove()};
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
  const items=[["dashboard","⌂","Today"],["checkin","❤","Check-in"]];
  if(isBabyMode()) items.push(["baby","👶","Baby tracker"]);
  items.push(["updates","↗","Updates"],["timeline",isBabyMode()?"◷":"◷",isBabyMode()?"Baby timeline":"Pregnancy timeline"],["settings","⚙","Settings"]);
  return items.map(x=>`<button class="nav-btn ${state.page===x[0]?"active":""}" data-page="${x[0]}"><span>${x[1]}</span>${x[2]}</button>`).join("");
}
function mobileNav(){
  const items=[["dashboard","⌂","Home"],["checkin","❤","Check-in"]];
  if(isBabyMode()) items.push(["baby","👶","Baby"]);
  items.push(["updates","↗","Updates"],["settings","⚙","Settings"]);
  return items.map(x=>`<button class="${state.page===x[0]?"active":""}" data-page="${x[0]}"><span style="font-size:20px">${x[1]}</span>${x[2]}</button>`).join("");
}

function content(){
  if(state.page==="checkin") return checkin();
  if(state.page==="baby") return babyTracker();
  if(state.page==="updates") return updates();
  if(state.page==="timeline") return timeline();
  if(state.page==="settings") return settings();
  return dashboard();
}


function babyDashboard(){
  const b=state.baby;
  const today=state.babyLogs.filter(x=>new Date(x.date).toDateString()===new Date().toDateString());
  const feeds=today.filter(x=>x.type==="feeding");
  const sleeps=today.filter(x=>x.type==="sleep");
  const nappies=today.filter(x=>x.type==="nappy");
  const last=state.checkIns[0];
  return `<div class="page-title"><div><div class="eyebrow">Bloom · Baby mode</div><h1>Good morning, ${esc(state.user.name)} 👋</h1><p class="subtitle">${esc(b.name||"Baby")} · ${b.birthDate?formatDate(new Date(b.birthDate+"T12:00:00")):"Birth date not set"}</p></div><button class="btn btn-secondary" id="bell">🔔 ${state.notifications.filter(n=>!n.read).length}</button></div>
    <section class="card hero baby-hero"><div class="hero-inner"><div><div class="eyebrow">Today with ${esc(b.name||"Baby")}</div><div class="big-week">👶</div><p class="subtitle">${feeds.length} feeds · ${sleeps.length} sleep events · ${nappies.length} nappies logged today</p><div class="action-row" style="margin-top:14px"><button class="btn btn-primary" data-page="baby">Open baby tracker</button><button class="btn btn-secondary" id="switchMode">App settings</button></div></div><div style="font-size:90px">🍼</div></div></section>
    <div style="height:18px"></div>
    <div class="grid grid-3">
      <section class="card small-card"><div class="kpi">${feeds.length}</div><div class="mini">Feeds today</div></section>
      <section class="card small-card"><div class="kpi">${sleeps.length}</div><div class="mini">Sleep events</div></section>
      <section class="card small-card"><div class="kpi">${nappies.length}</div><div class="mini">Nappies today</div></section>
    </div>
    <div style="height:18px"></div>
    <div class="grid grid-2"><section class="card"><h2>Mum's latest check-in</h2>${last?checkinSummary(last):`<div class="empty">No check-in yet.</div>`}</section><section class="card"><h2>Recent baby activity</h2>${babyRecent()}</section></div>`;
}

function babyTracker(){
  const b=state.baby;
  return `<div class="page-title"><div><h1>Baby tracker 👶</h1><p class="subtitle">Quickly log the everyday things both parents need to know.</p></div></div>
  <section class="card"><div class="baby-profile"><div class="baby-avatar">👶</div><div><div class="eyebrow">Baby profile</div><h2 style="margin-bottom:3px">${esc(b.name||"Baby")}</h2><p class="subtitle">${b.birthDate?`Born ${formatDate(new Date(b.birthDate+"T12:00:00"))}`:"Birth date not set"}</p></div></div></section>
  <div style="height:18px"></div>
  <div class="grid grid-2">
    <section class="card"><h2>🍼 Feeding</h2><p class="mini">Bottle, breast or other feed.</p>
      <div class="form-group"><label>Feed type</label><select id="feedType"><option>Bottle</option><option>Breastfeed</option><option>Other</option></select></div>
      <div class="form-group"><label>Amount / duration</label><input id="feedAmount" placeholder="e.g. 7 oz or 15 mins"></div>
      <button class="btn btn-primary" id="addFeed">Log feed</button>
    </section>
    <section class="card"><h2>😴 Sleep</h2><p class="mini">Log a nap or sleep period.</p>
      <div class="form-group"><label>Sleep type</label><select id="sleepType"><option>Nap</option><option>Night sleep</option></select></div>
      <div class="form-group"><label>Duration</label><input id="sleepDuration" placeholder="e.g. 1h 20m"></div>
      <button class="btn btn-primary" id="addSleep">Log sleep</button>
    </section>
    <section class="card"><h2>💧 Nappies</h2><p class="mini">Keep the shared record simple.</p>
      <div class="option-row" id="nappyType"><button class="choice-btn selected" data-nappy="Wet">💧 Wet</button><button class="choice-btn" data-nappy="Dirty">💩 Dirty</button><button class="choice-btn" data-nappy="Wet & dirty">💧💩 Both</button></div>
      <button class="btn btn-primary" id="addNappy">Log nappy</button>
    </section>
    <section class="card"><h2>📝 Baby note</h2><p class="mini">Anything both parents should know.</p>
      <textarea id="babyNote" rows="5" style="width:100%;border:1px solid var(--border);border-radius:12px;padding:12px;resize:vertical" placeholder="e.g. Baby was unsettled this afternoon..."></textarea>
      <button class="btn btn-primary" id="addBabyNote" style="margin-top:10px">Add note</button>
    </section>
  </div>
  <div style="height:18px"></div>
  <section class="card"><h2>Today's activity</h2>${babyRecent(true)}</section>`;
}

function babyRecent(all=false){
  const list=(all?state.babyLogs:state.babyLogs.slice(0,6));
  if(!list.length) return `<div class="empty">No baby activity logged yet.</div>`;
  const icons={feeding:"🍼",sleep:"😴",nappy:"💧",note:"📝"};
  return list.map(x=>`<div class="update"><div class="update-icon">${icons[x.type]||"👶"}</div><div><b>${esc(x.title)}</b><div class="update-meta">${formatDate(new Date(x.date))} · ${new Date(x.date).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div></div></div>`).join("");
}

function dashboard(){
  if(isBabyMode()) return babyDashboard();
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
  if(isBabyMode()){
    const events=state.babyTimeline.length?state.babyTimeline:state.babyLogs.slice().reverse();
    return `<div class="page-title"><div><h1>Baby timeline</h1><p class="subtitle">A shared record of ${esc(state.baby.name||"Baby")}'s journey.</p></div></div>
      <section class="card"><div class="timeline">${events.length?events.map(e=>`<div class="timeline-item"><span class="dot"></span><h3>${esc(e.title)}</h3><p class="subtitle">${formatDate(new Date(e.date))} · ${new Date(e.date).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</p></div>`).join(""):`<div class="empty">Your baby timeline will appear here as you log activity.</div>`}</div></section>`;
  }
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
  return `<div class="page-title"><div><h1>Settings</h1><p class="subtitle">Control your pregnancy, baby mode and sharing.</p></div></div>
    <div class="grid grid-2">
      <section class="card"><h2>Pregnancy details</h2><div class="form-group"><label>Estimated due date</label><input type="date" id="dueDate" value="${esc(state.pregnancy.dueDate)}"></div><button class="btn btn-primary" id="saveDue">Save due date</button></section>
      <section class="card"><h2>Partner</h2><div class="notice success">❤️ Connected to ${esc(state.partner.name)}</div><div class="form-group" style="margin-top:15px"><label>Partner name</label><input id="partnerName" value="${esc(state.partner.name)}"></div><button class="btn btn-secondary" id="savePartner">Save partner</button></section>
    </div>
    <div style="height:18px"></div>
    <section class="card"><h2>App stage</h2>
      <div class="notice ${isBabyMode()?"success":"warn"}">${isBabyMode()?"👶 Baby mode is active.":"🤰 Pregnancy mode is active."}</div>
      <p class="subtitle" style="margin-top:12px">Bloom normally asks whether your baby has arrived once the due date is reached. You can also change the stage manually here.</p>
      <div class="action-row" style="margin-top:14px">
        <button class="btn ${!isBabyMode()?"btn-primary":"btn-secondary"}" id="pregnancyMode">🤰 Pregnancy mode</button>
        <button class="btn ${isBabyMode()?"btn-primary":"btn-secondary"}" id="babyMode">👶 Baby mode</button>
      </div>
    </section>
    <div style="height:18px"></div>
    ${isBabyMode()?`<section class="card"><h2>Baby profile</h2><div class="grid grid-2"><div class="form-group"><label>Baby name</label><input id="babyName" value="${esc(state.baby.name||"Baby")}"></div><div class="form-group"><label>Birth date</label><input type="date" id="birthDate" value="${esc(state.baby.birthDate||"")}"></div><div class="form-group"><label>Birth weight <span class="mini">(optional)</span></label><input id="birthWeight" value="${esc(state.baby.birthWeight||"")}" placeholder="e.g. 7 lb 4 oz"></div></div><button class="btn btn-primary" id="saveBabyProfile">Save baby profile</button></section><div style="height:18px"></div>`:""}
    <section class="card"><h2>What should your partner see?</h2>
      ${setting("mood","Mood updates","Share your selected mood with your partner.")}
      ${setting("symptoms","Symptom updates","Share selected physical and emotional symptoms.")}
      ${setting("sleep","Sleep updates","Share sleep-related information.")}
      ${setting("babyActivity","Baby activity","Share baby tracking activity with your partner.")}
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
  document.querySelectorAll("[data-nappy]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-nappy]").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
  const addBabyLog=(type,title,details="")=>{
    const entry={id:Date.now(),type,title,details,date:new Date().toISOString()};
    state.babyLogs.unshift(entry); state.babyTimeline.unshift(entry);
    if(state.sharing.babyActivity) notify(`${state.baby.name||"Baby"}: ${title}`,"👶");
    save(); toast("Baby activity saved."); render();
  };
  document.getElementById("addFeed")?.addEventListener("click",()=>{
    const type=document.getElementById("feedType").value, amount=document.getElementById("feedAmount").value.trim();
    addBabyLog("feeding",`${type}${amount?" · "+amount:""}`);
  });
  document.getElementById("addSleep")?.addEventListener("click",()=>{
    const type=document.getElementById("sleepType").value, duration=document.getElementById("sleepDuration").value.trim();
    addBabyLog("sleep",`${type}${duration?" · "+duration:""}`);
  });
  document.getElementById("addNappy")?.addEventListener("click",()=>{
    const type=document.querySelector("[data-nappy].selected")?.dataset.nappy||"Wet";
    addBabyLog("nappy",`${type} nappy`);
  });
  document.getElementById("addBabyNote")?.addEventListener("click",()=>{
    const note=document.getElementById("babyNote").value.trim();
    if(!note){toast("Add a note first.");return}
    addBabyLog("note",note);
  });
  document.getElementById("pregnancyMode")?.addEventListener("click",()=>{
    state.pregnancy.status="pregnancy"; state.baby.arrived=false; state.page="dashboard"; save(); render();
  });
  document.getElementById("babyMode")?.addEventListener("click",()=>{
    state.pregnancy.status="baby"; state.baby.arrived=true; state.page="baby"; save(); render();
  });
  document.getElementById("switchMode")?.addEventListener("click",()=>{state.page="settings";save();render()});
  document.getElementById("saveBabyProfile")?.addEventListener("click",()=>{
    state.baby.name=document.getElementById("babyName").value.trim()||"Baby";
    state.baby.birthDate=document.getElementById("birthDate").value||"";
    state.baby.birthWeight=document.getElementById("birthWeight").value.trim()||"";
    save();toast("Baby profile updated.");render();
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
