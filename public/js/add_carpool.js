// public/js/add_carpool.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Script add_carpool.js chargé.');

    // =====================================================================
    // CONSTANTES ET SÉLECTEURS DOM
    // =====================================================================

    // --- Données globales ---
    let userVehiclesData = [];
    let userDriverCovoituragesData = [];
    let userPassengerCovoituragesData = [];

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

    // NOUVEAU: On récupère les éléments de la modale d'annulation (pour participation, pas covoiturage chauffeur)
    const cancelConfirmationModalElement = document.getElementById('cancelConfirmationModal'); // Modal pour annuler une participation
    const cancelParticipationModal = cancelConfirmationModalElement ? new bootstrap.Modal(cancelConfirmationModalElement) : null;
    const confirmCancelParticipationButton = document.getElementById('confirmCancelButton');

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
    
    function translateStatus(status) {
        switch (status) {
            case 'initialise':
                return 'Non démarré';
            case 'en_cours':
                return 'En cours';
            case 'en_attente_validation':
                return 'En attente de validation';
            case 'termine':
                return 'Terminé';
            case 'annule': // Ajout du statut annulé
                return 'Annulé';
            default:
                return status || 'N/A';
        }
    }

    // =====================================================================
    // RÉCUPÉRATION DES DONNÉES INITIALES (Véhicules)
    // =====================================================================
    
    try {
        const userVehiclesDataElement = document.getElementById('user-vehicles-data');
        if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim()) {
            userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
        }
    } catch (e) {
        console.error("add_carpool.js: Erreur parsing des données véhicules:", e);
    }

    // =====================================================================
    // LOGIQUE DE LA SECTION "CHAUFFEUR"
    // =====================================================================

    function addDriverCovoiturageToList(covoiturageData, prepend = false) {
        if (!driverTripsContainer) return;
        if (noDriverTripsMessage) noDriverTripsMessage.classList.add('d-none');

        const covoiturageDiv = document.createElement('div');
        covoiturageDiv.id = `covoiturage-${covoiturageData.id}`;
        covoiturageDiv.className = 'd-flex flex-column flex-md-row align-items-start align-items-md-center px-3 py-2 rounded border mb-2 bg-light carpool-item'; // Ajout de carpool-item

        const mainInfoSpan = document.createElement('span');
        mainInfoSpan.className = 'mb-2 mb-md-0 flex-grow-1 text-sm';
        
        let vehiculeInfo = 'Véhicule inconnu';
        let iconHtml = '';
        
        if (covoiturageData.voiture && typeof covoiturageData.voiture === 'object') {
            const marque = covoiturageData.voiture.marque?.libelle || '';
            const modele = covoiturageData.voiture.modele || '';
            const immatriculation = covoiturageData.voiture.immatriculation || 'N/A';
            vehiculeInfo = `${marque} ${modele} (${immatriculation})`;
            
            const energie = covoiturageData.voiture.energie?.toLowerCase() || '';
            if (energie === 'electric' || energie === 'hybrid') {
                iconHtml = '<i class="bi bi-leaf-fill text-primary"></i> ';
                covoiturageDiv.classList.remove('bg-light');
                covoiturageDiv.classList.add('bg-secondary', 'bg-opacity-25');
            }
        }

        // MODIFICATION: On génère la liste des participants
        let participantsHtml = '';
        if (covoiturageData.participations && covoiturageData.participations.length > 0) {
            const pseudos = covoiturageData.participations.map(p => p.passager?.pseudo || 'Inconnu').join(', ');
            participantsHtml = `<br><small class="text-muted"><strong>Participants:</strong> ${pseudos}</small>`;
        } else {
            participantsHtml = `<br><small class="text-muted">Aucun participant pour le moment.</small>`;
        }

        mainInfoSpan.innerHTML = `
            <strong>${covoiturageData.villeDepart}</strong> <i class="bi bi-arrow-right"></i> <strong>${covoiturageData.villeArrivee}</strong><br>
            Le ${formatDisplayDate(covoiturageData.dateDepart.date)} à ${covoiturageData.heureDepart} <br>
            Prix: ${covoiturageData.prix} crédits - Place(s): ${covoiturageData.placesDisponibles} <br>
            Véhicule: ${iconHtml}${vehiculeInfo}
            ${participantsHtml} 
        `;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0';

        const actionButtonsDiv = document.createElement('div');
        actionButtonsDiv.className = 'd-flex gap-2';
        
        // Boutons Commencer et Terminer
        actionButtonsDiv.innerHTML = `
            <button type="button" class="btn btn-success btn-sm rounded-4 px-3 start-trip-btn" data-covoiturage-id="${covoiturageData.id}">Commencer</button>
            <button type="button" class="btn btn-warning btn-sm rounded-4 px-3 end-trip-btn" data-covoiturage-id="${covoiturageData.id}">Terminer</button>
        `;

        // NOUVEAU : Bouton Annuler
        if (covoiturageData.statut === 'initialise' || covoiturageData.statut === 'en_cours') {
            actionButtonsDiv.innerHTML += `
                <button type="button" class="btn btn-danger btn-sm rounded-4 px-3 cancel-carpool-btn" data-carpool-id="${covoiturageData.id}">Annuler</button>
            `;
        }

        covoiturageDiv.append(mainInfoSpan, statusSpan, actionButtonsDiv);
        prepend ? driverTripsContainer.prepend(covoiturageDiv) : driverTripsContainer.appendChild(covoiturageDiv);
        updateTripActionButtonsForElement(covoiturageDiv, covoiturageData.statut, new Date(covoiturageData.dateDepart.date));
    }

    async function loadAndDisplayDriverCovoiturages() {
        if (!driverTripsContainer) return;
        try {
            const response = await fetch('/api/user-covoiturages');
            if (!response.ok) throw new Error((await response.json()).message);
            
            userDriverCovoituragesData = await response.json();
            
            driverTripsContainer.innerHTML = ''; // Vide le conteneur
            if (userDriverCovoituragesData.length === 0) {
                if (noDriverTripsMessage) {
                    noDriverTripsMessage.innerHTML = "Vous n'avez pas de voyage de prévu.";
                    noDriverTripsMessage.classList.remove('d-none');
                    driverTripsContainer.appendChild(noDriverTripsMessage);
                }
            } else {
                if (noDriverTripsMessage) noDriverTripsMessage.classList.add('d-none');
                userDriverCovoituragesData.forEach(covoiturage => addDriverCovoiturageToList(covoiturage));
            }
        } catch (error) {
            displayMessage(tripMessageContainer, `Impossible de charger vos voyages (chauffeur): ${error.message}`, 'danger');
        }
    }
    
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
            if(covoiturageData) covoiturageData.statut = result.newStatus;
            updateTripActionButtonsForElement(covoiturageElement, result.newStatus, new Date(covoiturageData.dateDepart.date)); // Utilise .date pour accéder à la date
            displayMessage(tripMessageContainer, result.message, 'success');
        } catch (error) {
            displayMessage(tripMessageContainer, error.message, 'danger');
        }
    });

    function updateTripActionButtonsForElement(covoiturageElement, status, tripDate) {
        const startBtn = covoiturageElement.querySelector('.start-trip-btn');
        const endBtn = covoiturageElement.querySelector('.end-trip-btn');
        const cancelBtn = covoiturageElement.querySelector('.cancel-carpool-btn'); // NOUVEAU : Sélection du bouton Annuler
        const statusSpan = covoiturageElement.querySelector('span:nth-of-type(2)'); // Assurez-vous que c'est bien le bon span

        // Cache tous les boutons par défaut
        if (startBtn) startBtn.classList.add('d-none');
        if (endBtn) endBtn.classList.add('d-none');
        if (cancelBtn) cancelBtn.classList.add('d-none'); // Cache le bouton Annuler

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tripDate.setHours(0, 0, 0, 0);

        statusSpan.textContent = translateStatus(status);
        statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0'; // Réinitialise les classes de statut

        switch(status) {
            case 'initialise':
                if (startBtn) {
                    startBtn.classList.remove('d-none');
                    startBtn.disabled = tripDate.getTime() !== today.getTime();
                }
                if (cancelBtn) cancelBtn.classList.remove('d-none'); // Annuler visible pour "initialise"
                statusSpan.classList.add('text-info');
                break;
            case 'en_cours':
                if (endBtn) endBtn.classList.remove('d-none');
                if (cancelBtn) cancelBtn.classList.remove('d-none'); // Annuler visible pour "en_cours"
                statusSpan.classList.add('text-success');
                break;
            case 'en_attente_validation':
                statusSpan.classList.add('text-warning');
                break;
            case 'termine':
                statusSpan.classList.add('text-danger');
                break;
            case 'annule': // NOUVEAU : Gestion du statut "annule"
                statusSpan.classList.add('text-danger');
                // Les boutons Commencer/Terminer/Annuler ne sont plus affichés
                break;
        }
    }


    // =====================================================================
    // LOGIQUE DE LA SECTION "PASSAGER"
    // =====================================================================

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
        
        const translatedStatus = translateStatus(covoiturage.statut);
        
        mainInfoSpan.innerHTML = `
            <strong>${covoiturage.villeDepart}</strong> <i class="bi bi-arrow-right"></i> <strong>${covoiturage.villeArrivee}</strong><br>
            Le ${formatDisplayDate(covoiturage.dateDepart.date)} à ${covoiturage.heureDepart}<br>
            Conducteur: <strong>${driverPseudo}</strong> - Statut: <span class="fw-bold">${translatedStatus}</span>
        `;
        
        const actionBtn = document.createElement('button');
        actionBtn.className = 'btn btn-outline-danger btn-sm rounded-4 px-3 ms-md-auto cancel-participation-btn';
        actionBtn.textContent = 'Annuler';
        actionBtn.dataset.participationId = participationData.id;

        // NOUVEAU : Désactiver le bouton d'annulation si le covoiturage n'est pas "initialise"
        if (covoiturage.statut !== 'initialise') {
            actionBtn.disabled = true;
            actionBtn.textContent = `Annulé (${translatedStatus})`;
            actionBtn.classList.remove('btn-outline-danger');
            actionBtn.classList.add('btn-secondary');
        }


        tripDiv.append(mainInfoSpan, actionBtn);
        passengerTripsContainer.appendChild(tripDiv);
    }
    
    async function loadAndDisplayPassengerTrips() {
        if (!passengerTripsContainer) return;
        try {
            const response = await fetch('/api/user-participations'); 
            if (!response.ok) {
                const errorText = await response.text();
                try {
                    throw new Error(JSON.parse(errorText).message || 'Erreur inconnue');
                } catch (e) {
                    throw new Error("Le serveur a renvoyé une erreur inattendue.");
                }
            }

            userPassengerCovoituragesData = await response.json();
            
            passengerTripsContainer.innerHTML = ''; // Vide le conteneur

            if (userPassengerCovoituragesData.length === 0) {
                if (noPassengerTripsMessage) {
                    noPassengerTripsMessage.innerHTML = 'Vous ne participez à aucun voyage pour le moment. <a href="/covoiturage" class="link-primary">Trouver un voyage</a>';
                    noPassengerTripsMessage.classList.remove('d-none');
                    passengerTripsContainer.appendChild(noPassengerTripsMessage);
                }
            } else {
                if (noPassengerTripsMessage) noPassengerTripsMessage.classList.add('d-none');
                userPassengerCovoituragesData.forEach(participation => addPassengerTripToList(participation));
            }
        } catch (error) {
            displayMessage(passengerTripsContainer, `Impossible de charger vos participations: ${error.message}`, 'danger');
        }
    }

    // MODIFIÉ: Le clic sur "Annuler" ouvre la modale et affiche les crédits
    passengerTripsContainer?.addEventListener('click', (e) => {
        const cancelButton = e.target.closest('.cancel-participation-btn');
        if (!cancelButton || !cancelParticipationModal || cancelButton.disabled) return; // Ne pas ouvrir si désactivé

        const participationId = cancelButton.dataset.participationId;
        
        // Trouver la participation pour récupérer le prix
        const participation = userPassengerCovoituragesData.find(p => p.id == participationId);
        const creditsToRefund = participation?.covoiturage?.prix || 0;

        // Mettre à jour le texte de la modale avec le montant des crédits
        const creditsSpan = document.getElementById('creditsToRefund');
        if (creditsSpan) {
            creditsSpan.textContent = creditsToRefund;
        }
        
        // On stocke l'ID sur le bouton de confirmation de la modale pour l'utiliser plus tard
        if(confirmCancelParticipationButton) {
            confirmCancelParticipationButton.dataset.participationId = participationId;
        }
        cancelParticipationModal.show();
    });

    // MODIFIÉ: Le clic sur le bouton de confirmation gère le chargement et le rafraîchissement
    confirmCancelParticipationButton?.addEventListener('click', async () => {
        const participationId = confirmCancelParticipationButton.dataset.participationId;
        if (!participationId) return;

        // Ajout d'un état de chargement pour un meilleur retour visuel
        confirmCancelParticipationButton.disabled = true;
        confirmCancelParticipationButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Annulation...';

        try {
            const response = await fetch(`/api/participation/${participationId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Impossible d\'annuler la participation.');
            }

            // SUCCÈS: On rafraîchit la page pour voir tous les changements (crédits, liste)
            location.reload();

        } catch (error) {
            console.error('Erreur lors de l\'annulation de la participation:', error);
            cancelParticipationModal.hide(); // Cacher la modale en cas d'erreur
            displayMessage(tripMessageContainer, error.message, 'danger');
            
            // Réactiver le bouton en cas d'erreur
            confirmCancelParticipationButton.disabled = false;
            confirmCancelParticipationButton.innerHTML = 'Oui, annuler';
        }
    });


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
            const text = `${icon}${marque} ${modele} - ${vehicle.nombreDePlaces} place(s)`;
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

    function activateTabFromHash() {
        const hash = window.location.hash;
        if (hash === '#trip' || hash === '#roles' || hash === '#history' || hash === '#account') {
            const tabTrigger = document.querySelector(`.nav-tabs button[data-bs-target="${hash}"]`);
            if (tabTrigger) {
                const tab = new bootstrap.Tab(tabTrigger);
                tab.show();
            }
        }
    }

    activateTabFromHash();
});
