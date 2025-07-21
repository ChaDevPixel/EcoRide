// assets/js/cancel_carpool.js

// Encapsule toute la logique dans une fonction pour la rendre compatible avec Turbo
const initializeCancelCarpoolPage = () => {
    // Flag pour éviter les écouteurs multiples si initializeCancelCarpoolPage est appelé plusieurs fois
    // par DOMContentLoaded et turbo:load sur la même page sans rechargement complet.
    // On utilise un élément clé de la page pour marquer si le script a déjà été initialisé.
    const tripTabElement = document.getElementById('trip-tab');
    if (tripTabElement && tripTabElement._cancelCarpoolInitialized) {
        return; // Déjà initialisé pour cette instance de page
    }
    if (tripTabElement) {
        tripTabElement._cancelCarpoolInitialized = true; // Marque comme initialisé
    }

    console.log("cancel_carpool.js: Script chargé et initialisé.");

    // =====================================================================
    // SÉLECTEURS DOM ET VARIABLES (Déclarées avec const/let pour éviter les globales)
    // =====================================================================
    const driverTripsContainer = document.getElementById('driver-trips-container');
    const cancelModalElement = document.getElementById('cancelCarpoolModal');
    const confirmCancelBtn = document.getElementById('confirmCancelCarpoolBtn');
    let carpoolIdToCancel = null; // Variable pour stocker l'ID du covoiturage à annuler

    // Vérifie si la modale existe avant d'essayer de l'initialiser
    if (!cancelModalElement) {
        console.warn("cancel_carpool.js: L'élément #cancelCarpoolModal n'a pas été trouvé. Le script d'annulation de covoiturage ne s'exécutera pas.");
        return;
    }

    // Initialisation de la modale Bootstrap (accès via window.bootstrap)
    const cancelModal = new window.bootstrap.Modal(cancelModalElement);

    // =====================================================================
    // FONCTIONS UTILITAIRES
    // =====================================================================

    // Fonction pour afficher des messages à l'utilisateur (remplace alert())
    function alertUser(type, message) {
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
                const bsAlert = window.bootstrap.Alert.getInstance(alertDiv); 
                if (bsAlert) { 
                    bsAlert.dispose(); 
                } else {
                    alertDiv.remove(); 
                }
            }
        }, 5000);
    }

    // =====================================================================
    // GESTION DES ÉVÉNEMENTS
    // =====================================================================

    // Utilisation de la délégation d'événements sur le conteneur parent pour les boutons d'annulation du chauffeur
    if (driverTripsContainer) {
        // Pour éviter la duplication des écouteurs sur turbo:load
        if (!driverTripsContainer._cancelCarpoolListenerAdded) {
            driverTripsContainer.addEventListener('click', (event) => {
                const button = event.target.closest('.cancel-carpool-btn');
                if (button) {
                    carpoolIdToCancel = button.dataset.carpoolId;
                    cancelModal.show();
                }
            });
            driverTripsContainer._cancelCarpoolListenerAdded = true;
        }
    } else {
        console.warn("cancel_carpool.js: L'élément #driver-trips-container n'a pas été trouvé. Les boutons d'annulation de covoiturage ne seront pas interactifs.");
    }

    // Écouteur d'événements pour la confirmation d'annulation dans la modale
    if (confirmCancelBtn) {
        // Pour éviter la duplication des écouteurs sur turbo:load
        if (!confirmCancelBtn._cancelConfirmListenerAdded) {
            confirmCancelBtn.addEventListener('click', async () => {
                if (!carpoolIdToCancel) {
                    console.error("cancel_carpool.js: Aucun ID de covoiturage à annuler n'a été défini.");
                    return;
                }

                cancelModal.hide(); // Cache la modale

                try {
                    const response = await fetch(`/api/covoiturage/${carpoolIdToCancel}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') // Décommenter si CSRF est utilisé
                        },
                        body: JSON.stringify({})
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alertUser('success', result.message);
                        // Recharge la page après succès pour rafraîchir la liste
                        window.location.reload(); 
                    } else {
                        alertUser('danger', result.message || 'Une erreur est survenue lors de l\'annulation.');
                    }
                } catch (error) {
                    console.error('cancel_carpool.js: Erreur réseau ou inattendue lors de l\'annulation:', error);
                    alertUser('danger', 'Impossible de communiquer avec le serveur pour annuler le covoiturage.');
                } finally {
                    carpoolIdToCancel = null; // Réinitialise l'ID
                }
            });
            confirmCancelBtn._cancelConfirmListenerAdded = true;
        }
    }

}; // Fin de initializeCancelCarpoolPage

// On écoute à la fois le chargement initial (pour la première visite) et les navigations Turbo (pour les navigations SPA)
document.addEventListener('DOMContentLoaded', initializeCancelCarpoolPage);
document.addEventListener('turbo:load', initializeCancelCarpoolPage);