// Basic helper functions to query DOM
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

// Simple storage helpers (localStorage wrapper)
const S = {
  load: (k, def) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? def;
    } catch {
      return def;
    }
  },
  save: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// Keys used to persist each list
const K = {
  birthdays: 'bcj.birthdays',
  trips:     'bcj.trips',
  shop:      'bcj.shop',
  admin:     'bcj.admin',
  contacts:  'bcj.contacts',
  media:     'bcj.media',
  goals:     'bcj.goals',
  familyPic: 'bcj.familyPic'
};

// Application state (loaded from localStorage on start)
const state = {
  birthdays: S.load(K.birthdays, []),
  trips:     S.load(K.trips, []),
  shop:      S.load(K.shop, []),
  admin:     S.load(K.admin, []),
  contacts:  S.load(K.contacts, []),
  media:     S.load(K.media, []),
  goals:     S.load(K.goals, [])
};

// Variables to keep track of current month and year for the calendar view
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Update the calendar month label (e.g., "April 2025")
function updateCalLabel() {
  const label = $('#cal-month-label');
  if (!label) return;
  const date = new Date(currentYear, currentMonth, 1);
  const monthName = date.toLocaleString('default', { month: 'long' });
  label.textContent = `${monthName} ${currentYear}`;
}

// Render the in-app calendar grid and highlight days with events
function renderCalendar() {
  const grid = $('#calendar-grid');
  if (!grid) return;
  grid.innerHTML = '';
  // Determine the first day of the current month and how many days to show from previous/next months
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startIndex = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  // Generate 42 cells (6 weeks) to cover all possible days
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement('div');
    cell.classList.add('day');
    let date;
    if (i < startIndex) {
      // Days from previous month
      const day = daysInPrevMonth - (startIndex - i - 1);
      date = new Date(currentYear, currentMonth - 1, day);
      cell.classList.add('other-month');
    } else if (i >= startIndex + daysInMonth) {
      // Days from next month
      const day = i - (startIndex + daysInMonth) + 1;
      date = new Date(currentYear, currentMonth + 1, day);
      cell.classList.add('other-month');
    } else {
      // Days in current month
      const day = i - startIndex + 1;
      date = new Date(currentYear, currentMonth, day);
    }
    const iso = date.toISOString().slice(0, 10);
    cell.dataset.date = iso;
    cell.textContent = date.getDate();
    // Highlight cells with birthdays or trips
    const hasBirthday = state.birthdays.some(b => b.date === iso);
    const hasTrip = state.trips.some(t => iso >= t.start && iso <= t.end);
    if (hasBirthday || hasTrip) {
      cell.classList.add('event');
    }
    grid.appendChild(cell);
  }
  updateCalLabel();
}

// Set up navigation for the calendar (previous/next month)
function setupCalendarNav() {
  $('#cal-prev')?.addEventListener('click', () => {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    renderCalendar();
  });
  $('#cal-next')?.addEventListener('click', () => {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    renderCalendar();
  });
}

// Display events for the selected day in the details box
function setupCalendarClick() {
  const grid = $('#calendar-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const cell = e.target.closest('.day');
    if (!cell || !cell.dataset.date) return;
    const iso = cell.dataset.date;
    const details = $('#cal-details');
    if (!details) return;
    const birthdayEvents = state.birthdays.filter(b => b.date === iso);
    const tripEvents = state.trips.filter(t => iso >= t.start && iso <= t.end);
    let html = '';
    if (birthdayEvents.length) {
      html += '<h4>Birthdays</h4><ul>' + birthdayEvents.map(b => `<li>${b.name}</li>`).join('') + '</ul>';
    }
    if (tripEvents.length) {
      html += '<h4>Trips</h4><ul>' + tripEvents.map(t => `<li>${t.title} (${t.start} → ${t.end})</li>`).join('') + '</ul>';
    }
    details.innerHTML = html || '<p>No events</p>';
  });
}

// Save all state back to localStorage
function saveAll() {
  S.save(K.birthdays, state.birthdays);
  S.save(K.trips, state.trips);
  S.save(K.shop, state.shop);
  S.save(K.admin, state.admin);
  S.save(K.contacts, state.contacts);
  S.save(K.media, state.media);
  S.save(K.goals, state.goals);
}

// Helper to create a simple iCalendar (.ics) string for birthdays/trips
function createICSString(title, start, end, details = '', allDay = true) {
  const dtStart = allDay ? start.replace(/-/g, '') : start.replace(/[-:]/g, '').slice(0, 15);
  const dtEnd   = allDay ? end.replace(/-/g, '') : end.replace(/[-:]/g, '').slice(0, 15);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}`   : `DTEND:${dtEnd}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.join('\r\n');
}

// Birthdays list (uses .ics download)
function renderBirthdays() {
  const ul = $('#list-birthdays'); if (!ul) return;
  ul.innerHTML = '';
  state.birthdays.sort((a,b) => a.date.localeCompare(b.date)).forEach(b => {
    const li = document.createElement('li');
    const d  = new Date(b.date);
    const startISO = b.date;
    const endDate  = new Date(startISO);
    endDate.setDate(endDate.getDate() + 1);
    const endISO   = endDate.toISOString().slice(0, 10);
    const ics = createICSString(`${b.name} Birthday`, startISO, endISO, 'Birthday reminder', true);
    const icsEncoded = encodeURIComponent(ics);
    li.innerHTML = `
      <div>
        <strong>${b.name}</strong>
        <div class="meta">${d.toLocaleDateString()}</div>
      </div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <a class="btn btn-ghost" href="data:text/calendar;charset=utf-8,${icsEncoded}" download="${b.name}_birthday.ics">Calendar</a>
        <button class="btn btn-ghost" data-del="${b.id}" data-type="birthday">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
  if ($('#calendar-grid')) renderCalendar();
}

// Trips list (.ics download for phone calendar)
function renderTrips() {
  const ul = $('#list-trips'); if (!ul) return;
  ul.innerHTML = '';
  state.trips.sort((a,b) => a.start.localeCompare(b.start)).forEach(t => {
    const li = document.createElement('li');
    const startISO = t.start;
    const endDate  = new Date(t.end);
    endDate.setDate(endDate.getDate() + 1);
    const endISO   = endDate.toISOString().slice(0, 10);
    const ics      = createICSString(t.title, startISO, endISO, t.location || '', true);
    const icsEncoded = encodeURIComponent(ics);
    li.innerHTML = `
      <div>
        <strong>${t.title}</strong>
        <div class="meta">${t.start} → ${t.end}${t.location ? (' • ' + t.location) : ''}</div>
      </div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <a class="btn btn-ghost" href="data:text/calendar;charset=utf-8,${icsEncoded}" download="${t.title}.ics">Calendar</a>
        <button class="btn btn-ghost" data-del="${t.id}" data-type="trip">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
  if ($('#calendar-grid')) renderCalendar();
}

// Shopping list
function renderShop() {
  const ul = $('#list-shopping'); if (!ul) return;
  ul.innerHTML = '';
  state.shop.forEach(i => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>${i.done ? '✅' : '🛒'} ${i.title} ${i.qty > 1 ? `x${i.qty}` : ''}</div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-toggle="${i.id}">${i.done ? 'Undo' : 'Done'}</button>
        <button class="btn btn-ghost" data-del="${i.id}" data-type="shop">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// Admin tasks list
function renderAdmin() {
  const ul = $('#list-admin'); if (!ul) return;
  ul.innerHTML = '';
  state.admin.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${t.title}</strong>
        ${t.due ? `<div class="meta">Due: ${t.due}</div>` : ''}
      </div>
      <div class="row" style="grid-template-columns:auto auto;gap:6px">
        <button class="btn btn-ghost" data-status="${t.id}">Status</button>
        <button class="btn btn-ghost" data-del="${t.id}" data-type="admin">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// Contacts list
function renderContacts() {
  const ul = $('#list-contacts'); if (!ul) return;
  ul.innerHTML = '';
  state.contacts.forEach(c => {
    const li = document.createElement('li');
    const tel = (c.phone || '').replace(/\s/g, '');
    li.innerHTML = `
      <div>
        <strong>${c.name}</strong>
        <div class="meta">${c.phone || ''} ${c.address ? (' • ' + c.address) : ''}</div>
      </div>
      ${tel ? `<a class="btn btn-ghost" href="tel:${tel}">Call</a>` : ''}
    `;
    ul.appendChild(li);
  });
}

// Watchlist with ratings
function renderMedia() {
  const ul = $('#list-media'); if (!ul) return;
  ul.innerHTML = '';
  state.media.forEach(m => {
    const rating = m.rating !== undefined && m.rating !== null ? ` • Rating: ${m.rating}` : '';
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${m.title}</strong>
        <div class="meta">${m.kind}${m.where ? (' • ' + m.where) : ''}${rating}</div>
      </div>
      <div class="row" style="grid-template-columns:auto auto auto;gap:6px">
        <button class="btn btn-ghost" data-rate="${m.id}">Rate</button>
        <button class="btn btn-ghost" data-del="${m.id}" data-type="media">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
}

// Goals with progress bars
function renderGoals() {
  const ul = $('#list-goals'); if (!ul) return;
  ul.innerHTML = '';
  state.goals.forEach(g => {
    const progress = Math.max(0, Math.min(100, g.progress || 0));
    const isComplete = progress >= 100;
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${g.title}</strong>
        <div class="meta">Progress: ${progress}% ${isComplete ? '🎉' : ''}</div>
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

// Home screen: show birthdays today and next trips
function renderHome() {
  const box = $('#home-upcoming'); if (!box) return;
  const now = new Date();
  const birthdays = state.birthdays
    .map(b => ({ name: b.name, date: new Date(b.date) }))
    .filter(b => !isNaN(b.date) && b.date.getMonth() === now.getMonth() && b.date.getDate() === now.getDate());
  const trips = state.trips
    .map(t => ({ title: t.title, start: new Date(t.start) }))
    .filter(t => !isNaN(t.start))
    .sort((a, b) => a.start - b.start)
    .slice(0, 3);
  let html = '';
  if (birthdays.length) {
    html += `<h3>🎂 Birthdays</h3><ul class="list">` +
      birthdays.map(b => `<li><div>${b.name}</div><div class="meta">${b.date.toLocaleDateString()}</div></li>`).join('') + `</ul>`;
  }
  if (trips.length) {
    html += `<h3>🧳 Trips</h3><ul class="list">` +
      trips.map(t => `<li><div>${t.title}</div><div class="meta">${t.start.toLocaleDateString()}</div></li>`).join('') + `</ul>`;
  }
  box.innerHTML = html || '<p class="meta">No upcoming items yet.</p>';
}

/*
 * UI wiring: attach all event listeners.
 */
function wireUI() {
  // Tab navigation
  $$('.tab').forEach(btn => btn.addEventListener('click', () => openView(btn.dataset.open)));

  // Birthdays
  $('#form-birthday')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#b-name').value.trim();
    const date = $('#b-date').value;
    if (!name || !date) return;
    state.birthdays.push({ id: crypto.randomUUID(), name, date });
    saveAll(); renderBirthdays(); renderHome(); e.target.reset();
  });

  // Trips
  $('#form-trip')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title    = $('#t-title').value.trim();
    const start    = $('#t-start').value;
    const end      = $('#t-end').value;
    const location = $('#t-location').value.trim();
    if (!title || !start || !end) return;
    state.trips.push({ id: crypto.randomUUID(), title, start, end, location });
    saveAll(); renderTrips(); renderHome(); e.target.reset();
  });

  // Shopping
  $('#form-shop')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#s-title').value.trim();
    const qty   = parseInt($('#s-qty').value || '1', 10);
    if (!title) return;
    state.shop.push({ id: crypto.randomUUID(), title, qty, done: false });
    saveAll(); renderShop(); e.target.reset();
  });

  // Admin tasks
  $('#form-admin')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#a-title').value.trim();
    const due   = $('#a-due').value;
    if (!title) return;
    state.admin.push({ id: crypto.randomUUID(), title, due, status: 'todo' });
    saveAll(); renderAdmin(); e.target.reset();
  });

  // Contacts
  $('#form-contact')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = $('#c-name').value.trim();
    const phone   = $('#c-phone').value.trim();
    const address = $('#c-address').value.trim();
    if (!name) return;
    state.contacts.push({ id: crypto.randomUUID(), name, phone, address });
    saveAll(); renderContacts(); e.target.reset();
  });

  // Media / watchlist
  $('#form-media')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const kind  = $('#m-kind').value;
    const title = $('#m-title').value.trim();
    const where = $('#m-where').value.trim();
    if (!title) return;
    state.media.push({ id: crypto.randomUUID(), kind, title, where, status:'queued' });
    saveAll(); renderMedia(); e.target.reset();
  });

  // Goals
  $('#form-goal')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#g-title').value.trim();
    const target = $('#g-target').value;
    if (!title) return;
    state.goals.push({ id: crypto.randomUUID(), title, target, progress: 0 });
    saveAll(); renderGoals(); e.target.reset();
  });

  // Delegated handlers
  $('#list-birthdays')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.birthdays = state.birthdays.filter(x => x.id !== id);
    saveAll(); renderBirthdays(); renderHome();
  });

  $('#list-trips')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.trips = state.trips.filter(x => x.id !== id);
    saveAll(); renderTrips(); renderHome();
  });

  $('#list-shopping')?.addEventListener('click', (e) => {
    const tid = e.target.dataset.toggle;
    if (tid) {
      const item = state.shop.find(x => x.id === tid);
      if (item) {
        item.done = !item.done;
        saveAll(); renderShop();
      }
      return;
    }
    const id = e.target.dataset.del; if (!id) return;
    state.shop = state.shop.filter(x => x.id !== id); saveAll(); renderShop();
  });

  $('#list-admin')?.addEventListener('click', (e) => {
    const sid = e.target.dataset.status;
    if (sid) {
      const it = state.admin.find(x => x.id === sid);
      if (it) {
        it.status = it.status === 'todo' ? 'doing' : it.status === 'doing' ? 'done' : 'todo';
        saveAll(); renderAdmin();
      }
      return;
    }
    const id = e.target.dataset.del; if (!id) return;
    state.admin = state.admin.filter(x => x.id !== id); saveAll(); renderAdmin();
  });

  $('#list-contacts')?.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id) return;
    state.contacts = state.contacts.filter(x => x.id !== id); saveAll(); renderContacts();
  });

  $('#list-media')?.addEventListener('click', (e) => {
    const rateId = e.target.dataset.rate;
    if (rateId) {
      const m = state.media.find(x => x.id === rateId);
      if (m) {
        const val = prompt('Enter rating (0–5, halves allowed):', m.rating ?? '');
        if (val !== null) {
          const num = parseFloat(val);
          if (!isNaN(num) && num >= 0 && num <= 5) {
            m.rating = num;
            saveAll(); renderMedia();
          }
        }
      }
      return;
    }
    const id = e.target.dataset.del; if (!id) return;
    state.media = state.media.filter(x => x.id !== id); saveAll(); renderMedia();
  });

  $('#list-goals')?.addEventListener('click', (e) => {
    const upd = e.target.dataset.update;
    if (upd) {
      const g = state.goals.find(x => x.id === upd);
      if (g) {
        const val = prompt('Enter progress percentage (0–100):', g.progress ?? '');
        if (val !== null) {
          const num = parseInt(val, 10);
          if (!isNaN(num)) {
            g.progress = Math.max(0, Math.min(100, num));
            saveAll(); renderGoals(); renderHome();
          }
        }
      }
      return;
    }
    const id = e.target.dataset.del; if (!id) return;
    state.goals = state.goals.filter(x => x.id !== id); saveAll(); renderGoals(); renderHome();
  });

  // Family photo picker
  $('#family-photo-btn')?.addEventListener('click', () => {
    $('#family-photo-input').click();
  });
  $('#family-photo-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result;
      localStorage.setItem(K.familyPic, data);
      const img = $('#family-pic');
      if (img) img.src = data;
    };
    reader.readAsDataURL(file);
  });
}

// Initialise family photo from localStorage
function initFamilyPhoto() {
  const data = localStorage.getItem(K.familyPic);
  if (data) {
    const img = $('#family-pic');
    if (img) img.src = data;
  }
}

// Switch between views (tabs)
function openView(id) {
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.open === id));
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === `view-${id}`));
  if (id === 'home') renderHome();
}

// Start application once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  wireUI();          // Attach listeners
  initFamilyPhoto(); // Show saved photo
  // Render all lists
  renderBirthdays();
  renderTrips();
  renderShop();
  renderAdmin();
  renderContacts();
  renderMedia();
  renderGoals();
  renderHome();
  // Setup calendar navigation and click handlers
  setupCalendarNav();
  setupCalendarClick();
  // Render initial calendar
  renderCalendar();
});
