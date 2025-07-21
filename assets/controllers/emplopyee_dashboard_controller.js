// assets/controllers/employee_dashboard_controller.js

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = [
        'pendingReviewsContainer',
        'noPendingReviewsMessage',
        'disputedCarpoolsContainer',
        'noDisputedCarpoolsMessage',
        'rejectedReviewsContainer',
        'noRejectedReviewsMessage',
        'resolvedDisputesContainer',
        'noResolvedDisputesMessage',
        'rejectConfirmModal',
        'confirmRejectButton'
    ];

    rejectModalInstance = null;
    currentReviewIdToReject = null; // Pour stocker l'ID de l'avis à rejeter

    connect() {
        console.log("Stimulus: employee_dashboard_controller connecté.");
        
        // Initialiser la modale de rejet Bootstrap
        if (this.hasRejectConfirmModalTarget) {
            this.rejectModalInstance = new Modal(this.rejectConfirmModalTarget);
        }

        // Attacher les écouteurs d'événements délégués aux conteneurs
        // L'action sera sur le contrôleur principal element.
        this.element.addEventListener('click', this.handleReviewActions.bind(this));
        this.element.addEventListener('submit', this.handleDisputeResolution.bind(this));
        
        // Attacher l'écouteur pour le bouton de confirmation de rejet de la modale
        if (this.hasConfirmRejectButtonTarget) {
            this.confirmRejectButtonTarget.addEventListener('click', this.handleRejectConfirmation.bind(this));
        }

        // Chargement initial des données
        this.loadPendingReviews();
        this.loadDisputedCarpools();
        this.loadRejectedReviews();
        this.loadResolvedDisputes();
    }

    disconnect() {
        console.log("Stimulus: employee_dashboard_controller déconnecté.");
        if (this.rejectModalInstance) {
            this.rejectModalInstance.hide();
        }
        // Nettoyer les écouteurs ajoutés manuellement
        this.element.removeEventListener('click', this.handleReviewActions.bind(this));
        this.element.removeEventListener('submit', this.handleDisputeResolution.bind(this));
        if (this.hasConfirmRejectButtonTarget) {
            this.confirmRejectButtonTarget.removeEventListener('click', this.handleRejectConfirmation.bind(this));
        }
    }

    // --- Fonctions utilitaires pour charger les données depuis l'API ---
    async loadData(url, containerTarget, noDataMessageTarget) {
        if (!containerTarget || !noDataMessageTarget) {
            console.warn(`Conteneur ou message manquant pour l'URL: ${url}. Chargement annulé.`);
            return [];
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erreur serveur lors du chargement des données.');
            const data = await response.json();

            containerTarget.innerHTML = '';
            
            if (data.length === 0) {
                noDataMessageTarget.style.display = 'block';
                if (noDataMessageTarget.parentNode !== containerTarget) {
                    containerTarget.appendChild(noDataMessageTarget);
                }
                return [];
            }
            noDataMessageTarget.style.display = 'none';
            return data;
        } catch (error) {
            noDataMessageTarget.textContent = `Erreur de chargement: ${error.message}`;
            noDataMessageTarget.style.display = 'block';
            console.error('Erreur lors du chargement des données:', error);
            return [];
        }
    }

    // --- Fonctions pour charger et afficher les différents types de données ---
    async loadPendingReviews() {
        if (!this.hasPendingReviewsContainerTarget || !this.hasNoPendingReviewsMessageTarget) return; 
        const reviews = await this.loadData('/api/employee/pending-reviews', this.pendingReviewsContainerTarget, this.noPendingReviewsMessageTarget);
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
                    <button class="btn btn-primary btn-sm rounded-pill px-3 approve-review-btn" data-review-id="${review.id}" data-action="click->employee-dashboard#handleReviewActions">Approuver</button>
                    <button class="btn btn-outline-danger btn-sm rounded-pill px-3 reject-review-btn" data-review-id="${review.id}" data-action="click->employee-dashboard#handleReviewActions">Rejeter</button>
                </div>`;
            this.pendingReviewsContainerTarget.appendChild(reviewCard);
        });
    }

    async loadDisputedCarpools() {
        if (!this.hasDisputedCarpoolsContainerTarget || !this.hasNoDisputedCarpoolsMessageTarget) return;
        const carpools = await this.loadData('/api/employee/disputed-carpools', this.disputedCarpoolsContainerTarget, this.noDisputedCarpoolsMessageTarget);
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
                            <form class="resolve-dispute-form" data-dispute-id="${carpool.id}" data-action="submit->employee-dashboard#handleDisputeResolution" novalidate>
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
            this.disputedCarpoolsContainerTarget.appendChild(disputeCard);
        });
    }

    async loadRejectedReviews() {
        if (!this.hasRejectedReviewsContainerTarget || !this.hasNoRejectedReviewsMessageTarget) return;
        const reviews = await this.loadData('/api/employee/rejected-reviews', this.rejectedReviewsContainerTarget, this.noRejectedReviewsMessageTarget);
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
            this.rejectedReviewsContainerTarget.appendChild(reviewCard);
        });
    }

    async loadResolvedDisputes() {
        if (!this.hasResolvedDisputesContainerTarget || !this.hasNoResolvedDisputesMessageTarget) return;
        const carpools = await this.loadData('/api/employee/resolved-disputes', this.resolvedDisputesContainerTarget, this.noResolvedDisputesMessageTarget);
        if (!carpools) return;
        carpools.forEach(carpool => {
            const details = carpool.moderationDetails;
            const decision = details.decisionFinale === 'approve' ? '<span class="badge bg-primary">Avis validé</span>' : '<span class="badge bg-danger">Avis rejeté</span>';
            const dateToUse = details.dateCloture?.date || details.dateCloture;
            const dateClotureFormatted = dateToUse ? new Date(dateToUse).toLocaleDateString('fr-FR') : 'Date inconnue';

            const card = document.createElement('div');
            card.className = 'card mb-3 bg-light';
            card.innerHTML = `<div class="card-body"><h6 class="card-title">Covoiturage n°${carpool.id} - ${carpool.villeDepart} → ${carpool.villeArrivee}</h6><p class="card-text mb-1"><small>Clôturé le ${dateClotureFormatted} - Décision : ${decision}</small></p></div>`;
            this.resolvedDisputesContainerTarget.appendChild(card);
        });
    }
    
    // --- Fonctions de gestion d'événements (déplacées ici) ---
    async handleReviewActions(e) {
        const approveBtn = e.target.closest('.approve-review-btn');
        const rejectBtn = e.target.closest('.reject-review-btn');
        
        if (approveBtn) {
            const reviewId = approveBtn.dataset.reviewId;
            if (!reviewId) return;
            try {
                const response = await fetch(`/api/employee/reviews/${reviewId}/approve`, { method: 'POST' });
                if (!response.ok) throw new Error('L\'action d\'approbation a échoué.');
                
                document.getElementById(`review-${reviewId}`)?.remove();
                this.loadPendingReviews();
                this.loadRejectedReviews();
            } catch (error) { 
                console.error(`Erreur lors de l'approbation de l'avis ${reviewId}:`, error);
            }
        }

        if (rejectBtn) {
            const reviewId = rejectBtn.dataset.reviewId;
            if (!reviewId) return;
            this.currentReviewIdToReject = reviewId; // Stocke l'ID pour la confirmation
            if (this.rejectModalInstance) this.rejectModalInstance.show();
        }
    }

    async handleRejectConfirmation() {
        const reviewId = this.currentReviewIdToReject; // Utilise l'ID stocké
        if (!reviewId) return;

        try {
            const response = await fetch(`/api/employee/reviews/${reviewId}/reject`, { method: 'POST' });
            if (!response.ok) throw new Error('L\'action de rejet a échoué.');
            
            if (this.rejectModalInstance) this.rejectModalInstance.hide();
            document.getElementById(`review-${reviewId}`)?.remove();
            this.loadPendingReviews();
            this.loadRejectedReviews();
        } catch (error) { 
            console.error(`Erreur lors du rejet de l'avis ${reviewId}:`, error);
        }
    }

    async handleDisputeResolution(e) {
        const form = e.target.closest('.resolve-dispute-form');
        if (!form) return;

        e.preventDefault();

        const carpoolId = form.dataset.disputeId;
        const submitter = e.submitter; 
        if (!submitter) return;

        const decision = submitter.value;
        const messageContainer = form.querySelector(`#dispute-form-message-${carpoolId}`); // Reste un querySelector sur le form

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
            this.loadDisputedCarpools();
            this.loadResolvedDisputes();
        } catch (error) {
            console.error(`Erreur lors de la résolution du litige ${carpoolId}:`, error);
            if (approveBtn) approveBtn.disabled = false;
            if (rejectBtn) rejectBtn.disabled = false;
            submitter.innerHTML = originalButtonText;
        }
    }
}