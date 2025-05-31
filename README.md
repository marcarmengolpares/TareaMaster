# TareaMaster

¡Bienvenido a **TareaMaster**! Una aplicación web sencilla para gestionar tus tareas pendientes.

## Descripción
TareaMaster es una herramienta que te permite:
- Añadir nuevas tareas.
- Marcar tareas como completadas.
- Editar o eliminar tareas.
- Guardar tus tareas en el navegador (localStorage).
- **Priorizar tus tareas** con etiquetas visuales.
- **Modo oscuro** para una mejor experiencia visual.

## Consejos de uso
Aquí tienes algunos consejos para sacarle el máximo partido a TareaMaster:

1.  **Organiza tus tareas por prioridad**: Añade las tareas más importantes primero.
2.  **Usa etiquetas o colores**: Si tienes muchas tareas, puedes usar colores o etiquetas para categorizarlas.
3.  **Revisa tus tareas diariamente**: Marca las tareas completadas y añade nuevas según sea necesario.
4.  **Personaliza tu interfaz**: Cambia al modo oscuro si lo prefieres para una experiencia visual diferente.

## Cómo usar
1.  Clona este repositorio:
    ```bash
    git clone [https://marcarmengolpares.github.io/TareaMaster/](https://marcarmengolpares.github.io/TareaMaster/)
    ```

---
## Registro de Cambios

### Versión 1.2.0 (2025-5-31)
#### Añadido
- **Botón de Ajustes**: Implementación de un botón de ajustes flotante en la esquina inferior derecha.
- **Menú Desplegable de Ajustes**: Menú que aparece al hacer clic en el botón de ajustes.
- **Opción "Eliminar todas las tareas"**: Funcionalidad dentro del menú de ajustes para borrar todas las tareas pendientes con una confirmación de seguridad.
- **Integración con Modo Oscuro**: Los estilos del botón de ajustes y su menú se adaptan automáticamente al tema oscuro de la aplicación.

#### Mejorado
- **Estilo del Botón de Ajustes**: Eliminado el **contorno de enfoque y el círculo** que aparecían al interactuar con el botón, para una apariencia más limpia y coherente.
- **Posicionamiento**: Ajustada la posición del botón de ajustes para una mejor visibilidad y experiencia de usuario, moviéndolo ligeramente más arriba.

### Versión 1.1.0 (2025-3-16)
- Funcionalidad para editar la prioridad de las tareas.
- Posibilidad de quitar la prioridad de una tarea.
- Bloqueo del arrastre de tareas mientras se están editando.

#### Corregido
- Error que impedía añadir tareas nuevas.
- Problema con el color de fondo de las tareas sin prioridad.

#### Mejorado
- Optimización del CSS para hacerlo más corto y legible.

### Versión 1.0.0 (2025-3-5)
#### Añadido
- Funcionalidad básica para añadir, editar y eliminar tareas.
- Selección de prioridad para las tareas (alta, media, baja).
- Guardado de tareas en `localStorage`.
