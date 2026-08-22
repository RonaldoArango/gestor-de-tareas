const STORAGE_KEY = 'gestor-de-tareas-items';

const taskForm = document.querySelector('#taskForm');
const taskInput = document.querySelector('#taskInput');
const taskList = document.querySelector('#taskList');
const emptyState = document.querySelector('#emptyState');
const emptyTitle = document.querySelector('#emptyTitle');
const emptyText = document.querySelector('#emptyText');
const taskCount = document.querySelector('#taskCount');
const allCount = document.querySelector('#allCount');
const pendingCount = document.querySelector('#pendingCount');
const completedCount = document.querySelector('#completedCount');
const summaryText = document.querySelector('#summaryText');
const progressRing = document.querySelector('#progressRing');
const progressValue = document.querySelector('#progressValue');
const dateDisplay = document.querySelector('#dateDisplay');
const clearCompleted = document.querySelector('#clearCompleted');
const filterButtons = document.querySelectorAll('[data-filter]');

let tasks = loadTasks();
let activeFilter = 'all';

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTask(title) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    title,
    completed: false,
    createdAt: new Date().toISOString()
  };
}

function getVisibleTasks() {
  if (activeFilter === 'pending') return tasks.filter((task) => !task.completed);
  if (activeFilter === 'completed') return tasks.filter((task) => task.completed);
  return tasks;
}

function formatTaskDate(dateString) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(dateString));
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.length - completedTasks;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  taskList.innerHTML = visibleTasks.map((task) => `
    <article class="task-item${task.completed ? ' is-completed' : ''}" data-id="${task.id}">
      <input class="task-check" type="checkbox" aria-label="Marcar '${escapeHtml(task.title)}' como completada" ${task.completed ? 'checked' : ''}>
      <p class="task-title">${escapeHtml(task.title)}</p>
      <div class="task-meta">
        <time class="task-time" datetime="${task.createdAt}">${formatTaskDate(task.createdAt)}</time>
        <button class="delete-button" type="button" aria-label="Eliminar '${escapeHtml(task.title)}'" title="Eliminar tarea">×</button>
      </div>
    </article>
  `).join('');

  taskList.hidden = visibleTasks.length === 0;
  emptyState.hidden = visibleTasks.length !== 0;
  updateEmptyState();

  taskCount.textContent = tasks.length;
  allCount.textContent = tasks.length;
  pendingCount.textContent = pendingTasks;
  completedCount.textContent = completedTasks;
  progressValue.textContent = `${progress}%`;
  progressRing.style.setProperty('--progress', `${progress}%`);
  summaryText.textContent = tasks.length === 0
    ? 'Añade una tarea para empezar.'
    : pendingTasks === 0
      ? 'Todo está completo. Buen trabajo.'
      : `${pendingTasks} ${pendingTasks === 1 ? 'tarea pendiente' : 'tareas pendientes'} para hoy.`;

  clearCompleted.disabled = completedTasks === 0;
  clearCompleted.style.opacity = completedTasks === 0 ? '.45' : '1';
}

function updateEmptyState() {
  if (activeFilter === 'completed' && tasks.some((task) => task.completed)) {
    emptyTitle.textContent = 'Sin resultados';
    emptyText.textContent = 'Todavía no hay tareas completadas en esta vista.';
  } else if (activeFilter === 'pending' && tasks.length > 0) {
    emptyTitle.textContent = 'Todo despejado';
    emptyText.textContent = 'No tienes tareas pendientes. Disfruta el momento.';
  } else {
    emptyTitle.textContent = 'Todo despejado';
    emptyText.textContent = 'No hay tareas pendientes. Añade una para comenzar.';
  }
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  tasks.unshift(createTask(title));
  saveTasks();
  taskForm.reset();
  renderTasks();
  taskInput.focus();
});

taskList.addEventListener('change', (event) => {
  if (!event.target.classList.contains('task-check')) return;
  const taskItem = event.target.closest('.task-item');
  const task = tasks.find((item) => item.id === taskItem.dataset.id);
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

taskList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('.delete-button');
  if (!deleteButton) return;
  const taskItem = deleteButton.closest('.task-item');
  tasks = tasks.filter((task) => task.id !== taskItem.dataset.id);
  saveTasks();
  renderTasks();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('is-active', isActive);
      filterButton.setAttribute('aria-pressed', isActive);
    });
    renderTasks();
  });
});

clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

dateDisplay.textContent = new Intl.DateTimeFormat('es', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
}).format(new Date());

renderTasks();
