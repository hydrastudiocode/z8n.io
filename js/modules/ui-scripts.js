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