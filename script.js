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
    const charCounter = document.getElementById('charCounter'); // Asegúrate de tener este elemento en tu HTML

    // --- Variables de Estado Globales ---
    let notificationPermissionGranted = false;
    let userNotificationsEnabled = JSON.parse(localStorage.getItem('userNotificationsEnabled')) || false; // Preferencia del usuario
    let notificationIntervalId = null; // Para almacenar el ID del intervalo y poder limpiarlo
    let tasks = JSON.parse(localStorage.getItem('tasks')) || []; // Carga las tareas desde localStorage

    // --- Funcionalidad de Temas ---
    // Carga el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateToggleIcon(savedTheme);
    }

    // Cambia el tema cuando se hace clic en el botón
    themeToggle.addEventListener('click', function () {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(newTheme);
    });

    // Actualiza el icono del botón de tema
    function updateToggleIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (icon) { // Asegurarse de que el icono existe
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
    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        // Asegúrate de que la fecha sea válida antes de formatear
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', options);
    }

    // --- Funciones de Notificaciones ---

    // Función para enviar una notificación de tarea
    function sendTaskNotification(task) {
        if (notificationPermissionGranted && userNotificationsEnabled) {
            const today = new Date().toISOString().split('T')[0];

            if (task.notifiedForDay !== today) {
                new Notification("TareaMaster: Tarea Próxima", {
                    body: `${task.text} vence el ${formatDate(task.date)}`,
                    icon: 'LOGOINTERFAZ.png' // Asegúrate de que esta ruta sea correcta
                });

                task.notifiedForDay = today;
                saveTasks();
            }
        }
    }

    // Función para comprobar tareas próximas a vencer y enviar notificaciones
    function checkAndSendDueTaskNotifications() {
        if (!notificationPermissionGranted || !userNotificationsEnabled) {
            return; // No hacer nada si no hay permiso del navegador o el usuario las ha desactivado
        }
    
        const now = new Date();
        // Establecer el umbral para "próxima a vencer": hasta el final del día de mañana
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Inicio de hoy
    
        tasks.forEach(task => {
            // Asegurarse de que la tarea tiene fecha, no está completada y la fecha es válida
            if (task.date && !task.completed && !isNaN(new Date(task.date))) {
                const taskDueDate = new Date(task.date); // Convertir la fecha de la tarea a objeto Date
    
                // Normalizar taskDueDate a inicio del día para la comparación
                const taskDueDay = new Date(taskDueDate.getFullYear(), taskDueDate.getMonth(), taskDueDate.getDate(), 0, 0, 0);
    
                // Comprobar si la tarea vence hoy o mañana
                if (taskDueDay >= today && taskDueDay <= tomorrow) {
                    sendTaskNotification(task);
                }
            }
        });
    }
    
    // Función para actualizar el estado visual del botón de notificaciones
    function updateNotificationUI() {
        // --- INICIO DE VERIFICACIÓN PARA DEPURACIÓN ---
        console.log("--- updateNotificationUI() SE HA EJECUTADO ---");
        console.log("  Estado userNotificationsEnabled (preferencia del usuario):", userNotificationsEnabled);
        console.log("  Estado notificationPermissionGranted (permiso del navegador):", notificationPermissionGranted);
        console.log("  Permiso directo del navegador (Notification.permission):", "Notification" in window ? Notification.permission : "No soportado");
        // --- FIN DE VERIFICACIÓN PARA DEPURACIÓN ---

        if (userNotificationsEnabled && notificationPermissionGranted) {
            if (notificationStatusSpan) {
                notificationStatusSpan.textContent = 'ON';
                notificationStatusSpan.classList.add('active');
            }
            if (toggleNotificationsBtn) {
                const icon = toggleNotificationsBtn.querySelector('i');
                if (icon) {
                    icon.classList.replace('fa-bell-slash', 'fa-bell');
                }
            }
            console.log("  Decisión: MOSTRAR 'ON'");
        } else {
            if (notificationStatusSpan) {
                notificationStatusSpan.textContent = 'OFF';
                notificationStatusSpan.classList.remove('active');
            }
            if (toggleNotificationsBtn) {
                const icon = toggleNotificationsBtn.querySelector('i');
                if (icon) {
                    icon.classList.replace('fa-bell', 'fa-bell-slash');
                }
            }
            console.log("  Decisión: MOSTRAR 'OFF'");
        }
    }

    function startNotificationChecks() {
        if (notificationIntervalId === null) { // Solo si no está ya activo
            notificationIntervalId = setInterval(() => {
                checkAndSendDueTaskNotifications();
            }, 3600000); // Cada hora (3.600.000 milisegundos)
            console.log("Comprobaciones de notificación iniciadas.");
        }
    }
    
    function stopNotificationChecks() {
        if (notificationIntervalId !== null) {
            clearInterval(notificationIntervalId);
            notificationIntervalId = null;
            console.log("Comprobaciones de notificación detenidas.");
        }
    }

    // Función para activar/desactivar notificaciones (control del usuario)
    function toggleNotifications() {
        console.log("toggleNotifications: Se hizo clic. userNotificationsEnabled (antes):", userNotificationsEnabled);
        if (!userNotificationsEnabled) { // Si el usuario las quiere activar
            console.log("Intentando activar notificaciones.");
            if (!("Notification" in window)) {
                alert("Tu navegador no soporta notificaciones de escritorio.");
                console.log("toggleNotifications: Navegador no soporta.");
                return;
            }

            console.log("toggleNotifications: Permiso del navegador ANTES de pedir:", Notification.permission);
            if (Notification.permission === "denied") {
                alert("Las notificaciones están bloqueadas por tu navegador. Por favor, revoca el permiso manualmente en la configuración del sitio para activarlas.");
                console.log("toggleNotifications: Permiso denegado por el navegador.");
                // Aunque el permiso esté denegado por el navegador, el usuario podría intentar activarlas,
                // así que nos aseguramos de que el estado interno sea 'OFF' para la UI
                userNotificationsEnabled = false;
                localStorage.setItem('userNotificationsEnabled', false);
                updateNotificationUI(); // Actualizar UI a OFF
                return;
            }

            if (Notification.permission === "granted") {
                console.log("toggleNotifications: Permiso ya concedido por el navegador.");
                notificationPermissionGranted = true;
                userNotificationsEnabled = true;
                localStorage.setItem('userNotificationsEnabled', true);
                startNotificationChecks();
                checkAndSendDueTaskNotifications(); // Ejecutar inmediatamente
                updateNotificationUI(); // Actualizar UI después de la interacción
            } else { // Permiso es 'default'
                console.log("toggleNotifications: Permiso en estado 'default', solicitando...");
                Notification.requestPermission().then(permission => {
                    console.log("toggleNotifications: Respuesta del navegador:", permission);
                    if (permission === "granted") {
                        notificationPermissionGranted = true;
                        userNotificationsEnabled = true;
                        localStorage.setItem('userNotificationsEnabled', true);
                        startNotificationChecks();
                        checkAndSendDueTaskNotifications(); // Ejecutar inmediatamente
                    } else {
                        // El usuario denegó el permiso en este momento
                        notificationPermissionGranted = false;
                        userNotificationsEnabled = false; // Asegurarse de que el switch esté en OFF
                        localStorage.setItem('userNotificationsEnabled', false);
                        alert("Has denegado el permiso de notificaciones. No podremos enviarte alertas.");
                    }
                    updateNotificationUI(); // Actualizar UI después de la interacción
                });
            }
        } else { // Si el usuario las quiere desactivar
            console.log("Intentando desactivar notificaciones.");
            userNotificationsEnabled = false;
            localStorage.setItem('userNotificationsEnabled', false);
            stopNotificationChecks();
            updateNotificationUI(); // Actualizar el estado visual del botón
        }
        console.log("toggleNotifications: userNotificationsEnabled (DESPUÉS):", userNotificationsEnabled);
        console.log("toggleNotifications: notificationPermissionGranted (DESPUÉS):", notificationPermissionGranted);
    }


    // --- Funcionalidad de Tareas ---

    // Renderiza las tareas en la lista
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.className = `prioritat-${task.priority || 'null'}`;
    
            // Icono de prioritat
            if (task.priority) {
                const priorityIcon = document.createElement('i');
                priorityIcon.className = task.priority === 'alta' ? 'fas fa-exclamation-circle' :
                                        task.priority === 'mitjana' ? 'fas fa-exclamation-triangle' : 
                                        task.priority === 'baixa' ? 'fas fa-check-circle' : ''; // Agregado 'baixa'
                li.appendChild(priorityIcon);
            }
    
            // Text de la tasca (unificado con fecha)
            const taskText = document.createElement('span');
            taskText.textContent = task.text + (task.date ? ` (${formatDate(task.date)})` : '');
            li.appendChild(taskText);
    
            // Botones
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(index, li);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(index);
            });
            
            buttonContainer.appendChild(editBtn);
            buttonContainer.appendChild(deleteBtn);
            li.appendChild(buttonContainer);
            taskList.appendChild(li);
    
            if (task.completed) {
                li.classList.add('completed');
            }
        });
    }

    // Añadir una nueva tarea
    function addTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const date = document.getElementById('taskDate').value || null; // Nueva línea
    
        if (text.length > 24) {
            alert("La tarea no puede tener más de 24 caracteres.");
            return;
        }
    
        if (text !== '') {
            // Asegúrate de que el objeto task contenga notifiedForDay
            tasks.push({ text, priority: priority || null, date, completed: false, notifiedForDay: null }); 
            taskInput.value = '';
            prioritySelect.value = '';
            document.getElementById('taskDate').value = ''; // Limpia el campo fecha
            charCounter.textContent = '0/24';
            saveTasks();
            renderTasks();
        }
    }

    // Marca una tasca como completada o no completada
    function toggleTaskCompletion(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    // Elimina una tasca
    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    // Edita una tasca
    function editTask(index, li) {
        const task = tasks[index];
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = task.date || '';
        dateInput.classList.add('date-input');

        // Desactivar l'arrossegament mentre s'està editant
        li.draggable = false;

        // Crear un input per editar el text de la tasca
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.text;
        editInput.classList.add('edit-input');

        // Crear un selector per editar la prioritat (incloent opció per treure-la)
        const prioritySelect = document.createElement('select');
        prioritySelect.innerHTML = `
            <option value="">Sense prioritat</option>
            <option value="alta" ${task.priority === 'alta' ? 'selected' : ''}>Alta</option>
            <option value="mitjana" ${task.priority === 'mitjana' ? 'selected' : ''}>Mitjana</option>
            <option value="baixa" ${task.priority === 'baixa' ? 'selected' : ''}>Baixa</option>
        `;
        prioritySelect.classList.add('priority-select');

        // Crear el botó de guardar
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Guardar';
        saveBtn.classList.add('save-btn');
        // task.date = dateInput.value || null; // Esta línea debería ir en el event listener del saveBtn
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            task.text = editInput.value.trim(); // Actualitzar el text de la tasca
            task.priority = prioritySelect.value || null; // Actualitzar la prioritat (o treure-la si és buida)
            task.date = dateInput.value || null; // Actualizar la fecha
            saveTasks();
            renderTasks();

            // Reactivar l'arrossegament després de guardar
            li.draggable = true;
        });

        // Netejar el contingut de la tasca i afegir el formulari d'edició
        li.innerHTML = '';
        li.appendChild(editInput);
        li.appendChild(prioritySelect);
        li.appendChild(dateInput); // Añadir el campo de fecha al editar
        li.appendChild(saveBtn);
    }

    // Guarda les tasques a localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
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
                e.preventDefault(); // Evita que se propague el evento
                addTask(); // Llama a la función para añadir la tarea
            }
        });
        // Limitar el nombre de caràcters al camp d'entrada
        taskInput.addEventListener('input', function () {
            const currentLength = taskInput.value.length;
            if (charCounter) {
                charCounter.textContent = `${currentLength}/24`; // Actualiza el contador
                // Cambia el color si se llega al límite
                if (currentLength > 24) {
                    charCounter.style.color = 'red'; // Color rojo si supera el límite
                } else {
                    charCounter.style.color = '#666'; // Color gris si está dentro del límite
                }
            }
        });
    }

    // Renderiza las tareas iniciales al cargar
    renderTasks();

    // Configura SortableJS para la lista de tareas
    if (taskList && typeof Sortable !== 'undefined') { // Asegúrate de que Sortable esté cargado
        Sortable.create(taskList, {
            animation: 150,
            ghostClass: 'ghost',
            onEnd: function (evt) {
                updateTaskOrder();
            }
        });
    }


    // Actualiza el orden de las tareas en el localStorage después de arrastrar y soltar
    function updateTaskOrder() {
        const updatedTasks = [];
        Array.from(taskList.children).forEach((taskElement) => {
            const taskTextElement = taskElement.querySelector('span');
            // Asegúrate de que taskTextElement exista antes de intentar acceder a textContent
            const rawTaskText = taskTextElement ? taskTextElement.textContent : '';
            const taskText = rawTaskText.replace(/ \(\d{2}\/\d{2}\/\d{4}\)$/, ''); // Elimina la fecha del texto formateado

            const taskPriority = taskElement.className.replace('prioritat-', ''); // Obtiene la prioridad de la clase
            const originalTask = tasks.find(t => t.text === taskText); // Busca la tarea original por el texto sin la fecha
            
            if (originalTask) {
                updatedTasks.push({
                    text: originalTask.text, // Usa el texto original para mayor precisión
                    priority: taskPriority !== 'null' ? taskPriority : null,
                    date: originalTask.date, // Mantiene la fecha original
                    completed: originalTask.completed,
                    notifiedForDay: originalTask.notifiedForDay || null // Mantiene el estado de notificación
                });
            }
        });
        
        tasks = updatedTasks;
        saveTasks();
    }

    // --- Funcionalidad del botón de ajustes y menú ---

    // Mostrar/ocultar el menú de ajustes al hacer clic en el botón
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function(event) {
            if (settingsMenu) {
                settingsMenu.classList.toggle('active');
            }
            event.stopPropagation(); // Evita que el clic se propague al documento
        });
    }


    // Ocultar el menú de ajustes si se hace clic fuera de él
    document.addEventListener('click', function(event) {
        if (settingsMenu && settingsBtn) {
            if (!settingsMenu.contains(event.target) && !settingsBtn.contains(event.target)) {
                settingsMenu.classList.remove('active');
            }
        }
    });

    // Eliminar todas las tareas
    if (clearAllTasksBtn) {
        clearAllTasksBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que quieres eliminar TODAS las tareas pendientes? Esta acción no se puede deshacer.')) {
                tasks = []; // Vacía el array de tareas
                saveTasks(); // Guarda el estado vacío en localStorage
                renderTasks(); // Vuelve a renderizar para mostrar la lista vacía
                if (settingsMenu) {
                    settingsMenu.classList.remove('active'); // Oculta el menú después de la acción
                }
            }
        });
    }

    // --- Inicialización y Event Listener para Notificaciones (AHORA EN EL LUGAR CORRECTO) ---

    // NEW: Event listener para el botón de activar/desactivar notificaciones
    // Asegúrate de que el botón de notificaciones exista antes de añadir el listener
    if (toggleNotificationsBtn) {
        toggleNotificationsBtn.addEventListener('click', toggleNotifications);
    }
    
    // Inicializar estado de las notificaciones al cargar la página
    if ("Notification" in window) {
        console.log("Soporte de Notificaciones del navegador: Sí");
        console.log("Permiso actual del navegador:", Notification.permission); // <-- MUY IMPORTANTE
        if (Notification.permission === "granted") {
            notificationPermissionGranted = true;
        } else {
            notificationPermissionGranted = false;
        }
    } else {
        console.log("Soporte de Notificaciones del navegador: NO");
        notificationPermissionGranted = false;
        // Opcional: Deshabilitar el botón de notificaciones si no hay soporte
        if (toggleNotificationsBtn) { // Asegúrate de que el botón exista antes de intentar acceder a él
            toggleNotificationsBtn.disabled = true;
            toggleNotificationsBtn.textContent = "Notificaciones (No Soportadas)"; // Esto podría ser un texto en el HTML
            const icon = toggleNotificationsBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bell-slash'; // Mostrar siempre tachada si no hay soporte
        }
    }

    console.log("userNotificationsEnabled al inicio:", userNotificationsEnabled); // <-- Importante
    console.log("notificationPermissionGranted al inicio:", notificationPermissionGranted); // <-- Importante

    updateNotificationUI(); // Actualiza la UI del botón de notificaciones al cargar la página

    // Si el usuario las tenía activadas y el navegador tiene permiso, iniciar las comprobaciones
    if (userNotificationsEnabled && notificationPermissionGranted) {
        startNotificationChecks();
        checkAndSendDueTaskNotifications(); // Primera comprobación al iniciar
    }


    // --- Funcionalidad del Campo de Fecha ---
    // En el DOMContentLoaded, añade:
    const taskDateInput = document.getElementById('taskDate'); // Asegúrate de que este ID exista
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
});
