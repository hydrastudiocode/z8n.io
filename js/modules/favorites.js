export function isFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(id);
}

export function toggleFavorite(id) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(id);
    let isFav = false;
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

