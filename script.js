document.addEventListener('DOMContentLoaded', function () {
    // --- Selectores de Elementos del DOM ---
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const prioritySelect = document.getElementById('prioritySelect');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    const clearAllTasksBtn = document.getElementById('clearAllTasksBtn');
    const toggleNotificationsBtn = document.getElementById('toggleNotificationsBtn');
    const notificationStatusSpan = document.getElementById('notificationStatus');
    const charCounter = document.getElementById('charCounter');
    const taskDateInput = document.getElementById('taskDate');

    // Nuevos selectores para la funcionalidad de ordenación
    const dropdownSortToggle = document.querySelector('.dropdown-sort .dropdown-toggle');
    const dropdownSortContent = document.querySelector('.dropdown-sort .dropdown-content');
    const sortByPriorityBtn = document.getElementById('sortByPriority');
    const sortByDateBtn = document.getElementById('sortByDate');
    const sortByCreationBtn = document.getElementById('sortByCreation');

    // --- Variables de Estado Globales ---
    let notificationPermissionGranted = false;
    // Carga la preferencia de notificación del usuario, por defecto a falso si no está definida
    let userNotificationsEnabled = JSON.parse(localStorage.getItem('userNotificationsEnabled')) || false;
    let notificationIntervalId = null; // Para almacenar el ID del intervalo de notificaciones
    // Carga las tareas desde localStorage o inicializa un array vacío si no hay tareas guardadas
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // --- Funcionalidad de Temas ---
    // Carga el tema guardado en localStorage al iniciar la aplicación
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateToggleIcon(savedTheme);
    }

    // Maneja el cambio de tema al hacer clic en el botón de alternar tema
    themeToggle.addEventListener('click', function () {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(newTheme);
    });

    // Actualiza el icono del botón de tema para reflejar el tema actual
    function updateToggleIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }

    // --- Funciones de Utilidad ---
    // Formatea una cadena de fecha a un formato legible (dd/mm/aaaa)
    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', options);
    }

    // --- Funciones de Notificaciones ---

    // Envía una notificación de tarea al usuario
    function sendTaskNotification(task) {
        if (notificationPermissionGranted && userNotificationsEnabled) {
            const today = new Date().toISOString().split('T')[0];

            // Envía la notificación solo si no ha sido notificada para hoy
            if (task.notifiedForDay !== today) {
                new Notification("TareaMaster: Tarea Próxima", {
                    body: `${task.text} vence el ${formatDate(task.date)}`,
                    icon: 'LOGOINTERFAZ.png' // Asegúrate de que esta ruta sea accesible
                });

                task.notifiedForDay = today; // Marca la tarea como notificada para hoy
                saveTasks(); // Guarda el estado actualizado de la tarea
            }
        }
    }

    // Comprueba las tareas próximas a vencer y envía notificaciones si aplica
    function checkAndSendDueTaskNotifications() {
        if (!notificationPermissionGranted || !userNotificationsEnabled) {
            return; // Sale si no hay permiso o las notificaciones están desactivadas
        }

        const now = new Date();
        // Define el umbral para "próxima a vencer": hasta el final del día de mañana
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Inicio de hoy

        tasks.forEach(task => {
            // Asegura que la tarea tenga fecha, no esté completada y la fecha sea válida
            if (task.date && !task.completed && !isNaN(new Date(task.date))) {
                const taskDueDate = new Date(task.date);
                // Normaliza la fecha de vencimiento de la tarea al inicio del día para la comparación
                const taskDueDay = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate(), 0, 0, 0);

                // Comprueba si la tarea vence hoy o mañana
                if (taskDueDay >= todayStart && taskDueDay <= tomorrow) {
                    sendTaskNotification(task);
                }
            }
        });
    }

    // Actualiza el estado visual del botón de notificaciones
    function updateNotificationUI() {
        if (notificationStatusSpan && toggleNotificationsBtn) {
            const icon = toggleNotificationsBtn.querySelector('i');
            if (userNotificationsEnabled && notificationPermissionGranted) {
                notificationStatusSpan.textContent = 'ON';
                notificationStatusSpan.classList.add('active');
                if (icon) icon.classList.replace('fa-bell-slash', 'fa-bell');
            } else {
                notificationStatusSpan.textContent = 'OFF';
                notificationStatusSpan.classList.remove('active');
                if (icon) icon.classList.replace('fa-bell', 'fa-bell-slash');
            }
        }
    }

    // Inicia el intervalo para comprobar y enviar notificaciones
    function startNotificationChecks() {
        if (notificationIntervalId === null) {
            notificationIntervalId = setInterval(() => {
                checkAndSendDueTaskNotifications();
            }, 3600000); // Cada hora (3.600.000 milisegundos)
        }
    }

    // Detiene el intervalo de comprobación de notificaciones
    function stopNotificationChecks() {
        if (notificationIntervalId !== null) {
            clearInterval(notificationIntervalId);
            notificationIntervalId = null;
        }
    }

    // Alterna el estado de las notificaciones (activar/desactivar por el usuario)
    function toggleNotifications() {
        if (!userNotificationsEnabled) { // Si el usuario las quiere activar
            if (!("Notification" in window)) {
                // Usar un modal en lugar de alert
                showModal("Tu navegador no soporta notificaciones de escritorio.");
                return;
            }

            if (Notification.permission === "denied") {
                showModal("Las notificaciones están bloqueadas por tu navegador. Por favor, revoca el permiso manualmente en la configuración del sitio para activarlas.");
                userNotificationsEnabled = false; // Asegura que el estado interno sea 'OFF'
                localStorage.setItem('userNotificationsEnabled', false);
                updateNotificationUI();
                return;
            }

            if (Notification.permission === "granted") {
                notificationPermissionGranted = true;
                userNotificationsEnabled = true;
                localStorage.setItem('userNotificationsEnabled', true);
                startNotificationChecks();
                checkAndSendDueTaskNotifications(); // Ejecutar inmediatamente
                updateNotificationUI();
            } else { // Permiso es 'default'
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        notificationPermissionGranted = true;
                        userNotificationsEnabled = true;
                        localStorage.setItem('userNotificationsEnabled', true);
                        startNotificationChecks();
                        checkAndSendDueTaskNotifications();
                    } else {
                        notificationPermissionGranted = false;
                        userNotificationsEnabled = false;
                        localStorage.setItem('userNotificationsEnabled', false);
                        showModal("Has denegado el permiso de notificaciones. No podremos enviarte alertas.");
                    }
                    updateNotificationUI();
                });
            }
        } else { // Si el usuario las quiere desactivar
            userNotificationsEnabled = false;
            localStorage.setItem('userNotificationsEnabled', false);
            stopNotificationChecks();
            updateNotificationUI();
        }
    }

    // --- Funcionalidad de Tareas ---

    // Renderiza las tareas en la lista
    function renderTasks() {
        taskList.innerHTML = ''; // Limpia la lista actual
        tasks.forEach((task) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.className = `prioritat-${task.priority || 'null'}`;
            li.dataset.id = task.id; // Asigna el ID único para referencia en reordenación

            // Icono de prioridad
            if (task.priority) {
                const priorityIcon = document.createElement('i');
                priorityIcon.className = task.priority === 'alta' ? 'fas fa-exclamation-circle' :
                                        task.priority === 'mitjana' ? 'fas fa-exclamation-triangle' :
                                        task.priority === 'baixa' ? 'fas fa-check-circle' : '';
                li.appendChild(priorityIcon);
            }

            // Texto de la tarea (unificado con fecha)
            const taskText = document.createElement('span');
            taskText.textContent = task.text + (task.date ? ` (${formatDate(task.date)})` : '');
            li.appendChild(taskText);

            // Contenedor de botones
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');

            // Botón de completado
            const completeBtn = document.createElement('button');
            completeBtn.classList.add('complete-btn');
            completeBtn.innerHTML = '<i class="fas fa-check"></i>'; // Icono de check
            completeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleTaskCompletion(task.id); // Pasa el ID en lugar del índice
            });

            // Botón de editar
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>'; // Icono de editar
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(task.id, li); // Pasa el ID y el elemento li
            });

            // Botón de eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>'; // Icono de basura
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id); // Pasa el ID
            });

            buttonContainer.appendChild(completeBtn);
            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);
            li.appendChild(buttonContainer);
            taskList.appendChild(li);

            // Aplica la clase 'completed' si la tarea está completada
            if (task.completed) {
                li.classList.add('completed');
            }
        });
    }

    // Añade una nueva tarea a la lista
    function addTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const date = taskDateInput.value || null; // Obtiene la fecha del input

        if (text.length > 24) {
            showModal("La tarea no puede tener más de 24 caracteres.");
            return;
        }
        if (text === '') {
            showModal("La descripción de la tarea no puede estar vacía.");
            return;
        }

        if (text !== '') {
            // Crea un ID único y la fecha de creación para la tarea
            const newTask = {
                id: crypto.randomUUID(), // Genera un ID único para la tarea
                text,
                priority: priority || null,
                date,
                completed: false,
                notifiedForDay: null,
                creationDate: Date.now() // Almacena el timestamp de creación
            };
            tasks.push(newTask); // Añade la nueva tarea al array
            taskInput.value = '';
            prioritySelect.value = '';
            taskDateInput.value = '';
            charCounter.textContent = '0/24';
            saveTasks();
            renderTasks();
            // Si las notificaciones están activadas, comprueba si debe enviar una para la nueva tarea
            if (userNotificationsEnabled && notificationPermissionGranted) {
                checkAndSendDueTaskNotifications();
            }
        }
    }

    // Alterna el estado de completado de una tarea
    function toggleTaskCompletion(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
        }
    }

    // Elimina una tarea
    function deleteTask(taskId) {
        // Usar un modal de confirmación
        showConfirmationModal('¿Estás seguro de que quieres eliminar esta tarea?', () => {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
        });
    }

    // Edita una tarea existente
    function editTask(taskId, li) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Desactivar el arrastre mientras se edita
        li.draggable = false;

        // Crear elementos del formulario de edición
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.text;
        editInput.classList.add('edit-input');
        editInput.maxLength = 24; // Limita los caracteres también en edición

        const charCounterEdit = document.createElement('div');
        charCounterEdit.classList.add('char-counter', 'edit-char-counter');
        charCounterEdit.textContent = `${editInput.value.length}/24`;

        editInput.addEventListener('input', function() {
            const currentLength = editInput.value.length;
            charCounterEdit.textContent = `${currentLength}/24`;
            charCounterEdit.style.color = currentLength > 24 ? 'red' : '#666';
        });

        const prioritySelectEdit = document.createElement('select');
        prioritySelectEdit.innerHTML = `
            <option value="">Sin prioridad</option>
            <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
            <option value="mitjana" ${task.priority === 'mitjana' ? 'selected' : ''}>Media</option>
            <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>Baja</option>
        `;
        prioritySelectEdit.classList.add('priority-select');

        const dateInputEdit = document.createElement('input');
        dateInputEdit.type = 'date';
        dateInputEdit.value = task.date || '';
        dateInputEdit.classList.add('date-input');

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Guardar';
        saveBtn.classList.add('save-btn');
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const newText = editInput.value.trim();
            if (newText.length > 24) {
                showModal("La tarea no puede tener más de 24 caracteres.");
                return;
            }
            if (newText === '') {
                showModal("La descripción de la tarea no puede estar vacía.");
                return;
            }

            task.text = newText;
            task.priority = prioritySelectEdit.value || null;
            task.date = dateInputEdit.value || null;
            saveTasks();
            renderTasks();
            li.draggable = true; // Reactivar arrastre
        });

        // Limpiar el contenido de la tarea y añadir el formulario de edición
        li.innerHTML = '';
        li.appendChild(editInput);
        li.appendChild(prioritySelectEdit);
        li.appendChild(dateInputEdit);
        li.appendChild(saveBtn);
    }

    // Guarda las tareas en localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // --- Funcionalidad de Ordenación ---

    // Ordena las tareas según el tipo especificado
    function sortTasks(type) {
        switch (type) {
            case 'priority':
                // Define el orden de prioridad: Alta > Media > Baja > Sin Prioridad
                const priorityOrder = { 'alta': 1, 'mitjana': 2, 'baixa': 3, 'null': 4, '': 4 };
                tasks.sort((a, b) => {
                    const priorityA = priorityOrder[a.priority || 'null'];
                    const priorityB = priorityOrder[b.priority || 'null'];

                    // Ordena por prioridad primero
                    if (priorityA !== priorityB) {
                        return priorityA - priorityB;
                    }
                    // Si las prioridades son iguales, ordena por fecha (las que tienen fecha primero)
                    return sortByDateComparator(a, b);
                });
                break;
            case 'date':
                tasks.sort(sortByDateComparator);
                break;
            case 'creation':
                // Ordena por la fecha de creación (más reciente primero)
                tasks.sort((a, b) => b.creationDate - a.creationDate);
                break;
            default:
                // No hace nada o aplica un orden por defecto si es necesario
                break;
        }
        saveTasks();
        renderTasks();
    }

    // Comparador de fechas para la función de ordenación
    function sortByDateComparator(a, b) {
        const dateA = a.date ? new Date(a.date).getTime() : Infinity; // Tareas sin fecha van al final
        const dateB = b.date ? new Date(b.date).getTime() : Infinity; // Tareas sin fecha van al final
        return dateA - dateB;
    }

    // --- Event Listeners Principales ---

    // Añadir tareas con el botón
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', addTask);
    }

    // Añadir tareas con la tecla Enter
    if (taskInput) {
        taskInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
        });
        // Contador de caracteres para el input de tarea
        taskInput.addEventListener('input', function () {
            const currentLength = taskInput.value.length;
            if (charCounter) {
                charCounter.textContent = `${currentLength}/24`;
                charCounter.style.color = currentLength > 24 ? 'red' : '#666';
            }
        });
    }

    // Configura SortableJS para la lista de tareas (arrastrar y soltar)
    if (taskList && typeof Sortable !== 'undefined') {
        Sortable.create(taskList, {
            animation: 150,
            ghostClass: 'ghost',
            onEnd: function (evt) {
                updateTaskOrder(); // Actualiza el orden después de arrastrar y soltar
            }
        });
    }

    // Actualiza el orden de las tareas en el localStorage después de arrastrar y soltar
    function updateTaskOrder() {
        const updatedTasks = [];
        Array.from(taskList.children).forEach((taskElement) => {
            const taskId = taskElement.dataset.id; // Obtiene el ID de la tarea
            const originalTask = tasks.find(t => t.id === taskId); // Busca la tarea original por su ID

            if (originalTask) {
                updatedTasks.push(originalTask); // Añade la tarea original con todos sus datos
            }
        });
        tasks = updatedTasks;
        saveTasks();
        // No es necesario llamar a renderTasks aquí, SortableJS ya actualiza el DOM
        // y la UI ya refleja el nuevo orden visualmente.
    }

    // --- Funcionalidad del botón de ajustes y menú ---

    // Muestra/oculta el menú de ajustes al hacer clic en el botón de ajustes
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(event) {
            if (settingsMenu) {
                settingsMenu.classList.toggle('active');
            }
            event.stopPropagation(); // Evita que el clic se propague y cierre el menú inmediatamente
        });
    }

    // Oculta el menú de ajustes y el desplegable de ordenación si se hace clic fuera de ellos
    document.addEventListener('click', function(event) {
        if (settingsMenu && settingsBtn && !settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
            settingsMenu.classList.remove('active');
        }
        if (dropdownSortContent && dropdownSortToggle && !dropdownSortContent.contains(event.target) && !dropdownSortToggle.contains(event.target)) {
            dropdownSortContent.classList.remove('active'); // Oculta el desplegable de ordenación
        }
    });

    // Elimina todas las tareas (con confirmación)
    if (clearAllTasksBtn) {
        clearAllTasksBtn.addEventListener('click', function() {
            showConfirmationModal('¿Estás seguro de que quieres eliminar TODAS las tareas pendientes? Esta acción no se puede deshacer.', () => {
                tasks = [];
                saveTasks();
                renderTasks();
                if (settingsMenu) {
                    settingsMenu.classList.remove('active');
                }
            });
        });
    }

    // --- Inicialización y Event Listeners para Notificaciones ---

    // Event listener para el botón de activar/desactivar notificaciones
    if (toggleNotificationsBtn) {
        toggleNotificationsBtn.addEventListener('click', toggleNotifications);
    }

    // Comprueba el soporte de notificaciones del navegador al cargar la página
    if ("Notification" in window) {
        if (Notification.permission === "granted") {
            notificationPermissionGranted = true;
        } else {
            notificationPermissionGranted = false;
        }
    } else {
        notificationPermissionGranted = false;
        if (toggleNotificationsBtn) {
            toggleNotificationsBtn.disabled = true;
            toggleNotificationsBtn.textContent = "Notificaciones (No Soportadas)";
            const icon = toggleNotificationsBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bell-slash';
        }
    }

    updateNotificationUI(); // Actualiza la UI del botón de notificaciones al cargar

    // Si el usuario las tenía activadas y el navegador tiene permiso, iniciar las comprobaciones
    if (userNotificationsEnabled && notificationPermissionGranted) {
        startNotificationChecks();
        checkAndSendDueTaskNotifications(); // Primera comprobación al iniciar
    }

    // --- Funcionalidad del Campo de Fecha ---
    if (taskDateInput) {
        taskDateInput.addEventListener('focus', function() {
            if(!this.value) this.type = 'date';
        });
        taskDateInput.addEventListener('blur', function() {
            if(!this.value) {
                this.type = 'text';
                this.placeholder = 'dd/mm/aaaa';
            }
        });
    }

    // --- Nuevos Event Listeners para la ordenación ---

    // Muestra/oculta el contenido del desplegable de ordenación
    if (dropdownSortToggle) {
        dropdownSortToggle.addEventListener('click', function(event) {
            if (dropdownSortContent) {
                dropdownSortContent.classList.toggle('active');
            }
            event.stopPropagation(); // Evita que el clic se propague al documento y cierre inmediatamente
        });
    }

    // Event listeners para los botones de ordenación
    if (sortByPriorityBtn) {
        sortByPriorityBtn.addEventListener('click', () => {
            sortTasks('priority');
            if (dropdownSortContent) dropdownSortContent.classList.remove('active'); // Cierra el desplegable
            if (settingsMenu) settingsMenu.classList.remove('active'); // Cierra el menú principal
        });
    }
    if (sortByDateBtn) {
        sortByDateBtn.addEventListener('click', () => {
            sortTasks('date');
            if (dropdownSortContent) dropdownSortContent.classList.remove('active');
            if (settingsMenu) settingsMenu.classList.remove('active');
        });
    }
    if (sortByCreationBtn) {
        sortByCreationBtn.addEventListener('click', () => {
            sortTasks('creation');
            if (dropdownSortContent) dropdownSortContent.classList.remove('active');
            if (settingsMenu) settingsMenu.classList.remove('active');
        });
    }

    // --- Funciones para Modales (Reemplazo de alert/confirm) ---
    function showModal(message) {
        const modalDiv = document.createElement('div');
        modalDiv.classList.add('custom-modal'); // Añade clase para estilos CSS
        modalDiv.innerHTML = `
            <div class="custom-modal-content">
                <p>${message}</p>
                <button class="custom-modal-ok-btn">OK</button>
            </div>
        `;
        document.body.appendChild(modalDiv);

        modalDiv.querySelector('.custom-modal-ok-btn').addEventListener('click', () => {
            document.body.removeChild(modalDiv);
        });
    }

    function showConfirmationModal(message, onConfirm) {
        const modalDiv = document.createElement('div');
        modalDiv.classList.add('custom-modal');
        modalDiv.innerHTML = `
            <div class="custom-modal-content">
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="custom-modal-confirm-btn">Sí</button>
                    <button class="custom-modal-cancel-btn">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalDiv);

        modalDiv.querySelector('.custom-modal-confirm-btn').addEventListener('click', () => {
            document.body.removeChild(modalDiv);
            onConfirm();
        });

        modalDiv.querySelector('.custom-modal-cancel-btn').addEventListener('click', () => {
            document.body.removeChild(modalDiv);
        });
    }

    // Renderiza las tareas iniciales al cargar la página
    renderTasks();
});
