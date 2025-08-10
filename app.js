// Helpers
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const S = {
  load: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  save: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const K = {
  birthdays: 'bcj.birthdays',
  trips:     'bcj.trips',
  shop:      'bcj.shop',
  admin:     'bcj.admin',
  contacts:  'bcj.contacts',
  media:     'bcj.media',
  goals:     'bcj.goals',
  familyPics:'bcj.familyPics',
  events:    'bcj.events'
};

// State with extra arrays
const state = {
  birthdays:S.load(K.birthdays,[]),
  trips:    S.load(K.trips,[]),
  shop:     S.load(K.shop,[]),
  admin:    S.load(K.admin,[]),
  contacts: S.load(K.contacts,[]),
  media:    S.load(K.media,[]),
  goals:    S.load(K.goals,[]),
  familyPics:S.load(K.familyPics,[]),
  events:    S.load(K.events,[])  // custom events via date-click
};

function saveAll() {
  S.save(K.birthdays, state.birthdays);
  S.save(K.trips,     state.trips);
  S.save(K.shop,      state.shop);
  S.save(K.admin,     state.admin);
  S.save(K.contacts,  state.contacts);
  S.save(K.media,     state.media);
  S.save(K.goals,     state.goals);
  S.save(K.familyPics,state.familyPics);
  S.save(K.events,    state.events);
}

/* Calendar variables */
let currentMonth = new Date().getMonth();
let currentYear  = new Date().getFullYear();

/* Helpers to create .ics file; same as before */
function createICSString(title,start,end,details = '',allDay = true) {
  const dtStart = allDay ? start.replace(/-/g,'') : start.replace(/[-:]/g,'').slice(0,15);
  const dtEnd   = allDay ? end.replace(/-/g,'')   : end.replace(/[-:]/g,'').slice(0,15);
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',
    `SUMMARY:${title}`,`DESCRIPTION:${details}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}`   : `DTEND:${dtEnd}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
}

/* Renderers with extras */
function renderBirthdays() {
  const ul = $('#list-birthdays'); if (!ul) return;
  ul.innerHTML = '';
  state.birthdays.sort((a,b)=>a.date.localeCompare(b.date)).forEach(b=>{
    const d = new Date(b.date);
    const endDate = new Date(b.date); endDate.setDate(endDate.getDate()+1);
    const ics = createICSString(`${b.name} Birthday`, b.date, endDate.toISOString().slice(0,10), 'Birthday reminder', true);
    const encoded = encodeURIComponent(ics);
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${b.name}</strong><div class="meta">${d.toLocaleDateString()}</div></div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <a class="btn btn-ghost" href="data:text/calendar;charset=utf-8,${encoded}" download="${b.name}_birthday.ics">Calendar</a>
        <button class="btn btn-ghost" data-del="${b.id}" data-type="birthday">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
  renderCalendar();
}

function renderTrips() {
  const ul = $('#list-trips'); if (!ul) return;
  ul.innerHTML = '';
  state.trips.sort((a,b)=>a.start.localeCompare(b.start)).forEach(t=>{
    const endDate = new Date(t.end); endDate.setDate(endDate.getDate()+1);
    const ics = createICSString(t.title, t.start, endDate.toISOString().slice(0,10), t.location || '', true);
    const encoded = encodeURIComponent(ics);
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${t.title}</strong><div class="meta">${t.start} → ${t.end}${t.location?(' • '+t.location):''}</div></div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <a class="btn btn-ghost" href="data:text/calendar;charset=utf-8,${encoded}" download="${t.title}.ics">Calendar</a>
        <button class="btn btn-ghost" data-del="${t.id}" data-type="trip">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
  renderCalendar();
}

function renderShop() {
  const ul = $('#list-shopping'); if (!ul) return;
  ul.innerHTML = '';
  state.shop.forEach(i=>{
    const li = document.createElement('li');
    li.innerHTML = `
      <div>${i.done?'✅':'🛒'} ${i.title} ${i.qty>1?`x${i.qty}`:''}</div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-toggle="${i.id}">${i.done?'Undo':'Done'}</button>
        <button class="btn btn-ghost" data-del="${i.id}" data-type="shop">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderAdmin() {
  const ul = $('#list-admin'); if (!ul) return;
  ul.innerHTML = '';
  state.admin.forEach(t=>{
    const progress = Math.min(100, Math.max(0, t.progress || 0));
    const finished = progress >= 100;
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${t.title}</strong>${t.due?`<div class="meta">Due: ${t.due}</div>`:''}
        <div class="progress-bar"><div class="progress" style="width:${progress}%;"></div></div>
        <div class="meta">Progress: ${progress}% ${finished ? '😎' : ''}</div>
      </div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-status="${t.id}">Status</button>
        <button class="btn btn-ghost" data-del="${t.id}" data-type="admin">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderContacts() {
  const ul = $('#list-contacts'); if (!ul) return;
  ul.innerHTML = '';
  state.contacts.forEach(c=>{
    const tel = (c.phone||'').replace(/\s/g,'');
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${c.name}</strong><div class="meta">${c.phone||''} ${c.address?(' • '+c.address):''}</div></div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        ${tel ? `<a class="btn btn-ghost" href="tel:${tel}">Call</a>` : ''}
        <button class="btn btn-ghost" data-del="${c.id}" data-type="contact">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderMedia() {
  const ul = $('#list-media'); if (!ul) return;
  ul.innerHTML = '';
  state.media.forEach(m=>{
    const starsFilled = Math.round((m.rating || 0) * 2) / 2; // halves allowed
    let starsHTML = '<span class="stars">';
    for (let i=1; i<=5; i++) {
      if (i <= starsFilled) starsHTML += '★';
      else if (i - 0.5 === starsFilled) starsHTML += '☆';  // half-star replaced by empty star
      else starsHTML += '☆';
    }
    starsHTML += '</span>';
    const li = document.createElement('li');
    li.innerHTML = `
      <div><strong>${m.title}</strong><div class="meta">${m.kind}${m.where?(' • '+m.where):''} ${starsHTML}</div></div>
      <div class="row" style="grid-template-columns:auto auto auto;gap:6px">
        <button class="btn btn-ghost" data-rate="${m.id}">Rate</button>
        <button class="btn btn-ghost" data-del="${m.id}" data-type="media">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderGoals() {
  const ul = $('#list-goals'); if (!ul) return;
  ul.innerHTML = '';
  state.goals.forEach(g=>{
    const progress = Math.max(0, Math.min(100, g.progress || 0));
    const complete = progress >= 100;
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${g.title}</strong>
        <div class="meta">Progress: ${progress}% ${complete?'🎉':''}</div>
        <div class="progress-bar"><div class="progress" style="width:${progress}%"></div></div>
      </div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-update="${g.id}">Update Progress</button>
        <button class="btn btn-ghost" data-del="${g.id}" data-type="goal">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

function renderHome() {
  const box = $('#home-upcoming'); if (!box) return;
  const now = new Date();
  const birthdaysToday = state.birthdays.filter(b=>{
    const d = new Date(b.date);
    return d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const nextTrips = state.trips
    .map(t => ({title:t.title, start:new Date(t.start)}))
    .filter(t => !isNaN(t.start))
    .sort((a,b)=>a.start-b.start)
    .slice(0,3);
  let html = '';
  if (birthdaysToday.length) {
    html += '<h3>🎂 Birthdays Today</h3><ul class="list">' +
      birthdaysToday.map(b => `<li><div>${b.name}</div><div class="meta">${new Date(b.date).toLocaleDateString()}</div></li>`).join('') +
      '</ul>';
  }
  if (nextTrips.length) {
    html += '<h3>🧳 Trips</h3><ul class="list">' +
      nextTrips.map(t => `<li><div>${t.title}</div><div class="meta">${t.start.toLocaleDateString()}</div></li>`).join('') +
      '</ul>';
  }
  box.innerHTML = html || '<p class="meta">No upcoming items yet.</p>';
  // load photos
  const grid = $('#family-photo-grid');
  if (grid) {
    grid.innerHTML = '';
    state.familyPics.forEach(src=>{
      const img = document.createElement('img');
      img.src = src;
      grid.appendChild(img);
    });
  }
}

/* Calendar functions */
function updateCalLabel() {
  const label = $('#cal-month-label'); if (!label) return;
  const date  = new Date(currentYear, currentMonth, 1);
  const monthName = date.toLocaleString('default',{month:'long'});
  label.textContent = `${monthName} ${currentYear}`;
}
function renderCalendar() {
  const grid = $('#calendar-grid'); if (!grid) return;
  grid.innerHTML = '';
  const firstDay  = new Date(currentYear, currentMonth, 1);
  const startIdx  = (firstDay.getDay()+6)%7;
  const daysThisMonth = new Date(currentYear,currentMonth+1,0).getDate();
  const daysPrevMonth = new Date(currentYear,currentMonth,0).getDate();
  for (let i=0; i<42; i++) {
    const cell = document.createElement('div');
    cell.classList.add('day');
    let date;
    if (i < startIdx) {
      const day = daysPrevMonth - (startIdx - i - 1);
      date = new Date(currentYear, currentMonth - 1, day);
      cell.classList.add('other-month');
    } else if (i >= startIdx + daysThisMonth) {
      const day = i - (startIdx + daysThisMonth) + 1;
      date = new Date(currentYear, currentMonth + 1, day);
      cell.classList.add('other-month');
    } else {
      const day = i - startIdx + 1;
      date = new Date(currentYear, currentMonth, day);
    }
    const iso = date.toISOString().slice(0,10);
    cell.dataset.date = iso;
    cell.textContent = date.getDate();
    // Highlight if birthday/trip/custom event
    const hasBirthday  = state.birthdays.some(b => b.date === iso);
    const hasTrip      = state.trips.some(t => iso >= t.start && iso <= t.end);
    const hasEvent     = state.events.some(e => e.date === iso);
    if (hasBirthday || hasTrip || hasEvent) cell.classList.add('event');
    grid.appendChild(cell);
  }
  updateCalLabel();
}
function setupCalendarNav() {
  $('#cal-prev')?.addEventListener('click', ()=>{ if (currentMonth===0){currentMonth=11; currentYear--; }else currentMonth--; renderCalendar();});
  $('#cal-next')?.addEventListener('click', ()=>{ if (currentMonth===11){currentMonth=0; currentYear++; }else currentMonth++; renderCalendar();});
}
function setupCalendarClick() {
  $('#calendar-grid')?.addEventListener('click', (e)=>{
    const cell = e.target.closest('.day'); if (!cell || !cell.dataset.date) return;
    const iso = cell.dataset.date;
    // Show current events first
    const details = $('#cal-details');
    const birthdayEvents = state.birthdays.filter(b=>b.date === iso);
    const tripEvents     = state.trips.filter(t=> iso >= t.start && iso <= t.end);
    const customEvents   = state.events.filter(evt=> evt.date === iso);
    let html = '';
    if (birthdayEvents.length) {
      html += '<h4>Birthdays</h4><ul>'+birthdayEvents.map(b=>`<li>${b.name}</li>`).join('')+'</ul>';
    }
    if (tripEvents.length) {
      html += '<h4>Trips</h4><ul>'+tripEvents.map(t=>`<li>${t.title} (${t.start} → ${t.end})</li>`).join('')+'</ul>';
    }
    if (customEvents.length) {
      html += '<h4>Events</h4><ul>'+customEvents.map(evt=>`<li>${evt.title}</li>`).join('')+'</ul>';
    }
    // Add prompt link
    html += '<button class="btn btn-ghost" id="add-event-btn">Add Event</button>';
    details.innerHTML = html || '<p>No events</p>';
    // Add handler for adding event
    $('#add-event-btn')?.addEventListener('click', ()=>{
      const title = prompt('Event title:'); if (!title) return;
      state.events.push({ id: crypto.randomUUID(), title, date: iso });
      saveAll(); renderCalendar(); details.innerHTML = '<p>Event added!</p>';
    });
  });
}

/* Family photo functions */
function initFamilyPhotos() {
  const grid = $('#family-photo-grid');
  if (grid) {
    grid.innerHTML = '';
    state.familyPics.forEach(src=>{
      const img = document.createElement('img');
      img.src = src;
      grid.appendChild(img);
    });
  }
}

/* Wiring UI */
function wireUI() {
  // Tabs
  $$('.tab').forEach(btn=>btn.addEventListener('click',()=>openView(btn.dataset.open)));

  // Birthdays
  $('#form-birthday')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name = $('#b-name').value.trim(); const date = $('#b-date').value;
    if (!name || !date) return;
    state.birthdays.push({ id: crypto.randomUUID(), name, date });
    saveAll(); renderBirthdays(); renderHome(); e.target.reset();
  });

  // Trips
  $('#form-trip')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const title = $('#t-title').value.trim();
    const start = $('#t-start').value;
    const end   = $('#t-end').value;
    const location = $('#t-location').value.trim();
    if (!title || !start || !end) return;
    state.trips.push({ id: crypto.randomUUID(), title, start, end, location });
    saveAll(); renderTrips(); renderHome(); e.target.reset();
  });

  // Shopping
  $('#form-shop')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const title = $('#s-title').value.trim();
    const qty   = parseInt($('#s-qty').value||'1',10);
    if (!title) return;
    state.shop.push({ id: crypto.randomUUID(), title, qty, done:false });
    saveAll(); renderShop(); e.target.reset();
  });

  // Admin tasks
  $('#form-admin')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const title = $('#a-title').value.trim();
    const due   = $('#a-due').value;
    if (!title) return;
    state.admin.push({ id: crypto.randomUUID(), title, due, progress:0 });
    saveAll(); renderAdmin(); e.target.reset();
  });

  // Contacts
  $('#form-contact')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name = $('#c-name').value.trim();
    const phone = $('#c-phone').value.trim();
    const address = $('#c-address').value.trim();
    if (!name) return;
    state.contacts.push({ id: crypto.randomUUID(), name, phone, address });
    saveAll(); renderContacts(); e.target.reset();
  });

  // Media / watchlist
  $('#form-media')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const kind  = $('#m-kind').value;
    const title = $('#m-title').value.trim();
    const where = $('#m-where').value.trim();
    if (!title) return;
    state.media.push({ id: crypto.randomUUID(), kind, title, where, rating:0 });
    saveAll(); renderMedia(); e.target.reset();
  });

  // Goals
  $('#form-goal')?.addEventListener('submit',(e)=>{
    e.preventDefault();
    const title  = $('#g-title').value.trim();
    const target = $('#g-target').value;
    if (!title) return;
    state.goals.push({ id: crypto.randomUUID(), title, target, progress:0 });
    saveAll(); renderGoals(); e.target.reset();
  });

  // Delegated handlers for lists
  $('#list-birthdays')?.addEventListener('click',(e)=>{ const id = e.target.dataset.del; if (!id) return;
    state.birthdays = state.birthdays.filter(x=>x.id!==id); saveAll(); renderBirthdays(); renderHome(); });

  $('#list-trips')?.addEventListener('click',(e)=>{ const id = e.target.dataset.del; if (!id) return;
    state.trips = state.trips.filter(x=>x.id!==id); saveAll(); renderTrips(); renderHome(); });

  $('#list-shopping')?.addEventListener('click',(e)=>{
    const tid = e.target.dataset.toggle;
    if (tid) { const item = state.shop.find(x=>x.id===tid);
      if (item) { item.done = !item.done; saveAll(); renderShop(); }
      return;
    }
    const id = e.target.dataset.del; if (id) { state.shop = state.shop.filter(x=>x.id!==id); saveAll(); renderShop(); }
  });

  $('#list-admin')?.addEventListener('click',(e)=>{
    const sid = e.target.dataset.status;
    if (sid) { const it = state.admin.find(x=>x.id===sid);
      if (it) { let val = prompt('Enter progress % (0-100):', it.progress); if (val!==null) {
        val = parseInt(val); if (!isNaN(val)) { it.progress = Math.max(0, Math.min(100, val)); saveAll(); renderAdmin(); } } }
      return;
    }
    const id = e.target.dataset.del; if (id) { state.admin = state.admin.filter(x=>x.id!==id); saveAll(); renderAdmin(); }
  });

  $('#list-contacts')?.addEventListener('click',(e)=>{
    const id = e.target.dataset.del; if (id) { state.contacts = state.contacts.filter(x=>x.id!==id); saveAll(); renderContacts(); }
  });

  $('#list-media')?.addEventListener('click',(e)=>{
    const rateId = e.target.dataset.rate;
    if (rateId) {
      const media = state.media.find(x=>x.id===rateId);
      if (media) {
        let val = prompt('Enter rating 1–5:', media.rating??'');
        if (val !== null) {
          const num = parseFloat(val); if (!isNaN(num) && num>=0 && num<=5) { media.rating = num; saveAll(); renderMedia(); }
        }
      }
      return;
    }
    const id = e.target.dataset.del; if (id) { state.media = state.media.filter(x=>x.id!==id); saveAll(); renderMedia(); }
  });

  $('#list-goals')?.addEventListener('click',(e)=>{
    const upd = e.target.dataset.update;
    if (upd) {
      const g = state.goals.find(x=>x.id===upd);
      if (g) {
        let val = prompt('Enter progress % (0-100):', g.progress); if (val!==null) {
          val = parseInt(val); if (!isNaN(val)) { g.progress = Math.max(0, Math.min(100,val)); saveAll(); renderGoals(); renderHome(); }
        }
      }
      return;
    }
    const id = e.target.dataset.del; if (id) { state.goals = state.goals.filter(x=>x.id!==id); saveAll(); renderGoals(); renderHome(); }
  });

  // Photo picker (multiple)
  $('#family-photo-btn')?.addEventListener('click', ()=>{ $('#family-photo-input').click(); });
  $('#family-photo-input')?.addEventListener('change', (e)=>{
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{ state.familyPics.push(ev.target.result); saveAll(); initFamilyPhotos(); };
    reader.readAsDataURL(file);
  });
}

// Switch view
function openView(id) {
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.open===id));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id===`view-${id}`));
  if (id==='home') renderHome();
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  wireUI();
  renderBirthdays();
  renderTrips();
  renderShop();
  renderAdmin();
  renderContacts();
  renderMedia();
  renderGoals();
  renderHome();
  setupCalendarNav();
  setupCalendarClick();
  initFamilyPhotos();
  renderCalendar();
});
