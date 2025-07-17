import { Controller } from '@hotwired/stimulus';

// DEBUG: Ce message s'affichera si le navigateur analyse bien ce fichier.
console.log("DEBUG: Fichier participation_controller.js en cours d'analyse.");

export default class extends Controller {
    // Les "targets" nous permettent de référencer facilement les éléments HTML importants.
    static targets = ["participateButton", "confirmButton", "modal", "messageContainer"];

    /**
     * Stimulus appelle cette méthode automatiquement quand le contrôleur est connecté au DOM.
     * C'est le log le plus important.
     */
    connect() {
        console.log("DEBUG: Le contrôleur Stimulus 'participation' s'est bien CONNECTÉ à l'élément:", this.element);
    }

    /**
     * Stimulus appelle cette méthode quand le contrôleur est déconnecté du DOM (ex: changement de page).
     */
    disconnect() {
        console.log("DEBUG: Le contrôleur Stimulus 'participation' a été DÉCONNECTÉ.");
    }

    /**
     * Ouvre la modale de confirmation lorsque l'utilisateur clique sur "Participer".
     */
    openConfirmationModal() {
        // DEBUG: Ce message doit apparaître quand vous cliquez sur "Participer".
        console.log("DEBUG: Action openConfirmationModal() déclenchée.");
        const modal = new bootstrap.Modal(this.modalTarget);
        if (this.hasMessageContainerTarget) {
            this.messageContainerTarget.innerHTML = ''; // Nettoie les anciens messages.
        }
        modal.show();
    }

    /**
     * Est appelée lorsque l'utilisateur clique sur "Confirmer" dans la modale.
     */
    async submitParticipation() {
        // DEBUG: Ce message doit apparaître quand vous cliquez sur "Confirmer ma participation".
        console.log("DEBUG: Action submitParticipation() déclenchée.");
        const covoiturageId = this.confirmButtonTarget.dataset.covoiturageId;
        if (!covoiturageId) {
            console.error("ID du covoiturage non trouvé.");
            return;
        }

        const modal = bootstrap.Modal.getInstance(this.modalTarget);
        if (modal) {
            modal.hide();
        }

        this.participateButtonTarget.disabled = true;
        this.participateButtonTarget.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Participation...';

        try {
            const response = await fetch(`/api/covoiturage/${covoiturageId}/participer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Une erreur inconnue est survenue.');
            }

            window.location.href = '/mon-compte#trip';

        } catch (error) {
            console.error("Erreur lors de l'appel API de participation:", error);
            this.displayMessage(error.message, 'danger');
            
            this.participateButtonTarget.disabled = false;
            this.participateButtonTarget.innerHTML = 'Participer';
        }
    }

    /**
     * Affiche un message d'erreur ou de succès sur la page.
     */
    displayMessage(message, type) {
        if (this.hasMessageContainerTarget) {
            this.messageContainerTarget.innerHTML = `
                <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
        }
    }
}