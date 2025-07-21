// assets/controllers/add_carpool_controller.js

import { Controller } from '@hotwired/stimulus';
import * as Turbo from '@hotwired/turbo'; 

export default class extends Controller {
    static targets = [
        'tripMessageContainer',
        'addTripButton', 
        'driverTripsContainer', 
        'noDriverTripsMessage',
        'tripFormContainer', 
        'tripForm',
        'passengerTripsContainer', 
        'noPassengerTripsMessage',
        'cancelConfirmationModal', // Modale d'annulation de participation (passager)
        'confirmCancelParticipationButton', // Bouton de confirmation d'annulation (passager)
        'creditsToRefund', // Span pour afficher les crédits à rembourser
        'validateReviewModal', // Modale de validation/avis (passager)
        'validateReviewForm', 
        'submitReviewBtn',
        'ratingSection', 
        'commentSection', 
        'reviewCommentInput',
        'departureCitySelect', 
        'departureDateInput', 
        'departureTimeInput',
        'arrivalCitySelect', 
        'arrivalDateInput', 
        'arrivalTimeInput',
        'tripPriceInput', 
        'tripVehicleSelect', 
        'isAccompaniedCheckbox',
        'companionsInputGroup', 
        'numberOfCompanionsInput', 
        'availableSeatsInput', 
        'cancelTripBtn',
        'tripValidationStatusYes', 
        'tripValidationStatusNo',  
        'ratingStar', 
        'validateReviewFormMessageContainer' 
    ];

    userVehiclesData = [];
    userDriverCovoituragesData = [];
    userPassengerCovoituragesData = [];
    cancelParticipationModalInstance = null; // Instance pour annulation passager
    validateReviewModalInstance = null;
    currentParticipationId = null;
    currentCovoiturageId = null;
    currentRating = 0;

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

    async connect() {
        console.log('Stimulus: add_carpool_controller connecté.');
        
        if (this.hasCancelConfirmationModalTarget) {
            this.cancelParticipationModalInstance = new Modal(this.cancelConfirmationModalTarget);
        }
        if (this.hasValidateReviewModalTarget) {
            this.validateReviewModalInstance = new Modal(this.validateReviewModalTarget, { backdrop: 'static', keyboard: false });
        }

        try {
            const userVehiclesDataElement = document.getElementById('user-vehicles-data');
            if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim()) {
                this.userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
            }
        } catch (e) {
            console.error("Stimulus add_carpool: Erreur parsing des données véhicules:", e);
        }

        if (this.hasTripValidationStatusYesTarget && this.hasTripValidationStatusNoTarget) {
            this.tripValidationStatusYesTarget.addEventListener('change', this.handleReviewStatusChange.bind(this));
            this.tripValidationStatusNoTarget.addEventListener('change', this.handleReviewStatusChange.bind(this));
        }
        this.ratingStarTargets.forEach(star => {
            star.addEventListener('click', this.handleRatingClick.bind(this));
        });

        await this.initializePage();
    }

    disconnect() {
        console.log('Stimulus: add_carpool_controller déconnecté.');
        if (this.cancelParticipationModalInstance) this.cancelParticipationModalInstance.hide();
        if (this.validateReviewModalInstance) this.validateReviewModalInstance.hide();
        
        if (this.hasTripValidationStatusYesTarget && this.hasTripValidationStatusNoTarget) {
            this.tripValidationStatusYesTarget.removeEventListener('change', this.handleReviewStatusChange.bind(this));
            this.tripValidationStatusNoTarget.removeEventListener('change', this.handleReviewStatusChange.bind(this));
        }
        this.ratingStarTargets.forEach(star => {
            star.removeEventListener('click', this.handleRatingClick.bind(this));
        });
    }

    displayMessage(container, message, type = 'danger') {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) {
            console.error(`add_carpool_controller: Conteneur de message "${container}" introuvable.`);
            return;
        }
        targetContainer.innerHTML = ''; 
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.appendChild(alertDiv);
        if (type !== 'danger') {
            setTimeout(() => {
                if (alertDiv.parentNode) {
                    alertDiv.classList.remove('show');
                    alertDiv.classList.add('fade');
                    alertDiv.addEventListener('transitionend', () => alertDiv.remove());
                }
            }, 5000);
        }
    }

    formatDate(date) { 
        return new Date(date).toISOString().split('T')[0]; 
    }
    
    formatDisplayDate(dateString) { 
        const dateToParse = typeof dateString === 'object' && dateString !== null && dateString.date 
                                ? dateString.date 
                                : dateString;
        const date = new Date(dateToParse);
        if (isNaN(date.getTime())) { 
            return "Date invalide"; 
        }
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
    }
    
    translateStatus(status) {
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

    addDriverCovoiturageToList(covoiturageData, prepend = false) {
        if (!this.hasDriverTripsContainerTarget) return;
        if (this.hasNoDriverTripsMessageTarget) this.noDriverTripsMessageTarget.classList.add('d-none');

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

        mainInfoSpan.innerHTML = `<div class="fw-bold">${covoiturageData.villeDepart} <i class="bi bi-arrow-right"></i> ${covoiturageData.villeArrivee}</div><div class="small text-muted"><span>Le ${this.formatDisplayDate(covoiturageData.dateDepart)} à ${covoiturageData.heureDepart}</span><span class="mx-2">|</span><span>${covoiturageData.prix} crédits - ${covoiturageData.placesDisponibles} place(s)</span></div><div class="small">${iconHtml}Véhicule: ${vehiculeInfo}</div><div class="small text-muted text-truncate" style="max-width: 300px;">${participantsText}</div>`;

        const rightSideWrapper = document.createElement('div');
        rightSideWrapper.className = 'd-flex flex-column flex-md-row align-items-md-center gap-2 ms-md-auto mt-2 mt-md-0';

        const statusSpan = document.createElement('span');
        statusSpan.className = 'fw-bold carpool-status-display mb-2 mb-md-0 text-md-end'; 

        const actionButtonsDiv = document.createElement('div');
        actionButtonsDiv.className = 'd-flex gap-2 flex-shrink-0';
        
        // Actions pour commencer/terminer le voyage du chauffeur
        actionButtonsDiv.innerHTML = `
            <button type="button" class="btn btn-success btn-sm rounded-4 px-3 start-trip-btn" data-covoiturage-id="${covoiturageData.id}" data-action="click->add-carpool#handleDriverStatusAction">Commencer</button>
            <button type="button" class="btn btn-primary btn-sm rounded-4 px-3 end-trip-btn" data-covoiturage-id="${covoiturageData.id}" data-action="click->add-carpool#handleDriverStatusAction">Terminer</button>`;

        // Bouton d'annulation du chauffeur (action déléguée à cancel-carpool_controller)
        if (covoiturageData.statut === 'initialise') {
            actionButtonsDiv.innerHTML += `<button type="button" class="btn btn-danger btn-sm rounded-4 px-3 cancel-carpool-btn" data-carpool-id="${covoiturageData.id}" data-action="click->cancel-carpool#showCancelCarpoolModal">Annuler</button>`; 
        }

        rightSideWrapper.append(statusSpan, actionButtonsDiv);

        covoiturageDiv.append(mainInfoSpan, rightSideWrapper);
        prepend ? this.driverTripsContainerTarget.prepend(covoiturageDiv) : this.driverTripsContainerTarget.appendChild(covoiturageDiv);
        this.updateTripActionButtonsForElement(covoiturageDiv, covoiturageData.statut, covoiturageData.dateDepart); 
    }

    async loadAndDisplayDriverCovoiturages() {
        if (!this.hasDriverTripsContainerTarget) return;
        try {
            const response = await fetch('/api/user-covoiturages');
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('add_carpool_controller: Utilisateur non authentifié. Redirection.');
                    Turbo.visit('/login'); 
                    return; 
                }
                throw new Error((await response.json()).message);
            }
            
            this.userDriverCovoituragesData = await response.json();
            
            const upcomingDriverTrips = this.userDriverCovoituragesData.filter(c => c.statut !== 'termine' && c.statut !== 'annule');

            this.driverTripsContainerTarget.innerHTML = ''; 
            if (upcomingDriverTrips.length === 0) {
                if (this.hasNoDriverTripsMessageTarget) {
                    this.noDriverTripsMessageTarget.innerHTML = "Vous n'avez pas de voyage de prévu.";
                    this.noDriverTripsMessageTarget.classList.remove('d-none');
                    this.driverTripsContainerTarget.appendChild(this.noDriverTripsMessageTarget);
                }
            } else {
                if (this.hasNoDriverTripsMessageTarget) this.noDriverTripsMessageTarget.classList.add('d-none');
                upcomingDriverTrips.forEach(covoiturage => this.addDriverCovoiturageToList(covoiturage));
            }
        } catch (error) {
            this.displayMessage(this.tripMessageContainerTarget, `Impossible de charger vos voyages (chauffeur): ${error.message}`, 'danger');
        }
    }
    
    // Gère le clic sur les boutons de statut (Commencer, Terminer) pour les trajets du chauffeur
    // L'annulation est gérée par cancel-carpool_controller.
    async handleDriverStatusAction(e) {
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

            const covoiturageData = this.userDriverCovoituragesData.find(c => c.id == covoiturageId);
            if(covoiturageData) {
                covoiturageData.statut = result.newStatus;
            }
            
            this.updateTripActionButtonsForElement(covoiturageElement, result.newStatus, covoiturageData.dateDepart); 
            this.displayMessage(this.tripMessageContainerTarget, result.message, 'success');

            if (actionType === 'end') { // Seulement après la fin du trajet, pas l'annulation
                 setTimeout(async () => {
                    await this.loadAndDisplayDriverCovoiturages();
                 }, 500); 
            }

        } catch (error) {
            this.displayMessage(this.tripMessageContainerTarget, error.message, 'danger');
        }
    }

    updateTripActionButtonsForElement(covoiturageElement, status, tripDateObj) {
        if (status === 'termine') { 
            covoiturageElement.style.transition = 'opacity 0.5s ease';
            covoiturageElement.style.opacity = '0';
            setTimeout(() => {
                covoiturageElement.remove();
                if (this.hasDriverTripsContainerTarget && this.driverTripsContainerTarget.children.length === 0 && this.hasNoDriverTripsMessageTarget) {
                    this.noDriverTripsMessageTarget.classList.remove('d-none');
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
            statusSpan.textContent = this.translateStatus(status);
            statusSpan.className = 'fw-bold carpool-status-display mb-2 mb-md-0';
        }

        switch(status) {
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

    addPassengerTripToList(participationData) {
        if (!this.hasPassengerTripsContainerTarget || !this.hasNoPassengerTripsMessageTarget) return;

        this.noPassengerTripsMessageTarget.classList.add('d-none');
        
        const covoiturage = participationData.covoiturage;
        if (!covoiturage) return;

        const tripDiv = document.createElement('div');
        tripDiv.id = `participation-${participationData.id}`;
        tripDiv.className = 'd-flex flex-column flex-md-row align-items-start align-items-md-center px-3 py-2 rounded border mb-2 bg-light';

        const mainInfoSpan = document.createElement('div');
        mainInfoSpan.className = 'mb-2 mb-md-0 flex-grow-1';
        
        const driverPseudo = covoiturage.chauffeur?.pseudo || 'Inconnu';
        const translatedStatus = this.translateStatus(covoiturage.statut);
        
        mainInfoSpan.innerHTML = `<div class="fw-bold">${covoiturage.villeDepart} <i class="bi bi-arrow-right"></i> ${covoiturage.villeArrivee}</div><div class="small text-muted">Le ${this.formatDisplayDate(covoiturage.dateDepart)} à ${covoiturage.heureDepart}</div><div class="small">Conducteur: <strong>${driverPseudo}</strong> - Statut: <span class="fw-bold">${translatedStatus}</span></div>`;
        
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
        } 
        else if (participationData.valideParPassager) {
            const validatedBadge = document.createElement('span');
            validatedBadge.className = 'badge bg-secondary text-dark px-4 py-2 ms-2 rounded-pill';
            validatedBadge.textContent = 'Validé';
            actionBtnContainer.appendChild(validatedBadge);
        }

        tripDiv.append(mainInfoSpan, actionBtnContainer);
        this.passengerTripsContainerTarget.appendChild(tripDiv);
    }
    
    async loadAndDisplayPassengerTrips() {
        if (!this.hasPassengerTripsContainerTarget) return [];
        try {
            const response = await fetch('/api/user-participations'); 
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('add_carpool_controller: Utilisateur non authentifié. Redirection.');
                    Turbo.visit('/login'); 
                    return; 
                }
                const errorText = await response.text();
                try {
                    throw new Error(JSON.parse(errorText).message || 'Erreur inconnue');
                } catch (e) {
                    throw new Error("Le serveur a renvoyé une erreur inattendue.");
                }
            }

            this.userPassengerCovoituragesData = await response.json();
            
            const upcomingPassengerTrips = this.userPassengerCovoituragesData.filter(p => p.covoiturage && p.covoiturage.statut !== 'termine' && p.covoiturage.statut !== 'annule'); // Correction: utiliser statut_annule si c'est la bonne valeur

            this.passengerTripsContainerTarget.innerHTML = ''; 

            if (upcomingPassengerTrips.length === 0) {
                if (this.hasNoPassengerTripsMessageTarget) {
                    this.noPassengerTripsMessageTarget.innerHTML = 'Vous ne participez à aucun voyage pour le moment. <a href="/covoiturage" class="link-primary">Trouver un voyage</a>';
                    this.noPassengerTripsMessageTarget.classList.remove('d-none');
                    this.passengerTripsContainerTarget.appendChild(this.noPassengerTripsMessageTarget);
                }
            } else {
                if (this.hasNoPassengerTripsMessageTarget) this.noPassengerTripsMessageTarget.classList.add('d-none');
                upcomingPassengerTrips.forEach(participation => this.addPassengerTripToList(participation));
            }
            return this.userPassengerCovoituragesData;
        } catch (error) {
            this.displayMessage(this.passengerTripsContainerTarget, `Impossible de charger vos participations: ${error.message}`, 'danger');
            return [];
        }
    }

    handlePassengerAction(e) {
        const cancelButton = e.target.closest('.cancel-participation-btn');
        if (cancelButton) { 
            if (!cancelButton.disabled && this.cancelParticipationModalInstance) {
                const participationId = cancelButton.dataset.participationId;
                
                const participation = this.userPassengerCovoituragesData.find(p => p.id == participationId);
                const creditsToRefund = participation?.covoiturage?.prix || 0;

                const creditsSpan = this.creditsToRefundTarget;
                if (creditsSpan) creditsSpan.textContent = creditsToRefund;
                
                if(this.hasConfirmCancelParticipationButtonTarget) this.confirmCancelParticipationButtonTarget.dataset.participationId = participationId;
                this.cancelParticipationModalInstance.show();
            }
        }
        
        const validateButton = e.target.closest('.validate-trip-btn');
        if (validateButton && this.validateReviewModalInstance) {
            this.currentParticipationId = validateButton.dataset.participationId;
            this.currentCovoiturageId = validateButton.dataset.covoiturageId;
            
            const modalTitle = document.getElementById('validateReviewModalLabel'); 
            if (modalTitle) {
                const participation = this.userPassengerCovoituragesData.find(p => p.id == this.currentParticipationId);
                if (participation && participation.covoiturage) {
                    const covoit = participation.covoiturage;
                    const driverPseudo = covoit.chauffeur?.pseudo || 'Inconnu';
                    modalTitle.innerHTML = `Valider: ${covoit.villeDepart} <i class="bi bi-arrow-right"></i> ${covoit.villeArrivee}<br><small class="fw-normal">avec ${driverPseudo}</small>`;
                } else {
                    modalTitle.textContent = 'Valider le covoiturage';
                }
            }
            
            this.validateReviewFormTarget.reset();
            this.ratingSectionTarget.classList.add('d-none');
            this.commentSectionTarget.classList.add('d-none');
            this.ratingStarTargets.forEach(star => star.classList.remove('selected'));
            this.currentRating = 0;
            
            if (this.hasValidateReviewFormMessageContainerTarget) {
                this.validateReviewFormMessageContainerTarget.innerHTML = '';
            }

            this.validateReviewModalInstance.show();
        }
    }

    async confirmCancelParticipation() { // Annulation PASSAGER (bouton dans la modale)
        const participationId = this.confirmCancelParticipationButtonTarget.dataset.participationId;
        if (!participationId) return;

        this.confirmCancelParticipationButtonTarget.disabled = true;
        this.confirmCancelParticipationButtonTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Annulation...';

        try {
            const response = await fetch(`/api/participation/${participationId}`, {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Impossible d\'annuler la participation.');
            
            Turbo.visit(window.location.href); 

        } catch (error) {
            this.cancelParticipationModalInstance.hide(); 
            this.displayMessage(this.tripMessageContainerTarget, error.message, 'danger');
        } finally {
            this.confirmCancelParticipationButtonTarget.disabled = false;
            this.confirmCancelParticipationButtonTarget.innerHTML = 'Oui, annuler';
        }
    }

    handleReviewStatusChange() {
        if (this.hasValidateReviewFormMessageContainerTarget) {
            this.validateReviewFormMessageContainerTarget.innerHTML = '';
        }

        const isYesChecked = this.tripValidationStatusYesTarget.checked;
        const isNoChecked = this.tripValidationStatusNoTarget.checked;

        if (isYesChecked) {
            this.ratingSectionTarget.classList.remove('d-none');
            this.commentSectionTarget.classList.remove('d-none');
        } else if (isNoChecked) {
            this.ratingSectionTarget.classList.remove('d-none'); 
            this.commentSectionTarget.classList.remove('d-none'); 
        } else {
            this.ratingSectionTarget.classList.add('d-none');
            this.commentSectionTarget.classList.add('d-none');
        }

        const commentLabel = document.querySelector('label[for="reviewComment"]'); 
        if (commentLabel) {
            if (isYesChecked) {
                commentLabel.innerHTML = 'Commentaire (facultatif)';
                this.reviewCommentInputTarget.required = false;
            } else if (isNoChecked) {
                commentLabel.innerHTML = 'Commentaire (obligatoire pour expliquer le problème) <span class="text-danger">*</span>';
                this.reviewCommentInputTarget.required = true;
            } else {
                commentLabel.innerHTML = 'Commentaire';
                this.reviewCommentInputTarget.required = false;
            }
        }
    }

    handleRatingClick(e) {
        this.currentRating = parseInt(e.currentTarget.dataset.rating);
        this.ratingStarTargets.forEach((s, index) => {
            s.classList.toggle('selected', index < this.currentRating);
        });
    }

    async submitReview() {
        if (this.hasValidateReviewFormMessageContainerTarget) {
            this.validateReviewFormMessageContainerTarget.innerHTML = '';
        }

        const tripStatusYes = this.tripValidationStatusYesTarget.checked;
        const tripStatusNo = this.tripValidationStatusNoTarget.checked;

        if (!tripStatusYes && !tripStatusNo) {
            this.displayMessage(this.validateReviewFormMessageContainerTarget, 'Veuillez indiquer si le voyage s\'est bien déroulé.', 'danger');
            return;
        }

        let reviewData = {
            participationId: this.currentParticipationId,
            covoiturageId: this.currentCovoiturageId,
            validationStatus: tripStatusYes,
            note: this.currentRating,
            commentaire: this.reviewCommentInputTarget.value
        };

        if (tripStatusYes) {
            if (this.currentRating === 0) {
                this.displayMessage(this.validateReviewFormMessageContainerTarget, 'Veuillez donner une note en étoiles.', 'danger');
                return;
            }
            reviewData.raisonLitige = null;
        } else { 
            if (!this.reviewCommentInputTarget.value.trim()) {
                this.displayMessage(this.validateReviewFormMessageContainerTarget, 'Veuillez indiquer la raison du problème dans le commentaire.', 'danger');
                return;
            }
            if (this.currentRating === 0) {
                this.displayMessage(this.validateReviewFormMessageContainerTarget, 'Veuillez donner une note en étoiles même si le voyage s\'est mal déroulé.', 'danger');
                return;
            }
            reviewData.raisonLitige = this.reviewCommentInputTarget.value;
            reviewData.note = 0;
        }

        this.submitReviewBtnTarget.disabled = true;
        this.submitReviewBtnTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Envoi...';

        try {
            const response = await fetch(`/api/participation/${this.currentParticipationId}/validate-review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewData)
            });
            const result = await response.json();

            if (response.ok) {
                this.validateReviewModalInstance.hide();
                this.displayMessage(this.tripMessageContainerTarget, result.message, 'success');
                const updatedTrips = await this.loadAndDisplayPassengerTrips();
                this.checkForPendingValidation(updatedTrips);
            } else {
                this.displayMessage(this.validateReviewFormMessageContainerTarget, result.message || 'Erreur lors de la validation du voyage.', 'danger');
            }
        } catch (error) {
            this.displayMessage(this.validateReviewFormMessageContainerTarget, 'Impossible de communiquer avec le serveur.', 'danger');
        } finally {
            this.submitReviewBtnTarget.disabled = false;
            this.submitReviewBtnTarget.innerHTML = 'Valider';
        }
    }

    populateCitySelect(selectElement, cities) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Sélectionnez une ville</option>';
        cities.forEach(city => {
            const option = new Option(city, city);
            selectElement.add(option);
        });
    }

    populateTripVehicleSelect() {
        if (!this.hasTripVehicleSelectTarget) return;
        this.tripVehicleSelectTarget.innerHTML = '<option value="">Sélectionnez un véhicule</option>';
        if (this.userVehiclesData.length === 0) {
            this.tripVehicleSelectTarget.add(new Option("Aucun véhicule. Ajoutez-en un d'abord.", "", false, true));
            return;
        }
        this.userVehiclesData.forEach(vehicle => {
            const marque = vehicle.marque?.libelle || 'Inconnue';
            const modele = vehicle.modele || 'Inconnu';
            const energie = vehicle.energie?.toLowerCase() || '';
            const icon = (energie === 'electric' || energie === 'hybrid') ? '🍃 ' : '';
            const text = `${icon}${marque} ${modele} - ${vehicle.nombreDePlaces} place(s)`;
            const option = new Option(text, vehicle.id);
            option.dataset.nombreDePlaces = vehicle.nombreDePlaces;
            this.tripVehicleSelectTarget.add(option);
        });
    }

    updateAvailableSeats() {
        if (!this.hasTripVehicleSelectTarget || !this.hasAvailableSeatsInputTarget || !this.hasNumberOfCompanionsInputTarget) return;
        const selectedOption = this.tripVehicleSelectTarget.options[this.tripVehicleSelectTarget.selectedIndex];
        const totalSeats = parseInt(selectedOption.dataset.nombreDePlaces) || 0;
        let companions = this.isAccompaniedCheckboxTarget.checked ? (parseInt(this.numberOfCompanionsInputTarget.value) || 0) : 0;
        companions = Math.max(0, Math.min(companions, totalSeats));
        this.numberOfCompanionsInputTarget.value = companions;
        this.availableSeatsInputTarget.value = Math.max(0, totalSeats - companions);
        this.numberOfCompanionsInputTarget.max = totalSeats;
    }

    showTripForm() {
        this.tripFormContainerTarget.classList.remove('d-none');
        this.addTripButtonTarget.classList.add('d-none');
        this.tripFormTarget.reset();
        this.populateTripVehicleSelect();
        this.isAccompaniedCheckboxTarget.checked = false;
        this.companionsInputGroupTarget.classList.add('d-none');
        this.updateAvailableSeats();
    }

    cancelTripForm() {
        this.tripFormContainerTarget.classList.add('d-none');
        this.addTripButtonTarget.classList.remove('d-none');
        if (this.hasTripMessageContainerTarget) {
            this.tripMessageContainerTarget.innerHTML = '';
        }
    }
    
    async submitTripForm(e) {
        e.preventDefault();
        const tripData = {
            villeDepart: this.departureCitySelectTarget.value,
            dateDepart: this.departureDateInputTarget.value,
            heureDepart: this.departureTimeInputTarget.value,
            villeArrivee: this.arrivalCitySelectTarget.value,
            dateArrivee: this.arrivalDateInputTarget.value,
            heureArrivee: this.arrivalTimeInputTarget.value,
            prix: parseInt(this.tripPriceInputTarget.value),
            vehiculeId: parseInt(this.tripVehicleSelectTarget.value),
            estAccompagne: this.isAccompaniedCheckboxTarget.checked,
            nombreAccompagnateurs: parseInt(this.numberOfCompanionsInputTarget.value) || 0,
            placesDisponibles: parseInt(this.availableSeatsInputTarget.value),
            statut: 'initialise'
        };

        if (tripData.villeDepart === tripData.villeArrivee) {
            this.displayMessage(this.tripMessageContainerTarget, 'La ville de départ et d\'arrivée doivent être différentes.', 'danger');
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

            this.displayMessage(this.tripMessageContainerTarget, result.message, 'success');
            this.addDriverCovoiturageToList(result.covoiturage, true);
            this.userDriverCovoituragesData.push(result.covoiturage);
            this.tripFormContainerTarget.classList.add('d-none');
            this.addTripButtonTarget.classList.remove('d-none');
        } catch (error) {
            this.displayMessage(this.tripMessageContainerTarget, error.message, 'danger');
        }
    }

    initializeTripForm() {
        this.populateCitySelect(this.departureCitySelectTarget, this.FRENCH_CITIES);
        this.populateCitySelect(this.arrivalCitySelectTarget, this.FRENCH_CITIES);
        this.populateTripVehicleSelect();

        const todayString = this.formatDate(new Date());
        if (this.hasDepartureDateInputTarget) {
            this.departureDateInputTarget.value = todayString;
            this.departureDateInputTarget.min = todayString;
        }
        if (this.hasArrivalDateInputTarget) {
            this.arrivalDateInputTarget.value = todayString;
            this.arrivalDateInputTarget.min = todayString;
        }
        this.departureDateInputTarget?.addEventListener('change', this.handleDepartureDateChange.bind(this));
        
        this.tripVehicleSelectTarget?.addEventListener('change', this.updateAvailableSeats.bind(this));
        this.isAccompaniedCheckboxTarget?.addEventListener('change', this.handleIsAccompaniedChange.bind(this));
        this.numberOfCompanionsInputTarget?.addEventListener('input', this.updateAvailableSeats.bind(this));
        this.updateAvailableSeats();
    }

    handleDepartureDateChange() {
        if (this.hasDepartureDateInputTarget && this.hasArrivalDateInputTarget) {
            this.arrivalDateInputTarget.min = this.departureDateInputTarget.value;
            if (this.arrivalDateInputTarget.value < this.departureDateInputTarget.value) {
                this.arrivalDateInputTarget.value = this.departureDateInputTarget.value;
            }
        }
    }

    handleIsAccompaniedChange() {
        if (this.hasCompanionsInputGroupTarget && this.hasIsAccompaniedCheckboxTarget) {
            this.companionsInputGroupTarget.classList.toggle('d-none', !this.isAccompaniedCheckboxTarget.checked);
            this.updateAvailableSeats();
        }
    }

    checkForPendingValidation(participations) {
        if (!participations || participations.length === 0) return;

        const pendingValidation = participations.find(p => 
            p.covoiturage && 
            p.covoiturage.statut === 'en_attente_validation' && 
            !p.valideParPassager
        );

        if (pendingValidation && this.validateReviewModalInstance) {
            this.displayMessage(this.tripMessageContainerTarget, '<strong>Action requise :</strong> Vous avez un voyage en attente de validation. Veuillez le traiter pour continuer.', 'info');

            this.currentParticipationId = pendingValidation.id;
            this.currentCovoiturageId = pendingValidation.covoiturage.id;
            
            const modalTitle = document.getElementById('validateReviewModalLabel'); 
            if (modalTitle) {
                const covoit = pendingValidation.covoiturage;
                const driverPseudo = covoit.chauffeur?.pseudo || 'Inconnu';
                modalTitle.innerHTML = `Valider: ${covoit.villeDepart} <i class="bi bi-arrow-right"></i> ${covoit.villeArrivee}<br><small class="fw-normal">avec ${driverPseudo}</small>`;
            }
            
            this.validateReviewFormTarget.reset();
            this.ratingSectionTarget.classList.add('d-none');
            this.commentSectionTarget.classList.add('d-none');
            this.ratingStarTargets.forEach(star => star.classList.remove('selected'));
            this.currentRating = 0;

            if (this.hasValidateReviewFormMessageContainerTarget) {
                this.validateReviewFormMessageContainerTarget.innerHTML = '';
            }

            this.validateReviewModalInstance.show();
        }
    }

    async initializePage() {
        this.initializeTripForm();
        await this.loadAndDisplayDriverCovoiturages();
        const passengerTrips = await this.loadAndDisplayPassengerTrips();
        
        this.checkForPendingValidation(passengerTrips); 
        
        this.activateTabFromHash();
    }

    activateTabFromHash() {
        const hash = window.location.hash;
        if (hash === '#trip' || hash === '#roles' || hash === '#history' || hash === '#account') {
            const tabTrigger = document.querySelector(`.nav-tabs button[data-bs-target="${hash}"]`);
            if (tabTrigger) {
                const tab = new Tab(tabTrigger); 
                tab.show();
            }
        }
    }
}