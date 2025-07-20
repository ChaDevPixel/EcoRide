document.addEventListener('DOMContentLoaded', () => {
    // Affiche une alerte stylisée pour les messages d'erreur ou de succès.
    const showMessage = (container, message, type = 'danger') => {
        const wrapper = document.createElement('div');
        wrapper.className = `alert alert-${type} alert-dismissible fade show mt-2`;
        wrapper.role = 'alert';
        wrapper.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        container.innerHTML = ''; 
        container.appendChild(wrapper);
    };

    // Formate une date pour l'affichage (ex: 18/07/2025)
    const formatDateOnly = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    };

    // Crée le HTML pour l'HISTORIQUE (design compact)
    const createHistoryTripCardHTML = (trip, role) => {
        const isDriver = role === 'driver';
        const isCancelled = trip.statut === 'annule'; // Correction du statut
        const statusText = isCancelled ? 'Annulé' : 'Terminé';
        const statusColor = isCancelled ? 'danger' : 'secondary';

        let detailsHtml = '';
        if (isDriver) {
            let participantsText = 'Aucun';
            if (trip.participations && trip.participations.length > 0) {
                participantsText = trip.participations.map(p => p.passager.pseudo).join(', ');
            }
            detailsHtml = `<div class="text-truncate"><strong>Participants:</strong> ${participantsText}</div>`;
        } else {
            let driverName = 'N/A';
            if (trip.chauffeur && trip.chauffeur.pseudo) {
                driverName = trip.chauffeur.pseudo;
            }
            detailsHtml = `<div><strong>Chauffeur:</strong> ${driverName}</div>`;
        }

        return `
            <div class="card mb-2 shadow-sm">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0 text-truncate pe-2">${trip.villeDepart} <i class="bi bi-arrow-right"></i> ${trip.villeArrivee}</h6>
                        <span class="badge bg-${statusColor} text-nowrap">${statusText}</span>
                    </div>
                    <small class="text-muted">Le ${formatDateOnly(trip.dateDepart)} • ${trip.prix} crédits</small>
                    <hr class="my-1">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="flex-grow-1 me-2">${detailsHtml}</small>
                    </div>
                </div>
            </div>
        `;
    };

    // Fonction principale pour charger et afficher les voyages de l'historique
    const loadAndDisplayHistory = async () => {
        const driverHistoryContainer = document.getElementById('driver-history-container');
        const passengerHistoryContainer = document.getElementById('passenger-history-container');
        const historyMessageContainer = document.getElementById('historyMessageContainer');

        try {
            const response = await fetch('/api/user/trips'); // L'API qui renvoie TOUS les voyages
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des voyages.');
            }
            const data = await response.json();

            const now = new Date();
            let allHistoryTrips = [];

            // Filtrer les voyages du chauffeur pour l'historique
            if (data.driver_trips) {
                const driverHistory = data.driver_trips
                    .filter(trip => new Date(trip.dateArrivee) < now || trip.statut === 'annule')
                    .map(trip => ({ ...trip, role: 'driver' })); // Ajoute le rôle pour le tri et l'affichage
                allHistoryTrips.push(...driverHistory);
            }

            // Filtrer les voyages du passager pour l'historique
            if (data.passenger_trips) {
                const passengerHistory = data.passenger_trips
                    .filter(trip => new Date(trip.dateArrivee) < now || trip.statut === 'annule')
                    .map(trip => ({ ...trip, role: 'passenger' })); // Ajoute le rôle
                allHistoryTrips.push(...passengerHistory);
            }

            // Trier tous les voyages de l'historique par date de départ (du plus récent au plus ancien)
            allHistoryTrips.sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart));

            let pastDriverTripsHTML = '';
            let pastPassengerTripsHTML = '';

            // Générer le HTML à partir de la liste triée
            allHistoryTrips.forEach(trip => {
                if (trip.role === 'driver') {
                    pastDriverTripsHTML += createHistoryTripCardHTML(trip, 'driver');
                } else {
                    pastPassengerTripsHTML += createHistoryTripCardHTML(trip, 'passenger');
                }
            });

            const getMessageOrDefault = (id, defaultHtml) => {
                const element = document.getElementById(id);
                return element ? element.outerHTML : defaultHtml;
            };

            // Mise à jour de l'onglet "Historique"
            if (driverHistoryContainer) {
                driverHistoryContainer.innerHTML = pastDriverTripsHTML || getMessageOrDefault('no-driver-history-message', '<p class="text-muted">Aucun voyage terminé pour le moment.</p>');
            }
            if (passengerHistoryContainer) {
                passengerHistoryContainer.innerHTML = pastPassengerTripsHTML || getMessageOrDefault('no-passenger-history-message', '<p class="text-muted">Vous n\'avez aucun voyage terminé pour le moment.</p>');
            }

        } catch (error) {
            console.error('ERREUR dans loadAndDisplayHistory:', error);
            if (historyMessageContainer) {
                showMessage(historyMessageContainer, 'Impossible de charger l\'historique. Veuillez réessayer plus tard.', 'danger');
            }
        }
    };

    // Appel initial au chargement de la page
    loadAndDisplayHistory();
});