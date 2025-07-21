// assets/controllers/roles_vehicles_controller.js

import { Controller } from '@hotwired/stimulus';
import * as Turbo from '@hotwired/turbo'; 

export default class extends Controller {
    static targets = [
        // Utilitaire pour afficher les messages
        'messageContainer', // Un conteneur général pour les messages

        // Gestion des rôles
        'rolePassengerCheckbox',
        'roleDriverCheckbox',
        'driverDetailsContainer',
        'editRolesButton',
        'rolesMessageContainer',
        'userRolesDataSpan', // Pour récupérer les rôles initiaux

        // Gestion des véhicules
        'addVehicleButton',
        'vehicleFormContainer',
        'vehicleForm',
        'cancelVehicleButton',
        'vehiclesContainer',
        'vehicleMessageContainer',
        'brandSelect',
        'countryDropdownButton',
        'countryDropdownMenu', // La div qui contient les dropdown-item
        'selectedFlagImage', // L'élément <img> pour le drapeau sélectionné
        'selectedCountryCodeSpan', // Le span pour le code pays
        'plateInput',
        'hiddenCountryCodeInput',
        'firstRegDateInput',
        'modelInput', // Ajout de target pour le modèle
        'colorSelect', // Ajout de target pour la couleur
        'seatsInput', // Ajout de target pour le nombre de places
        'engineTypeRadio' ,// Collection de radios, on y accède via target.filter(...)

        // Gestion des préférences
        'customPrefInput',
        'addCustomPrefButton',
        'customPrefListContainer',
        'prefSmokerCheckbox',
        'prefAnimalCheckbox',
        'profileForm', // Le formulaire des préférences
        'preferencesMessageContainer',
        'userPreferencesDataSpan' // Pour récupérer les préférences initiales
    ];

    // Données et mappages
    userRoles = [];
    userVehiclesData = [];
    userPreferences = {
        fumeurs_acceptes: false,
        animaux_acceptes: false,
        personnalisees: []
    };
    countryPlateMasks = {
        'FR': 'AA-999-AA',
        'DE': 'A-9999-AA', 
        'BE': '9-AAA-999',
        'LU': 'AA-9999',
        'CH': 'AA-999999',
        'IT': 'AA999AA',
        'ES': '9999-AAA',
    };
    energieMap = { 'electric': 'Électrique', 'hybrid': 'Hybride', 'thermal': 'Thermique' };

    connect() {
        console.log("Stimulus: roles_vehicles_controller connecté.");
        this.initializeDataFromDOM();
        this.initializeRolesDisplay();
        this.initializeVehiclesSection();
        this.initializePreferencesSection();
    }

    // Fonctions utilitaires (peuvent être déplacées dans un utilitaire commun si plusieurs contrôleurs les utilisent)
    displayMessage(container, message, type) {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) {
            console.error(`roles_vehicles_controller: Conteneur de message "${container}" introuvable.`);
            return;
        }
        targetContainer.innerHTML = ''; 
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.appendChild(alertDiv);
        setTimeout(() => {
            if (alertDiv) {
                alertDiv.classList.remove('show');
                alertDiv.classList.add('fade');
                alertDiv.addEventListener('transitionend', () => alertDiv.remove());
            }
        }, 5000);
    }

    // =====================================================================
    // INITIALISATION DES SECTIONS AU CHARGEMENT DU CONTROLEUR
    // =====================================================================
    initializeDataFromDOM() {
        // Rôles
        if (this.hasUserRolesDataSpanTarget) {
            const rawData = this.userRolesDataSpanTarget.textContent.trim();
            if (rawData !== '') {
                try {
                    this.userRoles = JSON.parse(rawData);
                } catch (e) {
                    console.error("roles_vehicles_controller: Erreur parsing des rôles:", e);
                    this.displayMessage(this.rolesMessageContainerTarget, "Erreur au chargement des rôles.", 'danger');
                }
            }
        } else {
            console.warn("roles_vehicles_controller: Élément 'user-roles-data' non trouvé.");
        }

        // Véhicules
        if (this.hasUserVehiclesDataSpanTarget) {
            const rawData = this.userVehiclesDataSpanTarget.textContent.trim();
            if (rawData !== '') {
                try {
                    this.userVehiclesData = JSON.parse(rawData);
                } catch (e) {
                    console.error("roles_vehicles_controller: Erreur parsing des véhicules:", e);
                    this.displayMessage(this.vehicleMessageContainerTarget, "Erreur au chargement des véhicules.", 'danger');
                }
            } else {
                if (this.hasVehiclesContainerTarget) this.vehiclesContainerTarget.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
            }
        } else {
            console.warn("roles_vehicles_controller: Élément 'user-vehicles-data' non trouvé.");
            if (this.hasVehiclesContainerTarget) this.vehiclesContainerTarget.innerHTML = '<p class="text-muted">Problème de chargement des données des véhicules.</p>';
        }

        // Préférences
        if (this.hasUserPreferencesDataSpanTarget) {
            const rawData = this.userPreferencesDataSpanTarget.textContent.trim();
            if (rawData !== '') {
                try {
                    const parsedData = JSON.parse(rawData);
                    this.userPreferences = Object.assign(this.userPreferences, parsedData); 
                } catch (e) {
                    console.error("roles_vehicles_controller: Erreur lors du parsing des préférences de l'utilisateur:", e);
                    this.displayMessage(this.preferencesMessageContainerTarget, "Erreur au chargement des préférences.", 'danger');
                }
            }
        } else {
            console.warn("roles_vehicles_controller: Élément 'user-preferences-data' non trouvé.");
        }
    }

    initializeRolesDisplay() {
        const isDriver = this.userRoles.includes('ROLE_DRIVER');
        if (this.hasRolePassengerCheckboxTarget) this.rolePassengerCheckboxTarget.checked = this.userRoles.includes('ROLE_PASSENGER');
        if (this.hasRoleDriverCheckboxTarget) this.roleDriverCheckboxTarget.checked = isDriver;
        
        // Initialisation des états disabled
        if (this.hasRolePassengerCheckboxTarget) this.rolePassengerCheckboxTarget.disabled = true;
        if (this.hasRoleDriverCheckboxTarget) this.roleDriverCheckboxTarget.disabled = true;

        if (this.hasDriverDetailsContainerTarget) this.driverDetailsContainerTarget.style.display = isDriver ? 'block' : 'none';
        if (this.hasEditRolesButtonTarget) this.editRolesButtonTarget.textContent = 'Modifier';
    }

    initializeVehiclesSection() {
        if (this.hasFirstRegDateInputTarget) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayString = `${year}-${month}-${day}`;
            this.firstRegDateInputTarget.setAttribute('max', todayString);
        }
        if (this.hasFirstRegDateInputTarget) {
            this.firstRegDateInputTarget.addEventListener('change', this.handleFirstRegDateChange.bind(this));
        }

        this.displayVehicles(this.userVehiclesData);
        this.loadAndPopulateBrands();

        if (this.hasCountryDropdownMenuTarget) {
            this.countryDropdownMenuTarget.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('click', this.handleCountrySelect.bind(this));
            });
            this.updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png');
        }
    }

    initializePreferencesSection() {
        if (this.hasPrefSmokerCheckboxTarget) this.prefSmokerCheckboxTarget.checked = this.userPreferences.fumeurs_acceptes;
        if (this.hasPrefAnimalCheckboxTarget) this.prefAnimalCheckboxTarget.checked = this.userPreferences.animaux_acceptes;

        if (this.hasCustomPrefListContainerTarget && this.userPreferences.personnalisees && Array.isArray(this.userPreferences.personnalisees)) {
            this.userPreferences.personnalisees.forEach(prefText => {
                const newTag = this.createPrefTag(prefText);
                this.customPrefListContainerTarget.appendChild(newTag);
            });
        }
    }


    // =====================================================================
    // GESTION DES RÔLES (Passager / Chauffeur) - Méthodes d'action
    // =====================================================================
    async toggleEditRoles() {
        if (this.editRolesButtonTarget.textContent === 'Modifier') {
            if (this.hasRolePassengerCheckboxTarget) this.rolePassengerCheckboxTarget.disabled = false;
            if (this.hasRoleDriverCheckboxTarget) this.roleDriverCheckboxTarget.disabled = false;
            this.editRolesButtonTarget.textContent = 'Appliquer';
        } else {
            if (!this.hasRolePassengerCheckboxTarget || (!this.rolePassengerCheckboxTarget.checked && (!this.hasRoleDriverCheckboxTarget || !this.roleDriverCheckboxTarget.checked))) {
                this.displayMessage(this.rolesMessageContainerTarget, "Au moins un rôle doit être sélectionné.", 'danger');
                return;
            }
            const data = {
                isPassengerChecked: this.hasRolePassengerCheckboxTarget ? this.rolePassengerCheckboxTarget.checked : false,
                isDriverChecked: this.hasRoleDriverCheckboxTarget ? this.roleDriverCheckboxTarget.checked : false
            };
            try {
                const response = await fetch('/mon-compte/update-roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    this.displayMessage(this.rolesMessageContainerTarget, result.message, 'success');
                    // Utiliser Turbo.visit pour un rechargement compatible Turbo
                    setTimeout(() => Turbo.visit(window.location.href), 1500); 
                } else {
                    this.displayMessage(this.rolesMessageContainerTarget, result.message, 'danger');
                }
            } catch (error) {
                console.error("roles_vehicles_controller: Erreur lors de la mise à jour des rôles:", error);
                this.displayMessage(this.rolesMessageContainerTarget, "Une erreur inattendue est survenue lors de la mise à jour des rôles.", 'danger');
            }
        }
    }

    // =====================================================================
    // GESTION DES VÉHICULES - Méthodes d'action et helpers
    // =====================================================================
    displayVehicles(vehicles) {
        if (!this.hasVehiclesContainerTarget) return;
        this.vehiclesContainerTarget.innerHTML = '';
        if (!vehicles || vehicles.length === 0) {
            this.vehiclesContainerTarget.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
            return;
        }
        vehicles.forEach(vehicle => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-12 mb-3';
            const vehicleDiv = document.createElement('div');
            vehicleDiv.className = 'd-flex align-items-center px-3 py-2 rounded border h-100';
            
            const carIcon = document.createElement('i');
            carIcon.className = `bi bi-car-front-fill fs-5 me-2`;
            carIcon.style.color = vehicle.couleur || 'currentColor';

            const mainInfoSpan = document.createElement('span');
            mainInfoSpan.className = 'mb-0 flex-grow-1 text-sm';
            
            const energieText = this.energieMap[vehicle.energie] || vehicle.energie;
            const marqueLibelle = vehicle.marque && vehicle.marque.libelle ? vehicle.marque.libelle : 'N/A';
            const modeleText = vehicle.modele || 'N/A';
            
            const countryCodeForFlag = vehicle.paysImmatriculation ? vehicle.paysImmatriculation.toLowerCase() : '';
            const countryFlag = countryCodeForFlag ? `<img src="https://flagcdn.com/w20/${countryCodeForFlag}.png" alt="${vehicle.paysImmatriculation}" class="flag-icon me-1">` : '';
            const immatriculationText = vehicle.immatriculation || 'N/A';

            mainInfoSpan.innerHTML = `${countryFlag} ${energieText} - ${immatriculationText} - ${marqueLibelle} ${modeleText}`;
            
            const seatsSpan = document.createElement('span');
            seatsSpan.className = 'fw-bold ms-auto text-sm';
            let leafIconHtml = '';
            if (vehicle.energie === 'electric' || vehicle.energie === 'hybrid') {
                leafIconHtml = `<i class="bi bi-leaf-fill text-primary me-1"></i>`;
            }
            seatsSpan.innerHTML = `${leafIconHtml}${vehicle.nombreDePlaces} places`;

            vehicleDiv.append(carIcon, mainInfoSpan, seatsSpan);
            colDiv.appendChild(vehicleDiv);
            this.vehiclesContainerTarget.appendChild(colDiv);
        });
    }
    
    async loadAndPopulateBrands() {
        if (!this.hasBrandSelectTarget) {
            console.warn("roles_vehicles_controller: Élément 'brandSelect' non trouvé pour charger les marques.");
            return;
        }
        try {
            const response = await fetch('/api/marques');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            const marques = await response.json();
            this.brandSelectTarget.innerHTML = '<option selected disabled value="">Choisir une marque</option>';
            marques.forEach(marque => {
                const option = document.createElement('option');
                option.value = marque.id;
                option.textContent = marque.nom;
                this.brandSelectTarget.appendChild(option);
            });
        } catch (error) {
            console.error("roles_vehicles_controller: Échec du chargement des marques:", error);
            this.brandSelectTarget.innerHTML = '<option selected disabled value="">Erreur de chargement</option>';
            this.displayMessage(this.vehicleMessageContainerTarget, 'Impossible de charger la liste des marques.', 'danger');
        }
    }

    validateFirstRegDate(dateString) {
        if (!dateString) {
            return "La date de première immatriculation est requise.";
        }
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100);
        minDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return "La date de première immatriculation ne peut pas être dans le futur.";
        }
        if (selectedDate < minDate) {
            return "La date de première immatriculation ne peut pas être antérieure à 100 ans.";
        }
        return null;
    }

    handleFirstRegDateChange() {
        if (this.hasFirstRegDateInputTarget && this.hasVehicleMessageContainerTarget) {
            const errorMessage = this.validateFirstRegDate(this.firstRegDateInputTarget.value);
            if (errorMessage) {
                this.displayMessage(this.vehicleMessageContainerTarget, errorMessage, 'danger');
            } else {
                this.vehicleMessageContainerTarget.innerHTML = ''; 
            }
        }
    }

    updateCountrySelection(countryCode, flagSrc) {
        if (this.hasSelectedFlagImageTarget) this.selectedFlagImageTarget.src = flagSrc;
        if (this.hasSelectedCountryCodeSpanTarget) this.selectedCountryCodeSpanTarget.textContent = countryCode;
        if (this.hasHiddenCountryCodeInputTarget) this.hiddenCountryCodeInputTarget.value = countryCode;
        
        if (this.hasPlateInputTarget) {
            this.plateInputTarget.value = '';
            const mask = this.countryPlateMasks[countryCode] || '';
            this.plateInputTarget.placeholder = mask;
            this.plateInputTarget.dataset.mask = mask;
            
            // Supprime l'ancien écouteur si existant
            if (this.plateInputTarget._maskListener) {
                this.plateInputTarget.removeEventListener('input', this.plateInputTarget._maskListener);
            }

            const applyMask = (event) => {
                let value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                let maskedValue = '';
                let maskIndex = 0;
                let valueIndex = 0;

                while (maskIndex < mask.length && valueIndex < value.length) {
                    if (mask[maskIndex] === 'A') {
                        if (/[A-Z]/.test(value[valueIndex])) {
                            maskedValue += value[valueIndex];
                            valueIndex++;
                        }
                        maskIndex++;
                    } else if (mask[maskIndex] === '9') {
                        if (/[0-9]/.test(value[valueIndex])) {
                            maskedValue += value[valueIndex];
                            valueIndex++;
                        }
                        maskIndex++;
                    } else if (mask[maskIndex] === '-') {
                        maskedValue += '-';
                        maskIndex++;
                        if (value[valueIndex] === '-') {
                            valueIndex++;
                        }
                    } else {
                        maskedValue += mask[maskIndex];
                        maskIndex++;
                    }
                }
                event.target.value = maskedValue;
            };
            this.plateInputTarget.addEventListener('input', applyMask);
            this.plateInputTarget._maskListener = applyMask;
        }
    }

    handleCountrySelect(e) {
        e.preventDefault();
        const countryCode = e.currentTarget.dataset.countryCode;
        const flagSrc = e.currentTarget.dataset.flagSrc;
        this.updateCountrySelection(countryCode, flagSrc);
    }

    showVehicleForm() {
        if (this.hasVehicleFormContainerTarget) this.vehicleFormContainerTarget.classList.remove('d-none');
        if (this.hasAddVehicleButtonTarget) this.addVehicleButtonTarget.classList.add('d-none');
        if (this.hasVehicleFormTarget) this.vehicleFormTarget.reset();
        this.updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png'); // Réinitialiser à FR
        if (this.hasFirstRegDateInputTarget) this.firstRegDateInputTarget.value = '';
        if (this.hasVehicleMessageContainerTarget) this.vehicleMessageContainerTarget.innerHTML = '';
    }

    hideVehicleForm() {
        if (this.hasVehicleFormContainerTarget) this.vehicleFormContainerTarget.classList.add('d-none');
        if (this.hasAddVehicleButtonTarget) this.addVehicleButtonTarget.classList.remove('d-none');
        if (this.hasVehicleMessageContainerTarget) this.vehicleMessageContainerTarget.innerHTML = '';
    }

    async submitVehicleForm(e) {
        e.preventDefault();
        
        const data = {
            immatriculation: this.plateInputTarget.value,
            paysImmatriculation: this.hiddenCountryCodeInputTarget.value,
            datePremiereImmatriculation: this.firstRegDateInputTarget.value,
            marqueId: this.brandSelectTarget.value,
            modele: this.modelInputTarget.value,
            couleur: this.colorSelectTarget.value,
            nombreDePlaces: this.seatsInputTarget.value,
            energie: this.element.querySelector('input[name="engineType"]:checked')?.value || '' // Accès via element car name est global
        };
        
        const dateError = this.validateFirstRegDate(data.datePremiereImmatriculation);
        if (dateError) {
            return this.displayMessage(this.vehicleMessageContainerTarget, dateError, 'danger');
        }

        if (!data.immatriculation) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez saisir une plaque d\'immatriculation.', 'danger');
        }
        if (!data.marqueId) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez sélectionner une marque.', 'danger');
        }
        if (!data.modele) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez saisir un modèle.', 'danger');
        }
        if (!data.couleur) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez sélectionner une couleur.', 'danger');
        }
        if (!data.nombreDePlaces || parseInt(data.nombreDePlaces) < 1) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez saisir un nombre de places valide (minimum 1).', 'danger');
        }
        if (!data.energie) {
            return this.displayMessage(this.vehicleMessageContainerTarget, 'Veuillez sélectionner un type d\'énergie.', 'danger');
        }

        try {
            const response = await fetch('/mon-compte/add-vehicle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.success) {
                this.displayMessage(this.vehicleMessageContainerTarget, result.message, 'success');
                if (this.hasVehicleFormTarget) this.vehicleFormTarget.reset();
                if (this.hasVehicleFormContainerTarget) this.vehicleFormContainerTarget.classList.add('d-none');
                if (this.hasAddVehicleButtonTarget) this.addVehicleButtonTarget.classList.remove('d-none');
                
                const updatedVehiclesResponse = await fetch('/api/user-vehicles');
                if (updatedVehiclesResponse.ok) {
                    const updatedVehicles = await updatedVehiclesResponse.json();
                    this.displayVehicles(updatedVehicles);
                } else {
                    this.displayMessage(this.vehicleMessageContainerTarget, "Véhicule ajouté, mais erreur lors du rafraîchissement de la liste.", 'warning');
                }
            } else {
                this.displayMessage(this.vehicleMessageContainerTarget, result.message, 'danger');
            }
        } catch (error) {
            console.error("roles_vehicles_controller: Erreur lors de l'ajout du véhicule:", error);
            this.displayMessage(this.vehicleMessageContainerTarget, "Une erreur client est survenue lors de l'ajout du véhicule.", 'danger');
        }
    }

    // =====================================================================
    // GESTION DES PRÉFÉRENCES - Méthodes d'action et helpers
    // =====================================================================
    createPrefTag(text) {
        const tag = document.createElement('div');
        tag.className = 'badge bg-dark d-flex align-items-center gap-2';
        const span = document.createElement('span');
        span.textContent = text;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-close btn-close-white btn-sm';
        btn.setAttribute('aria-label', 'Supprimer la préférence');
        // Utilisation de data-action pour le bouton de suppression de tag
        btn.dataset.action = 'click->roles-vehicles#removeCustomPreferenceTag';
        tag.appendChild(span);
        tag.appendChild(btn);
        return tag;
    }
    
    addCustomPreference() {
        if (!this.hasCustomPrefInputTarget || !this.hasCustomPrefListContainerTarget || !this.hasPreferencesMessageContainerTarget) return;

        const value = this.customPrefInputTarget.value.trim();
        if (value === '') {
            this.displayMessage(this.preferencesMessageContainerTarget, 'Veuillez saisir une préférence.', 'warning');
            return;
        }
        const existing = Array.from(this.customPrefListContainerTarget.children).some(
            (child) => child.firstChild && child.firstChild.textContent.toLowerCase() === value.toLowerCase()
        );
        if (existing) {
            this.displayMessage(this.preferencesMessageContainerTarget, 'Cette préférence est déjà ajoutée.', 'warning');
            return;
        }
        const newTag = this.createPrefTag(value);
        this.customPrefListContainerTarget.appendChild(newTag);
        this.customPrefInputTarget.value = '';
        this.displayMessage(this.preferencesMessageContainerTarget, 'Préférence ajoutée, n\'oubliez pas d\'enregistrer !', 'info');
    }

    removeCustomPreferenceTag(event) {
        const tag = event.currentTarget.parentNode;
        if (tag && this.hasCustomPrefListContainerTarget) {
            this.customPrefListContainerTarget.removeChild(tag);
            this.displayMessage(this.preferencesMessageContainerTarget, 'Préférence supprimée, n\'oubliez pas d\'enregistrer !', 'info');
        }
    }

    async submitProfileForm(e) {
        e.preventDefault();
        // S'assure que l'événement est déclenché par le bouton "Enregistrer les préférences"
        // Le bouton doit avoir data-action="click->roles-vehicles#submitProfileForm"
        // et le form data-action="submit->roles-vehicles#submitProfileForm"
        // OU on filtre par submitter si le form a d'autres submitters.
        // Ici, on gère les préférences uniquement.
        // if (e.submitter && e.submitter.id === 'savePreferencesBtn') { // Si le bouton a un ID savePreferencesBtn
        
        const preferencesToSave = {
            fumeursAcceptes: this.hasPrefSmokerCheckboxTarget ? this.prefSmokerCheckboxTarget.checked : false,
            animauxAcceptes: this.hasPrefAnimalCheckboxTarget ? this.prefAnimalCheckboxTarget.checked : false,
            preferencesPersonnalisees: []
        };
        if (this.hasCustomPrefListContainerTarget) {
            Array.from(this.customPrefListContainerTarget.children).forEach(tag => {
                const textSpan = tag.querySelector('span');
                if (textSpan) {
                    preferencesToSave.preferencesPersonnalisees.push(textSpan.textContent);
                }
            });
        }
        try {
            const response = await fetch('/mon-compte/update-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest' 
                },
                body: JSON.stringify(preferencesToSave)
            });
            const result = await response.json();
            if (result.success) {
                this.displayMessage(this.preferencesMessageContainerTarget, result.message, 'success');
                this.userPreferences = preferencesToSave; 
            } else {
                this.displayMessage(this.preferencesMessageContainerTarget, result.message, 'danger');
            }
        } catch (error) {
            console.error('roles_vehicles_controller: Erreur lors de la sauvegarde des préférences:', error);
            this.displayMessage(this.preferencesMessageContainerTarget, "Une erreur inattendue est survenue lors de la sauvegarde des préférences.", 'danger');
        }
    }
}