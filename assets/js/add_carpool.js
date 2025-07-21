document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Script add_carpool.js chargé.');
    let userVehiclesData = [];
    let userDriverCovoituragesData = [];
    let userPassengerCovoituragesData = [];
    const tripMessageContainer = document.getElementById('tripMessageContainer');
    const addTripButton = document.getElementById('addTripButton');
    const driverTripsContainer = document.getElementById('driver-trips-container');
    const noDriverTripsMessage = document.getElementById('no-driver-trips-message');
    const tripFormContainer = document.getElementById('tripFormContainer');
    const tripForm = document.getElementById('tripForm');
    const passengerTripsContainer = document.getElementById('passenger-trips-container');
    const noPassengerTripsMessage = document.getElementById('no-passenger-trips-message');
    const cancelConfirmationModalElement = document.getElementById('cancelConfirmationModal');
    const cancelParticipationModal = cancelConfirmationModalElement ? new bootstrap.Modal(cancelConfirmationModalElement) : null;
    const confirmCancelParticipationButton = document.getElementById('confirmCancelButton');
    const validateReviewModalElement = document.getElementById('validateReviewModal');
    const validateReviewModal = validateReviewModalElement ? new bootstrap.Modal(validateReviewModalElement, { backdrop: 'static', keyboard: false }) : null;
    const validateReviewForm = document.getElementById('validateReviewForm');
    const tripValidationStatusRadios = document.querySelectorAll('input[name="tripValidationStatus"]');
    const ratingSection = document.getElementById('ratingSection');
    const commentSection = document.getElementById('commentSection');
    const ratingStars = document.querySelectorAll('.star-rating .star');
    const reviewCommentInput = document.getElementById('reviewComment');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    let currentParticipationId = null;
    let currentCovoiturageId = null;
    let currentRating = 0;
    const validateReviewFormMessageContainer = document.getElementById('validateReviewFormMessage');
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
    const FRENCH_CITIES = ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Villeurbanne", "Saint-Denis", "Le Mans", "Aix-en-Provence", "Brest", "Limoges", "Tours", "Perpignan", "Metz", "Besançon", "Orléans", "Mulhouse", "Rouen", "Caen", "Nancy", "Argenteuil", "Montreuil", "Saint-Paul", "Avignon", "Versailles", "Nîmes", "Clermont-Ferrand", "Le Tampon", "Annecy", "Saint-Denis (Réunion)", "Boulogne-Billancourt", "Saint-Pierre (Réunion)", "Mérignac", "Troyes", "Poitiers", "Pau", "Antibes", "La Rochelle"].sort();

    function displayMessage(container, message, type) {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) return;
        targetContainer.innerHTML = '';
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.appendChild(alertDiv);
        if (type !== 'danger') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.parentNode.removeChild(alertDiv);
                }
            }, 5000);
        }
    }

    function formatDate(date) { return new Date(date).toISOString().split('T')[0]; }
    function formatDisplayDate(dateString) {
        const dateToParse = typeof dateString === 'object' && dateString !== null && dateString.date ? dateString.date : dateString;
        const date = new Date(dateToParse);
        if (isNaN(date.getTime())) {
            return "Date invalide";
        }
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function translateStatus(status) {
        switch (status) {
            case 'initialise': return 'Non démarré';
            case 'en_cours': return 'En cours';
            case 'en_attente_validation': return 'En attente de validation';
            case 'termine': return 'Terminé';
            case 'annule': return 'Annulé';
            case 'litige': return '⚠ Litige';
            default: return status || 'N/A';
        }
    }

    try {
        const userVehiclesDataElement = document.getElementById('user-vehicles-data');
        if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim()) {
            userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
        }
    } catch (e) {
        console.error("add_carpool.js: Erreur parsing des données véhicules:", e);
    }

    function addDriverCovoiturageToList(covoiturageData, prepend = false) {
        if (!driverTripsContainer) return;
        if (noDriverTripsMessage) noDriverTripsMessage.classList.add('d-none');
        const covoiturageDiv = document.createElement('div');
        covoiturageDiv.id = `covoiturage-${covoiturageData.id}`;
        covoiturageDiv.className = 'd-flex flex-column flex-md-row align-items-center px-3 py-2 rounded border mb-2 bg-light carpool-item';
        const mainInfoSpan = document.createElement('div');
        mainInfoSpan.className = 'mb-0 flex-grow-1';
        let vehiculeInfo = 'Véhicule inconnu';
        let iconHtml = '';
        if (covoiturageData.voiture && typeof covoiturageData.voiture === 'object') {
            const marque = covoiturageData.voiture.marque?.libelle || '';
            const modele = covoiturageData.voiture.modele || '';
            const immatriculation = covoiturageData.voiture.immatriculation || 'N/A';
            vehiculeInfo = `${marque} ${modele} (${immatriculation})`;
            const energie = covoiturageData.voiture.energie?.toLowerCase() || '';
            if (energie === 'electric' || energie === 'hybrid') {
                iconHtml = '<i class="bi bi-leaf-fill text-primary me-1"></i>';
                covoiturageDiv.classList.remove('bg-light');
                covoiturageDiv.classList.add('bg-secondary', 'bg-opacity-25');
            }
        }
        let participantsText = 'Aucun participant pour le moment.';
        if (covoiturageData.participations && covoiturageData.participations.length > 0) {
            const pseudos = covoiturageData.participations.map(p => p.passager?.pseudo || 'Inconnu').join(', ');
            participantsText = `<strong>Participants:</strong> ${pseudos}`;
        }
        mainInfoSpan.innerHTML = `<div class="fw-bold">${covoiturageData.villeDepart} <i class="bi bi-arrow-right"></i> ${covoiturageData.villeArrivee}</div><div class="small text-muted"><span>Le ${formatDisplayDate(covoiturageData.dateDepart)} à ${covoiturageData.heureDepart}</span><span class="mx-2">|</span><span>${covoiturageData.prix} crédits - ${covoiturageData.placesDisponibles} place(s)</span></div><div class="small">${iconHtml}Véhicule: ${vehiculeInfo}</div><div class="small text-muted text-truncate" style="max-width: 300px;">${participantsText}</div>`;
        const rightSideWrapper = document.createElement('div');
        rightSideWrapper.className = 'd-flex flex-column flex-md-row align-items-md-center gap-2 ms-md-auto mt-2 mt-md-0';
        const statusSpan = document.createElement('span');
        statusSpan.className = 'fw-bold carpool-status-display mb-2 mb-md-0 text-md-end';
        const actionButtonsDiv = document.createElement('div');
        actionButtonsDiv.className = 'd-flex gap-2 flex-shrink-0';
        actionButtonsDiv.innerHTML = `<button type="button" class="btn btn-success btn-sm rounded-4 px-3 start-trip-btn" data-covoiturage-id="${covoiturageData.id}">Commencer</button><button type="button" class="btn btn-primary btn-sm rounded-4 px-3 end-trip-btn" data-covoiturage-id="${covoiturageData.id}">Terminer</button>`;
        if (covoiturageData.statut === 'initialise') {
            actionButtonsDiv.innerHTML += `<button type="button" class="btn btn-danger btn-sm rounded-4 px-3 cancel-carpool-btn" data-carpool-id="${covoiturageData.id}">Annuler</button>`;
        }
        rightSideWrapper.append(statusSpan, actionButtonsDiv);
        covoiturageDiv.append(mainInfoSpan, rightSideWrapper);
        prepend ? driverTripsContainer.prepend(covoiturageDiv) : driverTripsContainer.appendChild(covoiturageDiv);
        updateTripActionButtonsForElement(covoiturageDiv, covoiturageData.statut, covoiturageData.dateDepart);
    }

    async function loadAndDisplayDriverCovoiturages() {
        if (!driverTripsContainer) return;
        try {
            const response = await fetch('/api/user-covoiturages');
            if (!response.ok) throw new Error((await response.json()).message);
            userDriverCovoituragesData = await response.json();
            const upcomingDriverTrips = userDriverCovoituragesData.filter(c => c.statut !== 'termine' && c.statut !== 'annule');
            driverTripsContainer.innerHTML = '';
            if (upcomingDriverTrips.length === 0) {
                if (noDriverTripsMessage) {
                    noDriverTripsMessage.innerHTML = "Vous n'avez pas de voyage de prévu.";
                    noDriverTripsMessage.classList.remove('d-none');
                    driverTripsContainer.appendChild(noDriverTripsMessage);
                }
            } else {
                if (noDriverTripsMessage) noDriverTripsMessage.classList.add('d-none');
                upcomingDriverTrips.forEach(covoiturage => addDriverCovoiturageToList(covoiturage));
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
        const covoiturageElement = button.closest('.carpool-item');
        if (!covoiturageElement) return;
        try {
            const response = await fetch(`/api/covoiturage/${covoiturageId}/${actionType}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            const covoiturageData = userDriverCovoituragesData.find(c => c.id == covoiturageId);
            if (covoiturageData) {
                covoiturageData.statut = result.newStatus;
            }
            updateTripActionButtonsForElement(covoiturageElement, result.newStatus, covoiturageData.dateDepart);
            displayMessage(tripMessageContainer, result.message, 'success');
        } catch (error) {
            displayMessage(tripMessageContainer, error.message, 'danger');
        }
    });

    function updateTripActionButtonsForElement(covoiturageElement, status, tripDateObj) {
        if (status === 'termine' || status === 'annule') {
            covoiturageElement.style.transition = 'opacity 0.5s ease';
            covoiturageElement.style.opacity = '0';
            setTimeout(() => {
                covoiturageElement.remove();
                if (driverTripsContainer && driverTripsContainer.children.length === 0 && noDriverTripsMessage) {
                    noDriverTripsMessage.classList.remove('d-none');
                }
            }, 500);
            return;
        }
        const startBtn = covoiturageElement.querySelector('.start-trip-btn');
        const endBtn = covoiturageElement.querySelector('.end-trip-btn');
        const cancelBtn = covoiturageElement.querySelector('.cancel-carpool-btn');
        const statusSpan = covoiturageElement.querySelector('.carpool-status-display');
        if (startBtn) startBtn.classList.add('d-none');
        if (endBtn) endBtn.classList.add('d-none');
        if (cancelBtn) cancelBtn.classList.add('d-none');
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        let dateStringForParsing = '';
        if (tripDateObj && typeof tripDateObj.date === 'string') {
            const match = tripDateObj.date.match(/^(\d{4}-\d{2}-\d{2})\s(\d{2}:\d{2}:\d{2})/);
            if (match) {
                dateStringForParsing = `${match[1]}T${match[2]}`;
            } else {
                dateStringForParsing = tripDateObj.date.split('.')[0].replace(' ', 'T');
            }
        } else if (typeof tripDateObj === 'string') {
            dateStringForParsing = tripDateObj.split('.')[0].replace(' ', 'T');
        }
        const tripDate = new Date(dateStringForParsing);
        const isToday = (tripDate.getFullYear() === todayYear && tripDate.getMonth() === todayMonth && tripDate.getDate() === todayDay);
        if (statusSpan) {
            statusSpan.textContent = translateStatus(status);
            statusSpan.className = 'fw-bold carpool-status-display mb-2 mb-md-0';
        }
        switch (status) {
            case 'initialise':
                if (startBtn) {
                    startBtn.classList.remove('d-none');
                    startBtn.disabled = !isToday;
                }
                if (cancelBtn) cancelBtn.classList.remove('d-none');
                if (statusSpan) statusSpan.classList.add('text-info');
                break;
            case 'en_cours':
                if (endBtn) endBtn.classList.remove('d-none');
                if (statusSpan) statusSpan.classList.add('text-info');
                break;
            case 'en_attente_validation':
                if (statusSpan) statusSpan.classList.add('text-warning');
                break;
            case 'litige':
                if (statusSpan) statusSpan.classList.add('text-danger');
                break;
        }
    }

    function addPassengerTripToList(participationData) {
        if (!passengerTripsContainer || !noPassengerTripsMessage) return;
        noPassengerTripsMessage.classList.add('d-none');
        const covoiturage = participationData.covoiturage;
        if (!covoiturage) return;
        const tripDiv = document.createElement('div');
        tripDiv.id = `participation-${participationData.id}`;
        tripDiv.className = 'd-flex flex-column flex-md-row align-items-start align-items-md-center px-3 py-2 rounded border mb-2 bg-light';
        const mainInfoSpan = document.createElement('div');
        mainInfoSpan.className = 'mb-2 mb-md-0 flex-grow-1';
        const driverPseudo = covoiturage.chauffeur?.pseudo || 'Inconnu';
        const translatedStatus = translateStatus(covoiturage.statut);
        mainInfoSpan.innerHTML = `<div class="fw-bold">${covoiturage.villeDepart} <i class="bi bi-arrow-right"></i> ${covoiturage.villeArrivee}</div><div class="small text-muted">Le ${formatDisplayDate(covoiturage.dateDepart)} à ${covoiturage.heureDepart}</div><div class="small">Conducteur: <strong>${driverPseudo}</strong> - Statut: <span class="fw-bold">${translatedStatus}</span></div>`;
        const actionBtnContainer = document.createElement('div');
        actionBtnContainer.className = 'd-flex gap-2 ms-md-auto';
        if (covoiturage.statut === 'initialise') {
            const cancelParticipationBtn = document.createElement('button');
            cancelParticipationBtn.className = 'btn btn-outline-danger btn-sm rounded-4 px-3 cancel-participation-btn';
            cancelParticipationBtn.textContent = 'Annuler';
            cancelParticipationBtn.dataset.participationId = participationData.id;
            actionBtnContainer.appendChild(cancelParticipationBtn);
        }
        if (covoiturage.statut === 'en_attente_validation' && !participationData.valideParPassager) {
            const validateTripBtn = document.createElement('button');
            validateTripBtn.className = 'btn btn-primary btn-sm rounded-4 px-3 validate-trip-btn';
            validateTripBtn.textContent = 'Valider le covoiturage';
            validateTripBtn.dataset.participationId = participationData.id;
            validateTripBtn.dataset.covoiturageId = covoiturage.id;
            actionBtnContainer.appendChild(validateTripBtn);
        } else if (participationData.valideParPassager) {
            const validatedBadge = document.createElement('span');
            validatedBadge.className = 'badge bg-secondary text-dark px-4 py-2 ms-2 rounded-pill';
            validatedBadge.textContent = 'Validé';
            actionBtnContainer.appendChild(validatedBadge);
        }
        tripDiv.append(mainInfoSpan, actionBtnContainer);
        passengerTripsContainer.appendChild(tripDiv);
    }

    async function loadAndDisplayPassengerTrips() {
        if (!passengerTripsContainer) return [];
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
            const upcomingPassengerTrips = userPassengerCovoituragesData.filter(p => p.covoiturage && p.covoiturage.statut !== 'termine' && p.covoiturage.statut !== 'annule');
            passengerTripsContainer.innerHTML = '';
            if (upcomingPassengerTrips.length === 0) {
                if (noPassengerTripsMessage) {
                    noPassengerTripsMessage.innerHTML = 'Vous ne participez à aucun voyage pour le moment. <a href="/covoiturage" class="link-primary">Trouver un voyage</a>';
                    noPassengerTripsMessage.classList.remove('d-none');
                    passengerTripsContainer.appendChild(noPassengerTripsMessage);
                }
            } else {
                if (noPassengerTripsMessage) noPassengerTripsMessage.classList.add('d-none');
                upcomingPassengerTrips.forEach(participation => addPassengerTripToList(participation));
            }
            return userPassengerCovoituragesData;
        } catch (error) {
            displayMessage(passengerTripsContainer, `Impossible de charger vos participations: ${error.message}`, 'danger');
            return [];
        }
    }

    passengerTripsContainer?.addEventListener('click', (e) => {
        const cancelButton = e.target.closest('.cancel-participation-btn');
        if (cancelButton) {
            if (!cancelButton.disabled && cancelParticipationModal) {
                const participationId = cancelButton.dataset.participationId;
                const participation = userPassengerCovoituragesData.find(p => p.id == participationId);
                const creditsToRefund = participation?.covoiturage?.prix || 0;
                const creditsSpan = document.getElementById('creditsToRefund');
                if (creditsSpan) creditsSpan.textContent = creditsToRefund;
                if (confirmCancelParticipationButton) confirmCancelParticipationButton.dataset.participationId = participationId;
                cancelParticipationModal.show();
            }
        }
        const validateButton = e.target.closest('.validate-trip-btn');
        if (validateButton && validateReviewModal) {
            currentParticipationId = validateButton.dataset.participationId;
            currentCovoiturageId = validateButton.dataset.covoiturageId;
            const modalTitle = document.getElementById('validateReviewModalLabel');
            if (modalTitle) {
                const participation = userPassengerCovoituragesData.find(p => p.id == currentParticipationId);
                if (participation && participation.covoiturage) {
                    const covoit = participation.covoiturage;
                    const driverPseudo = covoit.chauffeur?.pseudo || 'Inconnu';
                    modalTitle.innerHTML = `Valider: ${covoit.villeDepart} <i class="bi bi-arrow-right"></i> ${covoit.villeArrivee}<br><small class="fw-normal">avec ${driverPseudo}</small>`;
                } else {
                    modalTitle.textContent = 'Valider le covoiturage';
                }
            }
            validateReviewForm.reset();
            ratingSection.classList.add('d-none');
            commentSection.classList.add('d-none');
            ratingStars.forEach(star => star.classList.remove('selected'));
            currentRating = 0;
            if (validateReviewFormMessageContainer) {
                validateReviewFormMessageContainer.innerHTML = '';
            }
            validateReviewModal.show();
        }
    });

    confirmCancelParticipationButton?.addEventListener('click', async () => {
        const participationId = confirmCancelParticipationButton.dataset.participationId;
        if (!participationId) return;
        confirmCancelParticipationButton.disabled = true;
        confirmCancelParticipationButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Annulation...';
        try {
            const response = await fetch(`/api/participation/${participationId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Impossible d\'annuler la participation.');
            location.reload();
        } catch (error) {
            cancelParticipationModal.hide();
            displayMessage(tripMessageContainer, error.message, 'danger');
            confirmCancelParticipationButton.disabled = false;
            confirmCancelParticipationButton.innerHTML = 'Oui, annuler';
        }
    });

    tripValidationStatusRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (validateReviewFormMessageContainer) {
                validateReviewFormMessageContainer.innerHTML = '';
            }
            const isYesChecked = document.getElementById('tripStatusYes').checked;
            const isNoChecked = document.getElementById('tripStatusNo').checked;
            if (isYesChecked) {
                if (ratingSection) ratingSection.classList.remove('d-none');
                if (commentSection) commentSection.classList.remove('d-none');
            } else if (isNoChecked) {
                if (ratingSection) ratingSection.classList.remove('d-none');
                if (commentSection) commentSection.classList.remove('d-none');
            } else {
                if (ratingSection) ratingSection.classList.add('d-none');
                if (commentSection) commentSection.classList.add('d-none');
            }
            const commentLabel = document.querySelector('label[for="reviewComment"]');
            if (commentLabel) {
                if (isYesChecked) {
                    commentLabel.innerHTML = 'Commentaire (facultatif)';
                    reviewCommentInput.required = false;
                } else if (isNoChecked) {
                    commentLabel.innerHTML = 'Commentaire (obligatoire pour expliquer le problème) <span class="text-danger">*</span>';
                    reviewCommentInput.required = true;
                } else {
                    commentLabel.innerHTML = 'Commentaire';
                    reviewCommentInput.required = false;
                }
            }
        });
    });

    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            currentRating = parseInt(star.dataset.rating);
            ratingStars.forEach((s, index) => {
                s.classList.toggle('selected', index < currentRating);
            });
        });
    });

    submitReviewBtn?.addEventListener('click', async () => {
        if (validateReviewFormMessageContainer) {
            validateReviewFormMessageContainer.innerHTML = '';
        }
        const tripStatusYes = document.getElementById('tripStatusYes').checked;
        const tripStatusNo = document.getElementById('tripStatusNo').checked;
        if (!tripStatusYes && !tripStatusNo) {
            displayMessage(validateReviewFormMessageContainer, 'Veuillez indiquer si le voyage s\'est bien déroulé.', 'danger');
            return;
        }
        let reviewData = {
            participationId: currentParticipationId,
            covoiturageId: currentCovoiturageId,
            validationStatus: tripStatusYes,
            note: currentRating,
            commentaire: reviewCommentInput.value
        };
        if (tripStatusYes) {
            if (currentRating === 0) {
                displayMessage(validateReviewFormMessageContainer, 'Veuillez donner une note en étoiles.', 'danger');
                return;
            }
            reviewData.raisonLitige = null;
        } else {
            if (!reviewCommentInput.value.trim()) {
                displayMessage(validateReviewFormMessageContainer, 'Veuillez indiquer la raison du problème dans le commentaire.', 'danger');
                return;
            }
            if (currentRating === 0) {
                displayMessage(validateReviewFormMessageContainer, 'Veuillez donner une note en étoiles même si le voyage s\'est mal déroulé.', 'danger');
                return;
            }
            reviewData.raisonLitige = reviewCommentInput.value;
            reviewData.note = 0;
        }
        submitReviewBtn.disabled = true;
        submitReviewBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Envoi...';
        try {
            const response = await fetch(`/api/participation/${currentParticipationId}/validate-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            const result = await response.json();
            if (response.ok) {
                validateReviewModal.hide();
                displayMessage(tripMessageContainer, result.message, 'success');
                const updatedTrips = await loadAndDisplayPassengerTrips();
                checkForPendingValidation(updatedTrips);
            } else {
                displayMessage(validateReviewFormMessageContainer, result.message || 'Erreur lors de la validation du voyage.', 'danger');
            }
        } catch (error) {
            displayMessage(validateReviewFormMessageContainer, 'Impossible de communiquer avec le serveur.', 'danger');
        } finally {
            submitReviewBtn.disabled = false;
            submitReviewBtn.innerHTML = 'Valider';
        }
    });

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

    function checkForPendingValidation(participations) {
        if (!participations || participations.length === 0) return;
        const pendingValidation = participations.find(p =>
            p.covoiturage &&
            p.covoiturage.statut === 'en_attente_validation' &&
            !p.valideParPassager
        );
        if (pendingValidation && validateReviewModal) {
            displayMessage(tripMessageContainer, '<strong>Action requise :</strong> Vous avez un voyage en attente de validation. Veuillez le traiter pour continuer.', 'info');
            currentParticipationId = pendingValidation.id;
            currentCovoiturageId = pendingValidation.covoiturage.id;
            const modalTitle = document.getElementById('validateReviewModalLabel');
            if (modalTitle) {
                const covoit = pendingValidation.covoiturage;
                const driverPseudo = covoit.chauffeur?.pseudo || 'Inconnu';
                modalTitle.innerHTML = `Valider: ${covoit.villeDepart} <i class="bi bi-arrow-right"></i> ${covoit.villeArrivee}<br><small class="fw-normal">avec ${driverPseudo}</small>`;
            }
            validateReviewForm.reset();
            ratingSection.classList.add('d-none');
            commentSection.classList.add('d-none');
            ratingStars.forEach(star => star.classList.remove('selected'));
            currentRating = 0;
            if (validateReviewFormMessageContainer) {
                validateReviewFormMessageContainer.innerHTML = '';
            }
            validateReviewModal.show();
        }
    }

    async function initializePage() {
        initializeTripForm();
        await loadAndDisplayDriverCovoiturages();
        const passengerTrips = await loadAndDisplayPassengerTrips();
        checkForPendingValidation(passengerTrips);
        activateTabFromHash();
    }
    initializePage();

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
});