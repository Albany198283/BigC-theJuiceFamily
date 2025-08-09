function showSection(id) {
  document.querySelectorAll('section').forEach(sec => sec.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function addItem(listName) {
  const input = document.getElementById(`${listName}-input`);
  const ul = document.getElementById(`${listName}-list`);
  if (input.value.trim()) {
    const li = document.createElement('li');
    li.textContent = input.value.trim();
    ul.appendChild(li);
    input.value = '';
    saveData();
  }
}

function saveData() {
  const data = {};
  ['calendar', 'shopping', 'admin', 'contacts', 'watchlist', 'goals'].forEach(name => {
    const items = [];
    document.querySelectorAll(`#${name}-list li`).forEach(li => items.push(li.textContent));
    data[name] = items;
  });
  localStorage.setItem('familyAppData', JSON.stringify(data));
}

function loadData() {
  const data = JSON.parse(localStorage.getItem('familyAppData') || '{}');
  Object.keys(data).forEach(name => {
    const ul = document.getElementById(`${name}-list`);
    data[name].forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      ul.appendChild(li);
    });
  });
}

window.onload = loadData;
