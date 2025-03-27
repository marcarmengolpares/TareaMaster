document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    const prioritySelect = document.getElementById('prioritySelect');

    // Carrega el tema desat a localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateToggleIcon(savedTheme);
    }

    // Canvia el tema quan es faci clic al botó
    themeToggle.addEventListener('click', function () {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateToggleIcon(newTheme);
    });

    function formatDate(dateString) {
        if (!dateString) return '';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Actualitza la icona del botó de tema
    function updateToggleIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Carrega les tasques des de localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Renderitza les tasques a la llista
    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.draggable = true;
            li.className = `prioritat-${task.priority || 'null'}`;
    
            // Icona de prioritat
            if (task.priority) {
                const priorityIcon = document.createElement('i');
                priorityIcon.className = task.priority === 'alta' ? 'fas fa-exclamation-circle' :
                                         task.priority === 'mitjana' ? 'fas fa-exclamation-triangle' :
                                         'fas fa-check-circle';
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

    // Afegir una nova tasca
    // En la función addTask, modifica la validación de longitud:
    function addTask() {
        const text = taskInput.value.trim();
        const priority = prioritySelect.value;
        const date = document.getElementById('taskDate').value || null; // Nueva línea
    
        if (text.length > 24) {
            alert("La tarea no puede tener más de 24 caracteres.");
            return;
        }
    
        if (text !== '') {
            tasks.push({ text, priority: priority || null, date, completed: false }); // Añade 'date'
            taskInput.value = '';
            prioritySelect.value = '';
            document.getElementById('taskDate').value = ''; // Limpia el campo fecha
            charCounter.textContent = '0/24';
            saveTasks();
            renderTasks();
        }
    }

    // Marca una tasca com completada o no completada
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
        task.date = dateInput.value || null; // Nueva línea
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            task.text = editInput.value.trim(); // Actualitzar el text de la tasca
            task.priority = prioritySelect.value || null; // Actualitzar la prioritat (o treure-la si és buida)
            saveTasks();
            renderTasks();

            // Reactivar l'arrossegament després de guardar
            li.draggable = true;
        });

        // Netejar el contingut de la tasca i afegir el formulari d'edició
        li.innerHTML = '';
        li.appendChild(editInput);
        li.appendChild(prioritySelect);
        li.appendChild(saveBtn);
    }

    // Guarda les tasques a localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Afegir tasques amb el botó
    addTaskBtn.addEventListener('click', addTask);

    // Afegir tasques amb la tecla Enter
    // Afegir tasques amb la tecla Enter
    taskInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evita que es propagui l'esdeveniment
        addTask(); // Crida la funció per afegir la tasca
    }
    });
    // Limitar el nombre de caràcters al camp d'entrada
    taskInput.addEventListener('input', function () {
        const currentLength = taskInput.value.length;
        charCounter.textContent = `${currentLength}/24`; // Actualitza el comptador
    
        // Canvia el color si s'arriba al límit
        if (currentLength > 24) {
            charCounter.style.color = 'red'; // Color vermell si supera el límit
        } else {
            charCounter.style.color = '#666'; // Color gris si està dins del límit
        }
    });
    

    // Renderitza les tasques inicials
    renderTasks();

    // Configura SortableJS per a la llista de tasques
    Sortable.create(taskList, {
        animation: 150,
        ghostClass: 'ghost',
        onEnd: function (evt) {
            updateTaskOrder();
        }
    });

    // Actualitza l'ordre de les tasques al localStorage
    function updateTaskOrder() {
        const updatedTasks = [];
        Array.from(taskList.children).forEach((taskElement) => {
            const taskText = taskElement.querySelector('span').textContent.replace(/ \(\d{4}-\d{2}-\d{2}\)$/, ''); // Elimina la fecha del texto
            const taskPriority = taskElement.className.replace('prioritat-', ''); // Obtiene la prioridad de la clase
            const originalTask = tasks.find(t => t.text === taskText); // Busca la tarea original
            
            updatedTasks.push({
                text: taskText,
                priority: taskPriority !== 'null' ? taskPriority : null,
                date: originalTask ? originalTask.date : null, // Mantiene la fecha original
                completed: originalTask ? originalTask.completed : false
            });
        });
        
        tasks = updatedTasks;
        saveTasks();
    }
});

// En el DOMContentLoaded, añade:
document.getElementById('taskDate').addEventListener('focus', function() {
    if(!this.value) this.type = 'date';
});
document.getElementById('taskDate').addEventListener('blur', function() {
    if(!this.value) {
        this.type = 'text';
        this.placeholder = 'dd/mm/aaaa';
    }
});
