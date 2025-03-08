document.addEventListener('DOMContentLoaded', function () {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    
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

    // Actualitza la icona del botó
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

    // Cargar tareas desde localStorage
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function renderTasks() {
        taskList.innerHTML = '';
        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.draggable = true; // Permet arrossegar les tasques
    
            // Icona de punts verticals
            const dragHandle = document.createElement('i');
            dragHandle.classList.add('fas', 'fa-grip-vertical', 'drag-handle');
            li.appendChild(dragHandle);
    
            // Text de la tasca
            const taskText = document.createElement('span');
            taskText.textContent = task.text;
            li.appendChild(taskText);
    
            // Botó d'editar
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.classList.add('edit-btn');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editTask(index, li);
            });
    
            // Botó d'eliminar
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(index);
            });
    
            li.appendChild(editBtn);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
    
            // Marca la tasca com a completada si és necessari
            if (task.completed) {
                li.classList.add('completed');
            }
        });
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text !== '') {
            tasks.push({ text, completed: false });
            taskInput.value = '';
            saveTasks();
            renderTasks();
        }
    }

    function toggleTaskCompletion(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    function editTask(index, li) {
        const task = tasks[index];
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.text;
        editInput.classList.add('edit-input');

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Guardar';
        saveBtn.classList.add('save-btn');
        saveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            task.text = editInput.value.trim();
            saveTasks();
            renderTasks();
        });

        li.innerHTML = '';
        li.appendChild(editInput);
        li.appendChild(saveBtn);
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    renderTasks();
});

// Configura SortableJS per a la llista de tasques
const taskList = document.getElementById('taskList');

Sortable.create(taskList, {
    animation: 150, // Duració de l'animació en mil·lisegons
    ghostClass: 'ghost', // Classe CSS per a l'element fantasma (opcional)
    onEnd: function (evt) {
        // Actualitza l'ordre de les tasques al localStorage
        updateTaskOrder();
    }
});

// Funció per actualitzar l'ordre de les tasques
function updateTaskOrder() {
    const tasks = Array.from(taskList.children).map((task, index) => {
        return {
            text: task.querySelector('span').textContent,
            completed: task.classList.contains('completed')
        };
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}
