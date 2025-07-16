// public/js/participation.js
console.log("Fichier participation.js en cours d'analyse.");

// On définit le gestionnaire d'événements une seule fois.
const handleParticipationClick = async (event) => {
    // Ce log s'affichera à CHAQUE clic sur la page.
    console.log("Clic détecté sur le document. Cible :", event.target);

    // Fonction pour afficher les messages sur la page principale
    function displayDetailsMessage(message, type) {
        const messageContainer = document.getElementById('detailsMessageContainer');
        if (!messageContainer) return;
        messageContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    // --- GESTION DU CLIC SUR LE BOUTON "PARTICIPER" ---
    if (event.target.matches('#participateButton')) {
        console.log("Le clic correspond bien au bouton #participateButton.");
        const participationModalElement = document.getElementById('participationModal');
        if (participationModalElement) {
            const participationModal = bootstrap.Modal.getInstance(participationModalElement) || new bootstrap.Modal(participationModalElement);
            participationModal.show();
        }
    }

    // --- GESTION DU CLIC SUR LE BOUTON DE CONFIRMATION DANS LA MODALE ---
    if (event.target.matches('#confirm-participation-btn')) {
        console.log("Le clic correspond bien au bouton #confirm-participation-btn.");
        const confirmBtn = event.target;
        const participateButton = document.getElementById('participateButton');
        const covoiturageId = confirmBtn.dataset.covoiturageId;

        if (!covoiturageId || !participateButton) {
            console.error("ID du covoiturage ou bouton principal non trouvé.");
            return;
        }

        const participationModalElement = document.getElementById('participationModal');
        const participationModal = bootstrap.Modal.getInstance(participationModalElement);
        if (participationModal) {
            participationModal.hide();
        }
        
        participateButton.disabled = true;
        participateButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Participation...';

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
            displayDetailsMessage(error.message, 'danger');
            
            participateButton.disabled = false;
            participateButton.innerHTML = 'Participer';
        }
    }
};

/**
 * Cette fonction s'assure que notre écouteur d'événements est bien attaché au corps du document.
 */
const initializeParticipationListeners = () => {
    // Ce log s'affichera à chaque chargement de page (normal ou Turbo)
    console.log("Initialisation des écouteurs de participation...");
    document.body.removeEventListener('click', handleParticipationClick);
    document.body.addEventListener('click', handleParticipationClick);
    console.log('Écouteur de participation attaché.');
};

// On exécute notre fonction d'initialisation à la fois au chargement initial de la page
// et après chaque navigation gérée par Turbo.
document.addEventListener('DOMContentLoaded', initializeParticipationListeners);
document.addEventListener('turbo:load', initializeParticipationListeners);
