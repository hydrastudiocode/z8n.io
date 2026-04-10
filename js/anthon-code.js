// Import Firebase configuration from external file
import { firebaseConfig } from './firebase-config.js';

let scriptsRef;
let currentScriptId = null;
const currentTheme = 'github-dark';

function initializeFirebase() {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}

function initFirestoreRefs() {
    scriptsRef = firebase.firestore().collection('scripts');
}
// Inicializar CodeMirror para el formulario de agregar
let contentEditor = null;

function initCodeMirror() {
    const textarea = document.getElementById('script-content');
    if (textarea && !contentEditor) {
        contentEditor = CodeMirror.fromTextArea(textarea, {
            lineNumbers: true,
            lineWrapping: true,
            theme: 'dracula',
            autoCloseBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            matchBrackets: true,
            extraKeys: {
                "Ctrl-S": function(cm) {
                    // Guardar con Ctrl+S
                    document.getElementById('script-form').dispatchEvent(new Event('submit'));
                }
            }
        });
        
        // Cambiar el modo según el lenguaje seleccionado
        const categorySelect = document.getElementById('script-category');
        if (categorySelect) {
            categorySelect.addEventListener('change', function() {
                const mode = getModeFromCategory(this.value);
                contentEditor.setOption('mode', mode);
            });
        }
    }
}

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
        'FireBase': 'application/json',
        'GdScript': 'python',
        'Otro': 'javascript'
    };
    return modes[category] || 'javascript';
}

// Llamar a la función después de que el DOM esté listo
// Dentro de tu DOMContentLoaded existente, agrega:
initCodeMirror();

let editEditor = null;

function initEditCodeMirror() {
    const editTextarea = document.getElementById('edit-script-content');
    if (editTextarea && !editEditor) {
        editEditor = CodeMirror.fromTextArea(editTextarea, {
            lineNumbers: true,
            lineWrapping: true,
            theme: 'dracula',
            autoCloseBrackets: true,
            indentUnit: 4,
            tabSize: 4,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            matchBrackets: true
        });
        
        const editCategory = document.getElementById('edit-script-category');
        if (editCategory) {
            editCategory.addEventListener('change', function() {
                editEditor.setOption('mode', getModeFromCategory(this.value));
            });
        }
    }
}
function getFileExtension(category) {
    const extensions = {
        'C': 'c',
        'C#': 'cs',
        'C++': 'cpp',
        'JavaScript': 'js',
        'FireBase': 'json',
        'Python': 'py',
        'PHP': 'php',
        'GdScript': 'gd',
        'HTML': 'html',
        'CSS': 'css',
        'Otro': 'txt'
    };
    return extensions[category] || 'txt';
}

function getFileName(title, category) {
    const extension = getFileExtension(category);
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${cleanTitle}.${extension}`;
}

function downloadScript(content, title, category) {
    const fileName = getFileName(title, category);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`Descargado: ${fileName}`, 'success');
}

async function loadScripts(category = 'all') {
    try {
        let query = scriptsRef.orderBy('createdAt', 'desc');
        
        if (category !== 'all') {
            const snapshot = await query.get();
            const scriptsContainer = document.getElementById('scripts-container');
            
            if (snapshot.empty) {
                scriptsContainer.innerHTML = '<p class="empty-message">No hay scripts guardados</p>';
                return;
            }
            
            scriptsContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const script = doc.data();
                if (script.category === category) {
                    const scriptElement = createScriptElement(doc.id, script);
                    scriptsContainer.appendChild(scriptElement);
                }
            });
            
            if (scriptsContainer.innerHTML === '') {
                scriptsContainer.innerHTML = '<p class="empty-message">####No hay Scrips para esta categoria####</p>';
            }
            
            return;
        } //<!-- ############### SEPARADOR DE CODIGO ################# -->
        //<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
        const snapshot = await query.get();
        const scriptsContainer = document.getElementById('scripts-container');
        
        if (snapshot.empty) {
            scriptsContainer.innerHTML = '<p class="empty-message">####No se gudardo nada####</p>';
            return;
        }
        
        scriptsContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const script = doc.data();
            const scriptElement = createScriptElement(doc.id, script);
            scriptsContainer.appendChild(scriptElement);
        });
    } catch (error) {
        console.error('Error al cargar scripts:', error);
        document.getElementById('scripts-container').innerHTML = 
            '<p class="error-message">Error #404 al cargar los scripts#### ' + 
            'Error de Firebase Revisar el panel de control desde la consola #####</p>';
    }
}//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function getLanguageLogo(language) {
    const logos = {
        'C': 'assets/c.png',
        'C#': 'assets/c2.png',
        'C++': 'assets/c3.png',
        'JavaScript': 'assets/javaScript.png',
        'GdScript': 'assets/gd.png',
        'FireBase': 'assets/fire.png',
        'PHP': 'assets/php.png',
        'Python': 'assets/python.png',
        'HTML': 'assets/html.png',
        'CSS': 'assets/css.png',
        'Otro': 'assets/logowar.png'
    };
    
    return logos[language] || logos['Otro'];
}

function getHighlightLanguage(category) {
    const mapping = {
        'C': 'c',
        'C#': 'csharp',       
        'C++': 'cpp',         
        'GdScript': 'python', 
        'JavaScript': 'javascript',
        'FireBase': 'json',   
        'Python': 'python',
        'PHP': 'php',
        'HTML': 'html',
        'CSS': 'css',
        'Otro': 'javascript'
    };
    
    return mapping[category] || 'plaintext';
}//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function createScriptElement(id, script) {
    const scriptElement = document.createElement('div');
    scriptElement.className = 'script-block';
    scriptElement.innerHTML = `
        <img src="${getLanguageLogo(script.category)}" alt="${script.category}" class="script-logo">
        <h3 class="script-title">${script.title}</h3>
        <div class="script-author">${script.author || 'Autor no especificado'}</div>
        <div class="script-category">${script.category}</div>
        <div class="script-actions">
            <button class="view-btn" data-id="${id}">Ver</button>
        </div>
    `;
    scriptElement.querySelector('.view-btn').addEventListener('click', () => {
        showScriptModal(id, script);
    });
    return scriptElement;
}//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
async function addNewScript(title, author, notes, category, content) {
    try {
        await scriptsRef.add({
            title: title,
            author: author || '',
            notes: notes || '',
            category: category,
            content: content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error al agregar script:', error);
        throw error;
    }
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
async function updateScript(id, title, author, notes, category, content) {
    try {
        await scriptsRef.doc(id).update({
            title: title,
            author: author || '',
            notes: notes || '',
            category: category,
            content: content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error al actualizar script:', error);
        throw error;
    }
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
async function deleteScript(id) {
    try {
        await scriptsRef.doc(id).delete();
        const currentFilter = document.getElementById('language-filter').value;
        loadScripts(currentFilter);
        document.getElementById('script-modal').style.display = 'none';
        showNotification('Script eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error al eliminar script:', error);
        showNotification('Error al eliminar el script', 'error');
    }
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function applyCodeTheme() {
    const codeElement = document.getElementById('modal-code');
    codeElement.classList.remove('github-dark', 'atom-one-dark', 'monokai-sublime');
    codeElement.classList.add('github-dark');
    hljs.highlightElement(codeElement);
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.custom-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function showConfirmationModal(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'custom-confirm-modal';
    modal.innerHTML = `
        <div class="confirm-content">
            <p>${message}</p>
                <div class="confirm-buttons">
                    <button class="confirm-btn confirm-no">Cancelar</button>
                    <button class="confirm-btn confirm-yes">Eliminar</button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    modal.querySelector('.confirm-no').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });
    
    modal.querySelector('.confirm-yes').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            callback();
        }, 300);
    });
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
let viewerEditor = null;

function showScriptModal(id, script) {
    currentScriptId = id;
    document.getElementById('modal-title').textContent = script.title;
    document.getElementById('modal-author').textContent = script.author ? `Autor: ${script.author}` : 'Autor: No especificado';
    document.getElementById('modal-notes').textContent = script.notes || 'No hay observaciones';
    
    // Inicializar o actualizar CodeMirror
    const container = document.getElementById('modal-editor-container');
    if (container) {
        if (!viewerEditor) {
            viewerEditor = CodeMirror(container, {
                value: script.content,
                mode: getModeFromCategory(script.category),
                theme: 'dracula',
                lineNumbers: true,
                lineWrapping: true,
                readOnly: true,
                scrollbarStyle: 'native'
            });
        } else {
            viewerEditor.setValue(script.content);
            viewerEditor.setOption('mode', getModeFromCategory(script.category));
        }
        
        // Ajustar tamaño
        setTimeout(() => {
            viewerEditor.refresh();
        }, 100);
    }
    
    document.getElementById('script-modal').style.display = 'block';
    
    document.getElementById('copy-btn').onclick = () => {
        copyScriptToClipboard(script.content);
    };
    
    document.getElementById('edit-btn').onclick = () => {
        loadScriptForEditing(id, script);
    };
    
    document.getElementById('modal-delete-btn').onclick = () => {
        showConfirmationModal(' <-------- Anthon: Borro el Script? ----->', () => {
            deleteScript(id);
        });
    };
    
    // ========== NUEVO: BOTON DE DESCARGA ==========
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.onclick = () => {
            downloadScript(script.content, script.title, script.category);
        };
    }
    
    document.getElementById('script-modal').focus();
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function loadScriptForEditing(id, script) {
    document.getElementById('script-modal').style.display = 'none';
    document.getElementById('edit-script-section').style.display = 'block';
    document.getElementById('edit-script-id').value = id;
    document.getElementById('edit-script-title').value = script.title;
    document.getElementById('edit-script-author').value = script.author || '';
    document.getElementById('edit-script-notes').value = script.notes || '';
    document.getElementById('edit-script-category').value = script.category;
    
    // Inicializar editor si no existe
    if (!editEditor) {
        initEditCodeMirror();
    }
    
    // Actualizar el contenido del editor
    setTimeout(() => {
        if (editEditor) {
            editEditor.setValue(script.content);
            editEditor.setOption('mode', getModeFromCategory(script.category));
        }
    }, 50);
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function copyScriptToClipboard(content) {
    navigator.clipboard.writeText(content).then(() => {
        showNotification('######', 'success');
    }).catch(err => {
        console.error('Error al copiar: ', err);
        showNotification('<---Error al copiar el Script-->', 'error');
    });
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
function showSection(section) {
    document.getElementById('scripts-section').style.display = 'none';
    document.getElementById('add-script-section').style.display = 'none';
    document.getElementById('edit-script-section').style.display = 'none';
    
    document.getElementById('view-scripts-link').classList.remove('active');
    document.getElementById('add-script-link').classList.remove('active');
    
    if (section === 'scripts') {
        document.getElementById('scripts-section').style.display = 'block';
        document.getElementById('view-scripts-link').classList.add('active');
        const currentFilter = document.getElementById('language-filter').value;
        loadScripts(currentFilter);
    } else if (section === 'add-script') {
        document.getElementById('add-script-section').style.display = 'block';
        document.getElementById('add-script-link').classList.add('active');
    } else if (section === 'edit-script') {
        document.getElementById('edit-script-section').style.display = 'block';
    }
}
//<!-- ############### SEPARADOR DE CODIGO ################# -->
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
    initFirestoreRefs();
    loadScripts();
    
    document.getElementById('view-scripts-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('scripts');
    });
    
    document.getElementById('add-script-link').addEventListener('click', (e) => {
        e.preventDefault();
        showSection('add-script');
    });
    
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
    
    // ✅ OBTENER CONTENIDO DEL EDITOR CODEMIRROR
    let content = '';
    if (contentEditor) {
        content = contentEditor.getValue();  // CodeMirror
    } else {
        content = document.getElementById('script-content').value.trim();  // Fallback
    }
    
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
        
        status.textContent = 'Script guardado correctamente';
        status.className = 'success';
        
        // ✅ LIMPIAR EL EDITOR CODEMIRROR
        if (contentEditor) {
            contentEditor.setValue('');  // Limpiar editor
        } else {
            document.getElementById('script-form').reset();
        }
        
        // Limpiar otros campos
        document.getElementById('script-title').value = '';
        document.getElementById('script-author').value = '';
        document.getElementById('script-notes').value = '';
        
        const currentFilter = document.getElementById('language-filter').value;
        loadScripts(currentFilter);
        
        setTimeout(() => {
            showSection('scripts');
        }, 2000);
        
    } catch (error) {
        console.error('Error al guardar script:', error);
        status.textContent = 'Error al guardar el script';
        status.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
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
    
    // ✅ OBTENER CONTENIDO DEL EDITOR DE EDICIÓN
    let content = '';
    if (editEditor) {
        content = editEditor.getValue();  // CodeMirror de edición
    } else {
        content = document.getElementById('edit-script-content').value.trim();
    }
    
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
        
        status.textContent = 'Script actualizado correctamente';
        status.className = 'success';
        
        const currentFilter = document.getElementById('language-filter').value;
        loadScripts(currentFilter);
        
        setTimeout(() => {
            showSection('scripts');
            document.getElementById('edit-script-section').style.display = 'none';
        }, 2000);
        
    } catch (error) {
        console.error('Error al actualizar script:', error);
        status.textContent = 'Error al actualizar el script';
        status.className = 'error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        document.getElementById('edit-script-section').style.display = 'none';
        showSection('scripts');
    });
    
    document.getElementById('language-filter').addEventListener('change', function() {
        const category = this.value;
        loadScripts(category);
    });
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
    const modal = document.getElementById('script-modal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
    document.addEventListener('keydown', (e) => {
        if (modal.style.display === 'block') {
            if (e.key === 'Enter') {
                e.preventDefault();
                const codeContent = document.getElementById('modal-code').textContent;
                copyScriptToClipboard(codeContent);
            }
            
            if (e.key === 'Escape') {
                modal.style.display = 'none';
            }
        }
    });
    //<!-- ############### SEPARADOR DE CODIGO ################# -->
    modal.setAttribute('tabindex', '0');
    //<!-- ############### SEPARADOR DE CODIGO ################# -->

function checkAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    
    firebase.auth().onAuthStateChanged((user) => {
        if (!user && !isLoginPage) {
            window.location.href = 'index.html';
        } else if (user && isLoginPage) {
            window.location.href = 'dashboard.html';
        }
    });
}
const logoutButton = document.getElementById('logout-btn');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        window.handleLogout();
    });
}
let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        firebase.auth().signOut().then(() => {
            console.log('Sesión cerrada por inactividad (30 minutos sin actividad)');
            showNotification('Sesión cerrada por inactividad', 'info');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
    }, 30 * 60 * 1000); 
}

function setupInactivityMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
    
    events.forEach(event => {
        document.addEventListener(event, () => {
            resetInactivityTimer();
        });
    });
    
    resetInactivityTimer();
}

window.handleLogout = async function() {
    try {
        await firebase.auth().signOut();
        showNotification('Sesión cerrada correctamente', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión', 'error');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndRedirect();
    
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    
    if (!isLoginPage) {
        setupInactivityMonitoring();
    }
});
});

async function handleLogout() {
    try {
        showNotification('Cerrando sesión...', 'info');
        
        await firebase.auth().signOut();
        
        localStorage.removeItem('theme');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showNotification('Error al cerrar sesión: ' + error.message, 'error');
    }
}

function checkAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    
    firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed - User:', user ? user.email : 'No user');
        
        if (!user && !isLoginPage) {
            console.log('Redirigiendo a login...');
            window.location.href = 'index.html';
        } else if (user && isLoginPage) {
            console.log('Redirigiendo a dashboard...');
            window.location.href = 'dashboard.html';
        }
    });
}

let inactivityTimer;

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
        // Cerrar sesión por inactividad
        firebase.auth().signOut().then(() => {
            console.log('Sesión cerrada por inactividad (30 minutos sin actividad)');
            showNotification('Sesión cerrada por inactividad', 'info');
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error('Error al cerrar sesión por inactividad:', error);
        });
    }, 30 * 60 * 1000); 
}

function setupInactivityMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];
    
    events.forEach(event => {
        document.addEventListener(event, () => {
            resetInactivityTimer();
        });
    });
    
    resetInactivityTimer();
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        console.log('Botón de logout encontrado, configurando evento...');
        
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Click en botón de logout');
            handleLogout();
        });
    } else {
        console.log('Botón de logout NO encontrado en el DOM');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando controles de sesión...');
    
    checkAuthAndRedirect();
    
    setupLogoutButton();
    
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    
    if (!isLoginPage) {
        setupInactivityMonitoring();
    }
});