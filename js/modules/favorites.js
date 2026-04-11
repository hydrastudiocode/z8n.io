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
        showStarFeedback(true);
    } else {
        favorites.splice(index, 1);
        isFav = false;
        showStarFeedback(false);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    return isFav;
}

function showStarFeedback(isFavorite) {
    const star = document.getElementById('star-feedback');
    if (star) {
        star.textContent = isFavorite ? '⭐' : '☆';
        star.style.display = 'block';
        setTimeout(() => { star.style.display = 'none'; }, 500);
    }
}