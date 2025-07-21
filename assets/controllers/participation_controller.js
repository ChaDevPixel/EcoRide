import { Controller } from '@hotwired/stimulus';

console.log("DEBUG: Fichier participation_controller.js en cours d'analyse.");

export default class extends Controller {
    static targets = ["participateButton", "confirmButton", "modal", "messageContainer"];

    connect() {
        console.log("DEBUG: Le contrôleur Stimulus 'participation' s'est bien CONNECTÉ à l'élément:", this.element);
    }

    disconnect() {
        console.log("DEBUG: Le contrôleur Stimulus 'participation' a été DÉCONNECTÉ.");
    }

    openConfirmationModal() {
        console.log("DEBUG: Action openConfirmationModal() déclenchée.");
        const modal = new bootstrap.Modal(this.modalTarget);
        if (this.hasMessageContainerTarget) {
            this.messageContainerTarget.innerHTML = ''; 
        }
        modal.show();
    }

    async submitParticipation() {
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