// public/js/add_carpool.js

// Ce script gère les interactions sur la page "Mon Compte" pour la section "Saisir un voyage" :
// - Gestion du formulaire de création de voyage (villes, dates, prix, véhicule, accompagnateurs)
// - Affichage de la liste des covoiturages existants et leurs actions (Commencer/Terminer)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Script add_carpool.js chargé.');

    // =====================================================================
    // CONSTANTES ET DONNÉES GLOBALES
    // =====================================================================
    const FRENCH_CITIES = [
        "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg",
        "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre",
        "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Villeurbanne",
        "Saint-Denis", "Le Mans", "Aix-en-Provence", "Brest", "Limoges", "Tours",
        "Perpignan", "Metz", "Besançon", "Orléans", "Mulhouse", "Rouen",
        "Caen", "Nancy", "Argenteuil", "Montreuil", "Saint-Paul", "Avignon",
        "Versailles", "Nîmes", "Clermont-Ferrand", "Le Tampon", "Annecy",
        "Saint-Denis (Réunion)", "Boulogne-Billancourt", "Saint-Pierre (Réunion)",
        "Mérignac", "Troyes", "Poitiers", "Pau", "Antibes", "La Rochelle"
    ].sort(); // Trie les villes par ordre alphabétique

    let userVehiclesData = []; // Stockera les véhicules de l'utilisateur avec leurs détails
    let userCovoituragesData = []; // Stockera les covoiturages de l'utilisateur

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

    /**
     * Formate une date au format JJ/MM/AAAA.
     * @param {string} dateString La date en chaîne de caractères (ex: YYYY-MM-DD).
     * @returns {string} La date formatée.
     */
    function formatDisplayDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Formate une heure au format HH:MM.
     * @param {Date} date L'objet Date à formater.
     * @returns {string} L'heure formatée.
     */
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // =====================================================================
    // RÉCUPÉRATION DES DONNÉES INITIALES (Véhicules de l'utilisateur)
    // =====================================================================
    const userVehiclesDataElement = document.getElementById('user-vehicles-data');
    if (userVehiclesDataElement && userVehiclesDataElement.textContent.trim() !== '') {
        try {
            userVehiclesData = JSON.parse(userVehiclesDataElement.textContent);
            console.log('add_carpool.js: Véhicules utilisateur chargés:', userVehiclesData);
        } catch (e) {
            console.error("add_carpool.js: Erreur lors du parsing des données véhicules:", e);
        }
    }

    // =====================================================================
    // GESTION DU FORMULAIRE DE VOYAGE
    // =====================================================================
    const addTripButton = document.getElementById('addTripButton');
    const existingTripsContainer = document.getElementById('existingTripsContainer');
    const noTripsMessage = document.getElementById('noTripsMessage');

    const tripFormContainer = document.getElementById('tripFormContainer');
    const tripForm = document.getElementById('tripForm');
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
    const createTripBtn = document.querySelector('#tripForm button[type="submit"]');
    const cancelTripBtn = document.getElementById('cancelTripBtn');
    const tripMessageContainer = document.getElementById('tripMessageContainer');

    /**
     * Remplit un élément select avec une liste de villes.
     * @param {HTMLSelectElement} selectElement L'élément select à remplir.
     * @param {Array<string>} cities La liste des villes.
     */
    function populateCitySelect(selectElement, cities) {
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="">Sélectionnez une ville</option>';
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            selectElement.appendChild(option);
        });
    }

    /**
     * Remplit le select des véhicules pour le formulaire de voyage.
     */
    function populateTripVehicleSelect() {
        if (!tripVehicleSelect) return;

        tripVehicleSelect.innerHTML = '<option value="">Sélectionnez un véhicule</option>';
        if (userVehiclesData.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "Aucun véhicule disponible. Ajoutez-en un d'abord.";
            option.disabled = true;
            tripVehicleSelect.appendChild(option);
            return;
        }

        userVehiclesData.forEach(vehicle => {
            const option = document.createElement('option');
            option.value = vehicle.id;
            
            const marqueLibelle = vehicle.marque && vehicle.marque.libelle ? vehicle.marque.libelle : 'Inconnue';
            const modeleText = vehicle.modele || 'Inconnu';
            const immatriculationText = vehicle.immatriculation || 'N/A';
            const seatsText = `${vehicle.nombreDePlaces} places`;
            
            const energie = vehicle.energie ? vehicle.energie.trim().toLowerCase() : '';
            
            // MODIFIÉ: Utilise un emoji pour la liste déroulante car les balises HTML ne sont pas supportées
            const iconText = (energie === 'electric' || energie === 'hybrid') ? '🍃 ' : '';

            option.innerHTML = `${iconText}${marqueLibelle} ${modeleText} - ${immatriculationText} - ${seatsText}`;
            option.dataset.nombreDePlaces = vehicle.nombreDePlaces;
            option.dataset.energie = vehicle.energie;
            tripVehicleSelect.appendChild(option);
        });
    }

    /**
     * Met à jour le champ des places disponibles en fonction du véhicule sélectionné,
     * si l'utilisateur est accompagné et du nombre d'accompagnateurs.
     */
    function updateAvailableSeats() {
        if (!tripVehicleSelect || !availableSeatsInput || !numberOfCompanionsInput) return;

        const selectedOption = tripVehicleSelect.options[tripVehicleSelect.selectedIndex];
        // Récupère le nombre de places passagers du véhicule
        const totalPassengerSeats = selectedOption.dataset.nombreDePlaces ? parseInt(selectedOption.dataset.nombreDePlaces) : 0;

        let companions = 0;
        if (isAccompaniedCheckbox.checked) {
            companions = parseInt(numberOfCompanionsInput.value) || 0;
            if (companions > totalPassengerSeats) {
                companions = totalPassengerSeats;
                numberOfCompanionsInput.value = companions;
            }
            if (companions < 0) {
                companions = 0;
                numberOfCompanionsInput.value = companions;
            }
        } else {
            numberOfCompanionsInput.value = 0;
        }
        
        // Le nombre de places disponibles pour les autres est le total des places passagers - les accompagnateurs
        const availableSeats = totalPassengerSeats - companions; 
        availableSeatsInput.value = Math.max(0, availableSeats);

        // Le nombre max d'accompagnateurs est le nombre total de places passagers
        numberOfCompanionsInput.max = Math.max(0, totalPassengerSeats);
    }

    /**
     * Affiche un covoiturage dans la liste des voyages existants.
     * @param {Object} covoiturageData Les données du covoiturage.
     * @param {boolean} prepend Si vrai, ajoute le covoiturage au début de la liste.
     */
    function addCovoiturageToList(covoiturageData, prepend = false) {
        if (!existingTripsContainer) return;

        if (noTripsMessage) {
            noTripsMessage.classList.add('d-none');
        }

        const covoiturageDiv = document.createElement('div');
        covoiturageDiv.id = `covoiturage-${covoiturageData.id}`;
        covoiturageDiv.classList.add('d-flex', 'flex-column', 'flex-md-row', 'align-items-start', 'align-items-md-center', 'px-3', 'py-2', 'rounded', 'border', 'mb-2', 'bg-light');

        const mainInfoSpan = document.createElement('span');
        mainInfoSpan.classList.add('mb-2', 'mb-md-0', 'flex-grow-1', 'text-sm');
        
        let vehiculeInfo = 'Véhicule inconnu';
        let iconHtml = '';
        
        if (covoiturageData.voiture && typeof covoiturageData.voiture === 'object') {
            const vehiculeFromLocalData = userVehiclesData.find(v => v.id == covoiturageData.voiture.id);
            
            if (vehiculeFromLocalData) {
                const marqueLibelle = vehiculeFromLocalData.marque && vehiculeFromLocalData.marque.libelle ? vehiculeFromLocalData.marque.libelle : 'Inconnue';
                const modeleText = vehiculeFromLocalData.modele || 'Inconnu';
                const immatriculationText = vehiculeFromLocalData.immatriculation || 'N/A';
                
                const energie = vehiculeFromLocalData.energie ? vehiculeFromLocalData.energie.trim().toLowerCase() : '';
                
                if (energie === 'electric' || energie === 'hybrid') {
                    // MODIFIÉ: Couleur changée en 'text-primary'
                    iconHtml = '<i class="bi bi-leaf-fill text-primary"></i> ';
                    covoiturageDiv.classList.remove('bg-light');
                    covoiturageDiv.classList.add('bg-secondary', 'bg-opacity-10');
                }
                
                vehiculeInfo = `${marqueLibelle} ${modeleText} (${immatriculationText})`;

            } else if (covoiturageData.voiture.marque && covoiturageData.voiture.modele) {
                const marqueLibelle = covoiturageData.voiture.marque.libelle || 'Inconnue';
                const modeleText = covoiturageData.voiture.modele || 'Inconnu';
                const immatriculationText = covoiturageData.voiture.immatriculation || 'N/A';
                vehiculeInfo = `${marqueLibelle} ${modeleText} (${immatriculationText})`;
            } else if (covoiturageData.voiture.id) {
                vehiculeInfo = `Véhicule ID: ${covoiturageData.voiture.id}`;
            }
        }

        const formattedDate = formatDisplayDate(covoiturageData.dateDepart);

        mainInfoSpan.innerHTML = `
            <strong>${covoiturageData.villeDepart}</strong> <i class="bi bi-arrow-right"></i> <strong>${covoiturageData.villeArrivee}</strong><br>
            Le ${formattedDate} à ${covoiturageData.heureDepart} <br>
            Prix: ${covoiturageData.prix} crédits - Places: ${covoiturageData.placesDisponibles} <br>
            Véhicule: ${iconHtml}${vehiculeInfo}
        `;

        const statusSpan = document.createElement('span');
        statusSpan.classList.add('fw-bold', 'ms-md-auto', 'me-md-2', 'mb-2', 'mb-md-0');
        statusSpan.textContent = covoiturageData.statut;

        const actionButtonsDiv = document.createElement('div');
        actionButtonsDiv.classList.add('d-flex', 'gap-2');

        const startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.classList.add('btn', 'btn-success', 'btn-sm', 'rounded-4', 'px-3', 'start-trip-btn');
        startBtn.textContent = 'Commencer';
        startBtn.dataset.covoiturageId = covoiturageData.id;
        startBtn.dataset.covoiturageDate = covoiturageData.dateDepart;

        const endBtn = document.createElement('button');
        endBtn.type = 'button';
        endBtn.classList.add('btn', 'btn-warning', 'btn-sm', 'rounded-4', 'px-3', 'end-trip-btn', 'd-none');
        endBtn.textContent = 'Terminer';
        endBtn.dataset.covoiturageId = covoiturageData.id;

        actionButtonsDiv.appendChild(startBtn);
        actionButtonsDiv.appendChild(endBtn);

        covoiturageDiv.appendChild(mainInfoSpan);
        covoiturageDiv.appendChild(statusSpan);
        covoiturageDiv.appendChild(actionButtonsDiv);

        if (prepend) {
            existingTripsContainer.prepend(covoiturageDiv);
        } else {
            existingTripsContainer.appendChild(covoiturageDiv);
        }

        updateTripActionButtonsForElement(covoiturageDiv, covoiturageData.statut, new Date(covoiturageData.dateDepart));
    }

    /**
     * Met à jour la visibilité et l'état des boutons d'action pour un élément de covoiturage donné.
     * @param {HTMLElement} covoiturageElement L'élément div du covoiturage dans la liste.
     * @param {string} status Le statut actuel du covoiturage ('initialise', 'en_cours', 'termine').
     * @param {Date} tripDate La date de départ du covoiturage.
     */
    function updateTripActionButtonsForElement(covoiturageElement, status, tripDate) {
        const startBtn = covoiturageElement.querySelector('.start-trip-btn');
        const endBtn = covoiturageElement.querySelector('.end-trip-btn');
        const statusSpan = covoiturageElement.querySelector('span:nth-of-type(2)');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tripDate.setHours(0, 0, 0, 0);

        if (startBtn) {
            startBtn.classList.add('d-none');
            startBtn.disabled = false;
        }
        if (endBtn) {
            endBtn.classList.add('d-none');
        }

        if (status === 'initialise') {
            if (startBtn) {
                startBtn.classList.remove('d-none');
                if (tripDate.getTime() !== today.getTime()) {
                    startBtn.disabled = true; // Désactive si la date n'est pas aujourd'hui
                } else {
                    startBtn.disabled = false;
                }
            }
            statusSpan.textContent = 'Non démarré';
            statusSpan.classList.remove('text-success', 'text-danger');
            statusSpan.classList.add('text-info');

        } else if (status === 'en_cours') {
            if (endBtn) {
                endBtn.classList.remove('d-none');
            }
            statusSpan.textContent = 'En cours';
            statusSpan.classList.remove('text-info', 'text-danger');
            statusSpan.classList.add('text-success');

        } else if (status === 'termine') {
            statusSpan.textContent = 'Terminé';
            statusSpan.classList.remove('text-info', 'text-success');
            statusSpan.classList.add('text-danger');
        }
    }

    /**
     * Charge et affiche les covoiturages existants de l'utilisateur.
     */
    async function loadAndDisplayUserCovoiturages() {
        if (!existingTripsContainer) return;
        console.log('add_carpool.js: Tentative de chargement des voyages.');

        try {
            const response = await fetch('/api/user-covoiturages');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement des covoiturages de l\'utilisateur.');
            }
            userCovoituragesData = await response.json();
            console.log('add_carpool.js: Voyages chargés.', userCovoituragesData);

            if (userCovoituragesData.length === 0) {
                if (noTripsMessage) noTripsMessage.classList.remove('d-none');
            } else {
                if (noTripsMessage) noTripsMessage.classList.add('d-none');
                existingTripsContainer.innerHTML = '';
                userCovoituragesData.forEach(covoiturage => {
                    addCovoiturageToList(covoiturage);
                });
            }
        } catch (error) {
            console.error('add_carpool.js: Erreur lors du chargement des covoiturages:', error);
            displayMessage(tripMessageContainer, `Impossible de charger vos voyages: ${error.message}`, 'danger');
            if (noTripsMessage) noTripsMessage.classList.remove('d-none');
        }
    }


    // =====================================================================
    // INITIALISATION DES ÉLÉMENTS DE L'ONGLET VOYAGE
    // =====================================================================
    populateCitySelect(departureCitySelect, FRENCH_CITIES);
    populateCitySelect(arrivalCitySelect, FRENCH_CITIES);
    populateTripVehicleSelect(); // Appelé ici pour la première fois

    const today = new Date();
    const todayString = formatDate(today);
    if (departureDateInput) {
        departureDateInput.value = todayString; // Définit la date de départ à aujourd'hui par défaut
        departureDateInput.setAttribute('min', todayString);
    }

    if (departureDateInput && arrivalDateInput) {
        arrivalDateInput.value = departureDateInput.value;
        arrivalDateInput.setAttribute('min', departureDateInput.value);

        departureDateInput.addEventListener('change', () => {
            arrivalDateInput.setAttribute('min', departureDateInput.value);
            if (arrivalDateInput.value < departureDateInput.value) {
                arrivalDateInput.value = departureDateInput.value;
            }
        });
    }

    if (tripVehicleSelect) {
        tripVehicleSelect.addEventListener('change', updateAvailableSeats);
    }
    if (isAccompaniedCheckbox) {
        isAccompaniedCheckbox.addEventListener('change', () => {
            if (isAccompaniedCheckbox.checked) {
                companionsInputGroup.classList.remove('d-none');
                numberOfCompanionsInput.setAttribute('min', '0');
                numberOfCompanionsInput.value = 0; // Réinitialise à 0 lorsque l'interrupteur est activé
            } else {
                companionsInputGroup.classList.add('d-none');
                numberOfCompanionsInput.value = '';
            }
            updateAvailableSeats();
        });
    }
    if (numberOfCompanionsInput) {
        numberOfCompanionsInput.addEventListener('input', updateAvailableSeats);
    }
    updateAvailableSeats(); // Appel initial pour définir les places disponibles

    if (addTripButton && tripFormContainer) {
        addTripButton.addEventListener('click', () => {
            console.log('add_carpool.js: Bouton "Saisir un nouveau voyage" cliqué.');
            tripFormContainer.classList.remove('d-none');
            addTripButton.classList.add('d-none');
            tripForm.reset();
            populateTripVehicleSelect(); // Re-remplir le select des véhicules au cas où un nouveau véhicule a été ajouté
            updateAvailableSeats();
            tripMessageContainer.innerHTML = '';
            isAccompaniedCheckbox.checked = false; // Réinitialise l'interrupteur
            companionsInputGroup.classList.add('d-none');
            numberOfCompanionsInput.value = '';
        });
    } else {
        console.warn('add_carpool.js: Impossible de trouver addTripButton ou tripFormContainer. Vérifiez les IDs HTML.');
    }

    if (cancelTripBtn && tripFormContainer && addTripButton) {
        cancelTripBtn.addEventListener('click', () => {
            console.log('add_carpool.js: Bouton "Annuler" du formulaire de voyage cliqué.');
            tripForm.reset();
            populateTripVehicleSelect(); // Re-remplir le select des véhicules
            updateAvailableSeats();
            tripFormContainer.classList.add('d-none');
            addTripButton.classList.remove('d-none');
            tripMessageContainer.innerHTML = '';
            isAccompaniedCheckbox.checked = false;
            companionsInputGroup.classList.add('d-none');
            numberOfCompanionsInput.value = '';
        });
    }

    // =====================================================================
    // GESTION DE LA SOUMISSION DU FORMULAIRE DE VOYAGE
    // =====================================================================
    if (tripForm) {
        tripForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('add_carpool.js: Formulaire de voyage soumis.');

            const villeDepart = departureCitySelect.value;
            const dateDepart = departureDateInput.value;
            const heureDepart = departureTimeInput.value;
            const villeArrivee = arrivalCitySelect.value;
            const dateArrivee = arrivalDateInput.value;
            const heureArrivee = arrivalTimeInput.value;
            const prix = parseInt(tripPriceInput.value);
            const vehiculeId = parseInt(tripVehicleSelect.value);
            const estAccompagne = isAccompaniedCheckbox.checked;
            const nombreAccompagnateurs = estAccompagne ? parseInt(numberOfCompanionsInput.value) || 0 : 0;
            const placesDisponibles = parseInt(availableSeatsInput.value);

            // Validation des champs (côté client)
            if (!villeDepart || !dateDepart || !heureDepart || !villeArrivee || !dateArrivee || !heureArrivee || isNaN(prix) || !vehiculeId) {
                displayMessage(tripMessageContainer, 'Veuillez remplir tous les champs obligatoires du voyage.', 'danger');
                return;
            }

            if (villeDepart === villeArrivee) {
                displayMessage(tripMessageContainer, 'La ville de départ et la ville d\'arrivée ne peuvent pas être les mêmes.', 'danger');
                return;
            }

            const departureDateTime = new Date(`${dateDepart}T${heureDepart}`);
            const arrivalDateTime = new Date(`${dateArrivee}T${heureArrivee}`);
            const now = new Date();

            if (departureDateTime < now) {
                displayMessage(tripMessageContainer, 'La date et l\'heure de départ ne peuvent pas être dans le passé.', 'danger');
                return;
            }

            if (arrivalDateTime <= departureDateTime) {
                displayMessage(tripMessageContainer, 'La date et l\'heure d\'arrivée doivent être après la date et l\'heure de départ.', 'danger');
                return;
            }

            const selectedVehicle = userVehiclesData.find(v => v.id == vehiculeId);
            if (!selectedVehicle) {
                displayMessage(tripMessageContainer, 'Véhicule sélectionné introuvable.', 'danger');
                return;
            }
            const totalPassengerSeats = selectedVehicle.nombreDePlaces;

            if (estAccompagne && nombreAccompagnateurs > totalPassengerSeats) {
                displayMessage(tripMessageContainer, `Le nombre d'accompagnateurs (${nombreAccompagnateurs}) ne peut pas être supérieur au nombre total de places passagers (${totalPassengerSeats}).`, 'danger');
                return;
            }
            
            if (placesDisponibles < 1) {
                displayMessage(tripMessageContainer, 'Il doit y avoir au moins 1 place disponible pour créer un covoiturage.', 'danger');
                return;
            }

            const tripData = {
                villeDepart: villeDepart,
                dateDepart: dateDepart,
                heureDepart: heureDepart,
                villeArrivee: villeArrivee,
                dateArrivee: dateArrivee,
                heureArrivee: heureArrivee,
                prix: prix,
                vehiculeId: vehiculeId,
                estAccompagne: estAccompagne,
                nombreAccompagnateurs: nombreAccompagnateurs,
                placesDisponibles: placesDisponibles,
                statut: 'initialise'
            };

            console.log('add_carpool.js: Données envoyées pour la création du covoiturage:', tripData);

            try {
                const response = await fetch('/api/mon-compte/add-covoiturage', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify(tripData)
                });

                console.log('add_carpool.js: Réponse brute du serveur:', response);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('add_carpool.js: Erreur HTTP:', response.status, response.statusText, 'Réponse du serveur:', errorText);
                    displayMessage(tripMessageContainer, `Erreur du serveur lors de la création du covoiturage: ${response.status} ${response.statusText}. Détails en console.`, 'danger');
                    return;
                }

                const result = await response.json();
                console.log('add_carpool.js: Résultat JSON du serveur:', result);

                if (result.success) {
                    displayMessage(tripMessageContainer, result.message, 'success');
                    tripForm.reset();
                    
                    await fetch('/api/user-vehicles')
                        .then(res => res.json())
                        .then(updatedVehicles => {
                            userVehiclesData = updatedVehicles;
                            populateTripVehicleSelect();
                            updateAvailableSeats();
                        })
                        .catch(err => {
                            console.error('Erreur lors du rechargement des véhicules après ajout de covoiturage:', err);
                        });

                    addCovoiturageToList(result.covoiturage, true);
                    
                    tripFormContainer.classList.add('d-none');
                    addTripButton.classList.remove('d-none');

                } else {
                    displayMessage(tripMessageContainer, result.message, 'danger');
                }
            } catch (error) {
                console.error('add_carpool.js: Erreur lors de la création du covoiturage:', error);
                displayMessage(tripMessageContainer, "Une erreur inattendue est survenue lors de la création du covoiturage. Vérifiez la console pour plus de détails.", 'danger');
            }
        });
    }

    // Gestion des clics sur les boutons "Commencer" et "Terminer" dans la liste des covoiturages
    if (existingTripsContainer) {
        existingTripsContainer.addEventListener('click', async (e) => {
            const startBtnClicked = e.target.closest('.start-trip-btn');
            const endBtnClicked = e.target.closest('.end-trip-btn');

            let covoiturageId = null;
            let covoiturageElement = null;
            let actionType = null;

            if (startBtnClicked) {
                covoiturageId = startBtnClicked.dataset.covoiturageId;
                covoiturageElement = startBtnClicked.closest('div.d-flex');
                actionType = 'start';
            } else if (endBtnClicked) {
                covoiturageId = endBtnClicked.dataset.covoiturageId;
                covoiturageElement = endBtnClicked.closest('div.d-flex');
                actionType = 'end';
            }

            if (covoiturageId && covoiturageElement && actionType) {
                const covoiturageData = userCovoituragesData.find(c => c.id == covoiturageId);
                if (!covoiturageData) {
                    displayMessage(tripMessageContainer, 'Covoiturage introuvable.', 'danger');
                    return;
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tripDate = new Date(covoiturageData.dateDepart);
                tripDate.setHours(0, 0, 0, 0);

                if (actionType === 'start' && tripDate.getTime() !== today.getTime()) {
                    displayMessage(tripMessageContainer, "Le covoiturage ne peut être démarré qu'à la date prévue.", 'danger');
                    return;
                }

                try {
                    const response = await fetch(`/api/covoiturage/${covoiturageId}/${actionType}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });
                    const result = await response.json();
                    if (result.success) {
                        covoiturageData.statut = result.newStatus;
                        updateTripActionButtonsForElement(covoiturageElement, result.newStatus, tripDate);
                        displayMessage(tripMessageContainer, result.message, 'success');
                    } else {
                        displayMessage(tripMessageContainer, result.message, 'danger');
                    }
                } catch (error) {
                    console.error(`add_carpool.js: Erreur lors de l'action '${actionType}' sur le covoiturage:`, error);
                    displayMessage(tripMessageContainer, `Une erreur inattendue est survenue lors de l'action '${actionType}'.`, 'danger');
                }
            }
        });
    }


    // =====================================================================
    // GESTION DE L'HISTORIQUE (À DÉVELOPPER)
    // =====================================================================
    const historyTableBody = document.getElementById('historyTableBody');
    if (historyTableBody) {
        console.log("add_carpool.js: Section historique des voyages (logique à implémenter).");
    }

    // Appel initial pour charger les covoiturages existants au chargement de la page
    loadAndDisplayUserCovoiturages();

}); // Fin de DOMContentLoaded
