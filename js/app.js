/* ============================================================
   LIFE DASHBOARD — app.js
   Vanilla JavaScript | No frameworks | LocalStorage
   ============================================================ */

'use strict';

/* ── LocalStorage Keys ── */
const LS = {
  THEME:    'ld_theme',
  NAME:     'ld_name',
  TASKS:    'ld_tasks',
  LINKS:    'ld_links',
  POMO_DUR: 'ld_pomo_duration',
};

/* ── Helpers ── */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function lsGet(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ============================================================
   1. THEME  (Light / Dark)
   ============================================================ */
(function initTheme() {
  const saved = lsGet(LS.THEME, 'light');
  applyTheme(saved);

  $('#themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    lsSet(LS.THEME, next);
  });
})();

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeToggle').textContent = theme === 'dark' ? '☀️' : '🌙';
}

/* ============================================================
   2. CLOCK & GREETING
   ============================================================ */
function updateClock() {
  const now  = new Date();

  // Time
  const h  = String(now.getHours()).padStart(2, '0');
  const m  = String(now.getMinutes()).padStart(2, '0');
  const s  = String(now.getSeconds()).padStart(2, '0');
  $('#clock').textContent = `${h}:${m}:${s}`;

  // Date
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('#dateDisplay').textContent = now.toLocaleDateString(undefined, options);

  // Greeting
  const hour     = now.getHours();
  let   greeting = 'Good Evening';
  if (hour >= 5  && hour < 12) greeting = 'Good Morning';
  else if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';

  const name = lsGet(LS.NAME, '');
  $('#greeting').textContent = name ? `${greeting}, ${name}!` : `${greeting}!`;
}

// Tick every second
updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   3. CUSTOM NAME
   ============================================================ */
(function initName() {
  const name = lsGet(LS.NAME, '');
  renderNameDisplay(name);

  $('#editNameBtn').addEventListener('click', () => {
    $('#nameInput').value = lsGet(LS.NAME, '');
    $('#nameForm').classList.remove('hidden');
    $('#nameInput').focus();
  });

  $('#cancelNameBtn').addEventListener('click', () => {
    $('#nameForm').classList.add('hidden');
  });

  $('#saveNameBtn').addEventListener('click', saveName);

  $('#nameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') $('#nameForm').classList.add('hidden');
  });
})();

function saveName() {
  const name = $('#nameInput').value.trim();
  lsSet(LS.NAME, name);
  renderNameDisplay(name);
  $('#nameForm').classList.add('hidden');
  updateClock(); // refresh greeting immediately
}

function renderNameDisplay(name) {
  const display = $('#nameDisplay');
  if (name) {
    display.textContent = `Hello, ${name}`;
    $('#editNameBtn').textContent = '✏️ Edit name';
  } else {
    display.textContent = '';
    $('#editNameBtn').textContent = '✏️ Set name';
  }
}

/* ============================================================
   4. FOCUS TIMER (Pomodoro)
   ============================================================ */
let timerDuration = lsGet(LS.POMO_DUR, 25); // minutes
let timerSeconds  = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

(function initTimer() {
  $('#pomoDuration').value = timerDuration;
  renderTimer();

  $('#startBtn').addEventListener('click', startTimer);
  $('#stopBtn').addEventListener('click',  stopTimer);
  $('#resetBtn').addEventListener('click', resetTimer);

  $('#setDurationBtn').addEventListener('click', () => {
    const val = parseInt($('#pomoDuration').value, 10);
    if (!val || val < 1 || val > 120) return;
    timerDuration = val;
    lsSet(LS.POMO_DUR, val);
    resetTimer();
  });

  $('#pomoDuration').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#setDurationBtn').click();
  });
})();

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      renderTimer();
      notifyTimerDone();
      return;
    }
    timerSeconds--;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = timerDuration * 60;
  renderTimer();
}

function renderTimer() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  $('#timerDisplay').textContent = `${m}:${s}`;
}

function notifyTimerDone() {
  // Browser notification if permission granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⏰ Focus session complete!', {
      body: 'Great work! Time for a break.',
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('⏰ Focus session complete!', { body: 'Great work!' });
      }
    });
  }
  alert('⏰ Focus session complete! Great work!');
}

/* ============================================================
   5. TO-DO LIST
   ============================================================ */
let tasks = lsGet(LS.TASKS, []); // [{ id, text, done }]

(function initTodo() {
  renderTasks();

  $('#addTaskBtn').addEventListener('click', addTask);
  $('#taskInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });

  $('#sortSelect').addEventListener('change', renderTasks);
})();

function addTask() {
  const text = $('#taskInput').value.trim();
  if (!text) return;

  // Prevent duplicates (case-insensitive)
  const duplicate = tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    showDuplicateMsg();
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  renderTasks();
  $('#taskInput').value = '';
  hideDuplicateMsg();
}

function showDuplicateMsg() {
  $('#duplicateMsg').classList.remove('hidden');
  setTimeout(hideDuplicateMsg, 2500);
}

function hideDuplicateMsg() {
  $('#duplicateMsg').classList.add('hidden');
}

function saveTasks() {
  lsSet(LS.TASKS, tasks);
}

function getSortedTasks() {
  const sort = $('#sortSelect').value;
  const copy = [...tasks];
  if (sort === 'az')   return copy.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')   return copy.sort((a, b) => b.text.localeCompare(a.text));
  if (sort === 'done') return copy.sort((a, b) => Number(a.done) - Number(b.done));
  return copy; // default order
}

function renderTasks() {
  const list   = $('#taskList');
  const sorted = getSortedTasks();
  list.innerHTML = '';

  if (sorted.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);font-size:0.9rem;text-align:center;padding:12px;">No tasks yet. Add one above!</li>';
    return;
  }

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Mark task done" />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <div class="task-actions">
        <button class="btn-edit" data-action="edit" title="Edit task">Edit</button>
        <button class="btn-danger" data-action="delete" title="Delete task">Delete</button>
      </div>
    `;

    // Checkbox toggle
    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      const t = tasks.find(t => t.id === Number(li.dataset.id));
      if (t) { t.done = e.target.checked; saveTasks(); renderTasks(); }
    });

    // Edit / Delete buttons
    li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(task.id));
    li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTask(task.id));

    list.appendChild(li);
  });
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

/* ── Edit Modal ── */
let editingId = null;

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingId = id;
  $('#editInput').value = task.text;
  $('#editModal').classList.remove('hidden');
  $('#editInput').focus();
}

function closeEditModal() {
  editingId = null;
  $('#editModal').classList.add('hidden');
}

$('#saveEditBtn').addEventListener('click', saveEdit);
$('#cancelEditBtn').addEventListener('click', closeEditModal);

$('#editInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

// Close modal by clicking backdrop
$('#editModal').addEventListener('click', (e) => {
  if (e.target === $('#editModal')) closeEditModal();
});

function saveEdit() {
  const newText = $('#editInput').value.trim();
  if (!newText) return;

  // Prevent duplicate when editing (allow same task to keep its text)
  const duplicate = tasks.some(t => t.id !== editingId && t.text.toLowerCase() === newText.toLowerCase());
  if (duplicate) {
    $('#editInput').style.borderColor = 'var(--accent-danger)';
    setTimeout(() => { $('#editInput').style.borderColor = ''; }, 1500);
    return;
  }

  const task = tasks.find(t => t.id === editingId);
  if (task) { task.text = newText; saveTasks(); renderTasks(); }
  closeEditModal();
}

/* ============================================================
   6. QUICK LINKS
   ============================================================ */
let links = lsGet(LS.LINKS, [
  { id: 1, name: 'Google',   url: 'https://www.google.com' },
  { id: 2, name: 'Gmail',    url: 'https://mail.google.com' },
  { id: 3, name: 'Calendar', url: 'https://calendar.google.com' },
]);

(function initLinks() {
  renderLinks();

  $('#addLinkBtn').addEventListener('click', addLink);

  // Allow pressing Enter in either input to add
  $('#linkName').addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
  $('#linkUrl').addEventListener('keydown',  (e) => { if (e.key === 'Enter') addLink(); });
})();

function addLink() {
  const name = $('#linkName').value.trim();
  const url  = $('#linkUrl').value.trim();

  if (!name || !url) {
    showLinkError('Please enter both a name and a URL.');
    return;
  }

  // Basic URL validation
  if (!isValidUrl(url)) {
    showLinkError('Please enter a valid URL (e.g. https://example.com).');
    return;
  }

  // Prevent duplicates by name (case-insensitive)
  if (links.some(l => l.name.toLowerCase() === name.toLowerCase())) {
    showLinkError(`A link named "${name}" already exists.`);
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  $('#linkName').value = '';
  $('#linkUrl').value  = '';
  hideLinkError();
}

function isValidUrl(str) {
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

function showLinkError(msg) {
  const el = $('#linkError');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(hideLinkError, 3000);
}

function hideLinkError() {
  $('#linkError').classList.add('hidden');
}

function saveLinks() {
  lsSet(LS.LINKS, links);
}

function renderLinks() {
  const container = $('#linksList');
  container.innerHTML = '';

  if (links.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No links yet. Add one above!</p>';
    return;
  }

  links.forEach(link => {
    const wrapper = document.createElement('div');
    wrapper.className = 'link-btn-wrapper';

    const a = document.createElement('a');
    a.href      = link.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.className = 'link-btn';
    a.textContent = link.name;

    const removeBtn = document.createElement('button');
    removeBtn.className   = 'link-remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.title       = `Remove ${link.name}`;
    removeBtn.addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    wrapper.appendChild(a);
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  });
}

/* ============================================================
   UTILITY
   ============================================================ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
