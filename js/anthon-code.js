import { initializeFirebase, initFirestoreRefs } from './modules/firebase-init.js';
import { checkAuthAndRedirect, setupLogoutButton, setupInactivityMonitoring } from './modules/auth.js';
import { loadScripts } from './modules/ui-scripts.js';
import { addNewScript, updateScript } from './modules/scripts-crud.js';
import { initCodeMirror, initModalViewer, getContentEditor, getEditEditor } from './modules/editor-codemirror.js';
import { setupExpandEditor } from './modules/editor-expand.js';
import { setupFileImport } from './modules/import-file.js';
import { setupGistImport } from './modules/import-gist.js';
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
    
    // Importaciones
    setupFileImport();
    setupGistImport();
    
    // Eventos de navegación
    setupNavigation();
    setupFormSubmits();
    setupModalClose();

    
    // Cargar scripts
    loadScripts('all');
    
    // Inactividad
    if (!window.location.pathname.includes('index.html')) {
        setupInactivityMonitoring();
    }
    
}

function setupNavigation() {
    document.getElementById('view-scripts-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('scripts');
    });
    document.getElementById('add-script-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('add-script');
    });
    const favLink = document.getElementById('favorites-link');
    if (favLink) {
        favLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('favorites');
        });
    }
    document.getElementById('cancel-add-btn')?.addEventListener('click', () => showSection('scripts'));
    document.getElementById('cancel-edit-btn')?.addEventListener('click', () => showSection('scripts'));
}

function showSection(section) {
    document.getElementById('scripts-section').style.display = 'none';
    document.getElementById('add-script-section').style.display = 'none';
    document.getElementById('edit-script-section').style.display = 'none';
    
    document.getElementById('view-scripts-link').classList.remove('active');
    document.getElementById('add-script-link').classList.remove('active');
    document.getElementById('favorites-link')?.classList.remove('active');
    
    if (section === 'scripts') {
        document.getElementById('scripts-section').style.display = 'block';
        document.getElementById('view-scripts-link').classList.add('active');
        isShowingFavorites = false;
        loadScripts(currentCategory, '', false);
    } else if (section === 'add-script') {
        document.getElementById('add-script-section').style.display = 'block';
        document.getElementById('add-script-link').classList.add('active');
        isShowingFavorites = false;
    } else if (section === 'favorites') {
        document.getElementById('scripts-section').style.display = 'block';
        document.getElementById('favorites-link')?.classList.add('active');
        isShowingFavorites = true;
        loadScripts(currentCategory, '', true);
    }
}

function setupFormSubmits() {
    document.getElementById('script-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.querySelector('#script-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Guardando...';
        
        const title = document.getElementById('script-title').value.trim();
        const author = document.getElementById('script-author').value.trim();
        const notes = document.getElementById('script-notes').value.trim();
        const category = document.getElementById('script-category').value;
        const contentEditor = getContentEditor();
        const content = contentEditor ? contentEditor.getValue() : document.getElementById('script-content').value.trim();
        const status = document.getElementById('form-status');
        
        if (!title || !category || !content) {
            status.textContent = 'Completa los campos obligatorios';
            status.className = 'error';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        try {
            await addNewScript(title, author, notes, category, content);
            status.textContent = 'Script guardado';
            status.className = 'success';
            if (contentEditor) contentEditor.setValue('');
            document.getElementById('script-title').value = '';
            document.getElementById('script-author').value = '';
            document.getElementById('script-notes').value = '';
            setTimeout(() => showSection('scripts'), 2000);
        } catch (error) {
            status.textContent = 'Error al guardar';
            status.className = 'error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    // ========== FILTRO POR LENGUAJE (desde el popup) ==========
document.addEventListener('filterChange', (e) => {
    const category = e.detail.category;
    console.log('Filtrando por:', category); // Para depurar
    
    // Guardar categoría actual
    currentCategory = category;
    
    // Recargar scripts con la nueva categoría
    loadScripts(currentCategory, '', isShowingFavorites);
});
    document.getElementById('edit-script-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.querySelector('#edit-script-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';
        
        const id = document.getElementById('edit-script-id').value;
        const title = document.getElementById('edit-script-title').value.trim();
        const author = document.getElementById('edit-script-author').value.trim();
        const notes = document.getElementById('edit-script-notes').value.trim();
        const category = document.getElementById('edit-script-category').value;
        const editEditor = getEditEditor();
        const content = editEditor ? editEditor.getValue() : document.getElementById('edit-script-content').value.trim();
        const status = document.getElementById('edit-form-status');
        
        if (!title || !category || !content) {
            status.textContent = 'Completa los campos obligatorios';
            status.className = 'error';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        try {
            await updateScript(id, title, author, notes, category, content);
            status.textContent = 'Script actualizado';
            status.className = 'success';
            setTimeout(() => showSection('scripts'), 2000);
        } catch (error) {
            status.textContent = 'Error al actualizar';
            status.className = 'error';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

function setupModalClose() {
    const modal = document.getElementById('script-modal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block' && e.key === 'Escape') modal.style.display = 'none';
    });
}


// Iniciar
init();