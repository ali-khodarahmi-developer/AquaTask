const AppState = {
  tasks: [],
  currentFilter: "all",
  editingTaskId: null,
};
const Elements = {
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskDescription: document.getElementById("task-description"),
  taskPriority: document.getElementById("task-priority"),
  taskDueDate: document.getElementById("task-due-date"),
  tasksContainer: document.getElementById("tasks-container"),
  emptyState: document.getElementById("empty-state"),
  filterButtons: document.querySelectorAll(".filter-btn"),
  refreshBtn: document.getElementById("refresh-btn"),
  editModal: document.getElementById("edit-modal"),
  editForm: document.getElementById("edit-form"),
  editTaskId: document.getElementById("edit-task-id"),
  editTitle: document.getElementById("edit-title"),
  editDescription: document.getElementById("edit-description"),
  editPriority: document.getElementById("edit-priority"),
  editDueDate: document.getElementById("edit-due-date"),
  closeModal: document.getElementById("close-modal"),
  cancelEdit: document.getElementById("cancel-edit"),
  toast: document.getElementById("toast"),
  statTotal: document.getElementById("stat-total"),
  statActive: document.getElementById("stat-active"),
  statCompleted: document.getElementById("stat-completed"),
};
const API = {
  async fetchTasks(filter = "all") {
    try {
      const response = await fetch(`/api/tasks?filter=${filter}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to load tasks", "error");
      return [];
    }
  },
  async createTask(taskData) {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to create task", "error");
      return null;
    }
  },
  async updateTask(taskId, updates) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update task");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to update task", "error");
      return null;
    }
  },
  async deleteTask(taskId) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return true;
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to delete task", "error");
      return false;
    }
  },
  async toggleTask(taskId) {
    try {
      const response = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "PATCH",
      });
      if (!response.ok) throw new Error("Failed to toggle task");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      showToast("Failed to toggle task", "error");
      return null;
    }
  },
  async fetchStats() {
    try {
      const response = await fetch("/api/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  },
};
function renderTasks(tasks) {
  AppState.tasks = tasks;
  Elements.tasksContainer.innerHTML = "";
  if (tasks.length === 0) {
    Elements.emptyState.classList.add("visible");
    return;
  }
  Elements.emptyState.classList.remove("visible");
  tasks.forEach((task, index) => {
    const taskCard = createTaskCard(task);
    taskCard.style.animationDelay = `${index * 0.05}s`;
    Elements.tasksContainer.appendChild(taskCard);
  });
}
function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = `task-card ${task.completed ? "completed" : ""}`;
  card.dataset.taskId = task.id;
  const priorityIcon = `<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="6" cy="6" r="6"/></svg>`;
  const calendarIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  const clockIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  const editIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const deleteIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  card.innerHTML = `
        <div class="task-header">
            <div class="task-checkbox ${
              task.completed ? "checked" : ""
            }" data-task-id="${task.id}"></div>
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${
                  task.description
                    ? `<div class="task-description">${escapeHtml(
                        task.description
                      )}</div>`
                    : ""
                }
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">
                        ${priorityIcon} ${capitalizeFirst(task.priority)}
                    </span>
                    ${
                      task.due_date
                        ? `<span class="task-date">${calendarIcon} ${task.due_date}</span>`
                        : ""
                    }
                    <span class="task-date">${clockIcon} ${
    task.created_at
  }</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit" data-task-id="${
                  task.id
                }" title="Edit task">${editIcon}</button>
                <button class="task-btn delete" data-task-id="${
                  task.id
                }" title="Delete task">${deleteIcon}</button>
            </div>
        </div>
    `;
  const checkbox = card.querySelector(".task-checkbox");
  const editBtn = card.querySelector(".task-btn.edit");
  const deleteBtn = card.querySelector(".task-btn.delete");
  checkbox.addEventListener("click", () => handleToggleTask(task.id));
  editBtn.addEventListener("click", () => handleEditTask(task.id));
  deleteBtn.addEventListener("click", () => handleDeleteTask(task.id));
  return card;
}
function updateStats(stats) {
  if (!stats) return;
  Elements.statTotal.textContent = stats.total;
  Elements.statActive.textContent = stats.active;
  Elements.statCompleted.textContent = stats.completed;
  [Elements.statTotal, Elements.statActive, Elements.statCompleted].forEach(
    (el) => {
      el.style.animation = "none";
      setTimeout(() => {
        el.style.animation = "pulse 0.5s ease-out";
      }, 10);
    }
  );
}
async function handleCreateTask(e) {
  e.preventDefault();
  const title = Elements.taskTitle.value.trim();
  if (!title) {
    showToast("Please enter a task title", "error");
    return;
  }
  const taskData = {
    title: title,
    description: Elements.taskDescription.value.trim(),
    priority: Elements.taskPriority.value,
    due_date: Elements.taskDueDate.value || null,
  };
  const newTask = await API.createTask(taskData);
  if (newTask) {
    showToast("Task created successfully!", "success");
    Elements.taskForm.reset();
    await loadTasks();
    await loadStats();
  }
}
async function handleToggleTask(taskId) {
  const result = await API.toggleTask(taskId);
  if (result) {
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    const checkbox = taskCard.querySelector(".task-checkbox");
    if (result.completed) {
      taskCard.classList.add("completed");
      checkbox.classList.add("checked");
      showToast("Task completed! 🎉", "success");
    } else {
      taskCard.classList.remove("completed");
      checkbox.classList.remove("checked");
      showToast("Task reopened", "success");
    }
    await loadStats();
  }
}
function handleEditTask(taskId) {
  const task = AppState.tasks.find((t) => t.id === taskId);
  if (!task) return;
  AppState.editingTaskId = taskId;
  Elements.editTaskId.value = taskId;
  Elements.editTitle.value = task.title;
  Elements.editDescription.value = task.description || "";
  Elements.editPriority.value = task.priority;
  Elements.editDueDate.value = task.due_date || "";
  Elements.editModal.classList.add("show");
}
async function handleUpdateTask(e) {
  e.preventDefault();
  const taskId = AppState.editingTaskId;
  if (!taskId) return;
  const updates = {
    title: Elements.editTitle.value.trim(),
    description: Elements.editDescription.value.trim(),
    priority: Elements.editPriority.value,
    due_date: Elements.editDueDate.value || null,
  };
  const result = await API.updateTask(taskId, updates);
  if (result) {
    showToast("Task updated successfully!", "success");
    closeModal();
    await loadTasks();
  }
}
async function handleDeleteTask(taskId) {
  if (!confirm("Are you sure you want to delete this task?")) return;
  const result = await API.deleteTask(taskId);
  if (result) {
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    taskCard.style.animation = "taskSlideOut 0.3s ease-out";
    setTimeout(async () => {
      showToast("Task deleted successfully", "success");
      await loadTasks();
      await loadStats();
    }, 300);
  }
}
async function handleFilterChange(filterType) {
  AppState.currentFilter = filterType;
  Elements.filterButtons.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.filter === filterType) {
      btn.classList.add("active");
    }
  });
  await loadTasks();
}
function closeModal() {
  Elements.editModal.classList.remove("show");
  AppState.editingTaskId = null;
  Elements.editForm.reset();
}
async function loadTasks() {
  const tasks = await API.fetchTasks(AppState.currentFilter);
  renderTasks(tasks);
}
async function loadStats() {
  const stats = await API.fetchStats();
  updateStats(stats);
}
async function refreshData() {
  Elements.refreshBtn.style.animation = "spin 0.5s linear";
  await loadTasks();
  await loadStats();
  setTimeout(() => {
    Elements.refreshBtn.style.animation = "";
    showToast("Data refreshed!", "success");
  }, 500);
}
function showToast(message, type = "success") {
  Elements.toast.textContent = message;
  Elements.toast.classList.add("show");
  setTimeout(() => {
    Elements.toast.classList.remove("show");
  }, 3000);
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function setupEventListeners() {
  Elements.taskForm.addEventListener("submit", handleCreateTask);
  Elements.editForm.addEventListener("submit", handleUpdateTask);
  Elements.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => handleFilterChange(btn.dataset.filter));
  });
  Elements.refreshBtn.addEventListener("click", refreshData);
  Elements.closeModal.addEventListener("click", closeModal);
  Elements.cancelEdit.addEventListener("click", closeModal);
  Elements.editModal.addEventListener("click", (e) => {
    if (e.target === Elements.editModal) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && Elements.editModal.classList.contains("show")) {
      closeModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "r") {
      e.preventDefault();
      refreshData();
    }
  });
  const today = new Date().toISOString().split("T")[0];
  Elements.taskDueDate.setAttribute("min", today);
  Elements.editDueDate.setAttribute("min", today);
}
const style = document.createElement("style");
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    @keyframes taskSlideOut {
        to {
            opacity: 0;
            transform: translateX(-100px);
        }
    }
`;
document.head.appendChild(style);
async function initializeApp() {
  console.log("🚀 AquaTask Application Starting...");
  console.log("👨‍💻 Developed by: Ali Khodarahmi");
  setupEventListeners();
  await loadTasks();
  await loadStats();
  showToast("Welcome to AquaTask! 🎯", "success");
  console.log("✅ Application Ready!");
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
