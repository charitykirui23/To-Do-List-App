
"use strict";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const filterButtons = document.querySelectorAll("[data-filter]");
const clearCompletedButton = document.getElementById("clearCompleted");
const themeButton = document.getElementById("themeButton");


function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("taskflow-tasks");
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : [];

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter(task =>
            task &&
            Number.isSafeInteger(task.id) &&
            typeof task.title === "string" &&
            typeof task.completed === "boolean" &&
            ["low", "medium", "high"].includes(task.priority)
        );
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";


function saveTasks() {
    try {
        localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Your changes could not be saved. Check your browser storage settings.");
    }
}


function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);

    document.getElementById("themeIcon").textContent =
        isDark ? "☀" : "☾";

    document.getElementById("themeText").textContent =
        isDark ? "Light mode" : "Dark mode";
}

try {
    applyTheme(localStorage.getItem("taskflow-theme") === "dark");
} catch (error) {
    applyTheme(false);
}

themeButton.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");

    applyTheme(isDark);

    try {
        localStorage.setItem(
            "taskflow-theme",
            isDark ? "dark" : "light"
        );
    } catch (error) {
        console.error("Could not save theme preference:", error);
    }
});


taskForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        alert("Please enter a task title.");
        taskInput.focus();
        return;
    }

    const newTask = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: title,
        completed: false,
        priority: taskPriority.value,
        dueDate: taskDate.value,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);

    saveTasks();
    taskForm.reset();

    taskPriority.value = "medium";
    currentFilter = "all";

    searchInput.value = "";

    updateActiveFilter();
    renderTasks();

    taskInput.focus();
});


function toggleTask(id) {
    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    saveTasks();
    renderTasks();
}

// Edit a task
function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    const newTitle = prompt("Edit your task:", task.title);

    if (newTitle === null) return;

    if (!newTitle.trim()) {
        alert("The task title cannot be empty.");
        return;
    }

    const newDueDate = prompt(
        "Enter a due date (YYYY-MM-DD), or leave blank:",
        task.dueDate || ""
    );

    if (newDueDate === null) return;

    if (
        newDueDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(newDueDate)
    ) {
        alert("Please use the date format YYYY-MM-DD.");
        return;
    }

    if (newDueDate) {
        const date = new Date(newDueDate + "T00:00:00");

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== newDueDate
        ) {
            alert("Please enter a valid date.");
            return;
        }
    }

    tasks = tasks.map(item =>
        item.id === id
            ? {
                ...item,
                title: newTitle.trim(),
                dueDate: newDueDate
            }
            : item
    );

    saveTasks();
    renderTasks();
}


function deleteTask(id) {
    const confirmed = confirm("Are you sure you want to delete this task?");

    if (!confirmed) return;

    tasks = tasks.filter(task => task.id !== id);

    saveTasks();
    renderTasks();
}


function createActionButton(label, symbol, className, action) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = `action-button ${className}`;
    button.textContent = symbol;
    button.setAttribute("aria-label", label);
    button.title = label;

    button.addEventListener("click", action);

    return button;
}


function formatDate(dateString) {
    if (!dateString) return "No due date";

    const date = new Date(dateString + "T00:00:00");

    return date.toLocaleDateString("en", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}


function createTaskElement(task) {
    const article = document.createElement("article");

    article.className = "task-item";

    if (task.completed) {
        article.classList.add("is-complete");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`
    );

    checkbox.addEventListener("change", () => {
        toggleTask(task.id);
    });

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("p");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className = `priority priority-${task.priority}`;
    priority.textContent = `${task.priority} priority`;

    const dueDate = document.createElement("span");

    if (
        task.dueDate &&
        !task.completed &&
        task.dueDate < new Date().toLocaleDateString("en-CA")
    ) {
        dueDate.textContent = `Overdue · ${formatDate(task.dueDate)}`;
        dueDate.style.color = "#d65c67";
    } else {
        dueDate.textContent = `Due: ${formatDate(task.dueDate)}`;
    }

    meta.append(priority, dueDate);
    details.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    actions.append(
        createActionButton(
            "Edit task",
            "✎",
            "edit",
            () => editTask(task.id)
        ),
        createActionButton(
            "Delete task",
            "×",
            "delete",
            () => deleteTask(task.id)
        )
    );

    article.append(checkbox, details, actions);

    return article;
}


function getVisibleTasks() {
    const searchTerm = searchInput.value.trim().toLowerCase();

    let visibleTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm)
    );

    if (currentFilter === "pending") {
        visibleTasks = visibleTasks.filter(task => !task.completed);
    }

    if (currentFilter === "completed") {
        visibleTasks = visibleTasks.filter(task => task.completed);
    }

    const sortMode = sortSelect.value;

    if (sortMode === "due") {
        visibleTasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return a.dueDate.localeCompare(b.dueDate);
        });
    } else if (sortMode === "priority") {
        const rank = { high: 3, medium: 2, low: 1 };

        visibleTasks.sort(
            (a, b) => rank[b.priority] - rank[a.priority]
        );
    } else {
        visibleTasks.sort(
            (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")
        );
    }

    return visibleTasks;
}


function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = getVisibleTasks();

    if (visibleTasks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";

        const icon = document.createElement("div");
        icon.className = "empty-icon";
        icon.textContent = "✓";

        const heading = document.createElement("h3");
        heading.textContent = searchInput.value.trim()
            ? "No matching tasks"
            : currentFilter === "completed"
                ? "Nothing completed yet"
                : currentFilter === "pending"
                    ? "You're all caught up!"
                    : "Your task list is empty";

        const message = document.createElement("p");
        message.textContent = searchInput.value.trim()
            ? "Try a different search term."
            : currentFilter === "pending"
                ? "Add a task whenever you have something to do."
                : "Add your first task to get started.";

        empty.append(icon, heading, message);
        taskList.append(empty);
    } else {
        visibleTasks.forEach(task => {
            taskList.append(createTaskElement(task));
        });
    }

    updateStatistics();
}


function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const progress = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    document.getElementById("totalStat").textContent = total;
    document.getElementById("pendingStat").textContent = pending;
    document.getElementById("completedStat").textContent = completed;

    document.getElementById("allCount").textContent = total;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("completedCount").textContent = completed;

    document.getElementById("progressPercent").textContent =
        `${progress}%`;

    document.getElementById("progressFill").style.width =
        `${progress}%`;

    const progressTrack = document.getElementById("progressTrack");

    progressTrack.setAttribute("aria-valuenow", progress);

    document.getElementById("listHeading").textContent = {
        all: "All Tasks",
        pending: "Pending Tasks",
        completed: "Completed Tasks"
    }[currentFilter];

    document.getElementById("listSubtitle").textContent =
        `${pending} pending · ${completed} completed`;
}


function updateActiveFilter() {
    filterButtons.forEach(button => {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        updateActiveFilter();
        renderTasks();
    });
});


searchInput.addEventListener("input", renderTasks);
sortSelect.addEventListener("change", renderTasks);


clearCompletedButton.addEventListener("click", () => {
    const completed = tasks.filter(task => task.completed);

    if (completed.length === 0) {
        alert("There are no completed tasks to clear.");
        return;
    }

    if (!confirm(`Delete ${completed.length} completed task(s)?`)) {
        return;
    }

    tasks = tasks.filter(task => !task.completed);

    saveTasks();
    renderTasks();
});


document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en", {
        weekday: "long",
        month: "long",
        day: "numeric"
    }).toUpperCase();

document.getElementById("year").textContent =
    new Date().getFullYear();


updateActiveFilter();
renderTasks();
