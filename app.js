// ----- Helpers -----
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Storage helpers (simple offline store)
const S = {
  load: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  save: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};
const K = {
  birthdays: 'bcj.birthdays',
  trips: 'bcj.trips',
  shop: 'bcj.shop',
  admin: 'bcj.admin',
  contacts: 'bcj.contacts',
  media: 'bcj.media',
  goals: 'bcj.goals',
  pin: 'bcj.pin'
};

// App state
const state = {
  birthdays: S.load(K.birthdays, []),
  trips:     S.load(K.trips, []),
  shop:      S.load(K.shop, []),
  admin:     S.load(K.admin, []),
  contacts:  S.load(K.contacts, []),
  media:     S.load(K.media, []),
  goals:     S.load(K.goals, [])
};

// ----- Tabs -----
function openView(id) {
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.open === id));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `view-${id}`));
}

// ----- Renderers -----
function renderBirthdays() {
  const ul = $('#list-birthdays'); if (!ul) return;
  ul.innerHTML = '';
  state.birthdays.sort((a,b)=>a.date.localeCompare(b.date)).forEach(b => {
    const li = document.createElement('li');
    const d = new Date(b.date);
    li.innerHTML = `<div><strong>${b.name}</strong><div class="meta">${d.toLocaleDateString()}</div></div>
                    <button class="btn btn-ghost" data-del="${b.id}" data-type="birthday">Delete</button>`;
    ul.appendChild(li);
  });
}

function renderTrips() {
  const ul = $('#list-trips'); if (!ul) return;
  ul.innerHTML = '';
  state.trips.sort((a,b)=>a.start.localeCompare(b.start)).forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.title}</strong><div class="meta">${t.start} → ${t.end} ${t.location?('• '+t.location):''}</div></div>
                    <button class="btn btn-ghost" data-del="${t.id}" data-type="trip">Delete</button>`;
    ul.appendChild(li);
  });
}

function renderShop() {
  const ul = $('#list-shopping'); if (!ul) return;
  ul.innerHTML = '';
  state.shop.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = `<div>${i.done ? '✅' : '🛒'} ${i.title} ${i.qty>1?`x${i.qty}`:''}</div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-toggle="${i.id}">${i.done?'Undo':'Done'}</button>
        <button class="btn btn-ghost" data-del="${i.id}" data-type="shop">Delete</button>
      </div>`;
    ul.appendChild(li);
  });
}

function renderAdmin() {
  const ul = $('#list-admin'); if (!ul) return;
  ul.innerHTML = '';
  state.admin.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.title}</strong>${t.due?`<div class="meta">Due: ${t.due}</div>`:''}</div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-status="${t.id}">Status</button>
        <button class="btn btn-ghost" data-del="${t.id}" data-type="admin">Delete</button>
      </div>`;
    ul.appendChild(li);
  });
}

function renderContacts() {
  const ul = $('#list-contacts'); if (!ul) return;
  ul.innerHTML = '';
  state.contacts.forEach(c => {
    const li = document.createElement('li');
    const tel = (c.phone||'').replace(/\s/g,'');
    li.innerHTML = `<div><strong>${c.name}</strong><div class="meta">${c.phone||''} ${c.address?('• '+c.address):''}</div></div>
                    ${tel?`<a class="btn btn-ghost" href="tel:${tel}">Call</a>`:''}`;
    ul.appendChild(li);
  });
}

function renderMedia() {
  const ul = $('#list-media'); if (!ul) return;
  ul.innerHTML = '';
  state.media.forEach(m => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${m.title}</strong><div class="meta">${m.kind} ${m.where?('• '+m.where):''}</div></div>
                    <button class="btn btn-ghost" data-del="${m.id}" data-type="media">Delete</button>`;
    ul.appendChild(li);
  });
}

function renderGoals() {
  const ul = $('#list-goals'); if (!ul) return;
  ul.innerHTML = '';
  state.goals.forEach(g => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${g.title}</strong>${g.target?`<div class="meta">Target: ${g.target}</div>`:''}</div>
                    <button class="btn btn-ghost" data-del="${g.id}" data-type="goal">Delete</button>`;
    ul.appendChild(li);
  });
}

function renderHome() {
  const box = $('#home-upcoming'); if (!box) return;
  const birthdays = state.birthdays
    .map(b=>({name:b.name, date:new Date(b.date)}))
    .filter(b=>!isNaN(b.date)).sort((a,b)=>a.date-b.date).slice(0,3);
  const trips = state.trips
    .map(t=>({title:t.title, start:new Date(t.start)}))
    .filter(t=>!isNaN(t.start)).sort((a,b)=>a.start-b.start).slice(0,3);
  let html = '';
  if (birthdays.length) {
    html += `<h3>🎂 Birthdays</h3><ul class="list">` +
      birthdays.map(b=>`<li><div>${b.name}</div><div class="meta">${b.date.toLocaleDateString()}</div></li>`).join('') + `</ul>`;
  }
  if (trips.length) {
    html += `<h3>🧳 Trips</h3><ul class="list">` +
      trips.map(t=>`<li><div>${t.title}</div><div class="meta">${t.start.toLocaleDateString()}</div></li>`).join('') + `</ul>`;
  }
  if (!html) html = '<p class="meta">No upcoming items yet.</p>';
  box.innerHTML = html;
}

// Save all lists
function saveAll() {
  S.save(K.birthdays, state.birthdays);
  S.save(K.trips, state.trips);
  S.save(K.shop, state.shop);
  S.save(K.admin, state.admin);
  S.save(K.contacts, state.contacts);
  S.save(K.media, state.media);
  S.save(K.goals, state.goals);
}

// ----- Event wiring -----
function wireUI() {
  // Tabs
  $$('.tab').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.open)));

  // Forms
  $('#form-birthday')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#b-name').value.trim();
    const date = $('#b-date').value;
    if (!name || !date) return;
    state.birthdays.push({ id: crypto.randomUUID(), name, date });
    saveAll(); renderBirthdays(); renderHome(); e.target.reset();
  });

  $('#form-trip')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#t-title').value.trim();
    const start = $('#t-start').value;
    const end   = $('#t-end').value;
    const location = $('#t-location').value.trim();
    if (!title || !start || !end) return;
    state.trips.push({ id: crypto.randomUUID(), title, start, end, location });
    saveAll(); renderTrips(); renderHome(); e.target.reset();
  });

  $('#form-shop')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#s-title').value.trim();
    const qty   = parseInt($('#s-qty').value || '1', 10);
    if (!title) return;
    state.shop.push({ id: crypto.randomUUID(), title, qty, done:false });
    saveAll(); renderShop(); e.target.reset();
  });

  $('#form-admin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#a-title').value.trim();
    const due   = $('#a-due').value;
    if (!title) return;
    state.admin.push({ id: crypto.randomUUID(), title, due, status:'todo' });
    saveAll(); renderAdmin(); e.target.reset();
  });

  $('#form-contact')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#c-name').value.trim();
    const phone = $('#c-phone').value.trim();
    const address = $('#c-address').value.trim();
    if (!name) return;
    state.contacts.push({ id: crypto.randomUUID(), name, phone, address });
    saveAll(); renderContacts(); e.target.reset();
  });

  $('#form-media')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const kind = $('#m-kind').value;
    const title = $('#m-title').value.trim();
    const where = $('#m-where').value.trim();
    if (!title) return;
    state.media.push({ id: crypto.randomUUID(), kind, title, where, status:'queued' });
    saveAll(); renderMedia(); e.target.reset();
  });

  $('#form-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#g-title').value.trim();
    const target = $('#g-target').value;
    if (!title) return;
    state.goals.push({ id: crypto.randomUUID(), title, target, progress:0 });
    saveAll(); renderGoals(); e.target.reset();
  });

  // List item actions (event delegation)
  $('#list-birthdays')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.birthdays = state.birthdays.filter(x=>x.id!==id); saveAll(); renderBirthdays(); renderHome();
  });

  $('#list-trips')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.trips = state.trips.filter(x=>x.id!==id); saveAll(); renderTrips(); renderHome();
  });

  $('#list-shopping')?.addEventListener('click', (e) => {
    const tid = e.target.dataset.toggle;
    if (tid) { const it = state.shop.find(x=>x.id===tid); if (it){ it.done=!it.done; saveAll(); renderShop(); return; } }
    const id = e.target.dataset.del; if (!id) return;
    state.shop = state.shop.filter(x=>x.id!==id); saveAll(); renderShop();
  });

  $('#list-admin')?.addEventListener('click', (e) => {
    const sid = e.target.dataset.status;
    if (sid) { const it = state.admin.find(x=>x.id===sid);
      if (it) { it.status = it.status==='todo' ? 'doing' : it.status==='doing' ? 'done' : 'todo'; saveAll(); renderAdmin(); return; } }
    const id = e.target.dataset.del; if (!id) return;
    state.admin = state.admin.filter(x=>x.id!==id); saveAll(); renderAdmin();
  });

  $('#list-contacts')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.contacts = state.contacts.filter(x=>x.id!==id); saveAll(); renderContacts();
  });

  $('#list-media')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.media = state.media.filter(x=>x.id!==id); saveAll(); renderMedia();
  });

  $('#list-goals')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.goals = state.goals.filter(x=>x.id!==id); saveAll(); renderGoals();
  });

  // Passcode lock
  $('#unlock')?.addEventListener('click', () => {
    const cur = localStorage.getItem(K.pin);
    if (!cur) return alert('No passcode set yet. Tap "Set/Change Passcode".');
    if ($('#pin').value === cur) unlock(); else alert('Wrong passcode');
  });
  $('#setpin')?.addEventListener('click', () => {
    const p1 = prompt('Set a passcode (4–8 digits):'); if (!p1) return;
    const p2 = prompt('Confirm passcode:'); if (p1 !== p2) return alert('Passcodes do not match.');
    localStorage.setItem(K.pin, p1); alert('Passcode saved. Enter it to unlock.');
  });
}

function unlock(){
  $('#lock')?.classList.add('hidden');
  $('.app')?.classList.remove('hidden');
  openView('home');
  // initial renders
  renderBirthdays(); renderTrips(); renderShop(); renderAdmin(); renderContacts(); renderMedia(); renderGoals(); renderHome();
}

// Start once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  wireUI();            // attach all listeners once
  // If no passcode set, prompt to set (optional: auto-unlock for first run)
  if (!localStorage.getItem(K.pin)) {
    // show lock; user must set a code first
  }
});
