// Variables del modal de edición
const editModal = document.getElementById('edit-script-modal');
let currentEditScriptId = null;
let currentEditScriptData = null;
let isEditorExpanded = false;  // ← Añadir: estado del editor expandido

// Función para salir del modo expandido
function exitExpandMode() {
    const wrapper = document.querySelector('#edit-step-1 .code-mirror-wrapper');
    if (wrapper && wrapper.classList.contains('expanded')) {
        wrapper.classList.remove('expanded');
        isEditorExpanded = false;
        
        // Remover el botón de salir si existe
        const exitBtn = wrapper.querySelector('.expand-exit-btn');
        if (exitBtn) exitBtn.remove();
        
        // Refrescar el editor después de salir del modo expandido
        setTimeout(() => {
            if (window.editEditor) window.editEditor.refresh();
        }, 100);
    }
}

// Función para resetear el formulario a su estado inicial
function resetEditForm() {
    // Salir del modo expandido
    exitExpandMode();
    
    // Resetear al paso 1
    showEditStep(1);
    
    // Limpiar el status
    const statusEl = document.getElementById('edit-form-status');
    if (statusEl) statusEl.textContent = '';
    
    // Limpiar el editor (opcional)
    if (window.editEditor) {
        window.editEditor.setValue('');
    }
}

// Función para cerrar el modal (modificada)
function closeEditModal() {
    // Resetear el estado expandido ANTES de cerrar
    exitExpandMode();
    
    // Ocultar modal
    editModal.style.display = 'none';
    currentEditScriptId = null;
    currentEditScriptData = null;
}

// Función para mostrar el modal de edición (modificada)
window.showEditModal = function(scriptId, scriptData) {
    // Asegurarse de que el modo expandido esté cerrado antes de abrir
    exitExpandMode();
    
    currentEditScriptId = scriptId;
    currentEditScriptData = scriptData;
    
    // Limpiar estado anterior
    document.getElementById('edit-form-status').textContent = '';
    
    // Resetear al paso 1
    showEditStep(1);
    
    // Llenar campos
    document.getElementById('edit-script-id').value = scriptId;
    document.getElementById('edit-script-title').value = scriptData.title || '';
    document.getElementById('edit-script-author').value = scriptData.author || '';
    document.getElementById('edit-script-category').value = scriptData.category || '';
    document.getElementById('edit-script-notes').value = scriptData.notes || '';
    
    // Configurar CodeMirror
    const textarea = document.getElementById('edit-script-content');
    if (window.editEditor) {
        window.editEditor.setValue(scriptData.content || '');
        // Asegurar que el editor no esté en modo expandido
        window.editEditor.setSize(null, null);
    } else {
        window.editEditor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            mode: getModeFromCategory(scriptData.category),
            theme: 'dracula',
            lineWrapping: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
        });
        window.editEditor.setValue(scriptData.content || '');
    }
    
    // Mostrar modal
    editModal.style.display = 'block';
    
    // Refrescar editor después de mostrar
    setTimeout(() => {
        if (window.editEditor) window.editEditor.refresh();
    }, 100);
};

// Botón expandir editor (modificado)
document.getElementById('expand-edit-editor-btn')?.addEventListener('click', () => {
    const wrapper = document.querySelector('#edit-step-1 .code-mirror-wrapper');
    
    if (!wrapper.classList.contains('expanded')) {
        // Entrar en modo expandido
        wrapper.classList.add('expanded');
        isEditorExpanded = true;
        
        // Añadir botón para salir
        const exitBtn = document.createElement('button');
        exitBtn.className = 'expand-exit-btn';
        exitBtn.innerHTML = '<i class="fas fa-compress"></i> Salir';
        exitBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: var(--accent-primary);
            color: #000;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            z-index: 10000;
            font-size: 12px;
            font-weight: bold;
        `;
        exitBtn.onclick = (e) => {
            e.stopPropagation();
            exitExpandMode();
        };
        wrapper.appendChild(exitBtn);
    } else {
        // Salir del modo expandido
        exitExpandMode();
    }
    
    setTimeout(() => {
        if (window.editEditor) window.editEditor.refresh();
    }, 100);
});

// Función para cambiar de paso (modificada)
function showEditStep(stepNumber) {
    const step1 = document.getElementById('edit-step-1');
    const step2 = document.getElementById('edit-step-2');
    const indicators = document.querySelectorAll('.step-indicator');
    
    // Salir del modo expandido al cambiar de paso
    exitExpandMode();
    
    if (stepNumber === 1) {
        step1.classList.add('active');
        step2.classList.remove('active');
        setTimeout(() => window.editEditor?.refresh(), 100);
    } else {
        step1.classList.remove('active');
        step2.classList.add('active');
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

// Eventos del modal (modificados)
document.querySelectorAll('.edit-close, .btn-cancel-edit').forEach(btn => {
    btn.addEventListener('click', closeEditModal);
});

// Cerrar al hacer clic fuera
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

// Botones de navegación
document.querySelectorAll('.btn-next-step').forEach(btn => {
    btn.addEventListener('click', () => showEditStep(2));
});

document.querySelectorAll('.btn-prev-step').forEach(btn => {
    btn.addEventListener('click', () => showEditStep(1));
});

// Clic en indicadores
document.querySelectorAll('.step-indicator').forEach(indicator => {
    indicator.addEventListener('click', () => {
        const step = parseInt(indicator.getAttribute('data-step'));
        showEditStep(step);
    });
});

// Submit del formulario (modificado para resetear después de guardar)
document.getElementById('edit-script-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const scriptId = document.getElementById('edit-script-id').value;
    const updatedData = {
        title: document.getElementById('edit-script-title').value,
        author: document.getElementById('edit-script-author').value,
        category: document.getElementById('edit-script-category').value,
        content: window.editEditor ? window.editEditor.getValue() : document.getElementById('edit-script-content').value,
        notes: document.getElementById('edit-script-notes').value,
        updatedAt: new Date()
    };
    
    try {
        const { getScriptsRef } = await import('../firebase-init.js');
        const scriptsRef = getScriptsRef();
        await scriptsRef.doc(scriptId).update(updatedData);
        
        // Mostrar feedback
        const statusEl = document.getElementById('edit-form-status');
        statusEl.textContent = '✅ Script actualizado correctamente';
        statusEl.style.color = 'var(--accent-primary)';
        
        setTimeout(() => {
            // Resetear antes de cerrar
            resetEditForm();
            closeEditModal();
            // Recargar scripts
            if (typeof loadScripts === 'function') {
                loadScripts();
            } else {
                location.reload();
            }
        }, 1000);
    } catch (error) {
        console.error('Error al actualizar:', error);
        const statusEl = document.getElementById('edit-form-status');
        statusEl.textContent = '❌ Error al actualizar el script';
        statusEl.style.color = 'var(--accent-red)';
    }
});

// Función auxiliar para obtener modo de syntax
function getModeFromCategory(category) {
    const modes = {
        'JavaScript': 'javascript',
        'Python': 'python',
        'PHP': 'php',
        'C': 'text/x-csrc',
        'C++': 'text/x-c++src',
        'C#': 'text/x-csharp',
        'HTML': 'htmlmixed',
        'CSS': 'css',
        'JSON': 'application/json',
        'TypeScript': 'javascript',
        'Java': 'text/x-java',
        'Ruby': 'ruby',
        'Bash': 'shell'
    };
    return modes[category] || 'javascript';
}

// Exportar funciones al objeto window
window.showEditModal = showEditModal;
window.closeEditModal = closeEditModal;