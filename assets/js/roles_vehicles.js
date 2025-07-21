// assets/js/roles_vehicles.js

// On encapsule toute la logique dans une fonction pour la rendre compatible avec Turbo
const initializeRolesAndVehicles = () => {
    // Flag pour éviter les écouteurs multiples si initializeRolesAndVehicles est appelé plusieurs fois
    // par DOMContentLoaded et turbo:load sur la même page sans rechargement complet.
    // Cette variable est locale à initializeRolesAndVehicles.
    let isInitialized = false; 

    // Vérifie si le script a déjà été initialisé pour cette instance de page
    if (document.getElementById('roles-tab') && document.getElementById('roles-tab')._rolesVehiclesInitialized) {
        return; // Déjà initialisé
    }
    if (document.getElementById('roles-tab')) {
        document.getElementById('roles-tab')._rolesVehiclesInitialized = true; // Marque comme initialisé
    }

    console.log("roles_vehicles.js: Initialisation du script pour les rôles et véhicules...");

    // =====================================================================
    // SÉLECTEURS DOM ET VARIABLES
    // =====================================================================
    const rolesMessageContainer = document.getElementById('rolesMessageContainer');
    const rolePassenger = document.getElementById('rolePassenger');
    const roleDriver = document.getElementById('roleDriver');
    const driverDetails = document.getElementById('driverDetails');
    const editRolesBtn = document.getElementById('editRolesBtn');

    const addVehicleBtn = document.getElementById('addVehicleBtn');
    const vehicleFormContainer = document.getElementById('vehicleFormContainer');
    const vehicleForm = document.getElementById('vehicleForm');
    const cancelVehicleBtn = document.getElementById('cancelVehicleBtn');
    const vehiclesContainer = document.getElementById('vehiclesContainer');
    const vehicleMessageContainer = document.getElementById('vehicleMessageContainer');
    const brandSelect = document.getElementById('brandSelect');

    const countryDropdownButton = document.getElementById('countryDropdownButton');
    const countryDropdownMenu = document.getElementById('countryDropdownMenu');
    const selectedFlag = document.getElementById('selectedFlag');
    const selectedCountryCodeSpan = document.getElementById('selectedCountryCode');
    const plateInput = document.getElementById('plateInput');
    const hiddenCountryCode = document.getElementById('hiddenCountryCode');
    const firstRegDateInput = document.getElementById('firstRegDate');

    const customPrefInput = document.getElementById('customPrefInput');
    const addCustomPrefBtn = document.getElementById('addCustomPrefBtn');
    const customPrefList = document.getElementById('customPrefList');
    const prefSmoker = document.getElementById('prefSmoker');
    const prefAnimal = document.getElementById('prefAnimal');
    const profileForm = document.getElementById('profileForm');
    const preferencesMessageContainer = document.getElementById('preferencesMessageContainer');

    let userRoles = [];
    let userVehiclesData = [];
    let userPreferences = {
        fumeurs_acceptes: false,
        animaux_acceptes: false,
        personnalisees: []
    };

    const countryPlateMasks = {
        'FR': 'AA-999-AA', 'DE': 'A-9999-AA', 'BE': '9-AAA-999',
        'LU': 'AA-9999', 'CH': 'AA-999999', 'IT': 'AA999AA', 'ES': '9999-AAA',
    };
    const energieMap = { 'electric': 'Électrique', 'hybrid': 'Hybride', 'thermal': 'Thermique' };

    // =====================================================================
    // FONCTIONS UTILITAIRES (Définies ici pour être dans la portée)
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
        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) { // Vérification ajoutée
                alertDiv.classList.remove('show');
                alertDiv.classList.add('fade');
                alertDiv.addEventListener('transitionend', () => alertDiv.remove());
            }
        }, 5000);
    }

    function validateFirstRegDate(dateString) {
        if (!dateString) return "La date de première immatriculation est requise.";
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100);
        minDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) return "La date de première immatriculation ne peut pas être dans le futur.";
        if (selectedDate < minDate) return "La date de première immatriculation ne peut pas être antérieure à 100 ans.";
        return null;
    }

    function updateCountrySelection(countryCode, flagSrc) {
        if (selectedFlag) selectedFlag.src = flagSrc;
        if (selectedCountryCodeSpan) selectedCountryCodeSpan.textContent = countryCode;
        if (hiddenCountryCode) hiddenCountryCode.value = countryCode;
        
        if (plateInput) {
            plateInput.value = '';
            const mask = countryPlateMasks[countryCode] || '';
            plateInput.placeholder = mask;
            plateInput.dataset.mask = mask;
            
            // Supprime l'ancien écouteur si existant
            if (plateInput._maskListener) {
                plateInput.removeEventListener('input', plateInput._maskListener);
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
            plateInput.addEventListener('input', applyMask);
            plateInput._maskListener = applyMask;
        }
    }

    function createPrefTag(text) {
        const tag = document.createElement('div');
        tag.className = 'badge bg-dark d-flex align-items-center gap-2';
        tag.innerHTML = `
            <span>${text}</span>
            <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Supprimer la préférence"></button>
        `;
        // Attache l'écouteur de suppression directement ici
        const deleteButton = tag.querySelector('.btn-close');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                if (customPrefList) customPrefList.removeChild(tag);
                displayMessage(preferencesMessageContainer, 'Préférence supprimée, n\'oubliez pas d\'enregistrer !', 'info');
            });
        }
        return tag;
    }

    function displayVehicles(vehicles) {
        if (!vehiclesContainer) return;
        vehiclesContainer.innerHTML = '';
        if (!vehicles || vehicles.length === 0) {
            vehiclesContainer.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
            return;
        }
        vehicles.forEach(vehicle => {
            const countryCodeForFlag = vehicle.paysImmatriculation ? vehicle.paysImmatriculation.toLowerCase() : '';
            const countryFlag = countryCodeForFlag ? `<img src="https://flagcdn.com/w20/${countryCodeForFlag}.png" alt="${vehicle.paysImmatriculation}" class="flag-icon me-1">` : '';
            const leafIconHtml = (vehicle.energie === 'electric' || vehicle.energie === 'hybrid') ? `<i class="bi bi-tree-fill text-primary me-1"></i>` : '';
            
            const vehicleHtml = `
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center px-3 py-2 rounded border h-100">
                        <i class="bi bi-car-front-fill fs-5 me-2" style="color: ${vehicle.couleur || 'currentColor'};"></i>
                        <span class="mb-0 flex-grow-1 text-sm">
                            ${countryFlag}
                            ${energieMap[vehicle.energie] || vehicle.energie} -
                            ${vehicle.immatriculation || 'N/A'} -
                            ${vehicle.marque && vehicle.marque.libelle ? vehicle.marque.libelle : 'N/A'} ${vehicle.modele || 'N/A'}
                        </span>
                        <span class="fw-bold ms-auto text-sm">
                            ${leafIconHtml}${vehicle.nombreDePlaces} places
                        </span>
                    </div>
                </div>`;
            vehiclesContainer.insertAdjacentHTML('beforeend', vehicleHtml);
        });
    }

    async function loadAndPopulateBrands() {
        if (!brandSelect) return;
        try {
            const response = await fetch('/api/marques');
            if (!response.ok) throw new Error('Network response was not ok.');
            const marques = await response.json();
            brandSelect.innerHTML = '<option selected disabled value="">Choisir une marque</option>';
            marques.forEach(marque => {
                brandSelect.insertAdjacentHTML('beforeend', `<option value="${marque.id}">${marque.nom}</option>`);
            });
        } catch (error) {
            brandSelect.innerHTML = '<option selected disabled value="">Erreur</option>';
            displayMessage(vehicleMessageContainer, 'Impossible de charger la liste des marques.', 'danger');
        }
    }

    // =====================================================================
    // LOGIQUE D'INITIALISATION PRINCIPALE
    // =====================================================================

    // Récupération des données initiales depuis les SPAN HTML
    const userRolesDataElement = document.getElementById('user-roles-data');
    if (userRolesDataElement) {
        const rawData = userRolesDataElement.textContent.trim();
        if (rawData !== '') {
            try {
                userRoles = JSON.parse(rawData);
            } catch (e) {
                displayMessage(rolesMessageContainer, "Erreur au chargement des rôles.", 'danger');
                userRoles = [];
            }
        } else {
            userRoles = [];
        }
    }

    const userVehiclesDataElement = document.getElementById('user-vehicles-data');
    if (userVehiclesDataElement) {
        const rawData = userVehiclesDataElement.textContent.trim();
        if (rawData !== '') {
            try {
                userVehiclesData = JSON.parse(rawData);
            } catch (e) {
                displayMessage(vehicleMessageContainer, "Erreur au chargement des véhicules.", 'danger');
                userVehiclesData = [];
            }
        } else {
            userVehiclesData = [];
            if (vehiclesContainer) vehiclesContainer.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
        }
    } else {
        if (vehiclesContainer) vehiclesContainer.innerHTML = '<p class="text-muted">Problème de chargement des données des véhicules.</p>';
    }

    const userPreferencesDataElement = document.getElementById('user-preferences-data');
    if (userPreferencesDataElement) {
        const rawData = userPreferencesDataElement.textContent.trim();
        if (rawData !== '') {
            try {
                const parsedData = JSON.parse(rawData);
                userPreferences = Object.assign(userPreferences, parsedData); 
            } catch (e) {
                displayMessage(preferencesMessageContainer, "Erreur au chargement des préférences.", 'danger');
            }
        } else {
            userPreferences = { fumeurs_acceptes: false, animaux_acceptes: false, personnalisees: [] };
        }
    }

    // =====================================================================
    // GESTION DES RÔLES (Passager / Chauffeur)
    // =====================================================================

    const isDriver = userRoles.includes('ROLE_DRIVER');
    const isPassenger = userRoles.includes('ROLE_PASSENGER');

    if (rolePassenger) rolePassenger.checked = isPassenger;
    if (roleDriver) roleDriver.checked = isDriver;
    if (rolePassenger) rolePassenger.disabled = true;
    if (roleDriver) roleDriver.disabled = true;
    if (driverDetails) driverDetails.style.display = isDriver ? 'block' : 'none';
    if (editRolesBtn) editRolesBtn.textContent = 'Modifier';

    if (editRolesBtn) {
        editRolesBtn.addEventListener('click', async () => {
            if (editRolesBtn.textContent === 'Modifier') {
                if (rolePassenger) rolePassenger.disabled = false;
                if (roleDriver) roleDriver.disabled = false;
                editRolesBtn.textContent = 'Appliquer';
            } else {
                if (!rolePassenger || (!rolePassenger.checked && (!roleDriver || !roleDriver.checked))) {
                    displayMessage(rolesMessageContainer, "Au moins un rôle doit être sélectionné.", 'danger');
                    return;
                }
                const data = {
                    isPassengerChecked: rolePassenger ? rolePassenger.checked : false,
                    isDriverChecked: roleDriver ? roleDriver.checked : false
                };
                try {
                    const response = await fetch('/mon-compte/update-roles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (result.success) {
                        displayMessage(rolesMessageContainer, result.message, 'success');
                        if (result.redirectUrl) {
                            window.location.href = result.redirectUrl; 
                        } else {
                            window.location.reload(); 
                        }
                    } else {
                        displayMessage(rolesMessageContainer, result.message, 'danger');
                    }
                } catch (error) {
                    console.error("roles_vehicles.js: Erreur lors de la mise à jour des rôles:", error);
                    displayMessage(rolesMessageContainer, "Une erreur inattendue est survenue lors de la mise à jour des rôles.", 'danger');
                }
            }
        });
    }

    // =====================================================================
    // GESTION DES VÉHICULES
    // =====================================================================

    // Initialisation de la date maximale (aujourd'hui) pour le champ de date d'immatriculation
    if (firstRegDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        firstRegDateInput.setAttribute('max', todayString);
    }

    // Écouteur pour la validation en temps réel de la date
    if (firstRegDateInput) {
        firstRegDateInput.addEventListener('change', () => {
            const errorMessage = validateFirstRegDate(firstRegDateInput.value);
            if (errorMessage) {
                displayMessage(vehicleMessageContainer, errorMessage, 'danger');
            } else {
                if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = ''; 
            }
        });
    }

    // Initialisation du sélecteur de pays au chargement
    if (countryDropdownMenu) {
        countryDropdownMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const countryCode = item.dataset.countryCode;
                const flagSrc = item.dataset.flagSrc;
                updateCountrySelection(countryCode, flagSrc);
            });
        });
        updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png'); // Initialiser avec la France par défaut
    }

    // Appel initial pour afficher les véhicules existants
    displayVehicles(userVehiclesData);
    // Appel pour charger et peupler les marques dans le formulaire d'ajout
    loadAndPopulateBrands();

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            if (vehicleFormContainer) vehicleFormContainer.classList.remove('d-none');
            if (addVehicleBtn) addVehicleBtn.classList.add('d-none');
            if (vehicleForm) vehicleForm.reset();
            updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png'); // Réinitialiser à FR
            if (firstRegDateInput) firstRegDateInput.value = '';
            if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = '';
        });
    }

    if (cancelVehicleBtn) {
        cancelVehicleBtn.addEventListener('click', () => {
            if (vehicleFormContainer) vehicleFormContainer.classList.add('d-none');
            if (addVehicleBtn) addVehicleBtn.classList.remove('d-none');
            if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = '';
        });
    }

    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                immatriculation: plateInput.value,
                paysImmatriculation: hiddenCountryCode.value,
                datePremiereImmatriculation: firstRegDateInput.value,
                marqueId: brandSelect.value,
                modele: document.getElementById('model').value,
                couleur: document.getElementById('color').value,
                nombreDePlaces: document.getElementById('seats').value,
                energie: vehicleForm.querySelector('input[name="engineType"]:checked')?.value || ''
            };
            
            const dateError = validateFirstRegDate(data.datePremiereImmatriculation);
            if (dateError) {
                return displayMessage(vehicleMessageContainer, dateError, 'danger');
            }

            if (!data.immatriculation) {
                return displayMessage(vehicleMessageContainer, 'Veuillez saisir une plaque d\'immatriculation.', 'danger');
            }
            if (!data.marqueId) {
                return displayMessage(vehicleMessageContainer, 'Veuillez sélectionner une marque.', 'danger');
            }
            if (!data.modele) {
                return displayMessage(vehicleMessageContainer, 'Veuillez saisir un modèle.', 'danger');
            }
            if (!data.couleur) {
                return displayMessage(vehicleMessageContainer, 'Veuillez sélectionner une couleur.', 'danger');
            }
            if (!data.nombreDePlaces || parseInt(data.nombreDePlaces) < 1) {
                return displayMessage(vehicleMessageContainer, 'Veuillez saisir un nombre de places valide (minimum 1).', 'danger');
            }
            if (!data.energie) {
                return displayMessage(vehicleMessageContainer, 'Veuillez sélectionner un type d\'énergie.', 'danger');
            }

            try {
                const response = await fetch('/mon-compte/add-vehicle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    displayMessage(vehicleMessageContainer, result.message, 'success');
                    if (vehicleForm) vehicleForm.reset();
                    if (vehicleFormContainer) vehicleFormContainer.classList.add('d-none');
                    if (addVehicleBtn) addVehicleBtn.classList.remove('d-none');
                    
                    const updatedVehiclesResponse = await fetch('/api/user-vehicles');
                    if (updatedVehiclesResponse.ok) {
                        const updatedVehicles = await updatedVehiclesResponse.json();
                        displayVehicles(updatedVehicles);
                    } else {
                        displayMessage(vehicleMessageContainer, "Véhicule ajouté, mais erreur lors du rafraîchissement de la liste.", 'warning');
                    }
                } else {
                    displayMessage(vehicleMessageContainer, result.message, 'danger');
                }
            } catch (error) {
                console.error("roles_vehicles.js: Erreur lors de l'ajout du véhicule:", error);
                displayMessage(vehicleMessageContainer, "Une erreur client est survenue lors de l'ajout du véhicule.", 'danger');
            }
        });
    }

    // =====================================================================
    // GESTION DES PRÉFÉRENCES
    // =====================================================================
    
    // userPreferences est initialisé via le span dans initializeRolesAndVehicles

    if (prefSmoker) prefSmoker.checked = userPreferences.fumeurs_acceptes;
    if (prefAnimal) prefAnimal.checked = userPreferences.animaux_acceptes;

    // Affiche les préférences personnalisées initiales
    if (customPrefList && userPreferences.personnalisees && Array.isArray(userPreferences.personnalisees)) {
        userPreferences.personnalisees.forEach(prefText => {
            const newTag = createPrefTag(prefText);
            customPrefList.appendChild(newTag);
        });
    }

    if (addCustomPrefBtn) {
        addCustomPrefBtn.addEventListener('click', () => {
            const value = customPrefInput.value.trim();
            if (value === '') {
                displayMessage(preferencesMessageContainer, 'Veuillez saisir une préférence.', 'warning');
                return;
            }
            // Vérifie si la préférence existe déjà (case-insensitive)
            const existing = Array.from(customPrefList.children).some(
                (child) => child.firstChild && child.firstChild.textContent.toLowerCase() === value.toLowerCase()
            );
            if (existing) {
                displayMessage(preferencesMessageContainer, 'Cette préférence est déjà ajoutée.', 'warning');
                return;
            }
            const newTag = createPrefTag(value);
            customPrefList.appendChild(newTag);
            customPrefInput.value = ''; // Vide l'input après ajout
            displayMessage(preferencesMessageContainer, 'Préférence ajoutée, n\'oubliez pas d\'enregistrer !', 'info');
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // S'assure que l'événement est déclenché par le bouton "Enregistrer les préférences"
            if (e.submitter && e.submitter.id === 'savePreferencesBtn') {
                const preferencesToSave = {
                    fumeursAcceptes: prefSmoker ? prefSmoker.checked : false,
                    animauxAcceptes: prefAnimal ? prefAnimal.checked : false,
                    preferencesPersonnalisees: []
                };
                // Récupère toutes les préférences personnalisées affichées
                if (customPrefList) {
                    Array.from(customPrefList.children).forEach(tag => {
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
                        displayMessage(preferencesMessageContainer, result.message, 'success');
                        userPreferences = preferencesToSave; 
                    } else {
                        displayMessage(preferencesMessageContainer, result.message, 'danger');
                    }
                } catch (error) {
                    console.error('roles_vehicles.js: Erreur lors de la sauvegarde des préférences:', error);
                    displayMessage(preferencesMessageContainer, "Une erreur inattendue est survenue lors de la sauvegarde des préférences.", 'danger');
                }
            }
        });
    }
};

// On écoute à la fois le chargement initial (pour la première visite) et les navigations Turbo (pour les navigations SPA)
document.addEventListener('DOMContentLoaded', initializeRolesAndVehicles);
document.addEventListener('turbo:load', initializeRolesAndVehicles);