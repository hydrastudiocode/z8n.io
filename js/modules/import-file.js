import { getContentEditor } from './editor-codemirror.js';
import { showNotification } from './ui-modal.js';

function detectLanguageFromExtension(extension) {
    const map = {
        'js': 'JavaScript', 'py': 'Python', 'php': 'PHP', 'c': 'C',
        'cpp': 'C++', 'cs': 'C#', 'html': 'HTML', 'css': 'CSS',
        'json': 'FireBase', 'gd': 'GdScript', 'txt': 'Otro'
    };
    return map[extension] || 'Otro';
}

export function setupFileImport() {
    const dropzone = document.getElementById('import-dropzone');
    const fileInput = document.getElementById('file-input');
    if (!dropzone || !fileInput) return;
    
    const processFile = async (file) => {
        if (!file) return;
        try {
            const content = await file.text();
            const fileName = file.name;
            const extension = fileName.split('.').pop().toLowerCase();
            const language = detectLanguageFromExtension(extension);
            const title = fileName.replace(/\.[^/.]+$/, '');
            
            const editor = getContentEditor();
            if (editor) editor.setValue(content);
            else document.getElementById('script-content').value = content;
            
            document.getElementById('script-title').value = title;
            
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
            showNotification(`✅ ${fileName} importado`, 'success');
        } catch (error) {
            showNotification('Error al leer archivo', 'error');
        }
    };
    
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) processFile(e.target.files[0]);
        fileInput.value = '';
    });
}