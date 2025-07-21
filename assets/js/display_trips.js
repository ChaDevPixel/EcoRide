const initializeDisplayTripsPage = () => {
    const historyTabElement = document.getElementById('history-tab');
    if (historyTabElement && historyTabElement._displayTripsInitialized) return;
    if (historyTabElement) historyTabElement._displayTripsInitialized = true;
    console.log("display_trips.js: Script chargé et initialisé.");
    const driverHistoryContainer = document.getElementById('driver-history-container');
    const passengerHistoryContainer = document.getElementById('passenger-history-container');
    const historyMessageContainer = document.getElementById('historyMessageContainer');
    const noDriverHistoryMessage = document.getElementById('no-driver-history-message');
    const noPassengerHistoryMessage = document.getElementById('no-passenger-history-message');

    function showMessage(container, message, type = 'danger') {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) return;
        const wrapper = document.createElement('div');
        wrapper.className = `alert alert-${type} alert-dismissible fade show mt-2`;
        wrapper.role = 'alert';
        wrapper.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.innerHTML = '';
        targetContainer.appendChild(wrapper);
        setTimeout(() => {
            if (wrapper && wrapper.parentNode) {
                wrapper.classList.remove('show');
                wrapper.classList.add('fade');
                wrapper.addEventListener('transitionend', () => wrapper.remove());
            }
        }, 5000);
    }

    function formatDateOnly(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    function createHistoryTripCardHTML(trip, role) {
        const isDriver = role === 'driver';
        const isCancelled = trip.statut === 'annule';
        const statusText = isCancelled ? 'Annulé' : 'Terminé';
        const statusColor = isCancelled ? 'danger' : 'secondary';
        let detailsHtml = '';
        if (isDriver) {
            let participantsText = 'Aucun';
            if (trip.participations && trip.participations.length > 0) {
                const pseudos = trip.participations.map(p => p.passager && p.passager.pseudo ? p.passager.pseudo : 'Inconnu').join(', ');
                participantsText = pseudos;
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
    }

    async function loadAndDisplayHistory() {
        if (!driverHistoryContainer || !passengerHistoryContainer || !historyMessageContainer) return;
        try {
            const response = await fetch('/api/user/trips');
            if (response.status === 401) {
                console.error('display_trips.js: Utilisateur non authentifié. Redirection.');
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erreur lors de la récupération des voyages.');
            }
            const data = await response.json();
            const now = new Date();
            let allHistoryTrips = [];
            if (data.driver_trips) {
                const driverHistory = data.driver_trips
                    .filter(trip => new Date(trip.dateArrivee) < now || trip.statut === 'annule' || trip.statut === 'litige' || trip.statut === 'en_attente_validation')
                    .map(trip => ({ ...trip, role: 'driver' }));
                allHistoryTrips.push(...driverHistory);
            }
            if (data.passenger_trips) {
                const passengerHistory = data.passenger_trips
                    .filter(trip => trip.covoiturage && (new Date(trip.covoiturage.dateArrivee) < now || trip.covoiturage.statut === 'annule' || trip.covoiturage.statut === 'litige' || trip.covoiturage.statut === 'en_attente_validation'))
                    .map(trip => ({ ...trip, role: 'passenger' }));
                allHistoryTrips.push(...passengerHistory);
            }
            allHistoryTrips.sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart));
            let pastDriverTripsHTML = '';
            let pastPassengerTripsHTML = '';
            allHistoryTrips.forEach(trip => {
                if (trip.role === 'driver') {
                    pastDriverTripsHTML += createHistoryTripCardHTML(trip, 'driver');
                } else {
                    pastPassengerTripsHTML += createHistoryTripCardHTML(trip, 'passenger');
                }
            });
            const noDriverMsgElement = noDriverHistoryMessage ? noDriverHistoryMessage.outerHTML : '<p class="text-muted">Aucun voyage terminé pour le moment.</p>';
            const noPassengerMsgElement = noPassengerHistoryMessage ? noPassengerHistoryMessage.outerHTML : '<p class="text-muted">Vous n\'avez aucun voyage terminé pour le moment.</p>';
            if (driverHistoryContainer) {
                driverHistoryContainer.innerHTML = pastDriverTripsHTML || noDriverMsgElement;
            }
            if (passengerHistoryContainer) {
                passengerHistoryContainer.innerHTML = pastPassengerTripsHTML || noPassengerMsgElement;
            }
        } catch (error) {
            console.error('display_trips.js: ERREUR dans loadAndDisplayHistory:', error);
            if (historyMessageContainer) {
                showMessage(historyMessageContainer, 'Impossible de charger l\'historique. Veuillez réessayer plus tard.', 'danger');
            }
        }
    }
    loadAndDisplayHistory();

    function activateTabFromHash() {
        const hash = window.location.hash;
        if (hash === '#trip' || hash === '#roles' || hash === '#history' || hash === '#account') {
            const tabTrigger = document.querySelector(`.nav-tabs button[data-bs-target="${hash}"]`);
            if (tabTrigger) {
                const tab = new window.bootstrap.Tab(tabTrigger);
                tab.show();
            }
        }
    }
    activateTabFromHash();
};

document.addEventListener('DOMContentLoaded', initializeDisplayTripsPage);
document.addEventListener('turbo:load', initializeDisplayTripsPage);