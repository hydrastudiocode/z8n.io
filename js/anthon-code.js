import { initializeFirebase, initFirestoreRefs } from './modules/firebase-init.js';
import { checkAuthAndRedirect, setupLogoutButton, setupInactivityMonitoring } from './modules/auth.js';
import { loadScripts } from './modules/ui-scripts.js';
import { addNewScript, updateScript, updateFilterState } from './modules/scripts-crud.js';
import { initCodeMirror, initModalViewer, getContentEditor, getEditEditor } from './modules/editor-codemirror.js';
import { setupExpandEditor } from './modules/editor-expand.js';
import { showNotification } from './modules/ui-modal.js';

// ========== ESTADO DEL FILTRO ==========
let currentCategory = 'all';
let isShowingFavorites = false;

// ========== INICIALIZACIÓN ==========
function init() {
    initializeFirebase();
    initFirestoreRefs();
    checkAuthAndRedirect();
    setupLogoutButton();
    
    // Editores
    initCodeMirror();
    initModalViewer();
    
    const contentEditor = getContentEditor();
    if (contentEditor) {
        setupExpandEditor(contentEditor, 'code-mirror-container', 'expand-editor-btn');
    }
    
    // Eventos de navegación
    setupNavigation();
    setupFormSubmits();
    setupModalClose();
    
    // ========== FILTRO POR LENGUAJE (desde el popup) ==========
    document.addEventListener('filterChange', (e) => {
        currentCategory = e.detail.category;
        updateFilterState(currentCategory, isShowingFavorites);
        loadScripts(currentCategory, '', isShowingFavorites);
    });
    
    // Cargar scripts iniciales
    loadScripts(currentCategory, '', false);
    
    // Inactividad
    if (!window.location.pathname.includes('index.html')) {
        setupInactivityMonitoring();
    }
}

function setupNavigation() {
    const viewScriptsLink = document.getElementById('view-scripts-link');
    const addScriptLink = document.getElementById('add-script-link');
    const favoritesLink = document.getElementById('favorites-link');
    
    if (viewScriptsLink) {
        viewScriptsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('scripts');
        });
    }
    
    if (addScriptLink) {
        addScriptLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Abrir modal de agregar en lugar de mostrar sección
            if (typeof window.showAddModal === 'function') {
                window.showAddModal();
            } else {
                console.error('showAddModal no está definida');
                showNotification('Error: Módulo de agregar no cargado', 'error');
            }
        });
    }
    
    if (favoritesLink) {
        favoritesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('favorites');
        });
    }
}

function showSection(section) {
    const scriptsSection = document.getElementById('scripts-section');
    const viewScriptsLink = document.getElementById('view-scripts-link');
    const addScriptLink = document.getElementById('add-script-link');
    const favoritesLink = document.getElementById('favorites-link');
    
    // Ocultar todas las secciones
    if (scriptsSection) scriptsSection.style.display = 'block';
    
    // Actualizar clases activas
    if (viewScriptsLink) viewScriptsLink.classList.remove('active');
    if (addScriptLink) addScriptLink.classList.remove('active');
    if (favoritesLink) favoritesLink.classList.remove('active');
    
    if (section === 'scripts') {
        if (viewScriptsLink) viewScriptsLink.classList.add('active');
        isShowingFavorites = false;
        updateFilterState(currentCategory, isShowingFavorites);
        loadScripts(currentCategory, '', false);
    } else if (section === 'favorites') {
        if (favoritesLink) favoritesLink.classList.add('active');
        isShowingFavorites = true;
        updateFilterState(currentCategory, isShowingFavorites);
        loadScripts(currentCategory, '', true);
    }
    // Ya no manejamos 'add-script' porque ahora es un modal
}

function setupFormSubmits() {
    // Ya no manejamos el formulario de agregar antiguo porque fue eliminado
    // Solo manejamos el formulario de editar
    
    // Formulario de editar script
    const editForm = document.getElementById('edit-script-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.querySelector('#edit-script-form button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            
            const id = document.getElementById('edit-script-id').value;
            const title = document.getElementById('edit-script-title').value.trim();
            const author = document.getElementById('edit-script-author').value.trim();
            const notes = document.getElementById('edit-script-notes').value.trim();
            const category = document.getElementById('edit-script-category').value;
            const editEditor = getEditEditor();
            const content = editEditor ? editEditor.getValue() : document.getElementById('edit-script-content').value.trim();
            const status = document.getElementById('edit-form-status');
            
            if (!title || !category || !content) {
                if (status) {
                    status.textContent = 'Completa los campos obligatorios';
                    status.className = 'error';
                }
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            try {
                await updateScript(id, title, author, notes, category, content);
                if (status) {
                    status.textContent = '✅ Script actualizado correctamente';
                    status.className = 'success';
                }
                loadScripts(currentCategory, '', isShowingFavorites);
                setTimeout(() => {
                    const modal = document.getElementById('edit-script-modal');
                    if (modal) modal.style.display = 'none';
                }, 1500);
            } catch (error) {
                console.error('Error al actualizar:', error);
                if (status) {
                    status.textContent = '❌ Error al actualizar el script';
                    status.className = 'error';
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
}

function setupModalClose() {
    const modal = document.getElementById('script-modal');
    const closeBtn = document.querySelector('#script-modal .close');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => { 
        if (modal && e.target === modal) modal.style.display = 'none'; 
    });
    
    document.addEventListener('keydown', (e) => {
        if (modal && modal.style.display === 'block' && e.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
    
    // Cerrar modales de editar y agregar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const editModal = document.getElementById('edit-script-modal');
            const addModal = document.getElementById('add-script-modal');
            if (editModal && editModal.style.display === 'block') {
                if (typeof window.closeEditModal === 'function') {
                    window.closeEditModal();
                } else {
                    editModal.style.display = 'none';
                }
            }
            if (addModal && addModal.style.display === 'block') {
                if (typeof window.closeAddModal === 'function') {
                    window.closeAddModal();
                } else {
                    addModal.style.display = 'none';
                }
            }
        }
    });
}

// Función global para recargar scripts (usada por los módulos)
window.reloadScripts = function() {
    loadScripts(currentCategory, '', isShowingFavorites);
};

// Iniciar
init();