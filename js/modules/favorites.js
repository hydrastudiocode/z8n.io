// Cache local para mejor rendimiento
let favoritesCache = null;
let currentUserId = null;

// Función para obtener referencia de Firestore
function getFirestoreRef() {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        return firebase.firestore();
    }
    if (typeof window.firebase !== 'undefined' && window.firebase.firestore) {
        return window.firebase.firestore();
    }
    throw new Error('Firebase no está inicializado');
}

// Función para obtener el usuario actual
function getCurrentUser() {
    return firebase.auth().currentUser;
}

// Función para obtener la referencia de favoritos del usuario
function getUserFavoritesRef() {
    const user = getCurrentUser();
    if (!user) return null;
    return getFirestoreRef().collection('userFavorites').doc(user.uid);
}

// Función para cargar favoritos desde Firebase
async function loadFavoritesFromFirebase() {
    try {
        const user = getCurrentUser();
        if (!user) {
            favoritesCache = [];
            return [];
        }

        const docRef = getUserFavoritesRef();
        if (!docRef) {
            favoritesCache = [];
            return [];
        }

        const doc = await docRef.get();
        if (doc.exists) {
            favoritesCache = doc.data().favorites || [];
        } else {
            favoritesCache = [];
        }
        return favoritesCache;
    } catch (error) {
        console.error('Error cargando favoritos:', error);
        // Fallback a localStorage si hay error
        favoritesCache = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favoritesCache;
    }
}

// Función para guardar favoritos en Firebase
async function saveFavoritesToFirebase(favorites) {
    try {
        const user = getCurrentUser();
        if (!user) return;

        const docRef = getUserFavoritesRef();
        if (!docRef) return;

        await docRef.set({
            favorites: favorites,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error guardando favoritos:', error);
        // Fallback a localStorage
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

// Función para verificar si un script es favorito
export async function isFavorite(id) {
    const user = getCurrentUser();
    if (!user) {
        // Si no hay usuario, usar localStorage
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        return favorites.includes(id);
    }

    // Si el usuario cambió, recargar cache
    if (currentUserId !== user.uid) {
        currentUserId = user.uid;
        await loadFavoritesFromFirebase();
    }

    // Si no hay cache, cargar desde Firebase
    if (favoritesCache === null) {
        await loadFavoritesFromFirebase();
    }

    return favoritesCache.includes(id);
}

// Función para alternar favorito
export async function toggleFavorite(id) {
    const user = getCurrentUser();
    let favorites = [];
    let isFav = false;

    if (!user) {
        // Si no hay usuario, usar localStorage
        favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const index = favorites.indexOf(id);
        if (index === -1) {
            favorites.push(id);
            isFav = true;
        } else {
            favorites.splice(index, 1);
            isFav = false;
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
        return isFav;
    }

    // Si el usuario cambió, recargar cache
    if (currentUserId !== user.uid) {
        currentUserId = user.uid;
        await loadFavoritesFromFirebase();
    }

    // Si no hay cache, cargar desde Firebase
    if (favoritesCache === null) {
        await loadFavoritesFromFirebase();
    }

    favorites = [...favoritesCache];
    const index = favorites.indexOf(id);
    if (index === -1) {
        favorites.push(id);
        isFav = true;
    } else {
        favorites.splice(index, 1);
        isFav = false;
    }

    // Actualizar cache
    favoritesCache = favorites;

    // Guardar en Firebase (sin await para no bloquear UI)
    saveFavoritesToFirebase(favorites);

    return isFav;
}

// Función para inicializar cuando cambia el usuario
export function initializeFavoritesForUser() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            await loadFavoritesFromFirebase();

            // Migrar favoritos locales si existen (solo una vez)
            const hasMigrated = localStorage.getItem('favoritesMigrated');
            if (!hasMigrated) {
                await migrateLocalFavoritesToFirebase();
                localStorage.setItem('favoritesMigrated', 'true');
            }
        } else {
            currentUserId = null;
            favoritesCache = null;
        }
    });
}

// Función para migrar favoritos locales a Firebase (opcional)
export async function migrateLocalFavoritesToFirebase() {
    const user = getCurrentUser();
    if (!user) return;

    const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (localFavorites.length > 0) {
        await saveFavoritesToFirebase(localFavorites);
        // Limpiar localStorage después de migrar
        localStorage.removeItem('favorites');
        console.log('Favoritos locales migrados a Firebase');
    }
}

