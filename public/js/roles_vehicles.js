// public/js/roles_vehicles.js

// Ce script gère les interactions sur la page "Mon Compte" pour les sections :
// - Rôles (Passager/Chauffeur)
// - Préférences (Fumeurs, Animaux, Personnalisées)
// - Véhicules (Ajout, affichage, gestion des plaques)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Script roles_vehicles.js chargé.');

    // =====================================================================
    // FONCTIONS UTILITAIRES (Dupliquées pour l'indépendance des fichiers JS)
    // =====================================================================

    /**
     * Affiche un message d'alerte (succès/erreur/info) dans un conteneur spécifié.
     * @param {string|HTMLElement} container L'ID du conteneur ou l'élément HTML où afficher le message.
     * @param {string} message Le texte du message à afficher.
     * @param {string} type Le type d'alerte (par exemple, 'success', 'danger', 'info', 'warning').
     */
    function displayMessage(container, message, type) {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) {
            console.error(`Conteneur de message "${container}" introuvable.`);
            return;
        }
        targetContainer.innerHTML = ''; // Efface les messages précédents
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        targetContainer.appendChild(alertDiv);

        // Fait disparaître le message après 5 secondes
        setTimeout(() => {
            alertDiv.classList.remove('show');
            alertDiv.classList.add('fade');
            // Supprime l'élément du DOM après la fin de l'animation de fondu
            alertDiv.addEventListener('transitionend', () => alertDiv.remove());
        }, 5000);
    }

    /**
     * Formate une date au format YYYY-MM-DD.
     * @param {Date} date L'objet Date à formater.
     * @returns {string} La date formatée.
     */
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // =====================================================================
    // GESTION DES RÔLES (Passager / Chauffeur)
    // =====================================================================
    const rolePassenger = document.getElementById('rolePassenger');
    const roleDriver = document.getElementById('roleDriver');
    const driverDetails = document.getElementById('driverDetails');
    const preferencesCard = document.getElementById('preferencesCard'); // Assurez-vous que cette carte existe dans HTML
    const editRolesBtn = document.getElementById('editRolesBtn');
    const rolesMessageContainer = document.getElementById('rolesMessageContainer');

    let userRoles = [];
    const userRolesDataElement = document.getElementById('user-roles-data');
    if (userRolesDataElement && userRolesDataElement.textContent.trim() !== '') {
        try {
            userRoles = JSON.parse(userRolesDataElement.textContent);
        } catch (e) {
            console.error("Erreur lors du parsing des rôles de l'utilisateur:", e);
            displayMessage(rolesMessageContainer, "Erreur au chargement des rôles. Veuillez recharger la page.", 'danger');
        }
    }

    const isPassenger = userRoles.includes('ROLE_PASSENGER');
    const isDriver = userRoles.includes('ROLE_DRIVER');

    if (rolePassenger) rolePassenger.checked = isPassenger;
    if (roleDriver) roleDriver.checked = isDriver;

    if (rolePassenger) rolePassenger.disabled = true;
    if (roleDriver) roleDriver.disabled = true;

    // Afficher/masquer la section des véhicules et préférences en fonction du rôle de chauffeur
    if (driverDetails) driverDetails.style.display = isDriver ? 'block' : 'none';
    // if (preferencesCard) preferencesCard.style.display = isDriver ? 'block' : 'none'; // Les préférences sont toujours visibles, même pour passager

    if (editRolesBtn) editRolesBtn.textContent = 'Modifier';

    if (editRolesBtn) {
        editRolesBtn.addEventListener('click', async () => {
            if (editRolesBtn.textContent === 'Modifier') {
                if (rolePassenger) rolePassenger.disabled = false;
                if (roleDriver) roleDriver.disabled = false;

                // On ne masque plus les détails du chauffeur lors de la modification des rôles
                // car les préférences sont maintenant toujours visibles.
                // if (driverDetails) driverDetails.style.display = 'none'; 
                // if (preferencesCard) preferencesCard.style.display = 'none';

                editRolesBtn.textContent = 'Appliquer';
            } else {
                if (!rolePassenger || (!rolePassenger.checked && (!roleDriver || !roleDriver.checked))) {
                    displayMessage(rolesMessageContainer, "Au moins un rôle (Passager ou Chauffeur) doit être sélectionné.", 'danger');
                    return;
                }

                const data = {
                    isPassengerChecked: rolePassenger ? rolePassenger.checked : false,
                    isDriverChecked: roleDriver ? roleDriver.checked : false
                };

                try {
                    const response = await fetch('/mon-compte/update-roles', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();

                    if (result.success) {
                        displayMessage(rolesMessageContainer, result.message, 'success');
                        location.reload(); // Recharger pour mettre à jour les sections visibles
                    } else {
                        displayMessage(rolesMessageContainer, result.message, 'danger');
                        if (rolePassenger) rolePassenger.disabled = false;
                        if (roleDriver) roleDriver.disabled = false;
                        editRolesBtn.textContent = 'Appliquer';
                    }
                } catch (error) {
                    console.error('Erreur lors de la requête AJAX de mise à jour des rôles:', error);
                    displayMessage(rolesMessageContainer, "Une erreur inattendue est survenue lors de la mise à jour des rôles.", 'danger');
                    if (rolePassenger) rolePassenger.disabled = false;
                    if (roleDriver) roleDriver.disabled = false;
                    editRolesBtn.textContent = 'Appliquer';
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
    const modelInput = document.getElementById('model');
    const firstRegDateInput = document.getElementById('firstRegDate');
    const colorInput = document.getElementById('color');

    const plateInput = document.getElementById('plateInput');
    const countryDropdownButton = document.getElementById('countryDropdownButton');
    const countryDropdownMenu = document.getElementById('countryDropdownMenu');
    const selectedFlag = document.getElementById('selectedFlag');
    const hiddenCountryCode = document.getElementById('hiddenCountryCode');

    const plateFormats = {
        'FR': { placeholder: 'AA-123-BB', pattern: /^[A-Z]{2}-\d{3}-[A-Z]{2}$/ },
        'DE': { placeholder: 'AAA-B-1234', pattern: /^[A-Z]{1,3}-[A-Z]{1,2} \d{1,4}$/ },
        'BE': { placeholder: '1-ABC-123', pattern: /^\d-[A-Z]{3}-\d{3}$/ },
        'LU': { placeholder: 'AB1234', pattern: /^[A-Z]{1,2}\d{4}$|^\d{5}$/ },
        'CH': { placeholder: 'ZH 123456', pattern: /^[A-Z]{2} \d{1,6}$/ },
        'IT': { placeholder: 'AA 123 BB', pattern: /^[A-Z]{2} \d{3} [A-Z]{2}$/ },
        'ES': { placeholder: '1234 ABC', pattern: /^\d{4} [A-Z]{3}$/ }
    };

    let userVehiclesData = []; // Déclaré ici pour être accessible dans ce fichier JS

    function updatePlateInputDisplay(countryCode, flagSrc, placeholder) {
        if (!plateInput || !selectedFlag || !hiddenCountryCode) return;

        selectedFlag.src = flagSrc;
        selectedFlag.classList.remove('d-none');
        plateInput.placeholder = placeholder;
        plateInput.disabled = false;
        plateInput.value = '';
        hiddenCountryCode.value = countryCode;
        plateInput.focus();
    }

    function formatPlateInput(e) {
        const input = e.target;
        let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

        const countryCode = hiddenCountryCode ? hiddenCountryCode.value : 'FR';
        let formattedValue = value;

        switch (countryCode) {
            case 'FR':
                if (value.length > 2) formattedValue = value.substring(0, 2) + '-' + value.substring(2);
                if (value.length > 5) formattedValue = formattedValue.substring(0, 6) + '-' + formattedValue.substring(6);
                formattedValue = formattedValue.substring(0, 9);
                break;
            case 'DE':
                let cityCode = '';
                let distLetters = '';
                let numbers = '';
                let tempValue = value;

                const cityMatch = tempValue.match(/^([A-Z]{1,3})/);
                if (cityMatch) {
                    cityCode = cityMatch[1];
                    tempValue = tempValue.substring(cityCode.length);
                }

                const distMatch = tempValue.match(/^([A-Z]{1,2})/);
                if (distMatch) {
                    distLetters = distMatch[1];
                    tempValue = tempValue.substring(distLetters.length);
                }

                numbers = tempValue.match(/^(\d{1,4})/)?.[1] || '';

                formattedValue = cityCode;
                if (distLetters || numbers) {
                    formattedValue += '-';
                }
                formattedValue += distLetters;
                if (numbers) {
                    formattedValue += ' ';
                }
                formattedValue += numbers;

                formattedValue = formattedValue.substring(0, 11);
                break;
            case 'BE':
                if (value.length > 1) formattedValue = value.substring(0, 1) + '-' + value.substring(1);
                if (value.length > 5) formattedValue = formattedValue.substring(0, 6) + '-' + formattedValue.substring(6);
                formattedValue = formattedValue.substring(0, 10);
                break;
            case 'LU':
                formattedValue = value.substring(0, 6);
                break;
            case 'CH':
                if (value.length > 2) formattedValue = value.substring(0, 2) + ' ' + value.substring(2);
                formattedValue = formattedValue.substring(0, 9);
                break;
            case 'IT':
                if (value.length > 2) formattedValue = value.substring(0, 2) + ' ' + value.substring(2);
                if (value.length > 6) formattedValue = formattedValue.substring(0, 6) + ' ' + formattedValue.substring(6);
                formattedValue = formattedValue.substring(0, 10);
                break;
            case 'ES':
                if (value.length > 4) formattedValue = value.substring(0, 4) + ' ' + value.substring(4);
                formattedValue = formattedValue.substring(0, 8);
                break;
            default:
                formattedValue = value;
                break;
        }
        input.value = formattedValue;
    }

    const userVehiclesDataElement = document.getElementById('user-vehicles-data');
    if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim() !== '') {
        try {
            userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
        } catch (e) {
            console.error("Erreur lors du parsing des données véhicules:", e);
            displayMessage(vehicleMessageContainer, "Erreur au chargement des véhicules. Veuillez recharger la page.", 'danger');
            userVehiclesData = [];
        }
    }

    /**
     * Affiche la liste des véhicules de l'utilisateur.
     * @param {Array<Object>} vehicles Tableau d'objets véhicule.
     */
    function displayVehicles(vehicles) {
        if (vehiclesContainer) {
            vehiclesContainer.innerHTML = '';
            if (vehicles.length === 0) {
                vehiclesContainer.innerHTML = '<p class="text-muted">Aucun véhicule enregistré pour le moment.</p>';
                return;
            }

            const energieMap = {
                'electric': 'Électrique',
                'hybrid': 'Hybride',
                'thermal': 'Thermique'
            };

            vehicles.forEach(vehicle => {
                const colDiv = document.createElement('div');
                colDiv.classList.add('col-12', 'mb-3');

                const vehicleDiv = document.createElement('div');
                vehicleDiv.classList.add('d-flex', 'align-items-center', 'px-3', 'py-2', 'rounded', 'border', 'h-100', 'vehicle-card-responsive-width');

                const carIcon = document.createElement('i');
                carIcon.className = `bi bi-car-front-fill fs-5 me-2`;
                carIcon.style.color = vehicle.couleur || 'currentColor';

                const mainInfoSpan = document.createElement('span');
                mainInfoSpan.classList.add('mb-0', 'flex-grow-1', 'text-sm');
                
                const energieText = energieMap[vehicle.energie] || vehicle.energie;

                const marqueLibelle = vehicle.marque && vehicle.marque.libelle ? vehicle.marque.libelle : 'Marque inconnue';
                const modeleText = vehicle.modele || 'Modèle inconnu';
                
                const countryCodeForFlag = vehicle.paysImmatriculation ? vehicle.paysImmatriculation.toLowerCase() : '';
                const countryFlag = countryCodeForFlag ? `<img src="https://flagcdn.com/w20/${countryCodeForFlag}.png" alt="${vehicle.paysImmatriculation}" class="flag-icon me-1">` : '';
                const immatriculationText = vehicle.immatriculation || 'N/A';
                
                mainInfoSpan.innerHTML = `${countryFlag} ${energieText} - ${immatriculationText} - ${marqueLibelle} ${modeleText}`;

                const seatsSpan = document.createElement('span');
                seatsSpan.classList.add('fw-bold', 'ms-auto', 'text-sm');
                
                let leafIconHtml = '';
                if (vehicle.energie === 'electric' || vehicle.energie === 'hybrid') {
                    leafIconHtml = `<i class="bi bi-leaf-fill text-primary me-1"></i>`;
                }
                seatsSpan.innerHTML = `${leafIconHtml}${vehicle.nombreDePlaces} places`;

                vehicleDiv.appendChild(carIcon);
                vehicleDiv.appendChild(mainInfoSpan);
                vehicleDiv.appendChild(seatsSpan);

                colDiv.appendChild(vehicleDiv);
                vehiclesContainer.appendChild(colDiv);
            });
        }
    }

    /**
     * Charge les marques de véhicules depuis l'API et remplit le select.
     */
    async function loadBrandsIntoSelect() {
        if (!brandSelect) return;
        try {
            const response = await fetch('/api/marques');
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des marques.');
            }
            let brands = await response.json();

            brands.sort((a, b) => a.libelle.localeCompare(b.libelle));

            brandSelect.innerHTML = '<option value="">Sélectionnez une marque</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand.id;
                option.textContent = brand.libelle;
                brandSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur lors du chargement des marques:', error);
            displayMessage(vehicleMessageContainer, 'Impossible de charger les marques de véhicules.', 'danger');
        }
    }

    // Initialisation au chargement de la page: Définit la France comme défaut
    const defaultCountryCode = 'FR';
    const defaultFlagSrc = 'https://flagcdn.com/w20/fr.png';
    const defaultPlaceholder = plateFormats[defaultCountryCode].placeholder;
    updatePlateInputDisplay(defaultCountryCode, defaultFlagSrc, defaultPlaceholder);

    // Appels initiaux pour les véhicules
    displayVehicles(userVehiclesData);
    loadBrandsIntoSelect();

    const today = new Date();
    const todayString = formatDate(today);
    if (firstRegDateInput) {
        firstRegDateInput.setAttribute('max', todayString);
    }

    function validateFirstRegDate(dateString) {
        if (!dateString) {
            return 'La date de première immatriculation est obligatoire.';
        }

        const selectedDate = new Date(dateString);
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 100);

        selectedDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        minDate.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            return 'La date de première immatriculation ne peut pas être dans le futur.';
        }
        if (selectedDate < minDate) {
            return 'La date de première immatriculation ne peut pas être antérieure à 100 ans.';
        }
        return null;
    }

    if (firstRegDateInput) {
        firstRegDateInput.addEventListener('change', () => {
            const errorMessage = validateFirstRegDate(firstRegDateInput.value);
            if (errorMessage) {
                displayMessage(vehicleMessageContainer, errorMessage, 'danger');
            } else {
                if (vehicleMessageContainer.querySelector('.alert-danger')) {
                    vehicleMessageContainer.innerHTML = '';
                }
            }
        });
    }

    if (plateInput) {
        plateInput.addEventListener('input', formatPlateInput);
    }

    if (countryDropdownMenu) {
        countryDropdownMenu.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.dropdown-item');
            if (target) {
                const countryCode = target.dataset.countryCode;
                const flagSrc = target.dataset.flagSrc;
                const format = plateFormats[countryCode];
                if (format) {
                    updatePlateInputDisplay(countryCode, flagSrc, format.placeholder);
                }
            }
        });
    }

    if (addVehicleBtn && vehicleFormContainer) {
        addVehicleBtn.addEventListener('click', () => {
            vehicleFormContainer.classList.remove('d-none');
            addVehicleBtn.classList.add('d-none');
            if (vehicleForm) vehicleForm.reset();
            if (brandSelect) brandSelect.value = "";
            if (modelInput) modelInput.value = "";
            if (colorInput) colorInput.value = "";
            updatePlateInputDisplay(defaultCountryCode, defaultFlagSrc, defaultPlaceholder);
            if (firstRegDateInput) {
                firstRegDateInput.setAttribute('max', todayString);
                firstRegDateInput.value = '';
            }
        });
    }

    if (cancelVehicleBtn && vehicleFormContainer && addVehicleBtn) {
        cancelVehicleBtn.addEventListener('click', () => {
            if (vehicleForm) vehicleForm.reset();
            vehicleFormContainer.classList.add('d-none');
            addVehicleBtn.classList.remove('d-none');
            if (brandSelect) brandSelect.value = "";
            if (modelInput) modelInput.value = "";
            if (colorInput) colorInput.value = "";
            updatePlateInputDisplay(defaultCountryCode, defaultFlagSrc, defaultPlaceholder);
            if (firstRegDateInput) {
                firstRegDateInput.setAttribute('max', todayString);
                firstRegDateInput.value = '';
            }
        });
    }

    if (vehicleForm && brandSelect && hiddenCountryCode && plateInput && firstRegDateInput && modelInput && colorInput) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const paysImmatriculation = hiddenCountryCode.value;
            const immatriculation = plateInput.value.trim();
            const datePremiereImmatriculation = firstRegDateInput.value;
            const marqueId = brandSelect.value;
            const modele = modelInput.value.trim();
            const couleur = colorInput.value;
            const nombreDePlaces = document.getElementById('seats').value;
            const energie = vehicleForm.engineType.value;

            if (!paysImmatriculation) {
                displayMessage(vehicleMessageContainer, 'Veuillez sélectionner le pays d\'immatriculation.', 'danger');
                return;
            }
            if (!immatriculation) {
                displayMessage(vehicleMessageContainer, 'Veuillez saisir la plaque d\'immatriculation.', 'danger');
                return;
            }
            const format = plateFormats[paysImmatriculation];
            if (format && !format.pattern.test(immatriculation)) {
                displayMessage(vehicleMessageContainer, `Le format de la plaque pour ${paysImmatriculation} est incorrect. Attendu: ${format.placeholder}`, 'danger');
                return;
            }

            const dateErrorMessage = validateFirstRegDate(datePremiereImmatriculation);
            if (dateErrorMessage) {
                displayMessage(vehicleMessageContainer, dateErrorMessage, 'danger');
                return;
            }

            if (!marqueId) {
                displayMessage(vehicleMessageContainer, 'Veuillez sélectionner une marque de véhicule.', 'danger');
                return;
            }
            if (!modele) {
                displayMessage(vehicleMessageContainer, 'Veuillez saisir un modèle de véhicule.', 'danger');
                return;
            }

            if (!couleur) {
                displayMessage(vehicleMessageContainer, 'Veuillez sélectionner une couleur.', 'danger');
                return;
            }

            if (!nombreDePlaces || !energie) {
                displayMessage(vehicleMessageContainer, 'Veuillez remplir tous les champs obligatoires du véhicule.', 'danger');
                return;
            }

            try {
                const checkPlateResponse = await fetch('/api/check-plate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({ immatriculation: immatriculation })
                });

                const checkPlateResult = await checkPlateResponse.json();

                if (!checkPlateResult.isUnique) {
                    if (checkPlateResult.ownedByCurrentUser) {
                        displayMessage(vehicleMessageContainer, 'Vous avez déjà enregistré un véhicule avec cette plaque d\'immatriculation.', 'warning');
                    } else {
                        displayMessage(vehicleMessageContainer, 'Cette plaque d\'immatriculation est déjà utilisée par un autre utilisateur.', 'danger');
                    }
                    return;
                }
            } catch (error) {
                console.error('Erreur lors de la vérification de la plaque:', error);
                displayMessage(vehicleMessageContainer, "Une erreur inattendue est survenue lors de la vérification de la plaque.", 'danger');
                return;
            }

            const data = {
                paysImmatriculation: paysImmatriculation,
                immatriculation: immatriculation,
                datePremiereImmatriculation: datePremiereImmatriculation,
                marqueId: parseInt(marqueId),
                modele: modele,
                couleur: couleur,
                nombreDePlaces: parseInt(nombreDePlaces),
                energie: energie
            };

            try {
                const response = await fetch('/mon-compte/add-vehicle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    displayMessage(vehicleMessageContainer, result.message, 'success');
                    if (vehicleForm) vehicleForm.reset();
                    if (vehicleFormContainer) vehicleFormContainer.classList.add('d-none');
                    if (addVehicleBtn) addVehicleBtn.classList.remove('d-none');
                    if (brandSelect) brandSelect.value = "";
                    if (modelInput) modelInput.value = "";
                    if (colorInput) colorInput.value = "";
                    updatePlateInputDisplay(defaultCountryCode, defaultFlagSrc, defaultPlaceholder);
                    if (firstRegDateInput) {
                        firstRegDateInput.setAttribute('max', todayString);
                        firstRegDateInput.value = '';
                    }

                    // Recharger les véhicules après l'ajout pour mettre à jour la liste
                    await fetch('/api/user-vehicles')
                        .then(res => res.json())
                        .then(updatedVehicles => {
                            userVehiclesData = updatedVehicles;
                            displayVehicles(userVehiclesData);
                            // Si saisir_voyage.js dépend de cette liste, il faudra un mécanisme de mise à jour
                            // ou s'assurer qu'il charge ses propres données au besoin.
                            // Pour l'instant, on suppose qu'il rechargera au besoin ou que le rechargement de page suffira.
                        })
                        .catch(err => {
                            console.error('Erreur lors du rechargement des véhicules après ajout:', err);
                            displayMessage(vehicleMessageContainer, 'Véhicule ajouté, mais erreur lors de la mise à jour de la liste.', 'warning');
                        });

                } else {
                    displayMessage(vehicleMessageContainer, result.message, 'danger');
                }
            } catch (error) {
                console.error('Erreur lors de l\'envoi du véhicule:', error);
                displayMessage(vehicleMessageContainer, "Une erreur inattendue est survenue lors de l'ajout du véhicule.", 'danger');
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
    if (userPreferencesDataElement && userPreferencesDataElement.textContent.trim() !== '') {
        try {
            const parsedData = JSON.parse(userPreferencesDataElement.textContent);
            userPreferences = { ...userPreferences, ...parsedData };
        } catch (e) {
            console.error("Erreur lors du parsing des préférences de l'utilisateur:", e);
            displayMessage(preferencesMessageContainer, "Erreur au chargement des préférences. Veuillez recharger la page.", 'danger');
        }
    }

    if (prefSmoker) prefSmoker.checked = userPreferences.fumeurs_acceptes;
    if (prefAnimal) prefAnimal.checked = userPreferences.animaux_acceptes;

    if (customPrefList && userPreferences.personnalisees && Array.isArray(userPreferences.personnalisees)) {
        userPreferences.personnalisees.forEach(prefText => {
            const newTag = createPrefTag(prefText);
            customPrefList.appendChild(newTag);
        });
    }

    /**
     * Crée un tag de préférence visuel avec un bouton de suppression.
     * @param {string} text Le texte de la préférence.
     * @returns {HTMLElement} L'élément div représentant le tag.
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
        });

        tag.appendChild(span);
        tag.appendChild(btn);
        return tag;
    }

    if (addCustomPrefBtn && customPrefInput && customPrefList) {
        addCustomPrefBtn.addEventListener('click', () => {
            const value = customPrefInput.value.trim();
            if (value === '') {
                displayMessage(preferencesMessageContainer, 'Veuillez saisir une préférence personnalisée.', 'warning');
                return;
            }

            const existing = Array.from(customPrefList.children).some(
                (child) => child.firstChild && child.firstChild.textContent.toLowerCase() === value.toLowerCase()
            );
            if (existing) {
                displayMessage(preferencesMessageContainer, 'Cette préférence est déjà ajoutée.', 'warning');
                return;
            }

            const newTag = createPrefTag(value);
            customPrefList.appendChild(newTag);
            customPrefInput.value = '';
            displayMessage(preferencesMessageContainer, 'Préférence ajoutée, n\'oubliez pas d\'enregistrer !', 'info');
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (e.submitter && e.submitter.id === 'savePreferencesBtn') {
                const preferencesToSave = {
                    fumeursAcceptes: prefSmoker ? prefSmoker.checked : false,
                    animauxAcceptes: prefAnimal ? prefAnimal.checked : false,
                    preferencesPersonnalisees: []
                };

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
                    console.error('Erreur lors de l\'envoi des préférences:', error);
                    displayMessage(preferencesMessageContainer, "Une erreur inattendue est survenue lors de la sauvegarde des préférences.", 'danger');
                }
            }
        });
    }
}); // Fin de DOMContentLoaded