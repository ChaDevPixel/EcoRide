let listenersAttached = false;

function initializeEmployeeDashboard() {
    const pendingReviewsContainer = document.getElementById('pending-reviews-container');
    const noPendingReviewsMessage = document.getElementById('no-pending-reviews');
    const disputedCarpoolsContainer = document.getElementById('disputed-carpools-container');
    const noDisputedCarpoolsMessage = document.getElementById('no-disputed-carpools');
    const rejectedReviewsContainer = document.getElementById('rejected-reviews-container');
    const noRejectedReviewsMessage = document.getElementById('no-rejected-reviews');
    const resolvedDisputesContainer = document.getElementById('resolved-disputes-container');
    const noResolvedDisputesMessage = document.getElementById('no-resolved-disputes');
    
    const rejectModalElement = document.getElementById('rejectConfirmModal');
    const rejectModal = rejectModalElement ? new bootstrap.Modal(rejectModalElement) : null;
    const confirmRejectBtn = document.getElementById('confirm-reject-btn');

    async function loadData(url, container, noDataMessage) {
        if (!container || !noDataMessage) {
            console.warn(`Conteneur ou message manquant pour l'URL: ${url}. Chargement annulé.`);
            return [];
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur serveur lors du chargement des données.');
            const data = await response.json();

            container.innerHTML = '';
            
            if (data.length === 0) {
                noDataMessage.style.display = 'block';
                if (noDataMessage.parentNode !== container) {
                    container.appendChild(noDataMessage);
                }
                return [];
            }
            noDataMessage.style.display = 'none';
            return data;
        } catch (error) {
            noDataMessage.textContent = `Erreur de chargement: ${error.message}`;
            noDataMessage.style.display = 'block';
            console.error('Erreur lors du chargement des données:', error);
            return [];
        }
    }

    async function loadPendingReviews() {
        if (!pendingReviewsContainer || !noPendingReviewsMessage) return; 
        const reviews = await loadData('/api/employee/pending-reviews', pendingReviewsContainer, noPendingReviewsMessage);
        if (!reviews) return;
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'card mb-3';
            reviewCard.id = `review-${review.id}`;
            reviewCard.innerHTML = `
                <div class="card-body">
                    <p class="card-text">"${review.commentaire}"</p>
                    <footer class="blockquote-footer mb-0">
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
        if (!disputedCarpoolsContainer || !noDisputedCarpoolsMessage) return;
        const carpools = await loadData('/api/employee/disputed-carpools', disputedCarpoolsContainer, noDisputedCarpoolsMessage);
        if (!carpools) return;
        carpools.forEach(carpool => {
            const disputeCard = document.createElement('div');
            disputeCard.className = 'card mb-3';
            disputeCard.id = `dispute-${carpool.id}`;
            
            const disputeReview = carpool.avis.find(a => a.raisonLitige);
            const passenger = disputeReview ? disputeReview.auteur : { prenom: 'N/A', nom: '', pseudo: 'N/A', email: 'N/A', telephone: 'N/A' };
            const driver = carpool.chauffeur || { prenom: 'N/A', nom: '', pseudo: 'N/A', email: 'N/A', telephone: 'N/A' };
            
            disputeCard.innerHTML = `
                <div class="card-body">
                    <h6 class="card-title">Covoiturage n°${carpool.id} - ${carpool.villeDepart} → ${carpool.villeArrivee}</h6>
                    <p class="card-text"><small><strong>Raison :</strong> "${disputeReview ? disputeReview.raisonLitige : 'N/A'}"</small></p>
                    
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
        if (!rejectedReviewsContainer || !noRejectedReviewsMessage) return;
        const reviews = await loadData('/api/employee/rejected-reviews', rejectedReviewsContainer, noRejectedReviewsMessage);
        if (!reviews) return;
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'card mb-3 bg-light';
            const authorPseudo = review.auteur?.pseudo || 'N/A';
            const carpoolId = review.covoiturage?.id || 'N/A';
            const formattedDate = new Date(review.creeLe).toLocaleDateString('fr-FR');

            reviewCard.innerHTML = `
                <div class="card-body">
                    <h6 class="card-title mb-1">
                        Avis de <strong>${authorPseudo}</strong> pour Covoit. n°${carpoolId}
                    </h6>
                    <p class="card-text text-muted mb-3"><em>"${review.commentaire}"</em></p>
                    <footer class="blockquote-footer mb-0">
                        Rejeté le ${formattedDate}<br>
                        Note initiale: <span class="text-warning">${'★'.repeat(review.note)}${'☆'.repeat(5 - review.note)}</span>
                    </footer>
                </div>`;
            rejectedReviewsContainer.appendChild(reviewCard);
        });
    }

    async function loadResolvedDisputes() {
        if (!resolvedDisputesContainer || !noResolvedDisputesMessage) return;
        const carpools = await loadData('/api/employee/resolved-disputes', resolvedDisputesContainer, noResolvedDisputesMessage);
        if (!carpools) return;
        carpools.forEach(carpool => {
            const details = carpool.moderationDetails;
            const decision = details.decisionFinale === 'approve' ? '<span class="badge bg-primary">Avis validé</span>' : '<span class="badge bg-danger">Avis rejeté</span>';
            const dateToUse = details.dateCloture?.date || details.dateCloture;
            const dateClotureFormatted = dateToUse ? new Date(dateToUse).toLocaleDateString('fr-FR') : 'Date inconnue';

            const card = document.createElement('div');
            card.className = 'card mb-3 bg-light';
            card.innerHTML = `<div class="card-body"><h6 class="card-title">Covoiturage n°${carpool.id} - ${carpool.villeDepart} → ${carpool.villeArrivee}</h6><p class="card-text mb-1"><small>Clôturé le ${dateClotureFormatted} - Décision : ${decision}</small></p></div>`;
            resolvedDisputesContainer.appendChild(card);
        });
    }
    
    async function handleReviewActions(e) {
        const approveBtn = e.target.closest('.approve-review-btn');
        const rejectBtn = e.target.closest('.reject-review-btn');
        
        if (approveBtn) {
            const reviewId = approveBtn.dataset.reviewId;
            if (!reviewId) return;
            try {
                const response = await fetch(`/api/employee/reviews/${reviewId}/approve`, { method: 'POST' });
                if (!response.ok) throw new Error('L\'action d\'approbation a échoué.');
                document.getElementById(`review-${reviewId}`)?.remove();
                loadPendingReviews();
                loadRejectedReviews();
            } catch (error) { 
                console.error(`Erreur lors de l'approbation de l'avis ${reviewId}:`, error);
            }
        }

        if (rejectBtn) {
            const reviewId = rejectBtn.dataset.reviewId;
            if (!reviewId && confirmRejectBtn) {
                confirmRejectBtn.dataset.reviewId = reviewId;
            }
            if (rejectModal) rejectModal.show();
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
            loadPendingReviews();
            loadRejectedReviews();
        } catch (error) { 
            console.error(`Erreur lors du rejet de l'avis ${reviewId}:`, error);
        }
    }

    async function handleDisputeResolution(e) {
        const form = e.target.closest('.resolve-dispute-form');
        if (!form) return;

        e.preventDefault();

        const carpoolId = form.dataset.disputeId;
        const submitter = e.submitter; 
        if (!submitter) return;

        const decision = submitter.value;
        const messageContainer = form.querySelector(`#dispute-form-message-${carpoolId}`);
        
        const passagerContacte = form.querySelector('input[name="passagerContacte"]').checked;
        const chauffeurContacte = form.querySelector('input[name="chauffeurContacte"]').checked;
        const commentairePassager = form.querySelector('textarea[name="commentairePassager"]').value.trim();
        const commentaireChauffeur = form.querySelector('textarea[name="commentaireChauffeur"]').value.trim();

        if (!passagerContacte || !chauffeurContacte || !commentairePassager || !commentaireChauffeur) {
            if (messageContainer) messageContainer.textContent = 'Veuillez cocher les deux cases et remplir tous les commentaires avant de clôturer.';
            return;
        }
        if (messageContainer) messageContainer.textContent = '';

        const approveBtn = form.querySelector('button[value="approve"]');
        const rejectBtn = form.querySelector('button[value="reject"]');
        const originalButtonText = submitter.innerHTML;
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
            loadDisputedCarpools();
            loadResolvedDisputes();
        } catch (error) {
            console.error(`Erreur lors de la résolution du litige ${carpoolId}:`, error);
            if (approveBtn) approveBtn.disabled = false;
            if (rejectBtn) rejectBtn.disabled = false;
            submitter.innerHTML = originalButtonText;
        }
    }

    if (!listenersAttached) {
        document.addEventListener('click', handleReviewActions);
        document.addEventListener('submit', handleDisputeResolution);
        
        if (confirmRejectBtn) {
            confirmRejectBtn.addEventListener('click', handleRejectConfirmation);
        }
        
        listenersAttached = true; 
    }

    loadPendingReviews();
    loadDisputedCarpools();
    loadRejectedReviews();
    loadResolvedDisputes();
}

document.addEventListener('turbo:load', () => {
    if (document.getElementById('pending-reviews-container')) {
        setTimeout(initializeEmployeeDashboard, 0);
    }
});