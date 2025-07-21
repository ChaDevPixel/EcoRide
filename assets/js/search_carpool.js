
function initializeSearchPage() {
    const departSelect = document.getElementById('search-depart');
    const arriveeSelect = document.getElementById('search-arrivee');
    const dateInput = document.getElementById('search-date');

    const FRENCH_CITIES = [
        "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
        "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre",
        "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Villeurbanne",
        "Saint-Denis", "Le Mans", "Aix-en-Provence", "Brest", "Limoges", "Tours",
        "Perpignan", "Metz", "Besançon", "Orléans", "Mulhouse", "Rouen",
        "Caen", "Nancy", "Argenteuil", "Montreuil", "Saint-Paul", "Avignon",
        "Versailles", "Nîmes", "Clermont-Ferrand", "Le Tampon", "Annecy",
        "Saint-Denis (Réunion)", "Boulogne-Billancourt", "Saint-Pierre (Réunion)",
        "Mérignac", "Troyes", "Poitiers", "Pau", "Antibes", "La Rochelle"
    ].sort();

    function populateCitySelect(selectElement, selectedValue = null) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Sélectionnez</option>';
        FRENCH_CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            if (city === selectedValue) option.selected = true;
            selectElement.appendChild(option);
        });
    }

    function initializeDateField() {
        if (!dateInput) return;
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const searchDepart = urlParams.get('depart');
    const searchArrivee = urlParams.get('arrivee');
    const searchDate = urlParams.get('date');


    populateCitySelect(departSelect, searchDepart);
    populateCitySelect(arriveeSelect, searchArrivee);
    initializeDateField();
    
    if (dateInput && searchDate) {
        dateInput.value = searchDate;
    }

    const applyBtn = document.getElementById('apply-filters-btn');
    const resetBtn = document.getElementById('reset-filters-btn');
    const tripList = document.getElementById('trip-results-list');
    
    const ecoFilter = document.getElementById('eco-filter');
    const priceRange = document.getElementById('price-range');
    const priceOutput = document.getElementById('price-output');
    const ratingRange = document.getElementById('rating-range');
    const ratingOutput = document.getElementById('rating-output');
    const durationRange = document.getElementById('duration-range');
    const durationOutput = document.getElementById('duration-output');

    function filterTrips() {
        if (!tripList) return;

        const filters = {
            eco: ecoFilter.checked,
            maxPrice: parseInt(priceRange.value, 10),
            minRating: parseInt(ratingRange.value, 10),
            maxDuration: parseInt(durationRange.value, 10)
        };
        
        const allCards = tripList.querySelectorAll('.trip-card');
        let visibleCount = 0;

        allCards.forEach(card => {
            const trip = {
                price: parseInt(card.dataset.price, 10),
                rating: parseFloat(card.dataset.rating),
                isEco: card.dataset.eco === 'true',
                duration: parseInt(card.dataset.duration, 10)
            };

            const isDurationOk = filters.maxDuration >= 1440 ? true : trip.duration <= filters.maxDuration;

            const isVisible = 
                (filters.eco ? trip.isEco : true) &&
                (trip.price <= filters.maxPrice) &&
                (trip.rating >= filters.minRating) &&
                isDurationOk;

            card.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });
        
        const noFilterMatch = document.getElementById('no-filter-match-message');
        if (noFilterMatch) {
            noFilterMatch.remove();
        }

        if (visibleCount === 0 && allCards.length > 0) {
            const alert = '<div id="no-filter-match-message" class="alert alert-info text-center mt-3">Aucun résultat ne correspond à vos filtres.</div>';
            tripList.insertAdjacentHTML('beforeend', alert);
        }
    }
    
    function resetFilters() {
        if(ecoFilter) ecoFilter.checked = false;
        
        if (priceRange) priceRange.value = 50;
        if (priceOutput) priceOutput.textContent = 50;
        
        if (durationRange) durationRange.value = 1440;
        if (durationOutput) durationOutput.innerHTML = 'Illimitée';
        
        if(ratingRange) ratingRange.value = 0;
        if(ratingOutput) ratingOutput.textContent = 'Toutes';
        
        filterTrips();
    }

    if (applyBtn) applyBtn.addEventListener('click', filterTrips);
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    if (priceRange) priceRange.addEventListener('input', () => {
        if(priceOutput) priceOutput.textContent = priceRange.value;
    });
    
    if (durationRange) {
        durationRange.addEventListener('input', () => {
            const value = parseInt(durationRange.value, 10);
            if (value >= 1440) {
                if(durationOutput) durationOutput.innerHTML = 'Illimitée';
            } else {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                if(durationOutput) durationOutput.innerHTML = `&lt; ${hours}h${minutes > 0 ? ' ' + minutes + 'min' : ''}`;
            }
        });
    }

    if (ratingRange) {
        ratingRange.addEventListener('input', () => {
            const value = parseInt(ratingRange.value, 10);
            if (value === 0) {
                if(ratingOutput) ratingOutput.textContent = 'Toutes';
            } else {
                if(ratingOutput) ratingOutput.textContent = `${value}+ étoiles`;
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', initializeSearchPage);
document.addEventListener('turbo:load', initializeSearchPage);
