// public/js/cancel_carpool.js

document.addEventListener('DOMContentLoaded', () => {
    // Sélectionnez le conteneur parent où les covoiturages du chauffeur sont affichés
    // C'est le 'driver-trips-container' dans add_carpool.js
    const driverTripsContainer = document.getElementById('driver-trips-container');
    
    const cancelModalElement = document.getElementById('cancelCarpoolModal');
    
    // Vérifiez si la modal existe avant d'essayer de l'initialiser
    if (!cancelModalElement) {
        console.warn("L'élément #cancelCarpoolModal n'a pas été trouvé. Le script d'annulation de covoiturage ne s'exécutera pas.");
        return;
    }

    const cancelModal = new bootstrap.Modal(cancelModalElement);
    const confirmCancelBtn = document.getElementById('confirmCancelCarpoolBtn');
    let carpoolIdToCancel = null; // Variable pour stocker l'ID du covoiturage à annuler

    // NOUVEAU : Utilisation de la délégation d'événements sur le conteneur parent
    if (driverTripsContainer) {
        driverTripsContainer.addEventListener('click', (event) => {
            console.log('Clic détecté sur driverTripsContainer.'); // Debug log
            // Vérifie si l'élément cliqué ou l'un de ses parents correspond au bouton d'annulation
            const button = event.target.closest('.cancel-carpool-btn');
            if (button) {
                console.log('Bouton d\'annulation trouvé:', button); // Debug log
                carpoolIdToCancel = button.dataset.carpoolId;
                console.log('ID du covoiturage à annuler:', carpoolIdToCancel); // Debug log
                cancelModal.show();
            } else {
                console.log('Clic non sur un bouton d\'annulation.'); // Debug log
            }
        });
    } else {
        console.warn("L'élément #driver-trips-container n'a pas été trouvé. Les boutons d'annulation de covoiturage ne seront pas interactifs.");
    }

    // Écouteur d'événements pour la confirmation d'annulation dans la modal
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', async () => {
            if (!carpoolIdToCancel) {
                console.error("Aucun ID de covoiturage à annuler n'a été défini.");
                return;
            }

            cancelModal.hide(); // Cache la modal

            try {
                const response = await fetch(`/api/covoiturage/${carpoolIdToCancel}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Si vous utilisez des tokens CSRF, ajoutez-les ici
                        // 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({}) // Corps vide ou des données si nécessaire
                });

                const result = await response.json();

                if (response.ok) {
                    // Succès de l'annulation
                    console.log('Annulation réussie:', result.message);
                    // Afficher un message de succès à l'utilisateur
                    alertUser('success', result.message); // Utilisation d'une fonction d'alerte personnalisée
                    
                    // NOUVEAU : Mettre à jour l'interface utilisateur sans supprimer l'élément
                    const carpoolElement = document.getElementById(`covoiturage-${carpoolIdToCancel}`);
                    if (carpoolElement) {
                        // Mettre à jour le statut visuel
                        const statusSpan = carpoolElement.querySelector('span:nth-of-type(2)'); // Assurez-vous que c'est le bon sélecteur pour le statut
                        if (statusSpan) {
                            statusSpan.textContent = 'Annulé';
                            statusSpan.className = 'fw-bold ms-md-auto me-md-2 mb-2 mb-md-0 text-danger'; // Mettre à jour les classes pour le style
                        }

                        // Cacher les boutons d'action (Commencer, Terminer, Annuler)
                        const actionButtonsDiv = carpoolElement.querySelector('.d-flex.gap-2'); // Assurez-vous que c'est le bon sélecteur
                        if (actionButtonsDiv) {
                            actionButtonsDiv.innerHTML = ''; // Supprime tous les boutons d'action
                        }
                        
                        // Optionnel : Ajouter un badge "Annulé" ou une autre indication
                        const badgeAnnule = document.createElement('span');
                        badgeAnnule.className = 'badge bg-danger ms-2';
                        badgeAnnule.textContent = 'Annulé';
                        carpoolElement.querySelector('h5')?.insertAdjacentElement('afterend', badgeAnnule); // Ajoute après le titre du covoiturage

                    } else {
                        // Si l'élément n'est pas trouvé, recharger la page est une option simple
                        window.location.reload(); 
                    }

                } else {
                    // Échec de l'annulation
                    console.error('Erreur lors de l\'annulation:', result.message);
                    alertUser('danger', result.message || 'Une erreur est survenue lors de l\'annulation.'); // Utilisation d'une fonction d'alerte personnalisée
                }

            } catch (error) {
                console.error('Erreur réseau ou inattendue:', error);
                alertUser('danger', 'Impossible de communiquer avec le serveur pour annuler le covoiturage.'); // Utilisation d'une fonction d'alerte personnalisée
            } finally {
                carpoolIdToCancel = null; // Réinitialise l'ID
            }
        });
    }

    // Fonction utilitaire pour afficher des messages à l'utilisateur (remplace alert())
    // Vous devrez adapter cette fonction à votre système de notification/message existant
    function alertUser(type, message) {
        // Exemple simple : créer un élément div et l'ajouter au body
        // Dans un vrai projet, utilisez un système de toasts, modals, etc.
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top mt-3 mx-auto w-50`;
        alertDiv.setAttribute('role', 'alert');
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.body.appendChild(alertDiv);

        // Faire disparaître l'alerte après quelques secondes
        setTimeout(() => {
            if (alertDiv) {
                const bsAlert = bootstrap.Alert.getInstance(alertDiv);
                if (bsAlert) {
                    bsAlert.dispose();
                } else {
                    alertDiv.remove();
                }
            }
        }, 5000);
    }
});
