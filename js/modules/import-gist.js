import { getContentEditor } from './editor-codemirror.js';
import { showNotification } from './ui-modal.js';

function extractGistId(url) {
    const patterns = [
        /gist\.github\.com\/[^\/]+\/([a-f0-9]+)/i,
        /gist\.github\.com\/([a-f0-9]+)/i,
        /([a-f0-9]{32})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

function detectLanguageFromExtension(extension) {
    const map = {
        'js': 'JavaScript', 'py': 'Python', 'php': 'PHP', 'c': 'C',
        'cpp': 'C++', 'cs': 'C#', 'html': 'HTML', 'css': 'CSS',
        'json': 'FireBase', 'gd': 'GdScript', 'txt': 'Otro'
    };
    return map[extension] || 'Otro';
}

export function setupGistImport() {
    const importBtn = document.getElementById('import-gist-btn');
    const gistInput = document.getElementById('gist-url');
    if (!importBtn || !gistInput) return;
    
    importBtn.addEventListener('click', async () => {
        const url = gistInput.value.trim();
        if (!url) { showNotification('Ingresa una URL de Gist', 'error'); return; }
        
        const gistId = extractGistId(url);
        if (!gistId) { showNotification('URL inválida', 'error'); return; }
        
        showNotification('Obteniendo Gist...', 'info');
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`);
            if (!response.ok) throw new Error('Gist no encontrado');
            const gist = await response.json();
            const files = Object.values(gist.files);
            if (!files.length) throw new Error('Gist vacío');
            
            const firstFile = files[0];
            const content = firstFile.content;
            const fileName = firstFile.filename;
            const extension = fileName.split('.').pop().toLowerCase();
            const language = detectLanguageFromExtension(extension);
            const title = fileName.replace(/\.[^/.]+$/, '');
            
            const editor = getContentEditor();
            if (editor) editor.setValue(content);
            else document.getElementById('script-content').value = content;
            
            document.getElementById('script-title').value = title;
            if (gist.description) document.getElementById('script-notes').value = gist.description;
            
            const categorySelect = document.getElementById('script-category');
            if (categorySelect && language) {
                for (let i = 0; i < categorySelect.options.length; i++) {
                    if (categorySelect.options[i].value === language) {
                        categorySelect.selectedIndex = i;
                        break;
                    }
                }
                categorySelect.dispatchEvent(new Event('change'));
            }
            showNotification(`✅ Importado: ${fileName}`, 'success');
            gistInput.value = '';
        } catch (error) {
            showNotification(`Error: ${error.message}`, 'error');
        }
    });
    
    gistInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') importBtn.click(); });
}