import { deleteScript, cloneScript } from './scripts-crud.js';
import { loadScriptForEditing } from './editor-codemirror.js';
import { getModalViewerEditor, getModeFromCategory } from './editor-codemirror.js';
import { downloadScript } from './download.js';
import { toggleFavorite, isFavorite } from './favorites.js';

let currentScriptId = null;
let currentScriptData = null;  // ← Añadir esta variable para guardar los datos del script

export function showNotification(message, type = 'info') {
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

export function showConfirmationModal(message, callback) {
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
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.querySelector('.confirm-no').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    });
    
    modal.querySelector('.confirm-yes').addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
            callback();
        }, 300);
    });
}

// Función para cerrar el modal de visualización
function closeViewModal() {
    document.getElementById('script-modal').style.display = 'none';
}

export async function showScriptModal(id, script) {
    currentScriptId = id;
    currentScriptData = script;  // ← Guardar los datos del script
    document.getElementById('modal-title').textContent = script.title;
    document.getElementById('modal-author').textContent = script.author ? `Autor: ${script.author}` : 'Autor: No especificado';
    document.getElementById('modal-notes').textContent = script.notes || 'No hay observaciones';
    
    const modalEditor = getModalViewerEditor();
    if (modalEditor) {
        modalEditor.setValue(script.content || '');
        modalEditor.setOption('mode', getModeFromCategory(script.category));
        setTimeout(() => modalEditor.refresh(), 100);
    }
    
    document.getElementById('script-modal').style.display = 'block';
    
    document.getElementById('copy-btn').onclick = () => {
        navigator.clipboard.writeText(script.content);
        showNotification('¡Copiado!', 'success');
    };
    
    document.getElementById('clone-btn').onclick = async () => {
        await cloneScript(id, script);
        closeViewModal();
        const event = new CustomEvent('scriptsReload');
        document.dispatchEvent(event);
    };
    
    // ========== BOTÓN EDITAR CORREGIDO ==========
    document.getElementById('edit-btn').onclick = () => {
        // Cerrar modal de visualización
        closeViewModal();
        // Abrir modal de edición
        if (typeof window.showEditModal === 'function') {
            window.showEditModal(currentScriptId, currentScriptData);
        } else {
            console.error('showEditModal no está definida. Asegúrate de que editar-script.js esté cargado.');
            showNotification('Error: Editor no disponible', 'error');
        }
    };
    
    document.getElementById('download-btn').onclick = () => {
        downloadScript(script.content, script.title, script.category);
    };
    
    document.getElementById('modal-delete-btn').onclick = () => {
        showConfirmationModal('¿Borrar este Script?', async () => {
            await deleteScript(id);
            closeViewModal();
            const event = new CustomEvent('scriptsReload');
            document.dispatchEvent(event);
        });
    };
    
    const favStar = document.getElementById('modal-favorite-star');
    if (favStar) {
        const updateFavoriteButton = async (state) => {
            favStar.innerHTML = `${state ? '<i class="fas fa-star"></i> Favorito' : '<i class="far fa-star"></i> Favorito'}`;
            favStar.classList.toggle('active-favorite', state);
        };

        const isFav = await isFavorite(id);
        updateFavoriteButton(isFav);
        favStar.onclick = async () => {
            const newState = await toggleFavorite(id);
            updateFavoriteButton(newState);
        };
    }
}

// Cerrar modal con la X
document.querySelector('#script-modal .close')?.addEventListener('click', closeViewModal);

// Cerrar modal haciendo clic fuera
window.addEventListener('click', (e) => {
    const modal = document.getElementById('script-modal');
    if (e.target === modal) {
        closeViewModal();
    }
});