/* ============================================
   StudyPrep Planner — Frontend Application
   ============================================
   Connects to FastAPI backend at /auth and
   /planner endpoints with JWT authentication.
   ============================================ */

const API_BASE = 'http://localhost:8000';

// ============================================
// STATE
// ============================================
let authToken = localStorage.getItem('sp_token') || null;
let userEmail = localStorage.getItem('sp_email') || null;
let tasks = [];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Dismiss loading screen
    const loader = document.getElementById('loading-screen');
    loader.classList.add('fade-out');

    // Route to correct page
    if (authToken && userEmail) {
        showDashboard();
    } else {
        showAuthPage();
    }

    // Enter key listeners for auth forms
    document.getElementById('login-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('register-password').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleRegister();
    });
    document.getElementById('task-title').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });
    document.getElementById('task-desc').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
    });

    // Close modal on overlay click
    document.getElementById('edit-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeEditModal();
    });

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEditModal();
    });
});

// ============================================
// PAGE ROUTING
// ============================================
function showAuthPage() {
    document.getElementById('auth-page').style.display = '';
    document.getElementById('dashboard-page').style.display = 'none';
}

function showDashboard() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('dashboard-page').style.display = '';
    updateUserInfo();
    updateGreeting();
    loadTasks();
}

function updateUserInfo() {
    const email = userEmail || 'User';
    document.getElementById('nav-email').textContent = email;
    document.getElementById('user-avatar').textContent = email.charAt(0).toUpperCase();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good evening!';
    if (hour < 12) greeting = 'Good morning!';
    else if (hour < 17) greeting = 'Good afternoon!';
    document.getElementById('greeting-text').textContent = greeting;
}

// ============================================
// AUTH — Form Switching
// ============================================
function switchToRegister(e) {
    e.preventDefault();
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
    clearAuthMessages();
}

function switchToLogin(e) {
    e.preventDefault();
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
    clearAuthMessages();
}

function clearAuthMessages() {
    ['login-error', 'login-success', 'register-error', 'register-success'].forEach(id => {
        const el = document.getElementById(id);
        el.style.display = 'none';
        el.textContent = '';
    });
}

// ============================================
// AUTH — Login
// ============================================
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.getElementById('login-btn');

    clearAuthMessages();

    // Validation
    if (!email || !password) {
        showAuthError('login', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showAuthError('login', 'Please enter a valid email address');
        return;
    }

    // Show loading
    setButtonLoading(btn, true);

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Login failed');
        }

        // Store token
        authToken = data.access_token;
        userEmail = email;
        localStorage.setItem('sp_token', authToken);
        localStorage.setItem('sp_email', userEmail);

        showToast('Welcome back! 🎉', 'success');
        showDashboard();

    } catch (err) {
        showAuthError('login', err.message);
    } finally {
        setButtonLoading(btn, false);
    }
}

// ============================================
// AUTH — Register
// ============================================
async function handleRegister() {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const btn = document.getElementById('register-btn');

    clearAuthMessages();

    // Validation
    if (!email || !password) {
        showAuthError('register', 'Please fill in all fields');
        return;
    }

    if (!isValidEmail(email)) {
        showAuthError('register', 'Please enter a valid email address');
        return;
    }

    if (password.length < 6) {
        showAuthError('register', 'Password must be at least 6 characters');
        return;
    }

    setButtonLoading(btn, true);

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.detail || 'Registration failed');
        }

        showAuthSuccess('register', 'Account created! You can now sign in.');
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';

        // Auto-switch to login after 1.5s
        setTimeout(() => switchToLogin({ preventDefault: () => { } }), 1500);

    } catch (err) {
        showAuthError('register', err.message);
    } finally {
        setButtonLoading(btn, false);
    }
}

// ============================================
// AUTH — Logout
// ============================================
function handleLogout() {
    authToken = null;
    userEmail = null;
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_email');
    tasks = [];

    // Reset forms
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    clearAuthMessages();

    // Ensure login form is active
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');

    showToast('Logged out successfully', 'info');
    showAuthPage();
}

// ============================================
// TASKS — Load
// ============================================
async function loadTasks() {
    const container = document.getElementById('tasks-container');
    const emptyState = document.getElementById('empty-state');
    const loading = document.getElementById('tasks-loading');

    container.innerHTML = '';
    emptyState.style.display = 'none';
    loading.style.display = '';

    try {
        const res = await fetch(`${API_BASE}/planner/get-tasks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error('Failed to load tasks');

        tasks = await res.json();
        loading.style.display = 'none';

        if (tasks.length === 0) {
            emptyState.style.display = '';
        } else {
            renderTasks(tasks);
        }

        updateStats();

    } catch (err) {
        loading.style.display = 'none';
        showToast('Failed to load tasks: ' + err.message, 'error');
    }
}

// ============================================
// TASKS — Render
// ============================================
function getTaskId(task, index) {
    return task.id || task._id || index;
}

function renderTasks(taskList) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    taskList.forEach((task, index) => {
        const card = document.createElement('div');
        card.className = 'task-card';

        const taskId = getTaskId(task, index);

        card.innerHTML = `
            <div class="task-info">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-description">${escapeHtml(task.description || '')}</div>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick="openEditModal('${taskId}', '${escapeAttr(task.title)}', '${escapeAttr(task.description || '')}')" title="Edit task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon danger" onclick="handleDeleteTask('${taskId}')" title="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

// ============================================
// TASKS — Add
// ============================================
async function handleAddTask() {
    const titleInput = document.getElementById('task-title');
    const descInput = document.getElementById('task-desc');
    const title = titleInput.value.trim();
    const description = descInput.value.trim();

    if (!title) {
        showToast('Please enter a task title', 'error');
        titleInput.focus();
        return;
    }

    const btn = document.getElementById('add-task-btn');
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/planner/add-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description: description || 'No description' })
        });

        if (res.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error('Failed to add task');

        titleInput.value = '';
        descInput.value = '';
        showToast('Task added successfully! ✅', 'success');
        loadTasks();

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

// ============================================
// TASKS — Delete
// ============================================
async function handleDeleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const res = await fetch(`${API_BASE}/planner/delete-task/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error('Failed to delete task');

        showToast('Task deleted', 'info');
        loadTasks();

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ============================================
// TASKS — Edit Modal
// ============================================
function openEditModal(taskId, title, description) {
    document.getElementById('edit-task-id').value = taskId;
    document.getElementById('edit-title').value = title;
    document.getElementById('edit-desc').value = description;
    document.getElementById('edit-modal').style.display = '';
    document.getElementById('edit-title').focus();
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

async function handleUpdateTask() {
    const taskId = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-title').value.trim();
    const description = document.getElementById('edit-desc').value.trim();

    if (!title) {
        showToast('Task title is required', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/planner/update-task/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description: description || 'No description' })
        });

        if (res.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            handleLogout();
            return;
        }

        if (!res.ok) throw new Error('Failed to update task');

        closeEditModal();
        showToast('Task updated! ✏️', 'success');
        loadTasks();

    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ============================================
// STATS
// ============================================
function updateStats() {
    document.getElementById('total-tasks').textContent = tasks.length;
    document.getElementById('active-tasks').textContent = tasks.length;
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Auto-dismiss
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// ============================================
// AUTH HELPER MESSAGES
// ============================================
function showAuthError(form, message) {
    const el = document.getElementById(`${form}-error`);
    el.textContent = message;
    el.style.display = 'block';
}

function showAuthSuccess(form, message) {
    const el = document.getElementById(`${form}-success`);
    el.textContent = message;
    el.style.display = 'block';
}

// ============================================
// UI HELPERS
// ============================================
function setButtonLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (loading) {
        btn.disabled = true;
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = '';
    } else {
        btn.disabled = false;
        if (text) text.style.display = '';
        if (loader) loader.style.display = 'none';
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
}
