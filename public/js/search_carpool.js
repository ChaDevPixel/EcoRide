document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const resultsContainer = document.getElementById('search-results-container');
    const noResultsAlert = document.getElementById('no-results-alert');
    const initialMessage = document.getElementById('initial-message');
    const resultsTitle = document.getElementById('results-title');
    const filterButton = document.getElementById('filter-button');

    let allTrips = []; // Pour stocker les résultats de la recherche initiale

    if (!searchForm) return;

    // --- GESTION DE LA RECHERCHE PRINCIPALE ---
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(searchForm);
        const depart = formData.get('depart');
        const arrivee = formData.get('arrivee');
        const date = formData.get('date');

        if (!depart || !arrivee || !date) {
            alert('Veuillez remplir tous les champs de recherche.');
            return;
        }

        const query = new URLSearchParams({ depart, arrivee, date }).toString();
        const url = `/api/covoiturages/search?${query}`;
        
        // Affiche un indicateur de chargement
        resultsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        if(initialMessage) initialMessage.classList.add('d-none');
        if(noResultsAlert) noResultsAlert.classList.add('d-none');

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur du serveur: ${response.statusText}`);
            }
            const data = await response.json();
            allTrips = data.results; // Stocke les résultats bruts
            
            displayResults(allTrips); // Affiche tous les résultats

            if (allTrips.length > 0) {
                if(resultsTitle) resultsTitle.classList.remove('d-none');
                if(filterButton) filterButton.classList.remove('d-none');
            } else {
                handleNoResults(data.nextAvailable);
            }

        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            resultsContainer.innerHTML = `<div class="alert alert-danger">Une erreur est survenue. Veuillez réessayer.</div>`;
        }
    });

    // --- AFFICHAGE DES RÉSULTATS ---
    function displayResults(trips) {
        resultsContainer.innerHTML = ''; // Vide les anciens résultats
        if (trips.length === 0) {
            resultsContainer.innerHTML = '<div class="alert alert-info">Aucun voyage ne correspond à vos filtres.</div>';
            return;
        }
        trips.forEach(trip => {
            const cardHtml = createTripCardHTML(trip);
            resultsContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    }

    function handleNoResults(nextAvailable) {
        if(noResultsAlert) noResultsAlert.classList.remove('d-none');
        resultsContainer.innerHTML = ''; // Vide le spinner
        if(resultsTitle) resultsTitle.classList.add('d-none');
        if(filterButton) filterButton.classList.add('d-none');

        const nextAvailableText = noResultsAlert.querySelector('#next-available-text');
        const nextAvailableLink = noResultsAlert.querySelector('#next-available-link');

        if (nextAvailable && nextAvailableText && nextAvailableLink) {
            const nextDate = new Date(nextAvailable.dateDepart);
            const formattedDate = nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            nextAvailableText.textContent = `Prochain départ disponible : ${formattedDate} à ${nextAvailable.heureDepart}`;
            
            // Met à jour le formulaire et relance la recherche au clic
            nextAvailableLink.onclick = (e) => {
                e.preventDefault();
                searchForm.querySelector('input[name="date"]').value = nextDate.toISOString().split('T')[0];
                searchForm.dispatchEvent(new Event('submit', { cancelable: true }));
            };
            nextAvailableLink.classList.remove('d-none');
        } else if (nextAvailableLink) {
            nextAvailableLink.classList.add('d-none');
            nextAvailableText.textContent = 'Essayez de modifier votre recherche ou d\'élargir vos dates.';
        }
    }

    function createTripCardHTML(trip) {
        const isEco = trip.voiture && (trip.voiture.energie.toLowerCase() === 'electric' || trip.voiture.energie.toLowerCase() === 'hybrid');
        const ecoHtml = isEco ? `<p class="mb-1 text-primary"><i class="bi bi-leaf-fill"></i> Voyage écologique</p>` : '<p class="mb-1 text-muted">Voyage classique</p>';
        
        const driver = trip.utilisateur;
        const driverPhoto = driver.photo || 'https://i.pravatar.cc/80'; // Photo par défaut
        const driverRating = driver.noteMoyenne ? driver.noteMoyenne.toFixed(1) : 'N/A';

        // Calcule le nombre total de places
        const totalSeats = trip.placesDisponibles + (trip.nombreAccompagnateurs || 0);

        return `
            <div class="col-12 col-sm-6 col-lg-3 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column gap-3">
                        <div class="d-flex flex-column align-items-center text-center bg-primary rounded p-3">
                            <img src="${driverPhoto}" class="rounded-circle mb-2" width="80" height="80" alt="photo de ${driver.pseudo}">
                            <p class="card-title mb-1 fs-6 text-light">${driver.pseudo}</p>
                            <p class="mb-0 text-light"><i class="bi bi-star-fill text-warning"></i> ${driverRating}</p>
                        </div>
                        <div>
                            <p class="d-flex align-items-center justify-content-center fw-bold">${new Date(trip.dateDepart).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            <div class="d-flex align-items-center gap-2 justify-content-center mb-3">
                                <div class="text-start me-3">
                                    <p class="mb-0">${trip.villeDepart}</p>
                                    <p class="fw-semibold mb-0">${trip.heureDepart}</p>
                                </div>
                                <i class="bi bi-arrow-right fs-4"></i>
                                <div class="text-start ms-3">
                                    <p class="mb-0">${trip.villeArrivee}</p>
                                    <p class="fw-semibold mb-0">${trip.heureArrivee}</p>
                                </div>
                            </div>
                            <p class="mb-1">Places restantes: ${trip.placesDisponibles}/${totalSeats}</p>
                            <p class="mb-1">Prix : ${trip.prix} crédits</p>
                            ${ecoHtml}
                        </div>
                        <div class="text-center mt-auto">
                            <a href="/covoiturage/${trip.id}" class="btn btn-primary px-4">Détails</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- GESTION DES FILTRES ---
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const applyFiltersBtnMobile = document.getElementById('apply-filters-btn-mobile');

    const filterAction = () => {
        const filters = {
            eco: document.getElementById('eco-filter').checked,
            maxPrice: parseInt(document.getElementById('price-range').value, 10),
            // Note: la durée n'est pas une donnée que nous avons directement, nous laissons ce filtre de côté pour l'instant
            minRating: parseInt(document.getElementById('rating-value').value, 10)
        };

        const filteredTrips = allTrips.filter(trip => {
            const driverRating = trip.utilisateur.noteMoyenne || 0;
            const isEco = trip.voiture && (trip.voiture.energie.toLowerCase() === 'electric' || trip.voiture.energie.toLowerCase() === 'hybrid');

            if (filters.eco && !isEco) return false;
            if (trip.prix > filters.maxPrice) return false;
            if (driverRating < filters.minRating) return false;

            return true;
        });

        displayResults(filteredTrips);
    };

    if(applyFiltersBtn) applyFiltersBtn.addEventListener('click', filterAction);
    if(applyFiltersBtnMobile) applyFiltersBtnMobile.addEventListener('click', filterAction);

});
