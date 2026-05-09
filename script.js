document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const html = document.documentElement;
    const taskInput = document.getElementById('taskInput');
    const charCounter = document.getElementById('charCounter');
    const prioritySelect = document.getElementById('prioritySelect');
    const taskDate = document.getElementById('taskDate');
    const categorySelect = document.getElementById('categorySelect');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');
    const themeToggle = document.getElementById('themeToggle');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    // Stats Elements
    const totalCount = document.getElementById('totalCount');
    const pendingCount = document.getElementById('pendingCount');
    const doneCount = document.getElementById('doneCount');
    const progressPercent = document.getElementById('progressPercent');
    const progressBar = document.getElementById('progressBar');
    const taskListCount = document.getElementById('taskListCount');

    // Settings & Modals
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const toggleNotificationsBtn = document.getElementById('toggleNotificationsBtn');
    const notificationStatus = document.getElementById('notificationStatus');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
    const toastContainer = document.getElementById('toastContainer');

    // State
    let tasks = JSON.parse(localStorage.getItem('tareamaster_tasks')) || [];
    let currentFilter = 'all';
    let currentSearch = '';
    let notificationsEnabled = JSON.parse(localStorage.getItem('tareamaster_notifications')) || false;
    let notificationPermission = false;

    // Maximum characters allowed
    const MAX_CHARS = 50;

    // Init Theme
    const savedTheme = localStorage.getItem('tareamaster_theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Initialize
    init();

    function init() {
        renderTasks();
        updateStats();
        setupEventListeners();
        checkNotificationSupport();
        
        // Sortable JS setup
        if (typeof Sortable !== 'undefined') {
            Sortable.create(taskList, {
                animation: 150,
                handle: '.drag-handle',
                ghostClass: 'sortable-ghost',
                onEnd: () => {
                    const newOrder = [];
                    taskList.querySelectorAll('.task-item').forEach(el => {
                        const id = el.dataset.id;
                        const task = tasks.find(t => t.id === id);
                        if(task) newOrder.push(task);
                    });
                    tasks = newOrder;
                    saveTasks();
                }
            });
        }
    }

    function setupEventListeners() {
        // Theme Toggle
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('tareamaster_theme', next);
            updateThemeIcon(next);
            showToast(`Modo ${next === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
        });

        // Add Task
        addTaskBtn.addEventListener('click', handleAddTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddTask();
        });

        // Character Counter
        taskInput.addEventListener('input', () => {
            const len = taskInput.value.length;
            charCounter.textContent = `${len}/${MAX_CHARS}`;
            if (len >= MAX_CHARS) charCounter.classList.add('limit');
            else charCounter.classList.remove('limit');
        });

        // Search & Clear
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase();
            clearSearchBtn.style.display = currentSearch ? 'flex' : 'none';
            renderTasks();
        });

        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearSearchBtn.style.display = 'none';
            renderTasks();
        });

        // Filters
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                renderTasks();
            });
        });

        // Quick Sorts
        document.getElementById('sortByPriority').addEventListener('click', () => sortTasks('priority'));
        document.getElementById('sortByDate').addEventListener('click', () => sortTasks('date'));
        document.getElementById('sortByCreation').addEventListener('click', () => sortTasks('creation'));

        // Settings Panel
        settingsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('active');
            settingsOverlay.classList.add('active');
        });

        const closeSettings = () => {
            settingsPanel.classList.remove('active');
            settingsOverlay.classList.remove('active');
        };

        closeSettingsBtn.addEventListener('click', closeSettings);
        settingsOverlay.addEventListener('click', closeSettings);

        // Action Buttons inside settings
        clearCompletedBtn.addEventListener('click', () => {
            closeSettings();
            showConfirmModal('¿Eliminar todas las tareas completadas?', () => {
                const oldCount = tasks.length;
                tasks = tasks.filter(t => !t.completed);
                if (tasks.length < oldCount) {
                    saveTasks();
                    renderTasks();
                    showToast('Tareas completadas eliminadas', 'success');
                }
            });
        });

        clearAllTasksBtn.addEventListener('click', () => {
            closeSettings();
            showConfirmModal('¿Estás seguro de eliminar TODAS las tareas? Esta acción no se puede deshacer.', () => {
                tasks = [];
                saveTasks();
                renderTasks();
                showToast('Todas las tareas han sido eliminadas', 'success');
            });
        });

        toggleNotificationsBtn.addEventListener('click', handleToggleNotifications);
    }

    // --- Core Functions ---

    function handleAddTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const date = taskDate.value;
        const category = categorySelect.value;

        if (!text) {
            showAlertModal('La descripción de la tarea no puede estar vacía.');
            return;
        }

        if (text.length > MAX_CHARS) {
            showAlertModal(`La tarea no puede exceder los ${MAX_CHARS} caracteres.`);
            return;
        }

        const newTask = {
            id: crypto.randomUUID(),
            text,
            priority,
            date,
            category,
            completed: false,
            createdAt: Date.now()
        };

        tasks.unshift(newTask); // Add to top
        saveTasks();
        
        // Reset form
        taskInput.value = '';
        prioritySelect.value = '';
        taskDate.value = '';
        categorySelect.value = '';
        charCounter.textContent = `0/${MAX_CHARS}`;
        charCounter.classList.remove('limit');
        
        // Clear search/filters to see the new task
        if (currentFilter !== 'all' || currentSearch !== '') {
            currentFilter = 'all';
            currentSearch = '';
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            filterTabs.forEach(t => {
                t.classList.toggle('active', t.dataset.filter === 'all');
            });
        }
        
        renderTasks();
        showToast('Tarea añadida con éxito', 'success');
        checkAndNotify();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        let filteredTasks = tasks.filter(task => {
            // Search filter
            if (currentSearch && !task.text.toLowerCase().includes(currentSearch)) return false;
            
            // Tab filter
            if (currentFilter === 'all') return true;
            if (currentFilter === 'pending') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            if (['alta', 'mitjana', 'baixa'].includes(currentFilter)) return task.priority === currentFilter;
            
            return true;
        });

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            taskList.style.display = 'flex';
            
            filteredTasks.forEach(task => {
                taskList.appendChild(createTaskElement(task));
            });
        }

        // Update list count text
        if (currentSearch) {
            taskListCount.textContent = `${filteredTasks.length} resultados encontrados`;
        } else {
            taskListCount.textContent = `${filteredTasks.length} tareas`;
        }

        updateStats();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item prio-${task.priority || 'none'} ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        // Meta calculations
        let dateHtml = '';
        if (task.date) {
            const diffInfo = getDaysDiff(task.date);
            dateHtml = `<span class="meta-badge meta-date ${diffInfo.class}"><i class="fas fa-calendar-alt"></i> ${diffInfo.text}</span>`;
        }
        
        let catHtml = '';
        if (task.category) {
            const catIcons = { 'trabajo': 'briefcase', 'personal': 'home', 'salud': 'heartbeat', 'estudio': 'book', 'otro': 'thumb-tack' };
            const icon = catIcons[task.category] || 'tag';
            catHtml = `<span class="meta-badge"><i class="fas fa-${icon}"></i> ${capitalize(task.category)}</span>`;
        }

        li.innerHTML = `
            <i class="fas fa-grip-vertical drag-handle" title="Arrastrar para reordenar"></i>
            <div class="task-checkbox-wrapper">
                <input type="checkbox" class="custom-checkbox" ${task.completed ? 'checked' : ''}>
            </div>
            <div class="task-content">
                <span class="task-text">${escapeHTML(task.text)}</span>
                <div class="task-meta">
                    ${dateHtml}
                    ${catHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn btn-edit" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="action-btn btn-delete" title="Eliminar"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Checkbox Toggle
        const checkbox = li.querySelector('.custom-checkbox');
        checkbox.addEventListener('change', (e) => {
            task.completed = e.target.checked;
            if (task.completed) {
                li.classList.add('celebrate-effect');
                setTimeout(() => li.classList.remove('celebrate-effect'), 500);
            }
            saveTasks();
            renderTasks(); // Re-render to handle filtering
        });

        // Delete Task
        li.querySelector('.btn-delete').addEventListener('click', () => {
            showConfirmModal('¿Eliminar esta tarea?', () => {
                tasks = tasks.filter(t => t.id !== task.id);
                saveTasks();
                renderTasks();
                showToast('Tarea eliminada', 'info');
            });
        });

        // Edit Task
        li.querySelector('.btn-edit').addEventListener('click', () => {
            renderEditForm(li, task);
        });

        return li;
    }

    function renderEditForm(li, task) {
        li.innerHTML = `
            <div class="edit-form">
                <input type="text" class="edit-input" value="${escapeHTML(task.text)}" maxlength="${MAX_CHARS}">
                <div class="edit-controls">
                    <select class="edit-select edit-prio">
                        <option value="" ${!task.priority ? 'selected' : ''}>Sin prioridad</option>
                        <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>🔴 Alta</option>
                        <option value="mitjana" ${task.priority === 'mitjana' ? 'selected' : ''}>🟡 Media</option>
                        <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>🟢 Baja</option>
                    </select>
                    <select class="edit-select edit-cat">
                        <option value="" ${!task.category ? 'selected' : ''}>Sin categoría</option>
                        <option value="trabajo" ${task.category === 'trabajo' ? 'selected' : ''}>💼 Trabajo</option>
                        <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>🏠 Personal</option>
                        <option value="salud" ${task.category === 'salud' ? 'selected' : ''}>💪 Salud</option>
                        <option value="estudio" ${task.category === 'estudio' ? 'selected' : ''}>📚 Estudio</option>
                        <option value="otro" ${task.category === 'otro' ? 'selected' : ''}>📌 Otro</option>
                    </select>
                    <input type="date" class="edit-date" value="${task.date || ''}">
                    <div class="edit-actions">
                        <button class="btn-cancel"><i class="fas fa-times"></i></button>
                        <button class="btn-save"><i class="fas fa-check"></i> Guardar</button>
                    </div>
                </div>
            </div>
        `;

        const input = li.querySelector('.edit-input');
        input.focus();

        li.querySelector('.btn-cancel').addEventListener('click', () => {
            renderTasks(); // Re-render to cancel
        });

        li.querySelector('.btn-save').addEventListener('click', () => {
            const newText = input.value.trim();
            if (!newText) return showAlertModal('El texto no puede estar vacío');
            if (newText.length > MAX_CHARS) return showAlertModal(`Máximo ${MAX_CHARS} caracteres`);

            task.text = newText;
            task.priority = li.querySelector('.edit-prio').value;
            task.category = li.querySelector('.edit-cat').value;
            task.date = li.querySelector('.edit-date').value;
            
            saveTasks();
            renderTasks();
            showToast('Tarea actualizada', 'success');
        });
    }

    function sortTasks(type) {
        if (type === 'priority') {
            const pOrder = { 'alta': 1, 'mitjana': 2, 'baixa': 3, '': 4, 'none': 4 };
            tasks.sort((a, b) => pOrder[a.priority || ''] - pOrder[b.priority || '']);
            showToast('Ordenado por prioridad', 'info');
        } else if (type === 'date') {
            tasks.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;
                return new Date(a.date) - new Date(b.date);
            });
            showToast('Ordenado por fecha', 'info');
        } else if (type === 'creation') {
            tasks.sort((a, b) => b.createdAt - a.createdAt);
            showToast('Ordenado por fecha de creación', 'info');
        }
        saveTasks();
        renderTasks();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

        // Animate numbers (simple implementation)
        totalCount.textContent = total;
        pendingCount.textContent = pending;
        doneCount.textContent = completed;
        
        progressPercent.textContent = `${percent}%`;
        progressBar.style.width = `${percent}%`;
    }

    function saveTasks() {
        localStorage.setItem('tareamaster_tasks', JSON.stringify(tasks));
    }

    // --- Utility Functions ---

    function updateThemeIcon(theme) {
        const i = themeToggle.querySelector('i');
        if (theme === 'dark') {
            i.className = 'fas fa-sun';
            themeToggle.setAttribute('title', 'Modo Claro');
        } else {
            i.className = 'fas fa-moon';
            themeToggle.setAttribute('title', 'Modo Oscuro');
        }
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function getDaysDiff(dateString) {
        const target = new Date(dateString);
        target.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return { text: `Vencida hace ${Math.abs(diffDays)}d`, class: 'overdue' };
        if (diffDays === 0) return { text: 'Hoy', class: 'due-soon' };
        if (diffDays === 1) return { text: 'Mañana', class: 'due-soon' };
        
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return { text: target.toLocaleDateString('es-ES', options), class: 'normal' };
    }

    // --- UI Components (Toasts & Modals) ---

    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { 'success': 'check-circle', 'error': 'times-circle', 'info': 'info-circle' };
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Remove after animation (3s + 0.3s fade)
        setTimeout(() => {
            if(toast.parentNode) toast.parentNode.removeChild(toast);
        }, 3500);
    }

    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');

    function showConfirmModal(message, onConfirm) {
        confirmMessage.textContent = message;
        confirmModal.style.display = 'flex';
        
        const handleYes = () => {
            cleanup();
            onConfirm();
        };
        const handleNo = () => cleanup();
        
        const cleanup = () => {
            confirmModal.style.display = 'none';
            confirmYesBtn.removeEventListener('click', handleYes);
            confirmNoBtn.removeEventListener('click', handleNo);
        };

        confirmYesBtn.addEventListener('click', handleYes);
        confirmNoBtn.addEventListener('click', handleNo);
    }

    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const alertOkBtn = document.getElementById('alertOkBtn');

    function showAlertModal(message) {
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
        
        const cleanup = () => {
            alertModal.style.display = 'none';
            alertOkBtn.removeEventListener('click', cleanup);
        };
        alertOkBtn.addEventListener('click', cleanup);
    }

    // --- Notifications logic ---
    
    function checkNotificationSupport() {
        if (!("Notification" in window)) {
            notificationStatus.textContent = 'NO SOPORTADO';
            notificationStatus.className = 'status-badge off';
            toggleNotificationsBtn.disabled = true;
            return;
        }
        
        notificationPermission = Notification.permission === 'granted';
        updateNotificationUI();
        
        if (notificationsEnabled && notificationPermission) {
            checkAndNotify();
            // Check every hour
            setInterval(checkAndNotify, 3600000); 
        }
    }

    function updateNotificationUI() {
        if (notificationsEnabled && notificationPermission) {
            notificationStatus.textContent = 'ON';
            notificationStatus.className = 'status-badge on';
        } else {
            notificationStatus.textContent = 'OFF';
            notificationStatus.className = 'status-badge off';
        }
    }

    function handleToggleNotifications() {
        if (notificationsEnabled) {
            notificationsEnabled = false;
            localStorage.setItem('tareamaster_notifications', false);
            updateNotificationUI();
            showToast('Notificaciones desactivadas', 'info');
        } else {
            if (Notification.permission === 'granted') {
                notificationsEnabled = true;
                localStorage.setItem('tareamaster_notifications', true);
                updateNotificationUI();
                showToast('Notificaciones activadas', 'success');
                checkAndNotify();
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        notificationPermission = true;
                        notificationsEnabled = true;
                        localStorage.setItem('tareamaster_notifications', true);
                        updateNotificationUI();
                        showToast('Notificaciones activadas', 'success');
                        checkAndNotify();
                    } else {
                        showAlertModal("Permiso de notificaciones denegado.");
                    }
                });
            } else {
                showAlertModal("Las notificaciones están bloqueadas en tu navegador.");
            }
        }
    }

    function checkAndNotify() {
        if (!notificationsEnabled || !notificationPermission) return;
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        tasks.forEach(task => {
            if (!task.completed && task.date) {
                const diff = getDaysDiff(task.date);
                // Si vence hoy o mañana y no hemos notificado hoy
                if ((diff.text === 'Hoy' || diff.text === 'Mañana') && task.lastNotified !== todayStr) {
                    new Notification("TareaMaster", {
                        body: `¡Atención! La tarea "${task.text}" vence ${diff.text.toLowerCase()}.`,
                        icon: 'LOGOINTERFAZ.png'
                    });
                    task.lastNotified = todayStr;
                    saveTasks();
                }
            }
        });
    }

});
