import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'searchDepartSelect',
        'searchArriveeSelect',
        'searchDateInput',

        'applyFiltersBtn',
        'resetFiltersBtn',
        'tripResultsList',
        'ecoFilterCheckbox',
        'priceRangeInput',
        'priceOutputSpan',
        'ratingRangeInput',
        'ratingOutputSpan',
        'durationRangeInput',
        'durationOutputSpan'
    ];

    FRENCH_CITIES = [
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

    connect() {
        console.log('Stimulus: search_carpool_controller connecté.');
        
        const urlParams = new URLSearchParams(window.location.search);
        const searchDepart = urlParams.get('depart');
        const searchArrivee = urlParams.get('arrivee');
        const searchDate = urlParams.get('date');

        if (this.hasSearchDepartSelectTarget) {
            this.populateCitySelect(this.searchDepartSelectTarget, searchDepart);
        }
        if (this.hasSearchArriveeSelectTarget) {
            this.populateCitySelect(this.searchArriveeSelectTarget, searchArrivee);
        }
        if (this.hasSearchDateInputTarget) {
            this.initializeDateField();
            if (searchDate) {
                this.searchDateInputTarget.value = searchDate;
            }
        }

        if (this.hasPriceRangeInputTarget && this.hasPriceOutputSpanTarget) {
            this.priceOutputSpanTarget.textContent = this.priceRangeInputTarget.value;
        }
        if (this.hasDurationRangeInputTarget && this.hasDurationOutputSpanTarget) {
            this.updateDurationOutput(); 
        }
        if (this.hasRatingRangeInputTarget && this.hasRatingOutputSpanTarget) {
            this.updateRatingOutput(); 
        }
        
        if (this.hasTripResultsListTarget) {
            this.filterTrips(); 
        }
    }

    populateCitySelect(selectElement, selectedValue = null) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Sélectionnez</option>';
        this.FRENCH_CITIES.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            if (city === selectedValue) option.selected = true;
            selectElement.appendChild(option);
        });
    }

    initializeDateField() {
        if (!this.hasSearchDateInputTarget) return;
        const today = new Date().toISOString().split('T')[0];
        this.searchDateInputTarget.setAttribute('min', today);
    }

    filterTrips() {
        if (!this.hasTripResultsListTarget) return;

        const filters = {
            eco: this.hasEcoFilterCheckboxTarget ? this.ecoFilterCheckboxTarget.checked : false,
            maxPrice: this.hasPriceRangeInputTarget ? parseInt(this.priceRangeInputTarget.value, 10) : Infinity,
            minRating: this.hasRatingRangeInputTarget ? parseInt(this.ratingRangeInputTarget.value, 10) : 0,
            maxDuration: this.hasDurationRangeInputTarget ? parseInt(this.durationRangeInputTarget.value, 10) : Infinity
        };
        
        const allCards = this.tripResultsListTarget.querySelectorAll('.trip-card');
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
            this.tripResultsListTarget.insertAdjacentHTML('beforeend', alert);
        }
    }
    
    resetFilters() {
        if(this.hasEcoFilterCheckboxTarget) this.ecoFilterCheckboxTarget.checked = false;
        
        if (this.hasPriceRangeInputTarget) this.priceRangeInputTarget.value = 50;
        if (this.hasPriceOutputSpanTarget) this.priceOutputSpanTarget.textContent = 50;
        
        if (this.hasDurationRangeInputTarget) this.durationRangeInputTarget.value = 1440;
        if (this.hasDurationOutputSpanTarget) this.durationOutputSpanTarget.innerHTML = 'Illimitée';
        
        if(this.hasRatingRangeInputTarget) this.ratingRangeInputTarget.value = 0;
        if(this.hasRatingOutputSpanTarget) this.ratingOutputSpanTarget.textContent = 'Toutes';
        
        this.filterTrips();
    }

    updatePriceOutput() {
        if(this.hasPriceOutputSpanTarget && this.hasPriceRangeInputTarget) {
            this.priceOutputSpanTarget.textContent = this.priceRangeInputTarget.value;
        }
    }
    
    updateDurationOutput() {
        if(this.hasDurationRangeInputTarget && this.hasDurationOutputSpanTarget) {
            const value = parseInt(this.durationRangeInputTarget.value, 10);
            if (value >= 1440) {
                this.durationOutputSpanTarget.innerHTML = 'Illimitée';
            } else {
                const hours = Math.floor(value / 60);
                const minutes = value % 60;
                this.durationOutputSpanTarget.innerHTML = `< ${hours}h${minutes > 0 ? ' ' + minutes + 'min' : ''}`;
            }
        }
    }

    updateRatingOutput() {
        if(this.hasRatingRangeInputTarget && this.hasRatingOutputSpanTarget) {
            const value = parseInt(this.ratingRangeInputTarget.value, 10);
            if (value === 0) {
                this.ratingOutputSpanTarget.textContent = 'Toutes';
            } else {
                this.ratingOutputSpanTarget.textContent = `${value}+ étoiles`;
            }
        }
    }
}