document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'burakeye-checklist';
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

  document.querySelectorAll('[data-admin-task]').forEach((task) => {
    task.checked = Boolean(saved[task.dataset.adminTask]);
    task.addEventListener('change', () => {
      saved[task.dataset.adminTask] = task.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    });
  });

  document.querySelector('[data-clear-checklist]')?.addEventListener('click', () => {
    document.querySelectorAll('[data-admin-task]').forEach((task) => { task.checked = false; });
    localStorage.removeItem(storageKey);
  });

  const today = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
  document.querySelectorAll('[data-today]').forEach((element) => { element.textContent = today; });
});
