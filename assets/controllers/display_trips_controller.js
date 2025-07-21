// assets/controllers/display_trips_controller.js

import { Controller } from '@hotwired/stimulus';
import * as Turbo from '@hotwired/turbo'; 

export default class extends Controller {
    static targets = [
        'driverHistoryContainer',
        'passengerHistoryContainer',
        'historyMessageContainer',
        'noDriverHistoryMessage',    // Le paragraphe "Aucun voyage terminé..."
        'noPassengerHistoryMessage'  // Le paragraphe "Vous n'avez aucun voyage terminé..."
    ];

    connect() {
        console.log('Stimulus: display_trips_controller connecté.');
        // Appel initial au chargement du contrôleur (équivalent de DOMContentLoaded/turbo:load)
        this.loadAndDisplayHistory();
    }

    // Affiche une alerte stylisée pour les messages d'erreur ou de succès.
    showMessage(container, message, type = 'danger') {
        const targetContainer = typeof container === 'string' ? document.getElementById(container) : container;
        if (!targetContainer) {
            console.error(`display_trips_controller: Conteneur de message "${container}" introuvable.`);
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = `alert alert-${type} alert-dismissible fade show mt-2`;
        wrapper.role = 'alert';
        wrapper.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        targetContainer.innerHTML = ''; 
        targetContainer.appendChild(wrapper);

        // Disparition automatique pour les messages non-danger
        if (type !== 'danger') {
            setTimeout(() => {
                if (wrapper.parentNode) {
                    wrapper.classList.remove('show');
                    wrapper.classList.add('fade');
                    wrapper.addEventListener('transitionend', () => wrapper.remove());
                }
            }, 5000);
        }
    }

    // Formate une date pour l'affichage (ex: 18/07/2025)
    formatDateOnly(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return date.toLocaleDateString('fr-FR', options);
    }

    // Crée le HTML pour l'HISTORIQUE (design compact)
    createHistoryTripCardHTML(trip, role) {
        const isCancelled = trip.statut === 'annule'; 
        const statusText = isCancelled ? 'Annulé' : 'Terminé';
        const statusColor = isCancelled ? 'danger' : 'secondary';

        let detailsHtml = '';
        if (role === 'driver') { // Si c'est un voyage où l'utilisateur était chauffeur
            let participantsText = 'Aucun';
            if (trip.participations && trip.participations.length > 0) {
                participantsText = trip.participations.map(p => p.passager.pseudo).join(', ');
            }
            detailsHtml = `<div class="text-truncate"><strong>Participants:</strong> ${participantsText}</div>`;
        } else { // Si c'est un voyage où l'utilisateur était passager
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
                    <small class="text-muted">Le ${this.formatDateOnly(trip.dateDepart)} • ${trip.prix} crédits</small>
                    <hr class="my-1">
                    <div class="d-flex justify-content-between align-items-center">
                        <small class="flex-grow-1 me-2">${detailsHtml}</small>
                    </div>
                </div>
            </div>
        `;
    }

    // Fonction principale pour charger et afficher les voyages de l'historique
    async loadAndDisplayHistory() {
        if (!this.hasDriverHistoryContainerTarget || !this.hasPassengerHistoryContainerTarget || !this.hasHistoryMessageContainerTarget) return;

        try {
            const response = await fetch('/api/user/trips'); // L'API qui renvoie TOUS les voyages
            
            if (response.status === 401) {
                // Si non authentifié, rediriger vers la page de connexion
                console.error('display_trips_controller: Utilisateur non authentifié. Redirection.');
                Turbo.visit('/login'); 
                return; // Arrête l'exécution de la fonction
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
                    .filter(trip => new Date(trip.dateArrivee) < now || trip.statut === 'annule' || trip.statut === 'litige' || trip.statut === 'en_attente_validation') // Inclure litige/en_attente_validation car ils sont "terminés" du point de vue de l'historique chauffeur
                    .map(trip => ({ ...trip, role: 'driver' }));
                allHistoryTrips.push(...driverHistory);
            }

            if (data.passenger_trips) {
                const passengerHistory = data.passenger_trips
                    .filter(trip => new Date(trip.covoiturage.dateArrivee) < now || trip.covoiturage.statut === 'annule' || trip.covoiturage.statut === 'litige' || trip.covoiturage.statut === 'en_attente_validation') // Idem pour passager
                    .map(trip => ({ ...trip, role: 'passenger' }));
                allHistoryTrips.push(...passengerHistory);
            }

            allHistoryTrips.sort((a, b) => new Date(b.dateDepart) - new Date(a.dateDepart));

            let pastDriverTripsHTML = '';
            let pastPassengerTripsHTML = '';

            allHistoryTrips.forEach(trip => {
                if (trip.role === 'driver') {
                    pastDriverTripsHTML += this.createHistoryTripCardHTML(trip, 'driver');
                } else {
                    pastPassengerTripsHTML += this.createHistoryTripCardHTML(trip, 'passenger');
                }
            });
            
            // Accès aux messages par leurs targets
            const noDriverMsgElement = this.hasNoDriverHistoryMessageTarget ? this.noDriverHistoryMessageTarget.outerHTML : '<p class="text-muted">Aucun voyage terminé pour le moment.</p>';
            const noPassengerMsgElement = this.hasNoPassengerHistoryMessageTarget ? this.noPassengerHistoryMessageTarget.outerHTML : '<p class="text-muted">Vous n\'avez aucun voyage terminé pour le moment.</p>';

            if (this.hasDriverHistoryContainerTarget) {
                this.driverHistoryContainerTarget.innerHTML = pastDriverTripsHTML || noDriverMsgElement;
            }
            if (this.hasPassengerHistoryContainerTarget) {
                this.passengerHistoryContainerTarget.innerHTML = pastPassengerTripsHTML || noPassengerMsgElement;
            }

        } catch (error) {
            console.error('ERREUR dans loadAndDisplayHistory:', error);
            if (this.hasHistoryMessageContainerTarget) {
                this.showMessage(this.historyMessageContainerTarget, 'Impossible de charger l\'historique. Veuillez réessayer plus tard.', 'danger');
            }
        }
    }
}