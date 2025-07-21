// assets/controllers/auth_controller.js

import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
    static targets = ['authContainer', 'signUpButton', 'signInButton'];

    connect() {
        console.log('Stimulus: auth_controller connecté.');
        // Le code d'initialisation va ici, les écouteurs sont gérés par data-action.
        // Assurez-vous que l'état initial (e.g., quelle forme est active) est correct.
    }

    // Action pour le bouton d'inscription
    signUp() {
        if (this.hasAuthContainerTarget) {
            this.authContainerTarget.classList.add('right-panel-active');
        }
    }

    // Action pour le bouton de connexion
    signIn() {
        if (this.hasAuthContainerTarget) {
            this.authContainerTarget.classList.remove('right-panel-active');
        }
    }
}