import { getScriptsRef } from './firebase-init.js';
import { showNotification, showConfirmationModal } from './ui-modal.js';
import { loadScripts } from './ui-scripts.js';

export async function addNewScript(title, author, notes, category, content) {
    const scriptsRef = getScriptsRef();
    try {
        await scriptsRef.add({
            title, author: author || '', notes: notes || '',
            category, content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error al agregar script:', error);
        throw error;
    }
}

export async function updateScript(id, title, author, notes, category, content) {
    const scriptsRef = getScriptsRef();
    try {
        await scriptsRef.doc(id).update({
            title, author: author || '', notes: notes || '',
            category, content,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error al actualizar script:', error);
        throw error;
    }
}

export async function deleteScript(id) {
    const scriptsRef = getScriptsRef();
    try {
        await scriptsRef.doc(id).delete();
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        localStorage.setItem('favorites', JSON.stringify(favorites.filter(fid => fid !== id)));
        loadScripts(document.getElementById('language-filter').value);
        document.getElementById('script-modal').style.display = 'none';
        showNotification('Script eliminado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error al eliminar script:', error);
        showNotification('Error al eliminar el script', 'error');
        throw error;
    }
}

export async function cloneScript(id, script) {
    const scriptsRef = getScriptsRef();
    try {
        await scriptsRef.add({
            title: `${script.title} (copia)`,
            author: script.author || '',
            notes: script.notes || '',
            category: script.category,
            content: script.content,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification('Script clonado correctamente', 'success');
        return true;
    } catch (error) {
        console.error('Error al clonar script:', error);
        showNotification('Error al clonar', 'error');
        throw error;
    }
}