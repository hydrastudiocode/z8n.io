import { getScriptsRef } from './firebase-init.js';
import { showScriptModal } from './ui-modal.js';
import { toggleFavorite, isFavorite } from './favorites.js';

function getLanguageLogo(language) {
    const logos = {
        'C': 'assets/c.png', 'C#': 'assets/c2.png', 'C++': 'assets/c3.png',
        'JavaScript': 'assets/javaScript.png', 'GdScript': 'assets/gd.png',
        'FireBase': 'assets/fire.png', 'PHP': 'assets/php.png',
        'Python': 'assets/python.png', 'HTML': 'assets/html.png',
        'CSS': 'assets/css.png', 'GitHub': 'assets/github3.svg', 'Otro': 'assets/logowar.png',
        'Git': 'assets/git.svg', 'Google': 'assets/google.svg', 'Microsoft': 'assets/microsoft.svg',
        'Meta': 'assets/meta.svg', 'Spotify': 'assets/spotify.svg', 'Discord': 'assets/discord.svg',
        'Slack': 'assets/slack.svg', 'Figma': 'assets/figma.svg', 'Stripe': 'assets/stripe.svg',
        'Vercel': 'assets/vercel.svg', 'Docker': 'assets/docker.svg', 'React': 'assets/react.svg',
        'Next.js': 'assets/nextjs.svg', 'TypeScript': 'assets/typescript.svg', 'Rust': 'assets/rust.svg',
        'Claude': 'assets/claude.svg', 'Supabase': 'assets/supabase.svg', 'PostgreSQL': 'assets/postgresql.svg',
        'MongoDB': 'assets/mongodb.svg', 'Redis': 'assets/redis.svg', 'Linux': 'assets/linux.svg',
        'AWS': 'assets/aws.svg', 'Cloudfare': 'assets/cloudfare.svg', 'Swift': 'assets/swift.svg',
        'Android': 'assets/android.svg', 'AndroidStudio': 'assets/androidstudio.svg', 'JSON': 'assets/json.svg',
        'DotEnv': 'assets/dotenv.svg', 'Apache': 'assets/apache.svg', 'Angular': 'assets/angular.svg',
        'Astro': 'assets/astro.svg', 'Blitz': 'assets/blitz.svg', 'Django': 'assets/django.svg',
        'Microsoft-Net': 'assets/microsoft-dotnet.svg', 'FastApi': 'assets/fastapi.svg', 'Flutter': 'assets/flutter.svg',
        'Vue': 'assets/vue.svg', 'AssemblyScript': 'assets/assemblyscript.svg', 'Bash': 'assets/bash.svg',
        'Css-New': 'assets/css-new.svg', 'Dart': 'assets/dart.svg', 'Java': 'assets/java.svg', 'Kotlin': 'assets/kotlin.svg',
        'Ocaml': 'assets/ocaml.svg', 'Perl': 'assets/perl.svg', 'Powershell': 'assets/powershell.svg', 'Windows': 'assets/windows.svg',
        'Ruby': 'assets/ruby.svg', 'SVG': 'assets/svg.svg', 'Cobol': 'assets/cobol.svg'
    };
    return logos[language] || logos['Otro'];
}

// Función para obtener nombre de archivo seguro
function getSafeFileName(title, category) {
    const cleanTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = getFileExtension(category);
    return `${cleanTitle}.${extension}`;
}

// Función para obtener extensión según categoría
function getFileExtension(category) {
    const extensions = {
        'JavaScript': 'js', 'Python': 'py', 'PHP': 'php', 'C': 'c', 'C#': 'cs',
        'C++': 'cpp', 'HTML': 'html', 'CSS': 'css', 'JSON': 'json', 'TypeScript': 'ts',
        'Java': 'java', 'Kotlin': 'kt', 'Ruby': 'rb', 'Swift': 'swift', 'Rust': 'rs',
        'Bash': 'sh', 'Powershell': 'ps1', 'Dart': 'dart', 'GdScript': 'gd'
    };
    return extensions[category] || 'txt';
}

// Función para descargar script
function downloadScript(script) {
    const fileName = getSafeFileName(script.title, script.category);
    const content = script.content || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Descargar: ' + script.title);
}

// Función para copiar contenido al portapapeles
async function copyScriptContent(script) {
    const content = script.content || '';
    try {
        await navigator.clipboard.writeText(content);
        showToast('Copiado: ' + script.title);
    } catch (err) {
        console.error('Error al copiar:', err);
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copiado: ' + script.title);
    }
}

// Función para mostrar notificación temporal
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'download-toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--accent-primary);
        color: #000;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        z-index: 9999;
        animation: fadeInOut 2s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// Escapar HTML para evitar XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function createScriptElement(id, script) {
    const scriptElement = document.createElement('div');
    scriptElement.className = 'script-card';
    scriptElement.setAttribute('data-id', id);
    
    const isFav = isFavorite(id);
    const title = escapeHtml(script.title);
    const author = script.author ? escapeHtml(script.author) : 'Autor no especificado';
    const category = escapeHtml(script.category);
    const logoUrl = getLanguageLogo(script.category);
    
    scriptElement.innerHTML = `
        <button class="script-favorite-corner" data-id="${id}" title="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
            <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
        </button>
        <img src="${logoUrl}" alt="${category}" class="script-card-logo">
        <h3 class="script-card-title">${title}</h3>
        <div class="script-card-author">${author}</div>
        <div class="script-card-category">${category}</div>
        <div class="script-card-actions">
            <button class="script-action-btn view-btn" data-id="${id}" title="Ver código">
                <i class="fas fa-eye"></i>
            </button>
            <button class="script-action-btn copy-btn" data-id="${id}" title="Copiar código">
                <i class="fas fa-copy"></i>
            </button>
            <button class="script-action-btn download-btn" data-id="${id}" title="Descargar">
                <i class="fas fa-download"></i>
            </button>
        </div>
    `;
    
    // Botón Favorito (corazón en esquina)
    const favCornerBtn = scriptElement.querySelector('.script-favorite-corner');
    favCornerBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const newState = await toggleFavorite(id);
        const icon = favCornerBtn.querySelector('i');
        if (newState) {
            icon.className = 'fa-solid fa-heart';
            favCornerBtn.title = 'Quitar de favoritos';
            // Animación de corazón rojo
            showHeartAnimation(favCornerBtn);
        } else {
            icon.className = 'fa-regular fa-heart';
            favCornerBtn.title = 'Añadir a favoritos';
        }
    });
    
    // Botón Ver (ojo)
    const viewBtn = scriptElement.querySelector('.view-btn');
    viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showScriptModal(id, script);
    });
    
    // Botón Copiar
    const copyBtn = scriptElement.querySelector('.copy-btn');
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        copyScriptContent(script);
    });
    
    // Botón Descargar
    const downloadBtn = scriptElement.querySelector('.download-btn');
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadScript(script);
    });
    
    // Hacer clic en la tarjeta abre el modal
    scriptElement.addEventListener('click', () => {
        showScriptModal(id, script);
    });
    
    return scriptElement;
}

// Animación de corazón al hacer clic


export async function loadScripts(category = 'all', searchTerm = '', showFavorites = false) {
    const scriptsRef = getScriptsRef();
    try {
        let query = scriptsRef.orderBy('createdAt', 'desc');
        const snapshot = await query.get();
        const scriptsContainer = document.getElementById('scripts-container');
        
        if (!scriptsContainer) {
            console.error('scripts-container no encontrado');
            return;
        }
        
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
        const scriptsContainer = document.getElementById('scripts-container');
        if (scriptsContainer) {
            scriptsContainer.innerHTML = '<p class="error-message">Error al cargar los scripts</p>';
        }
    }
}