// public/js/add_carpool.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Script add_carpool.js chargé.');

    // =====================================================================
    // CONSTANTES ET SÉLECTEURS DOM
    // =====================================================================

    // --- Données globales ---
    let userVehiclesData = [];
    let userDriverCovoituragesData = []; // Voyages où l'utilisateur est chauffeur
    let userPassengerCovoituragesData = []; // Voyages où l'utilisateur est passager

    // --- Conteneurs principaux de l'onglet ---
    const tripMessageContainer = document.getElementById('tripMessageContainer');

    // --- Section Chauffeur ---
    const addTripButton = document.getElementById('addTripButton');
    const driverTripsContainer = document.getElementById('driver-trips-container');
    const noDriverTripsMessage = document.getElementById('no-driver-trips-message');
    const tripFormContainer = document.getElementById('tripFormContainer');
    const tripForm = document.getElementById('tripForm');

    // --- Section Passager ---
    const passengerTripsContainer = document.getElementById('passenger-trips-container');
    const noPassengerTripsMessage = document.getElementById('no-passenger-trips-message');

    // --- Éléments du formulaire de voyage ---
    const departureCitySelect = document.getElementById('departureCity');
    const departureDateInput = document.getElementById('departureDate');
    const departureTimeInput = document.getElementById('departureTime');
    const arrivalCitySelect = document.getElementById('arrivalCity');
    const arrivalDateInput = document.getElementById('arrivalDate');
    const arrivalTimeInput = document.getElementById('arrivalTime');
    const tripPriceInput = document.getElementById('tripPrice');
    const tripVehicleSelect = document.getElementById('tripVehicleSelect');
    const isAccompaniedCheckbox = document.getElementById('isAccompanied');
    const companionsInputGroup = document.getElementById('companionsInputGroup');
    const numberOfCompanionsInput = document.getElementById('numberOfCompanions');
    const availableSeatsInput = document.getElementById('availableSeats');
    const cancelTripBtn = document.getElementById('cancelTripBtn');
    
    // Liste de villes
    const FRENCH_CITIES = [
        "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
        "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre",
        "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Villeurbanne",
        "Saint-Denis", "Le Mans", "Aix-en-Provence", "Brest", "Limoges", "Tours",
        "Perpignan", "Metz", "Besançon", "Orléans", "Mulhouse", "Rouen", "Caen"
    ].sort();


    // =====================================================================
    // FONCTIONS UTILITAIRES
    // =====================================================================

    function displayMessage(container, message, type) {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) return;
        targetContainer.innerHTML = '';
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.appendChild(alertDiv);
        setTimeout(() => alertDiv.classList.remove('show'), 5000);
    }

    function formatDate(date) { return new Date(date).toISOString().split('T')[0]; }
    function formatDisplayDate(dateString) { return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

    // =====================================================================
    // RÉCUPÉRATION DES DONNÉES INITIALES (Véhicules)
    // =====================================================================
    
    try {
        const userVehiclesDataElement = document.getElementById('user-vehicles-data');
        if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim()) {
            userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
            console.log('add_carpool.js: Véhicules utilisateur chargés:', userVehiclesData);
        }
    } catch (e) {
        console.error("add_carpool.js: Erreur parsing des données véhicules:", e);
    }

    // =====================================================================
    // LOGIQUE DE LA SECTION "CHAUFFEUR"
    // =====================================================================

    /**
     * Affiche un covoiturage créé par l'utilisateur dans la liste CHAUFFEUR.
     */
    function addDriverCovoiturageToList(covoiturageData, prepend = false) {
        if (!driverTripsContainer) return;
        if (noDriverTripsMessage) noDriverTripsMessage.classList.add('d-none');

        const covoiturageDiv = document.createElement('div');
        covoiturageDiv.id = `covoiturage-${covoiturageData.id}`;
        covoiturageDiv.className = 'd-flex flex-column flex-md-row align-items-start align-items-md-center px-3 py-2 rounded border mb-2 bg-light';

        const mainInfoSpan = document.createElement('span');
        mainInfoSpan.className = 'mb-2 mb-md-0 flex-grow-1 text-sm';
        
        let vehiculeInfo = 'Véhicule inconnu';
        let iconHtml = '';
        if (covoiturageData.voiture && typeof covoiturageData.voiture === 'object') {
            const vehiculeFromLocalData = userVehiclesData.find(v => v.id == covoiturageData.voiture.id);
            if (vehiculeFromLocalData) {
                const energie = vehiculeFromLocalData.energie?.trim().toLowerCase() || '';
                if (energie === 'electric' || energie === 'hybrid') {
                    iconHtml = '<i class="bi bi-leaf-fill text-primary"></i> ';
                    covoiturageDiv.classList.replace('bg-light', 'bg-opacity-10');
                    covoiturageDiv.classList.add('bg-secondary');
                }
                vehiculeInfo = `${vehiculeFromLocalData.marque?.libelle || ''} ${vehiculeFromLocalData.modele || ''} (${vehiculeFromLocalData.immatriculation || 'N/A'})`;
            }
        }
        mainInfoSpan.innerHTML = `
            <strong>${covoiturageData.villeDepart}</strong> <i class="bi bi-arrow-right"></i> <strong>${covoiturageData.villeArrivee}</strong><br>
            Le ${formatDisplayDate(covoiturageData.dateDepart)} à ${covoiturageData.heureDepart} <br>
            Prix: ${covoiturageData.prix} crédits - Places: ${covoiturageData.placesDisponibles} <br>
            Véhicule: ${iconHtml}${vehiculeInfo}
        `;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0';

        const actionButtonsDiv = document.createElement('div');
        actionButtonsDiv.className = 'd-flex gap-2';
        actionButtonsDiv.innerHTML = `
            <button type="button" class="btn btn-success btn-sm rounded-4 px-3 start-trip-btn" data-covoiturage-id="${covoiturageData.id}">Commencer</button>
            <button type="button" class="btn btn-warning btn-sm rounded-4 px-3 end-trip-btn d-none" data-covoiturage-id="${covoiturageData.id}">Terminer</button>
        `;

        covoiturageDiv.append(mainInfoSpan, statusSpan, actionButtonsDiv);
        prepend ? driverTripsContainer.prepend(covoiturageDiv) : driverTripsContainer.appendChild(covoiturageDiv);
        updateTripActionButtonsForElement(covoiturageDiv, covoiturageData.statut, new Date(covoiturageData.dateDepart));
    }

    /**
     * Charge et affiche les covoiturages où l'utilisateur est CHAUFFEUR.
     */
    async function loadAndDisplayDriverCovoiturages() {
        if (!driverTripsContainer) return;
        try {
            const response = await fetch('/api/user-covoiturages');
            if (!response.ok) throw new Error((await response.json()).message);
            
            userDriverCovoituragesData = await response.json();
            console.log('add_carpool.js: Voyages CHAUFFEUR chargés.', userDriverCovoituragesData);

            driverTripsContainer.innerHTML = '';
            if (userDriverCovoituragesData.length === 0) {
                if (noDriverTripsMessage) noDriverTripsMessage.classList.remove('d-none');
            } else {
                userDriverCovoituragesData.forEach(covoiturage => addDriverCovoiturageToList(covoiturage));
            }
        } catch (error) {
            displayMessage(tripMessageContainer, `Impossible de charger vos voyages (chauffeur): ${error.message}`, 'danger');
        }
    }
    
    /**
     * Gère les clics sur les boutons "Commencer" et "Terminer".
     */
    driverTripsContainer?.addEventListener('click', async (e) => {
        const button = e.target.closest('.start-trip-btn, .end-trip-btn');
        if (!button) return;

        const covoiturageId = button.dataset.covoiturageId;
        const actionType = button.classList.contains('start-trip-btn') ? 'start' : 'end';
        const covoiturageElement = button.closest('div.d-flex');

        try {
            const response = await fetch(`/api/covoiturage/${covoiturageId}/${actionType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            const covoiturageData = userDriverCovoituragesData.find(c => c.id == covoiturageId);
            covoiturageData.statut = result.newStatus;
            updateTripActionButtonsForElement(covoiturageElement, result.newStatus, new Date(covoiturageData.dateDepart));
            displayMessage(tripMessageContainer, result.message, 'success');
        } catch (error) {
            displayMessage(tripMessageContainer, error.message, 'danger');
        }
    });

    /**
     * Met à jour les boutons d'action d'un voyage (visibilité, statut).
     */
    function updateTripActionButtonsForElement(covoiturageElement, status, tripDate) {
        const startBtn = covoiturageElement.querySelector('.start-trip-btn');
        const endBtn = covoiturageElement.querySelector('.end-trip-btn');
        const statusSpan = covoiturageElement.querySelector('span:nth-of-type(2)');

        startBtn.classList.add('d-none');
        endBtn.classList.add('d-none');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tripDate.setHours(0, 0, 0, 0);

        switch(status) {
            case 'initialise':
                startBtn.classList.remove('d-none');
                startBtn.disabled = tripDate.getTime() !== today.getTime();
                statusSpan.textContent = 'Non démarré';
                statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0 text-info';
                break;
            case 'en_cours':
                endBtn.classList.remove('d-none');
                statusSpan.textContent = 'En cours';
                statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0 text-success';
                break;
            case 'termine':
                statusSpan.textContent = 'Terminé';
                statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0 text-danger';
                break;
        }
    }


    // =====================================================================
    // LOGIQUE DE LA SECTION "PASSAGER"
    // =====================================================================

    /**
     * Affiche un voyage où l'utilisateur est passager.
     */
    function addPassengerTripToList(participationData) {
        if (!passengerTripsContainer || !noPassengerTripsMessage) return;

        noPassengerTripsMessage.classList.add('d-none');
        
        const covoiturage = participationData.covoiturage;
        if (!covoiturage) return;

        const tripDiv = document.createElement('div');
        tripDiv.id = `participation-${participationData.id}`;
        tripDiv.className = 'd-flex flex-column flex-md-row align-items-start align-items-md-center px-3 py-2 rounded border mb-2 bg-light';

        const mainInfoSpan = document.createElement('span');
        mainInfoSpan.className = 'mb-2 mb-md-0 flex-grow-1 text-sm';
        
        const driverPseudo = covoiturage.chauffeur?.pseudo || 'Inconnu';
        
        mainInfoSpan.innerHTML = `
            <strong>${covoiturage.villeDepart}</strong> <i class="bi bi-arrow-right"></i> <strong>${covoiturage.villeArrivee}</strong><br>
            Le ${formatDisplayDate(covoiturage.dateDepart)} à ${covoiturage.heureDepart}<br>
            Conducteur: <strong>${driverPseudo}</strong> - Statut: <span class="fw-bold">${covoiturage.statut || 'N/A'}</span>
        `;
        
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-outline-danger btn-sm rounded-4 px-3 ms-md-auto cancel-participation-btn';
        actionBtn.textContent = 'Annuler';
        actionBtn.dataset.participationId = participationData.id;

        tripDiv.append(mainInfoSpan, actionBtn);
        passengerTripsContainer.appendChild(tripDiv);
    }
    
    /**
     * Charge et affiche les voyages où l'utilisateur est PASSAGER.
     */
    async function loadAndDisplayPassengerTrips() {
        if (!passengerTripsContainer) return;
        try {
            // NOTE : Vous devez créer cette route API dans Symfony.
            const response = await fetch('/api/user-participations'); 
            if (!response.ok) throw new Error((await response.json()).message);

            userPassengerCovoituragesData = await response.json();
            console.log('add_carpool.js: Voyages PASSAGER chargés.', userPassengerCovoituragesData);

            passengerTripsContainer.innerHTML = '';
            if (userPassengerCovoituragesData.length === 0) {
                if (noPassengerTripsMessage) noPassengerTripsMessage.classList.remove('d-none');
            } else {
                userPassengerCovoituragesData.forEach(participation => addPassengerTripToList(participation));
            }
        } catch (error) {
            displayMessage(passengerTripsContainer, `Impossible de charger vos participations: ${error.message}`, 'danger');
        }
    }


    // =====================================================================
    // GESTION DU FORMULAIRE DE CRÉATION DE VOYAGE
    // =====================================================================

    function populateCitySelect(selectElement, cities) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Sélectionnez une ville</option>';
        cities.forEach(city => {
            const option = new Option(city, city);
            selectElement.add(option);
        });
    }

    function populateTripVehicleSelect() {
        if (!tripVehicleSelect) return;
        tripVehicleSelect.innerHTML = '<option value="">Sélectionnez un véhicule</option>';
        if (userVehiclesData.length === 0) {
            tripVehicleSelect.add(new Option("Aucun véhicule. Ajoutez-en un d'abord.", "", false, true));
            return;
        }
        userVehiclesData.forEach(vehicle => {
            const marque = vehicle.marque?.libelle || 'Inconnue';
            const modele = vehicle.modele || 'Inconnu';
            const energie = vehicle.energie?.toLowerCase() || '';
            const icon = (energie === 'electric' || energie === 'hybrid') ? '🍃 ' : '';
            const text = `${icon}${marque} ${modele} - ${vehicle.nombreDePlaces} places`;
            const option = new Option(text, vehicle.id);
            option.dataset.nombreDePlaces = vehicle.nombreDePlaces;
            tripVehicleSelect.add(option);
        });
    }

    function updateAvailableSeats() {
        if (!tripVehicleSelect || !availableSeatsInput || !numberOfCompanionsInput) return;
        const selectedOption = tripVehicleSelect.options[tripVehicleSelect.selectedIndex];
        const totalSeats = parseInt(selectedOption.dataset.nombreDePlaces) || 0;
        let companions = isAccompaniedCheckbox.checked ? (parseInt(numberOfCompanionsInput.value) || 0) : 0;
        companions = Math.max(0, Math.min(companions, totalSeats));
        numberOfCompanionsInput.value = companions;
        availableSeatsInput.value = Math.max(0, totalSeats - companions);
        numberOfCompanionsInput.max = totalSeats;
    }

    // --- Événements du formulaire ---
    addTripButton?.addEventListener('click', () => {
        tripFormContainer.classList.remove('d-none');
        addTripButton.classList.add('d-none');
        tripForm.reset();
        populateTripVehicleSelect();
        isAccompaniedCheckbox.checked = false;
        companionsInputGroup.classList.add('d-none');
        updateAvailableSeats();
    });

    cancelTripBtn?.addEventListener('click', () => {
        tripFormContainer.classList.add('d-none');
        addTripButton.classList.remove('d-none');
        tripMessageContainer.innerHTML = '';
    });
    
    tripForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tripData = {
            villeDepart: departureCitySelect.value,
            dateDepart: departureDateInput.value,
            heureDepart: departureTimeInput.value,
            villeArrivee: arrivalCitySelect.value,
            dateArrivee: arrivalDateInput.value,
            heureArrivee: arrivalTimeInput.value,
            prix: parseInt(tripPriceInput.value),
            vehiculeId: parseInt(tripVehicleSelect.value),
            estAccompagne: isAccompaniedCheckbox.checked,
            nombreAccompagnateurs: parseInt(numberOfCompanionsInput.value) || 0,
            placesDisponibles: parseInt(availableSeatsInput.value),
            statut: 'initialise'
        };

        if (tripData.villeDepart === tripData.villeArrivee) {
            displayMessage(tripMessageContainer, 'La ville de départ et d\'arrivée doivent être différentes.', 'danger');
            return;
        }

        try {
            const response = await fetch('/api/mon-compte/add-covoiturage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify(tripData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            displayMessage(tripMessageContainer, result.message, 'success');
            addDriverCovoiturageToList(result.covoiturage, true);
            userDriverCovoituragesData.push(result.covoiturage);
            tripFormContainer.classList.add('d-none');
            addTripButton.classList.remove('d-none');
        } catch (error) {
            displayMessage(tripMessageContainer, error.message, 'danger');
        }
    });

    // --- Initialisation des champs du formulaire ---
    function initializeTripForm() {
        populateCitySelect(departureCitySelect, FRENCH_CITIES);
        populateCitySelect(arrivalCitySelect, FRENCH_CITIES);
        populateTripVehicleSelect();

        const todayString = formatDate(new Date());
        if (departureDateInput) {
            departureDateInput.value = todayString;
            departureDateInput.min = todayString;
        }
        if (arrivalDateInput) {
            arrivalDateInput.value = todayString;
            arrivalDateInput.min = todayString;
        }
        departureDateInput?.addEventListener('change', () => {
            arrivalDateInput.min = departureDateInput.value;
            if (arrivalDateInput.value < departureDateInput.value) {
                arrivalDateInput.value = departureDateInput.value;
            }
        });

        tripVehicleSelect?.addEventListener('change', updateAvailableSeats);
        isAccompaniedCheckbox?.addEventListener('change', () => {
            companionsInputGroup.classList.toggle('d-none', !isAccompaniedCheckbox.checked);
            updateAvailableSeats();
        });
        numberOfCompanionsInput?.addEventListener('input', updateAvailableSeats);
        updateAvailableSeats();
    }


    // =====================================================================
    // CHARGEMENT INITIAL
    // =====================================================================
    initializeTripForm();
    loadAndDisplayDriverCovoiturages();
    loadAndDisplayPassengerTrips();

}); // Fin de DOMContentLoaded