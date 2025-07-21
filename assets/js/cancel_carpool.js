const initializeCancelCarpoolPage = () => {

    const tripTabElement = document.getElementById('trip-tab');
    if (tripTabElement && tripTabElement._cancelCarpoolInitialized) {
        return; 
    }
    if (tripTabElement) {
        tripTabElement._cancelCarpoolInitialized = true; 
    }

    console.log("cancel_carpool.js: Script chargé et initialisé.");

    const driverTripsContainer = document.getElementById('driver-trips-container');
    const cancelModalElement = document.getElementById('cancelCarpoolModal');
    const confirmCancelBtn = document.getElementById('confirmCancelCarpoolBtn');
    let carpoolIdToCancel = null; 

    if (!cancelModalElement) {
        console.warn("cancel_carpool.js: L'élément #cancelCarpoolModal n'a pas été trouvé. Le script d'annulation de covoiturage ne s'exécutera pas.");
        return;
    }

    const cancelModal = new window.bootstrap.Modal(cancelModalElement);

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
                const bsAlert = window.bootstrap.Alert.getInstance(alertDiv); 
                if (bsAlert) { 
                    bsAlert.dispose(); 
                } else {
                    alertDiv.remove(); 
                }
            }
        }, 5000);
    }

    if (driverTripsContainer) {
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

    if (confirmCancelBtn) {
        if (!confirmCancelBtn._cancelConfirmListenerAdded) {
            confirmCancelBtn.addEventListener('click', async () => {
                if (!carpoolIdToCancel) {
                    console.error("cancel_carpool.js: Aucun ID de covoiturage à annuler n'a été défini.");
                    return;
                }

                cancelModal.hide(); 

                try {
                    const response = await fetch(`/api/covoiturage/${carpoolIdToCancel}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({})
                    });

                    const result = await response.json();

                    if (response.ok) {
                        alertUser('success', result.message);
                        window.location.reload(); 
                    } else {
                        alertUser('danger', result.message || 'Une erreur est survenue lors de l\'annulation.');
                    }
                } catch (error) {
                    console.error('cancel_carpool.js: Erreur réseau ou inattendue lors de l\'annulation:', error);
                    alertUser('danger', 'Impossible de communiquer avec le serveur pour annuler le covoiturage.');
                } finally {
                    carpoolIdToCancel = null; 
                }
            });
            confirmCancelBtn._cancelConfirmListenerAdded = true;
        }
    }

}; 

document.addEventListener('DOMContentLoaded', initializeCancelCarpoolPage);
document.addEventListener('turbo:load', initializeCancelCarpoolPage);