// assets/controllers/cancel_carpool_controller.js

import { Controller } from '@hotwired/stimulus';
import * as Turbo from '@hotwired/turbo';

export default class extends Controller {
    static targets = [
        'cancelCarpoolModal',
        'confirmCancelCarpoolButton',
        // 'driverTripsContainer' // Si ce target n'est utilisé que pour la délégation et que data-action est sur les boutons eux-mêmes, il n'est plus nécessaire ici.
                                  // Je le laisse en commentaire, à vous de voir si vous l'utilisez ailleurs dans ce contrôleur.
    ];

    cancelCarpoolModalInstance = null;
    carpoolIdToCancel = null; 

    connect() {
        console.log("Stimulus: cancel_carpool_controller connecté.");
        
        if (!this.hasCancelCarpoolModalTarget) {
            console.warn("L'élément #cancelCarpoolModal (chauffeur) n'a pas été trouvé. Le script d'annulation de covoiturage ne s'exécutera pas.");
            return;
        }

        this.cancelCarpoolModalInstance = new Modal(this.cancelCarpoolModalTarget);
        
        // Tous les écouteurs sont désormais gérés par data-action dans le HTML.
        // Aucune attachement d'événements manuel n'est nécessaire ici.
    }

    disconnect() {
        console.log("Stimulus: cancel_carpool_controller déconnecté.");
        if (this.cancelModalInstance) {
            this.cancelModalInstance.hide();
            // Optionnel: this.cancelModalInstance.dispose(); si vous voulez détruire l'instance
        }
    }

    // Fonction utilitaire pour afficher des messages à l'utilisateur
    // Idéalement, cette fonction serait dans un module utilitaire partagé ou dans un "base controller"
    // pour éviter la duplication.
    alertUser(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top mt-3 mx-auto w-50`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv) {
                // Tente de récupérer l'instance Alert Bootstrap pour la gérer proprement
                const bsAlert = Modal.getInstance(alertDiv); 
                if (bsAlert) { 
                    bsAlert.dispose(); // Si c'est une instance Bootstrap Alert, la détruire
                } else {
                    alertDiv.remove(); // Sinon, simplement supprimer l'élément DOM
                }
            }
        }, 5000);
    }

    // Méthode appelée quand le bouton d'annulation de covoiturage (chauffeur) est cliqué.
    // Cette méthode doit être liée via : data-action="click->cancel-carpool#showCancelCarpoolModal"
    showCancelCarpoolModal(e) {
        const button = e.currentTarget; // currentTarget est l'élément HTML avec le data-action
        this.carpoolIdToCancel = button.dataset.carpoolId; // Récupère l'ID du covoiturage depuis le bouton
        this.cancelModalInstance.show(); // Affiche la modale de confirmation
    }

    // Méthode appelée quand le bouton de confirmation d'annulation (dans la modale) est cliqué.
    // Cette méthode doit être liée via : data-action="click->cancel-carpool#confirmCancelCarpool"
    async confirmCancelCarpool() {
        if (!this.carpoolIdToCancel) {
            console.error("Aucun ID de covoiturage à annuler n'a été défini.");
            return;
        }

        this.cancelModalInstance.hide(); // Cache la modale immédiatement

        try {
            const response = await fetch(`/api/covoiturage/${this.carpoolIdToCancel}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Envoie un corps de requête vide
            });

            const result = await response.json();

            if (response.ok) {
                console.log('Annulation réussie:', result.message);
                this.alertUser('success', result.message);
                
                // Recharge la page via Turbo pour rafraîchir l'interface utilisateur.
                // Cela est important car le covoiturage devrait disparaître des listes.
                Turbo.visit(window.location.href);

            } else {
                console.error('Erreur lors de l\'annulation:', result.message);
                this.alertUser('danger', result.message || 'Une erreur est survenue lors de l\'annulation.'); 
            }

        } catch (error) {
            console.error('Erreur réseau ou inattendue:', error);
            this.alertUser('danger', 'Impossible de communiquer avec le serveur pour annuler le covoiturage.'); 
        } finally {
            this.carpoolIdToCancel = null; // Réinitialise l'ID pour éviter des annulations accidentelles
        }
    }
}