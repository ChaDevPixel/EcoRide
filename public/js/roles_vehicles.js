// On encapsule toute la logique dans une fonction pour la rendre compatible avec Turbo
const initializeRolesAndVehicles = () => {
    console.log("roles_vehicles.js: Initialisation du script pour les rôles et véhicules...");

    // =====================================================================
    // FONCTIONS UTILITAIRES
    // =====================================================================
    /**
     * Affiche un message temporaire dans un conteneur spécifié.
     * @param {string|HTMLElement} container L'ID du conteneur ou l'élément HTML lui-même.
     * @param {string} message Le message à afficher.
     * @param {'success'|'danger'|'warning'|'info'} type Le type d'alerte Bootstrap.
     */
    function displayMessage(container, message, type) {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) {
            console.error(`roles_vehicles.js: Conteneur de message "${container}" introuvable.`);
            return;
        }
        // Nettoie les messages précédents pour éviter l'accumulation
        targetContainer.innerHTML = ''; 
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.appendChild(alertDiv);
        // Disparition automatique après 5 secondes
        setTimeout(() => {
            if (alertDiv) {
                alertDiv.classList.remove('show');
                alertDiv.classList.add('fade');
                // Supprime l'élément après la transition de fade-out
                alertDiv.addEventListener('transitionend', () => alertDiv.remove());
            }
        }, 5000);
    }

    // =====================================================================
    // GESTION DES RÔLES (Passager / Chauffeur)
    // =====================================================================
    const rolePassenger = document.getElementById('rolePassenger');
    const roleDriver = document.getElementById('roleDriver');
    const driverDetails = document.getElementById('driverDetails');
    const editRolesBtn = document.getElementById('editRolesBtn');
    const rolesMessageContainer = document.getElementById('rolesMessageContainer');

    let userRoles = [];
    const userRolesDataElement = document.getElementById('user-roles-data');
    if (userRolesDataElement) {
        const rawData = userRolesDataElement.textContent.trim();
        console.log("roles_vehicles.js: Rôles bruts (user-roles-data):", rawData);
        if (rawData !== '') {
            try {
                userRoles = JSON.parse(rawData);
                console.log("roles_vehicles.js: Rôles parsés:", userRoles);
            } catch (e) {
                console.error("roles_vehicles.js: Erreur parsing des rôles:", e);
                if (rolesMessageContainer) displayMessage(rolesMessageContainer, "Erreur au chargement des rôles.", 'danger');
            }
        } else {
            console.log("roles_vehicles.js: user-roles-data est vide.");
        }
    } else {
        console.warn("roles_vehicles.js: Élément 'user-roles-data' non trouvé.");
    }

    const isDriver = userRoles.includes('ROLE_DRIVER');
    if (rolePassenger) rolePassenger.checked = userRoles.includes('ROLE_PASSENGER');
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
                        setTimeout(() => location.reload(), 1500); 
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
    const addVehicleBtn = document.getElementById('addVehicleBtn');
    const vehicleFormContainer = document.getElementById('vehicleFormContainer');
    const vehicleForm = document.getElementById('vehicleForm');
    const cancelVehicleBtn = document.getElementById('cancelVehicleBtn');
    const vehiclesContainer = document.getElementById('vehiclesContainer');
    const vehicleMessageContainer = document.getElementById('vehicleMessageContainer');
    const brandSelect = document.getElementById('brandSelect');

    // NOUVEAU: Éléments pour le sélecteur de pays et la plaque
    const countryDropdownButton = document.getElementById('countryDropdownButton');
    const countryDropdownMenu = document.getElementById('countryDropdownMenu');
    const selectedFlag = document.getElementById('selectedFlag');
    const selectedCountryCodeSpan = document.getElementById('selectedCountryCode');
    const plateInput = document.getElementById('plateInput');
    const hiddenCountryCode = document.getElementById('hiddenCountryCode');
    const firstRegDateInput = document.getElementById('firstRegDate'); // Pour la validation de date

    // Initialisation de la date maximale (aujourd'hui) pour le champ de date d'immatriculation
    if (firstRegDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;
        firstRegDateInput.setAttribute('max', todayString);
    }

    // Fonction de validation de la date de première immatriculation
    function validateFirstRegDate(dateString) {
        if (!dateString) {
            return "La date de première immatriculation est requise.";
        }
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Comparer juste la date, pas l'heure
        
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100); // 100 ans avant aujourd'hui
        minDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return "La date de première immatriculation ne peut pas être dans le futur.";
        }
        if (selectedDate < minDate) {
            return "La date de première immatriculation ne peut pas être antérieure à 100 ans.";
        }
        return null; // Date valide
    }

    // Écouteur pour la validation en temps réel de la date
    if (firstRegDateInput) {
        firstRegDateInput.addEventListener('change', () => {
            const errorMessage = validateFirstRegDate(firstRegDateInput.value);
            if (errorMessage) {
                displayMessage(vehicleMessageContainer, errorMessage, 'danger');
            } else {
                // Effacer le message d'erreur si la date devient valide
                if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = ''; 
            }
        });
    }

    let userVehiclesData = [];
    const userVehiclesDataElementVehicles = document.getElementById('user-vehicles-data');
    if (userVehiclesDataElementVehicles) {
        const rawData = userVehiclesDataElementVehicles.textContent.trim();
        console.log("roles_vehicles.js: Véhicules bruts (user-vehicles-data):", rawData);
        if (rawData !== '') {
            try {
                userVehiclesData = JSON.parse(rawData);
                console.log("roles_vehicles.js: Véhicules parsés:", userVehiclesData);
            } catch (e) {
                console.error("roles_vehicles.js: Erreur parsing des véhicules:", e);
                if (vehicleMessageContainer) displayMessage(vehicleMessageContainer, "Erreur au chargement des véhicules.", 'danger');
            }
        } else {
            console.log("roles_vehicles.js: user-vehicles-data est vide.");
            if (vehiclesContainer) vehiclesContainer.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
        }
    } else {
        console.warn("roles_vehicles.js: Élément 'user-vehicles-data' non trouvé.");
        if (vehiclesContainer) vehiclesContainer.innerHTML = '<p class="text-muted">Problème de chargement des données des véhicules.</p>';
    }

    /**
     * Affiche les véhicules dans le conteneur.
     * @param {Array} vehicles Tableau d'objets véhicule.
     */
    function displayVehicles(vehicles) {
        console.log("roles_vehicles.js: Affichage des véhicules. Nombre:", vehicles ? vehicles.length : 0);
        if (!vehiclesContainer) return;
        vehiclesContainer.innerHTML = ''; // Vide le conteneur avant d'ajouter les véhicules
        if (!vehicles || vehicles.length === 0) {
            vehiclesContainer.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
            return;
        }
        const energieMap = { 'electric': 'Électrique', 'hybrid': 'Hybride', 'thermal': 'Thermique' };
        vehicles.forEach(vehicle => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-12 mb-3'; // Chaque véhicule prend toute la largeur
            const vehicleDiv = document.createElement('div');
            vehicleDiv.className = 'd-flex align-items-center px-3 py-2 rounded border h-100';
            
            const carIcon = document.createElement('i');
            carIcon.className = `bi bi-car-front-fill fs-5 me-2`;
            carIcon.style.color = vehicle.couleur || 'currentColor'; // Utilise la couleur du véhicule

            const mainInfoSpan = document.createElement('span');
            mainInfoSpan.className = 'mb-0 flex-grow-1 text-sm';
            
            const energieText = energieMap[vehicle.energie] || vehicle.energie;
            // CORRECTION ICI : Utilise vehicle.marque.libelle au lieu de vehicle.marque.nom
            const marqueLibelle = vehicle.marque && vehicle.marque.libelle ? vehicle.marque.libelle : 'N/A';
            const modeleText = vehicle.modele || 'N/A';
            
            const countryCodeForFlag = vehicle.paysImmatriculation ? vehicle.paysImmatriculation.toLowerCase() : '';
            const countryFlag = countryCodeForFlag ? `<img src="https://flagcdn.com/w20/${countryCodeForFlag}.png" alt="${vehicle.paysImmatriculation}" class="flag-icon me-1">` : '';
            const immatriculationText = vehicle.immatriculation || 'N/A';

            // NOUVEAU LOG POUR DÉBOGUER LE "N/A"
            console.log(`roles_vehicles.js: Véhicule ${vehicle.id} - Marque affichée: "${marqueLibelle}" (Modele: "${modeleText}")`);

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
            vehiclesContainer.appendChild(colDiv);
        });
    }
    
    /**
     * Charge les marques depuis l'API et remplit le sélecteur.
     */
    async function loadAndPopulateBrands() {
        console.log("roles_vehicles.js: Chargement et peuplement des marques...");
        if (!brandSelect) {
            console.warn("roles_vehicles.js: Élément 'brandSelect' non trouvé pour charger les marques.");
            return;
        }
        try {
            const response = await fetch('/api/marques');
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }
            const marques = await response.json();
            console.log("roles_vehicles.js: Marques chargées:", marques);
            brandSelect.innerHTML = '<option selected disabled value="">Choisir une marque</option>';
            marques.forEach(marque => {
                const option = document.createElement('option');
                option.value = marque.id;
                option.textContent = marque.nom; // 'nom' est la clé pour le libellé de la marque
                brandSelect.appendChild(option);
            });
        } catch (error) {
            console.error("roles_vehicles.js: Échec du chargement des marques:", error);
            brandSelect.innerHTML = '<option selected disabled value="">Erreur de chargement</option>';
            if (vehicleMessageContainer) displayMessage(vehicleMessageContainer, 'Impossible de charger la liste des marques.', 'danger');
        }
    }

    // NOUVEAU: Logique pour le sélecteur de pays et le masque de plaque
    const countryPlateMasks = {
        'FR': 'AA-999-AA',
        'DE': 'A-9999-AA', 
        'BE': '9-AAA-999',
        'LU': 'AA-9999',
        'CH': 'AA-999999',
        'IT': 'AA999AA',
        'ES': '9999-AAA',
        // Ajoutez d'autres pays et masques si nécessaire
    };

    /**
     * Met à jour le drapeau et le masque de la plaque d'immatriculation.
     * @param {string} countryCode Le code pays (ex: 'FR').
     * @param {string} flagSrc L'URL de l'image du drapeau.
     */
    function updateCountrySelection(countryCode, flagSrc) {
        console.log(`roles_vehicles.js: Mise à jour du pays sélectionné: ${countryCode}`);
        if (selectedFlag) selectedFlag.src = flagSrc;
        if (selectedCountryCodeSpan) selectedCountryCodeSpan.textContent = countryCode;
        if (hiddenCountryCode) hiddenCountryCode.value = countryCode; // Met à jour l'input caché
        
        // Applique le masque de la plaque d'immatriculation
        if (plateInput) {
            plateInput.value = ''; // Réinitialise la plaque
            const mask = countryPlateMasks[countryCode] || ''; // Récupère le masque
            plateInput.placeholder = mask; // Affiche le masque comme placeholder
            plateInput.dataset.mask = mask; // Stocke le masque dans un data attribute
            
            // Supprime l'ancien écouteur si existant
            if (plateInput._maskListener) {
                plateInput.removeEventListener('input', plateInput._maskListener);
            }

            // Ajoute un nouvel écouteur pour le masquage
            const applyMask = (event) => {
                let value = event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); // Nettoie l'entrée
                let maskedValue = '';
                let maskIndex = 0;
                let valueIndex = 0;

                while (maskIndex < mask.length && valueIndex < value.length) {
                    if (mask[maskIndex] === 'A') { // Lettre
                        if (/[A-Z]/.test(value[valueIndex])) {
                            maskedValue += value[valueIndex];
                            valueIndex++;
                        }
                        maskIndex++;
                    } else if (mask[maskIndex] === '9') { // Chiffre
                        if (/[0-9]/.test(value[valueIndex])) {
                            maskedValue += value[valueIndex];
                            valueIndex++;
                        }
                        maskIndex++;
                    } else if (mask[maskIndex] === '-') { // Trait d'union
                        maskedValue += '-';
                        maskIndex++;
                        if (value[valueIndex] === '-') { // Si l'utilisateur tape le trait d'union
                            valueIndex++;
                        }
                    } else { // Caractère fixe dans le masque (ex: espace)
                        maskedValue += mask[maskIndex];
                        maskIndex++;
                    }
                }
                event.target.value = maskedValue;
            };
            plateInput.addEventListener('input', applyMask);
            plateInput._maskListener = applyMask; // Stocke la référence de l'écouteur
        }
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
        // Initialiser avec la France par défaut si rien n'est sélectionné
        updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png');
    }

    // Appel initial pour afficher les véhicules existants
    displayVehicles(userVehiclesData);
    // Appel pour charger et peupler les marques dans le formulaire d'ajout
    loadAndPopulateBrands();

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => {
            if (vehicleFormContainer) vehicleFormContainer.classList.remove('d-none');
            addVehicleBtn.classList.add('d-none');
            if (vehicleForm) vehicleForm.reset();
            // Réinitialiser la sélection de pays et la date lors de l'ouverture du formulaire
            updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png');
            if (firstRegDateInput) firstRegDateInput.value = '';
            // Effacer les messages d'erreur précédents
            if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = '';
        });
    }

    if (cancelVehicleBtn) {
        cancelVehicleBtn.addEventListener('click', () => {
            if (vehicleFormContainer) vehicleFormContainer.classList.add('d-none');
            if (addVehicleBtn) addVehicleBtn.classList.remove('d-none');
            // Effacer les messages d'erreur lors de l'annulation
            if (vehicleMessageContainer) vehicleMessageContainer.innerHTML = '';
        });
    }

    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(vehicleForm);
            const data = Object.fromEntries(formData.entries());
            
            // Récupérer la valeur de l'input caché pour le pays
            data.paysImmatriculation = hiddenCountryCode ? hiddenCountryCode.value : 'FR';
            // Récupérer la date de première immatriculation
            data.datePremiereImmatriculation = firstRegDateInput ? firstRegDateInput.value : '';

            // Validation côté client pour la date
            const dateError = validateFirstRegDate(data.datePremiereImmatriculation);
            if (dateError) {
                displayMessage(vehicleMessageContainer, dateError, 'danger');
                return;
            }

            // Validations des champs obligatoires
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
                    
                    // Recharger la liste des véhicules après un ajout réussi
                    const updatedVehiclesResponse = await fetch('/api/user-vehicles');
                    if (updatedVehiclesResponse.ok) {
                        const updatedVehicles = await updatedVehiclesResponse.json();
                        displayVehicles(updatedVehicles);
                    } else {
                        console.error("roles_vehicles.js: Erreur lors du rechargement des véhicules après ajout.");
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
    const customPrefInput = document.getElementById('customPrefInput');
    const addCustomPrefBtn = document.getElementById('addCustomPrefBtn');
    const customPrefList = document.getElementById('customPrefList');
    const prefSmoker = document.getElementById('prefSmoker');
    const prefAnimal = document.getElementById('prefAnimal');
    const profileForm = document.getElementById('profileForm');
    const preferencesMessageContainer = document.getElementById('preferencesMessageContainer');

    let userPreferences = {
        fumeurs_acceptes: false,
        animaux_acceptes: false,
        personnalisees: []
    };
    const userPreferencesDataElement = document.getElementById('user-preferences-data');
    if (userPreferencesDataElement) {
        const rawData = userPreferencesDataElement.textContent.trim();
        console.log("roles_vehicles.js: Préférences brutes (user-preferences-data):", rawData);
        if (rawData !== '') {
            try {
                const parsedData = JSON.parse(rawData);
                userPreferences = Object.assign(userPreferences, parsedData); 
                console.log("roles_vehicles.js: Préférences parsées:", userPreferences);
            } catch (e) {
                console.error("roles_vehicles.js: Erreur lors du parsing des préférences de l'utilisateur:", e);
                if(preferencesMessageContainer) displayMessage(preferencesMessageContainer, "Erreur au chargement des préférences.", 'danger');
            }
        } else {
            console.log("roles_vehicles.js: user-preferences-data est vide.");
        }
    } else {
        console.warn("roles_vehicles.js: Élément 'user-preferences-data' non trouvé.");
    }

    if (prefSmoker) prefSmoker.checked = userPreferences.fumeurs_acceptes;
    if (prefAnimal) prefAnimal.checked = userPreferences.animaux_acceptes;

    // Affiche les préférences personnalisées initiales
    if (customPrefList && userPreferences.personnalisees && Array.isArray(userPreferences.personnalisees)) {
        userPreferences.personnalisees.forEach(prefText => {
            const newTag = createPrefTag(prefText);
            customPrefList.appendChild(newTag);
        });
    }

    /**
     * Crée un tag de préférence personnalisée.
     * @param {string} text Le texte de la préférence.
     * @returns {HTMLElement} L'élément div du tag.
     */
    function createPrefTag(text) {
        const tag = document.createElement('div');
        tag.className = 'badge bg-dark d-flex align-items-center gap-2';
        const span = document.createElement('span');
        span.textContent = text;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-close btn-close-white btn-sm';
        btn.setAttribute('aria-label', 'Supprimer la préférence');
        btn.addEventListener('click', () => {
            if (customPrefList) customPrefList.removeChild(tag);
            displayMessage(preferencesMessageContainer, 'Préférence supprimée, n\'oubliez pas d\'enregistrer !', 'info');
        });
        tag.appendChild(span);
        tag.appendChild(btn);
        return tag;
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
// Si Turbo n'est pas utilisé, seul DOMContentLoaded est nécessaire.
document.addEventListener('DOMContentLoaded', initializeRolesAndVehicles);
document.addEventListener('turbo:load', initializeRolesAndVehicles);

// Message d'exécution immédiate pour le débogage initial
console.log("roles_vehicles.js: Fichier JavaScript chargé et exécuté au niveau racine.");