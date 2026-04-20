// Variables del modal de agregar
const addModal = document.getElementById('add-script-modal');
let isAddEditorExpanded = false;
let isAdding = false;

// Función para salir del modo expandido (versión para agregar)
function exitAddExpandMode() {
    const wrapper = document.querySelector('#add-step-1 .code-mirror-wrapper');
    if (wrapper && wrapper.classList.contains('expanded')) {
        wrapper.classList.remove('expanded');
        isAddEditorExpanded = false;
        const exitBtn = wrapper.querySelector('.expand-exit-btn');
        if (exitBtn) exitBtn.remove();
        setTimeout(() => {
            if (window.addEditor) window.addEditor.refresh();
        }, 100);
    }
}

// Función para resetear el formulario de agregar
function resetAddForm() {
    exitAddExpandMode();
    showAddStep(1);
    const statusEl = document.getElementById('add-form-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.cssText = '';
        statusEl.style.display = 'none';
    }
}

// Función para cerrar el modal de agregar
function closeAddModal() {
    exitAddExpandMode();
    if (addModal) addModal.style.display = 'none';
    isAdding = false;
    
    // Limpiar el formulario
    const form = document.getElementById('add-script-form');
    if (form) form.reset();
    if (window.addEditor) window.addEditor.setValue('');
    
    // Limpiar mensajes de estado
    const statusEl = document.getElementById('add-form-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.cssText = '';
        statusEl.style.display = 'none';
    }
    
    // Restaurar botón de submit si estaba bloqueado
    const submitBtn = document.querySelector('#add-script-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Script';
        submitBtn.disabled = false;
    }
}

// Función para mostrar el modal de agregar
window.showAddModal = function() {
    // Resetear estado antes de abrir
    resetAddForm();
    isAdding = false;
    
    // Restaurar botón de submit
    const submitBtn = document.querySelector('#add-script-form button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Script';
        submitBtn.disabled = false;
    }
    
    // Limpiar mensajes de error
    const statusEl = document.getElementById('add-form-status');
    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.cssText = '';
        statusEl.style.display = 'none';
    }
    
    // Resetear al paso 1
    showAddStep(1);
    
    // Generar ID único para el nuevo script
    const newId = generateScriptId();
    document.getElementById('add-script-id').value = newId;
    
    // Limpiar campos
    document.getElementById('add-script-title').value = '';
    document.getElementById('add-script-author').value = '';
    document.getElementById('add-script-category').value = '';
    document.getElementById('add-script-notes').value = '';
    
    // Configurar CodeMirror
    const textarea = document.getElementById('add-script-content');
    if (window.addEditor) {
        window.addEditor.setValue('');
        window.addEditor.setSize(null, null);
        window.addEditor.setOption('mode', 'javascript');
    } else {
        window.addEditor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            mode: 'javascript',
            theme: 'dracula',
            lineWrapping: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        });
    }
    
    // Mostrar modal
    addModal.style.display = 'block';
    
    // Refrescar editor
    setTimeout(() => {
        if (window.addEditor) window.addEditor.refresh();
    }, 100);
};

// Función para generar ID único
function generateScriptId() {
    // Generar ID basado en timestamp y random
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `script_${timestamp}_${random}`;
}

// Botón expandir editor para agregar
document.getElementById('expand-add-editor-btn')?.addEventListener('click', () => {
    const wrapper = document.querySelector('#add-step-1 .code-mirror-wrapper');
    
    if (!wrapper.classList.contains('expanded')) {
        wrapper.classList.add('expanded');
        isAddEditorExpanded = true;
        
        const exitBtn = document.createElement('button');
        exitBtn.className = 'expand-exit-btn';
        exitBtn.innerHTML = '<i class="fas fa-compress"></i> Salir';
        exitBtn.onclick = (e) => {
            e.stopPropagation();
            exitAddExpandMode();
        };
        wrapper.appendChild(exitBtn);
    } else {
        exitAddExpandMode();
    }
    
    setTimeout(() => {
        if (window.addEditor) window.addEditor.refresh();
    }, 100);
});

// Función para cambiar de paso (versión agregar)
function showAddStep(stepNumber) {
    const step1 = document.getElementById('add-step-1');
    const step2 = document.getElementById('add-step-2');
    const indicators = document.querySelectorAll('.add-step-indicator');
    
    exitAddExpandMode();
    
    if (stepNumber === 1) {
        if (step1) step1.classList.add('active');
        if (step2) step2.classList.remove('active');
        setTimeout(() => window.addEditor?.refresh(), 100);
    } else {
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');
    }
    
    indicators.forEach(indicator => {
        const step = parseInt(indicator.getAttribute('data-step'));
        if (step === stepNumber) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

// Función para mostrar mensajes de estado (versión agregar)
function showAddStatus(message, type) {
    const statusEl = document.getElementById('add-form-status');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.padding = '10px';
    statusEl.style.borderRadius = '8px';
    statusEl.style.marginTop = '15px';
    statusEl.style.textAlign = 'center';
    
    if (type === 'success') {
        statusEl.style.color = '#4caf50';
        statusEl.style.background = 'rgba(76, 175, 80, 0.1)';
        statusEl.style.border = '1px solid #4caf50';
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.style.display = 'none';
            }
        }, 2000);
    } else if (type === 'error') {
        statusEl.style.color = '#f44336';
        statusEl.style.background = 'rgba(244, 67, 54, 0.1)';
        statusEl.style.border = '1px solid #f44336';
        setTimeout(() => {
            if (statusEl.textContent === message) {
                statusEl.style.display = 'none';
            }
        }, 3000);
    }
}

// Función para actualizar modo de syntax según categoría
window.updateAddEditorMode = function(category) {
    if (window.addEditor) {
        const mode = getModeFromCategory(category);
        window.addEditor.setOption('mode', mode);
    }
};

// SUBMIT DEL FORMULARIO DE AGREGAR
document.getElementById('add-script-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Prevenir envíos múltiples
    if (isAdding) {
        return;
    }
    
    // Obtener valores
    const scriptId = document.getElementById('add-script-id').value;
    const title = document.getElementById('add-script-title').value.trim();
    const category = document.getElementById('add-script-category').value;
    const author = document.getElementById('add-script-author').value.trim();
    const content = window.addEditor ? window.addEditor.getValue() : document.getElementById('add-script-content').value;
    const notes = document.getElementById('add-script-notes').value || '';
    
    // Validar campos requeridos
    if (!title) {
        showAddStatus('❌ Por favor ingresa un título', 'error');
        return;
    }
    
    if (!category) {
        showAddStatus('❌ Por favor selecciona una categoría', 'error');
        return;
    }
    
    if (!content || !content.trim()) {
        showAddStatus('❌ Por favor ingresa el contenido del script', 'error');
        return;
    }
    
    const newScript = {
        title: title,
        author: author || 'Anónimo',
        category: category,
        content: content,
        notes: notes,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    // Bloquear botón
    isAdding = true;
    const submitBtn = document.querySelector('#add-script-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;
    
    try {
        // Obtener referencia a Firestore
        let scriptsRef;
        try {
            const db = getFirestoreRef();
            scriptsRef = db.collection('scripts');
        } catch (err) {
            throw new Error('Firebase no está inicializado');
        }
        
        // Agregar a Firebase
        await scriptsRef.doc(scriptId).set(newScript);
        
        // Mostrar mensaje de éxito
        showAddStatus('✅ Script agregado correctamente', 'success');
        
        // Cerrar modal después de éxito
        setTimeout(() => {
            closeAddModal();
            // Recargar scripts sin recargar página
            if (typeof reloadScripts === 'function') {
                reloadScripts();
            } else {
                const event = new CustomEvent('scriptsReload');
                document.dispatchEvent(event);
                setTimeout(() => {
                    if (typeof window.loadScripts === 'function') {
                        window.loadScripts();
                    } else if (typeof loadScripts === 'function') {
                        loadScripts();
                    }
                }, 300);
            }
        }, 1500);
        
    } catch (error) {
        console.error('Error al agregar:', error);
        
        let errorMsg = '❌ Error al agregar el script';
        if (error.message) {
            if (error.message.includes('permission')) {
                errorMsg = '❌ Sin permisos para agregar scripts';
            } else if (error.message.includes('network')) {
                errorMsg = '❌ Error de red. Revisa tu conexión';
            }
        }
        
        showAddStatus(errorMsg, 'error');
        
        // Restaurar botón después del error
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        isAdding = false;
    }
});

// Eventos del modal de agregar
document.querySelectorAll('.add-close, .btn-cancel-add').forEach(btn => {
    btn.addEventListener('click', closeAddModal);
});

// Cerrar al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === addModal) {
        closeAddModal();
    }
});

// Botones de navegación para agregar
document.querySelectorAll('.btn-next-step-add').forEach(btn => {
    btn.addEventListener('click', () => showAddStep(2));
});

document.querySelectorAll('.btn-prev-step-add').forEach(btn => {
    btn.addEventListener('click', () => showAddStep(1));
});

// Clic en indicadores para agregar
document.querySelectorAll('.add-step-indicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
        const step = parseInt(indicator.getAttribute('data-step'));
        showAddStep(step);
    });
});

// Actualizar modo del editor cuando cambia la categoría
document.getElementById('add-script-category')?.addEventListener('change', (e) => {
    window.updateAddEditorMode(e.target.value);
});

console.log('Agregador de scripts cargado correctamente');