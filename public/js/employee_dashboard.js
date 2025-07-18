// public/js/employee_dashboard.js

// Le flag employeeDashboardInitialized n'est plus nécessaire avec l'event delegation
// let employeeDashboardInitialized = false; 

function initializeEmployeeDashboard() {
    // Déclaration des éléments DOM et des variables.
    // Ces déclarations sont locales à cette fonction, donc elles sont recréées à chaque appel,
    // ce qui est correct et évite l'erreur "already been declared".
    const pendingReviewsContainer = document.getElementById('pending-reviews-container');
    const noPendingReviewsMessage = document.getElementById('no-pending-reviews');
    const disputedCarpoolsContainer = document.getElementById('disputed-carpools-container');
    const noDisputedCarpoolsMessage = document.getElementById('no-disputed-carpools');
    const rejectedReviewsContainer = document.getElementById('rejected-reviews-container');
    const noRejectedReviewsMessage = document.getElementById('no-rejected-reviews');
    const resolvedDisputesContainer = document.getElementById('resolved-disputes-container');
    const noResolvedDisputesMessage = document.getElementById('no-resolved-disputes');
    
    const rejectModalElement = document.getElementById('rejectConfirmModal');
    // Assurez-vous que Bootstrap est chargé avant d'essayer d'initialiser le modal.
    const rejectModal = rejectModalElement ? new bootstrap.Modal(rejectModalElement) : null;
    const confirmRejectBtn = document.getElementById('confirm-reject-btn');

    // --- Fonctions utilitaires pour charger les données depuis l'API ---
    async function loadData(url, container, noDataMessage) {
        // Vérification de l'existence du conteneur et du message avant de procéder
        if (!container || !noDataMessage) {
            console.warn(`Conteneur ou message manquant pour l'URL: ${url}. Chargement annulé.`);
            return [];
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur serveur lors du chargement des données.');
            const data = await response.json();

            // Nettoyage du conteneur avant d'ajouter de nouvelles données
            container.innerHTML = '';
            
            if (data.length === 0) {
                // Si aucune donnée, afficher le message "pas de données"
                noDataMessage.style.display = 'block';
                // Ajouter le message au conteneur s'il n'y est pas déjà
                if (noDataMessage.parentNode !== container) {
                    container.appendChild(noDataMessage);
                }
                return []; // Retourne un tableau vide
            }
            // Si des données sont présentes, masquer le message "pas de données"
            noDataMessage.style.display = 'none';
            return data;
        } catch (error) {
            // Afficher l'erreur dans le message "pas de données"
            noDataMessage.textContent = `Erreur de chargement: ${error.message}`;
            noDataMessage.style.display = 'block'; // S'assurer que le message d'erreur est visible
            console.error('Erreur lors du chargement des données:', error);
            return [];
        }
    }

    // --- Fonctions pour charger et afficher les différents types de données ---
    async function loadPendingReviews() {
        if (!pendingReviewsContainer || !noPendingReviewsMessage) return; // Vérification spécifique
        const reviews = await loadData('/api/employee/pending-reviews', pendingReviewsContainer, noPendingReviewsMessage);
        if (!reviews) return; // Si loadData retourne null ou undefined en cas d'erreur
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'card mb-3';
            reviewCard.id = `review-${review.id}`;
            reviewCard.innerHTML = `
                <div class="card-body">
                    <p class="card-text">"${review.commentaire}"</p>
                    <footer class="blockquote-footer">
                        Note: <span class="text-warning">${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}</span><br>
                        Par <strong>${review.auteur.pseudo}</strong> sur <strong>${review.utilisateur.pseudo}</strong> (Covoit. n°${review.covoiturage.id})
                    </footer>
                </div>
                <div class="card-footer bg-light text-end">
                    <button class="btn btn-primary btn-sm rounded-pill px-3 approve-review-btn" data-review-id="${review.id}">Approuver</button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 reject-review-btn" data-review-id="${review.id}">Rejeter</button>
                </div>`;
            pendingReviewsContainer.appendChild(reviewCard);
        });
    }

    async function loadDisputedCarpools() {
        if (!disputedCarpoolsContainer || !noDisputedCarpoolsMessage) return; // Vérification spécifique
        const carpools = await loadData('/api/employee/disputed-carpools', disputedCarpoolsContainer, noDisputedCarpoolsMessage);
        if (!carpools) return;
        carpools.forEach(carpool => {
            const disputeCard = document.createElement('div');
            disputeCard.className = 'card mb-3';
            disputeCard.id = `dispute-${carpool.id}`;
            
            const disputeReview = carpool.avis.find(a => a.raisonLitige);
            // Fallbacks pour les données manquantes
            const passenger = disputeReview ? disputeReview.auteur : { prenom: 'N/A', nom: '', pseudo: 'N/A', email: 'N/A', telephone: 'N/A' };
            const driver = carpool.chauffeur || { prenom: 'N/A', nom: '', pseudo: 'N/A', email: 'N/A', telephone: 'N/A' };
            const dateValue = carpool.dateDepart?.date || carpool.dateDepart;
            let dateDepart = 'Date inconnue';
            if (typeof dateValue === 'string') {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) dateDepart = date.toLocaleDateString('fr-FR');
            }

            disputeCard.innerHTML = `
                <div class="card-body">
                    <h6 class="card-title">Covoiturage n°${carpool.id} - ${carpool.villeDepart} → ${carpool.villeArrivee}</h6>
                    <p class="card-text"><small><strong>Raison :</strong> "${disputeReview ? disputeReview.raisonLitige : 'N/A'}"</small></p>
                    
                    <!-- Nouvelle section déroulante pour les infos Passager/Chauffeur -->
                    <div class="mb-2">
                        <a class="btn btn-link text-dark fw-semibold p-0" data-bs-toggle="collapse" href="#passenger-driver-info-${carpool.id}" role="button" aria-expanded="false" aria-controls="passenger-driver-info-${carpool.id}">
                            Détails des parties impliquées <span class="ms-2 arrow-icon">&#9660;</span>
                        </a>
                        <div class="collapse mt-2" id="passenger-driver-info-${carpool.id}">
                            <div class="border p-2 rounded bg-light">
                                <p class="mb-1"><strong>Passager :</strong> ${passenger.prenom} ${passenger.nom} (${passenger.pseudo})</p>
                                <p class="mb-1 ms-3">Email : ${passenger.email}</p>
                                <p class="mb-0 ms-3">N° de tel : ${passenger.telephone}</p>
                                <hr class="my-2">
                                <p class="mb-1"><strong>Chauffeur :</strong> ${driver.prenom} ${driver.nom} (${driver.pseudo})</p>
                                <p class="mb-1 ms-3">Email : ${driver.email}</p>
                                <p class="mb-0 ms-3">N° de tel : ${driver.telephone}</p>
                            </div>
                        </div>
                    </div>
                    <!-- Fin de la nouvelle section -->

                    <button class="btn btn-secondary btn-sm rounded-pill px-3 moderate-dispute-btn" data-bs-toggle="collapse" data-bs-target="#moderate-form-${carpool.id}">Modérer ce litige</button>
                    <div class="collapse mt-3" id="moderate-form-${carpool.id}">
                        <div class="border p-3 rounded">
                            <form class="resolve-dispute-form" data-dispute-id="${carpool.id}" novalidate>
                                <div class="mb-3">
                                    <label class="form-label fw-bold">1. Contact Passager</label>
                                    <div class="form-check"><input class="form-check-input" type="checkbox" name="passagerContacte"><label class="form-check-label">Passager contacté</label></div>
                                    <textarea class="form-control form-control-sm mt-2" name="commentairePassager" placeholder="Commentaire sur le contact avec le passager..."></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label fw-bold">2. Contact Chauffeur</label>
                                    <div class="form-check"><input class="form-check-input" type="checkbox" name="chauffeurContacte"><label class="form-check-label">Chauffeur contacté</label></div>
                                    <textarea class="form-control form-control-sm mt-2" name="commentaireChauffeur" placeholder="Commentaire sur le contact avec le chauffeur..."></textarea>
                                </div>
                                <div class="form-text text-danger mt-2" id="dispute-form-message-${carpool.id}"></div>
                                <hr>
                                <div class="text-end">
                                    <!-- Boutons avec styles mis à jour -->
                                    <button type="submit" class="btn btn-primary btn-sm rounded-pill px-3" name="decision" value="approve">Valider l'avis et clôturer</button>
                                    <button type="submit" class="btn btn-danger btn-sm rounded-pill px-3" name="decision" value="reject">Rejeter l'avis et clôturer</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
            disputedCarpoolsContainer.appendChild(disputeCard);
        });
    }

    async function loadRejectedReviews() {
        if (!rejectedReviewsContainer || !noRejectedReviewsMessage) return; // Vérification spécifique
        const reviews = await loadData('/api/employee/rejected-reviews', rejectedReviewsContainer, noRejectedReviewsMessage);
        if (!reviews) return;
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'card mb-3 bg-light';
            reviewCard.innerHTML = `<div class="card-body"><p class="card-text text-muted"><em>"${review.commentaire}"</em></p><footer class="blockquote-footer">Rejeté le ${new Date(review.creeLe).toLocaleDateString('fr-FR')}<br>Note initiale: <span class="text-warning">${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}</span></footer></div>`;
            rejectedReviewsContainer.appendChild(reviewCard);
        });
    }

    async function loadResolvedDisputes() {
        if (!resolvedDisputesContainer || !noResolvedDisputesMessage) return; // Vérification spécifique
        const carpools = await loadData('/api/employee/resolved-disputes', resolvedDisputesContainer, noResolvedDisputesMessage);
        if (!carpools) return;
        carpools.forEach(carpool => {
            const details = carpool.moderationDetails;
            const decision = details.decisionFinale === 'approve' ? '<span class="badge bg-success">Avis validé</span>' : '<span class="badge bg-danger">Avis rejeté</span>';
            
            // Correction pour l'erreur "Cannot read properties of undefined (reading 'date')"
            const dateToUse = details.dateCloture?.date || details.dateCloture;
            const dateClotureFormatted = dateToUse ? new Date(dateToUse).toLocaleDateString('fr-FR') : 'Date inconnue';

            const card = document.createElement('div');
            card.className = 'card mb-3 bg-light';
            card.innerHTML = `<div class="card-body"><h6 class="card-title">Covoiturage n°${carpool.id} - ${carpool.villeDepart} → ${carpool.villeArrivee}</h6><p class="card-text mb-1"><small>Clôturé le ${dateClotureFormatted} - Décision : ${decision}</small></p></div>`;
            resolvedDisputesContainer.appendChild(card);
        });
    }
    
    // --- Fonctions de gestion d'événements (déplacées pour être attachées une seule fois) ---
    // Ces fonctions sont maintenant des gestionnaires d'événements délégués.
    // Elles sont appelées par les écouteurs sur 'document'.
    async function handleReviewActions(e) {
        // Utilisation de .closest() pour trouver le bouton ou un parent avec la classe
        const approveBtn = e.target.closest('.approve-review-btn');
        const rejectBtn = e.target.closest('.reject-review-btn');
        
        if (approveBtn) {
            const reviewId = approveBtn.dataset.reviewId;
            if (!reviewId) return;
            try {
                const response = await fetch(`/api/employee/reviews/${reviewId}/approve`, { method: 'POST' });
                if (!response.ok) throw new Error('L\'action d\'approbation a échoué.');
                document.getElementById(`review-${reviewId}`)?.remove();
                // Recharger toutes les sections après une action réussie
                loadPendingReviews();
                loadDisputedCarpools();
                loadRejectedReviews();
                loadResolvedDisputes();
            } catch (error) { 
                console.error(`Erreur lors de l'approbation de l'avis ${reviewId}:`, error);
            }
        }

        if (rejectBtn) {
            const reviewId = rejectBtn.dataset.reviewId;
            if (!reviewId) return;
            // Vérifier que confirmRejectBtn existe avant d'accéder à ses propriétés
            if (confirmRejectBtn) {
                confirmRejectBtn.dataset.reviewId = reviewId;
            }
            if (rejectModal) rejectModal.show(); // S'assurer que le modal existe avant de l'afficher
        }
    }

    async function handleRejectConfirmation(e) {
        const reviewId = e.target.dataset.reviewId;
        if (!reviewId) return;

        try {
            const response = await fetch(`/api/employee/reviews/${reviewId}/reject`, { method: 'POST' });
            if (!response.ok) throw new Error('L\'action de rejet a échoué.');
            
            if (rejectModal) rejectModal.hide();
            document.getElementById(`review-${reviewId}`)?.remove();
            // Recharger toutes les sections après une action réussie
            loadPendingReviews();
            loadDisputedCarpools();
            loadRejectedReviews();
            loadResolvedDisputes();
        } catch (error) { 
            console.error(`Erreur lors du rejet de l'avis ${reviewId}:`, error);
        }
    }

    async function handleDisputeResolution(e) {
        // Vérifier que l'événement provient d'un formulaire de résolution de litige
        const form = e.target.closest('.resolve-dispute-form');
        if (!form) return;

        e.preventDefault(); // Empêcher la soumission par défaut du formulaire

        const carpoolId = form.dataset.disputeId;
        // Trouver le bouton qui a déclenché la soumission
        const submitter = e.submitter; 
        if (!submitter) return; // Si aucun bouton n'a déclenché la soumission, sortir.

        const decision = submitter.value;
        const messageContainer = form.querySelector(`#dispute-form-message-${carpoolId}`);
        
        // --- Validation du formulaire ---
        const passagerContacte = form.querySelector('input[name="passagerContacte"]').checked;
        const chauffeurContacte = form.querySelector('input[name="chauffeurContacte"]').checked;
        const commentairePassager = form.querySelector('textarea[name="commentairePassager"]').value.trim();
        const commentaireChauffeur = form.querySelector('textarea[name="commentaireChauffeur"]').value.trim();

        // La validation existante est correcte et couvre les exigences
        if (!passagerContacte || !chauffeurContacte || !commentairePassager || !commentaireChauffeur) {
            if (messageContainer) messageContainer.textContent = 'Veuillez cocher les deux cases et remplir tous les commentaires avant de clôturer.';
            return; // Empêche la soumission si la validation échoue
        }
        if (messageContainer) messageContainer.textContent = ''; // Effacer les erreurs précédentes

        // --- Désactiver les boutons pour éviter les doubles clics ---
        const approveBtn = form.querySelector('button[value="approve"]');
        const rejectBtn = form.querySelector('button[value="reject"]');
        const originalButtonText = submitter.innerHTML; // Utiliser submitter ici
        if (approveBtn) approveBtn.disabled = true;
        if (rejectBtn) rejectBtn.disabled = true;
        submitter.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Clôture...';

        const data = {
            decision: decision,
            passagerContacte: passagerContacte,
            commentairePassager: commentairePassager,
            chauffeurContacte: chauffeurContacte,
            commentaireChauffeur: commentaireChauffeur,
        };

        try {
            const response = await fetch(`/api/employee/disputes/${carpoolId}/resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur serveur lors de la résolution du litige.');
            
            document.getElementById(`dispute-${carpoolId}`)?.remove();
            // Recharger toutes les sections après une action réussie
            loadPendingReviews();
            loadDisputedCarpools();
            loadRejectedReviews();
            loadResolvedDisputes();
        } catch (error) {
            console.error(`Erreur lors de la résolution du litige ${carpoolId}:`, error);
            // En cas d'erreur, réactiver les boutons
            if (approveBtn) approveBtn.disabled = false;
            if (rejectBtn) rejectBtn.disabled = false;
            submitter.innerHTML = originalButtonText; // Utiliser submitter ici
        }
    }

    // --- Attacher les Event Listeners sur 'document' pour l'affectation d'événements ---
    // Ces écouteurs sont attachés une seule fois et fonctionneront pour tous les éléments
    // correspondants, même s'ils sont ajoutés dynamiquement par Turbo.
    document.addEventListener('click', handleReviewActions);
    // L'écouteur pour confirmRejectBtn peut rester direct s'il est hors du swap de body
    // ou être délégué si le modal est aussi remplacé. Pour l'instant, on le garde direct
    // mais on s'assure qu'il existe.
    if (confirmRejectBtn) {
        document.addEventListener('click', (e) => {
            if (e.target === confirmRejectBtn) {
                handleRejectConfirmation(e);
            }
        });
    }
    document.addEventListener('submit', handleDisputeResolution);


    // --- Chargement initial des données ---
    // Ces fonctions sont appelées à chaque fois que initializeEmployeeDashboard est exécutée,
    // garantissant que les données sont toujours à jour.
    loadPendingReviews();
    loadDisputedCarpools();
    loadRejectedReviews();
    loadResolvedDisputes();
}

// Nous n'avons besoin que de l'écouteur turbo:load pour gérer les navigations Turbo
// et le chargement initial de la page.
document.addEventListener('turbo:load', initializeEmployeeDashboard);