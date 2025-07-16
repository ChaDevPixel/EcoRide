// On encapsule toute la logique dans une fonction pour la rendre compatible avec Turbo
const initializeParticipation = () => {
    const confirmBtn = document.getElementById('confirm-participation-btn');
    const participationModalElement = document.getElementById('participationModal');

    if (!confirmBtn || !participationModalElement) {
        return; // Le bouton ou la modale n'est pas sur cette page
    }

    // Tente de récupérer l'instance de la modale si elle existe, sinon en crée une nouvelle
    const participationModal = bootstrap.Modal.getInstance(participationModalElement) || new bootstrap.Modal(participationModalElement);

    confirmBtn.addEventListener('click', async () => {
        const covoiturageId = confirmBtn.dataset.covoiturageId;
        if (!covoiturageId) {
            console.error("ID du covoiturage non trouvé.");
            return;
        }

        // Ajoute un état de chargement pour un meilleur retour visuel
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Confirmation...';

        try {
            const response = await fetch(`/api/covoiturage/${covoiturageId}/participate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const result = await response.json();

            if (result.success) {
                // CORRECTION : Redirection vers la page "Mon Compte" après succès.
                // Pour un message de succès, l'idéal serait d'utiliser les "flash messages" de Symfony.
                window.location.href = '/mon-compte'; 

            } else {
                // Afficher l'erreur dans la modale
                const modalBody = participationModalElement.querySelector('.modal-body');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'alert alert-danger mt-3';
                errorDiv.textContent = result.message || 'Une erreur est survenue.';
                
                const existingError = modalBody.querySelector('.alert-danger');
                if (existingError) {
                    existingError.remove();
                }
                
                modalBody.appendChild(errorDiv);

                // Réactiver le bouton en cas d'erreur
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Confirmer ma participation';
            }

        } catch (error) {
            console.error("Erreur lors de l'appel API de participation:", error);
            alert("Une erreur de communication est survenue. Veuillez réessayer.");
            // Réactiver le bouton en cas d'erreur
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = 'Confirmer ma participation';
        }
    });
};

// On écoute à la fois le chargement initial et les navigations Turbo
document.addEventListener('DOMContentLoaded', initializeParticipation);
document.addEventListener('turbo:load', initializeParticipation);
