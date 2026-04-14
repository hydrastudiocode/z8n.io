import { getScriptsRef } from './firebase-init.js';
import { showScriptModal } from './ui-modal.js';
import { toggleFavorite, isFavorite } from './favorites.js';

function getLanguageLogo(language) {
    const logos = {
        'C': 'assets/c.png', 'C#': 'assets/c2.png', 'C++': 'assets/c3.png',
        'JavaScript': 'assets/javaScript.png', 'GdScript': 'assets/gd.png',
        'FireBase': 'assets/fire.png', 'PHP': 'assets/php.png',
        'Python': 'assets/python.png', 'HTML': 'assets/html.png',
        'CSS': 'assets/css.png', 'GitHub': 'assets/github3.svg', 'Otro': 'assets/logowar.png'
    };
    return logos[language] || logos['Otro'];
}

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
}

export async function loadScripts(category = 'all', searchTerm = '', showFavorites = false) {
    const scriptsRef = getScriptsRef();
    try {
        let query = scriptsRef.orderBy('createdAt', 'desc');
        const snapshot = await query.get();
        const scriptsContainer = document.getElementById('scripts-container');
        
        if (snapshot.empty) {
            scriptsContainer.innerHTML = '<p class="empty-message">No hay scripts guardados</p>';
            return;
        }
        
        let scripts = [];
        snapshot.forEach(doc => {
            const script = doc.data();
            script.id = doc.id;
            scripts.push(script);
        });
        
        scripts = scripts.filter(script => {
            if (category !== 'all' && script.category !== category) return false;
            if (showFavorites && !isFavorite(script.id)) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return script.title.toLowerCase().includes(term) ||
                       (script.author && script.author.toLowerCase().includes(term)) ||
                       (script.content && script.content.toLowerCase().includes(term));
            }
            return true;
        });
        
        if (scripts.length === 0) {
            scriptsContainer.innerHTML = '<p class="empty-message">No hay scripts que coincidan</p>';
            return;
        }
        
        scriptsContainer.innerHTML = '';
        scripts.forEach(script => {
            scriptsContainer.appendChild(createScriptElement(script.id, script));
        });
    } catch (error) {
        console.error('Error al cargar scripts:', error);
        scriptsContainer.innerHTML = '<p class="error-message">Error al cargar los scripts</p>';
    }
}