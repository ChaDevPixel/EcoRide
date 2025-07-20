import { Controller } from '@hotwired/stimulus';

console.log("DEBUG: Fichier account_controller.js en cours d'analyse.");

export default class extends Controller {
  // Définition des "targets" (éléments DOM que le contrôleur doit connaître)
  static targets = [
    // Section Rôles
    'roleDriver', 'driverDetails', 'editRolesBtn', 'rolesMessageContainer',

    // Section Véhicules
    'addVehicleBtn', 'vehicleFormContainer', 'vehicleForm', 'cancelVehicleBtn',
    'vehiclesContainer', 'vehicleMessageContainer', 'brandSelect', 'countryDropdownButton',
    'countryDropdownMenu', 'selectedFlag', 'selectedCountryCodeSpan', 'plateInput',
    'hiddenCountryCode', 'firstRegDate', 'model', 'color', 'seats', 'engineType',

    // Section Préférences
    'customPrefInput', 'addCustomPrefBtn', 'customPrefList', 'prefSmoker', 'prefAnimal',
    'profileForm', 'preferencesMessageContainer', 'savePreferencesBtn'
  ];

  // Définition des "values" (données passées depuis le HTML)
  static values = {
    userRoles: Array,
    userVehicles: Array,
    userPreferences: Object,
  };

  // Méthode d'initialisation, appelée quand le contrôleur se connecte au DOM
  connect() {
    this._initializeRoles();
    this._initializeVehicles();
    this._initializePreferences();
  }

  // =================================================================
  // Méthodes privées d'initialisation
  // =================================================================

  _initializeRoles() {
    const isDriver = this.userRolesValue.includes('ROLE_DRIVER');
    this.roleDriverTarget.checked = isDriver;
    this.roleDriverTarget.disabled = true;
    this.driverDetailsTarget.style.display = isDriver ? 'block' : 'none';
    this.editRolesBtnTarget.textContent = 'Modifier';
  }

  _initializeVehicles() {
    this._displayVehicles(this.userVehiclesValue);
    this._loadAndPopulateBrands();
    this._setupFirstRegDateInput();
    this._updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png'); // Défaut
  }

  _initializePreferences() {
    const prefs = this.userPreferencesValue || {};
    this.prefSmokerTarget.checked = prefs.fumeurs_acceptes || false;
    this.prefAnimalTarget.checked = prefs.animaux_acceptes || false;
    
    this.customPrefListTarget.innerHTML = '';
    (prefs.personnalisees || []).forEach(prefText => {
      const newTag = this._createPrefTag(prefText);
      this.customPrefListTarget.appendChild(newTag);
    });
  }

  // =================================================================
  // Actions liées aux Rôles
  // =================================================================

  async toggleEditRoles(event) {
    event.preventDefault();
    const btn = this.editRolesBtnTarget;

    if (btn.textContent === 'Modifier') {
      this.roleDriverTarget.disabled = false;
      btn.textContent = 'Appliquer';
    } else {
      const data = { isDriverChecked: this.roleDriverTarget.checked };
      try {
        const response = await fetch('/mon-compte/update-roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
          this._displayMessage(this.rolesMessageContainerTarget, result.message, 'success');
          if (result.redirectUrl) {
            setTimeout(() => window.location.href = result.redirectUrl, 2000);
          } else {
            setTimeout(() => location.reload(), 1500);
          }
        } else {
          this._displayMessage(this.rolesMessageContainerTarget, result.message, 'danger');
        }
      } catch (error) {
        this._displayMessage(this.rolesMessageContainerTarget, "Une erreur inattendue est survenue.", 'danger');
      }
    }
  }

  // =================================================================
  // Actions liées aux Véhicules
  // =================================================================

  showVehicleForm() {
    this.vehicleFormContainerTarget.classList.remove('d-none');
    this.addVehicleBtnTarget.classList.add('d-none');
    this.vehicleFormTarget.reset();
    this._updateCountrySelection('FR', 'https://flagcdn.com/w20/fr.png');
    this.firstRegDateTarget.value = '';
    this.vehicleMessageContainerTarget.innerHTML = '';
  }

  hideVehicleForm() {
    this.vehicleFormContainerTarget.classList.add('d-none');
    this.addVehicleBtnTarget.classList.remove('d-none');
    this.vehicleMessageContainerTarget.innerHTML = '';
  }

  async submitVehicleForm(event) {
    event.preventDefault();
    const data = {
      immatriculation: this.plateInputTarget.value,
      paysImmatriculation: this.hiddenCountryCodeTarget.value,
      datePremiereImmatriculation: this.firstRegDateTarget.value,
      marqueId: this.brandSelectTarget.value,
      modele: this.modelTarget.value,
      couleur: this.colorTarget.value,
      nombreDePlaces: this.seatsTarget.value,
      energie: this.element.querySelector('input[name="engineType"]:checked')?.value || ''
    };

    // Validations
    const dateError = this._validateFirstRegDate(data.datePremiereImmatriculation);
    if (dateError) return this._displayMessage(this.vehicleMessageContainerTarget, dateError, 'danger');
    if (!data.immatriculation) return this._displayMessage(this.vehicleMessageContainerTarget, 'Veuillez saisir une plaque d\'immatriculation.', 'danger');
    // ... (ajouter les autres validations ici pour la clarté)

    try {
      const response = await fetch('/mon-compte/add-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        this._displayMessage(this.vehicleMessageContainerTarget, result.message, 'success');
        this.hideVehicleForm();
        // Rafraîchir la liste des véhicules
        const updatedVehiclesResponse = await fetch('/api/user-vehicles');
        if (updatedVehiclesResponse.ok) {
          const updatedVehicles = await updatedVehiclesResponse.json();
          this._displayVehicles(updatedVehicles);
        }
      } else {
        this._displayMessage(this.vehicleMessageContainerTarget, result.message, 'danger');
      }
    } catch (error) {
      this._displayMessage(this.vehicleMessageContainerTarget, "Une erreur client est survenue.", 'danger');
    }
  }
  
  selectCountry(event) {
    event.preventDefault();
    const item = event.currentTarget;
    const countryCode = item.dataset.countryCode;
    const flagSrc = item.querySelector('img').src;
    this._updateCountrySelection(countryCode, flagSrc);
  }

  applyPlateMask(event) {
      const input = event.target;
      const mask = input.dataset.mask || '';
      if (!mask) return;

      let value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      let maskedValue = '';
      let valueIndex = 0;
      for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
          const maskChar = mask[i];
          const valueChar = value[valueIndex];
          if ((maskChar === 'A' && /[A-Z]/.test(valueChar)) || (maskChar === '9' && /[0-9]/.test(valueChar))) {
              maskedValue += valueChar;
              valueIndex++;
          } else if (maskChar === '-' || maskChar === ' ') {
              maskedValue += maskChar;
          }
      }
      input.value = maskedValue;
  }


  // =================================================================
  // Actions liées aux Préférences
  // =================================================================

  addCustomPreference() {
    const value = this.customPrefInputTarget.value.trim();
    if (value === '') {
      return this._displayMessage(this.preferencesMessageContainerTarget, 'Veuillez saisir une préférence.', 'warning');
    }
    const isExisting = Array.from(this.customPrefListTarget.children).some(
      child => child.firstChild?.textContent.toLowerCase() === value.toLowerCase()
    );
    if (isExisting) {
      return this._displayMessage(this.preferencesMessageContainerTarget, 'Cette préférence est déjà ajoutée.', 'warning');
    }
    const newTag = this._createPrefTag(value);
    this.customPrefListTarget.appendChild(newTag);
    this.customPrefInputTarget.value = '';
    this._displayMessage(this.preferencesMessageContainerTarget, 'Préférence ajoutée, n\'oubliez pas d\'enregistrer !', 'info');
  }
  
  removeCustomPreference(event) {
    const tag = event.currentTarget.closest('.badge');
    if(tag) {
        tag.remove();
        this._displayMessage(this.preferencesMessageContainerTarget, 'Préférence supprimée, n\'oubliez pas d\'enregistrer !', 'info');
    }
  }

  async savePreferences(event) {
    event.preventDefault();
    
    const preferencesToSave = {
      fumeursAcceptes: this.prefSmokerTarget.checked,
      animauxAcceptes: this.prefAnimalTarget.checked,
      preferencesPersonnalisees: Array.from(this.customPrefListTarget.querySelectorAll('span')).map(span => span.textContent)
    };

    try {
      const response = await fetch('/mon-compte/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(preferencesToSave)
      });
      const result = await response.json();
      if (result.success) {
        this._displayMessage(this.preferencesMessageContainerTarget, result.message, 'success');
        this.userPreferencesValue = preferencesToSave; // Met à jour la "value"
      } else {
        this._displayMessage(this.preferencesMessageContainerTarget, result.message, 'danger');
      }
    } catch (error) {
      this._displayMessage(this.preferencesMessageContainerTarget, "Une erreur est survenue.", 'danger');
    }
  }

  // =================================================================
  // Méthodes "Helpers" (privées)
  // =================================================================

  _displayMessage(container, message, type) {
    if (!container) return;
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    const alertDiv = container.firstChild;
    setTimeout(() => {
      alertDiv?.classList.remove('show');
      alertDiv?.addEventListener('transitionend', () => alertDiv.remove());
    }, 5000);
  }

  _displayVehicles(vehicles) {
    const container = this.vehiclesContainerTarget;
    container.innerHTML = '';
    if (!vehicles || vehicles.length === 0) {
      container.innerHTML = '<p class="text-muted">Aucun véhicule enregistré.</p>';
      return;
    }
    const energieMap = { 'electric': 'Électrique', 'hybrid': 'Hybride', 'thermal': 'Thermique' };
    vehicles.forEach(vehicle => {
        const countryCodeForFlag = vehicle.paysImmatriculation ? vehicle.paysImmatriculation.toLowerCase() : '';
        const countryFlag = countryCodeForFlag ? `<img src="https://flagcdn.com/w20/${countryCodeForFlag}.png" alt="${vehicle.paysImmatriculation}" class="flag-icon me-1">` : '';
        const leafIconHtml = (vehicle.energie === 'electric' || vehicle.energie === 'hybrid') ? `<i class="bi bi-leaf-fill text-primary me-1"></i>` : '';
        
        const vehicleHtml = `
            <div class="col-12 mb-3">
                <div class="d-flex align-items-center px-3 py-2 rounded border h-100">
                    <i class="bi bi-car-front-fill fs-5 me-2" style="color: ${vehicle.couleur || 'currentColor'};"></i>
                    <span class="mb-0 flex-grow-1 text-sm">
                        ${countryFlag}
                        ${energieMap[vehicle.energie] || vehicle.energie} -
                        ${vehicle.immatriculation || 'N/A'} -
                        ${vehicle.marque?.libelle || 'N/A'} ${vehicle.modele || 'N/A'}
                    </span>
                    <span class="fw-bold ms-auto text-sm">
                        ${leafIconHtml}${vehicle.nombreDePlaces} places
                    </span>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', vehicleHtml);
    });
  }

  async _loadAndPopulateBrands() {
    if (!this.hasBrandSelectTarget) return;
    try {
      const response = await fetch('/api/marques');
      if (!response.ok) throw new Error('Network response was not ok.');
      const marques = await response.json();
      this.brandSelectTarget.innerHTML = '<option selected disabled value="">Choisir une marque</option>';
      marques.forEach(marque => {
        this.brandSelectTarget.insertAdjacentHTML('beforeend', `<option value="${marque.id}">${marque.nom}</option>`);
      });
    } catch (error) {
      this.brandSelectTarget.innerHTML = '<option selected disabled value="">Erreur</option>';
      this._displayMessage(this.vehicleMessageContainerTarget, 'Impossible de charger les marques.', 'danger');
    }
  }

  _setupFirstRegDateInput() {
    if (!this.hasFirstRegDateTarget) return;
    const today = new Date().toISOString().split('T')[0];
    this.firstRegDateTarget.setAttribute('max', today);
  }

  _validateFirstRegDate(dateString) {
    if (!dateString) return "La date est requise.";
    const selectedDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate > today) return "La date ne peut pas être dans le futur.";
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100);
    if (selectedDate < minDate) return "La date ne peut pas être antérieure à 100 ans.";
    return null;
  }
  
  _updateCountrySelection(countryCode, flagSrc) {
      const countryPlateMasks = {
        'FR': 'AA-999-AA', 'DE': 'A-9999-AA', 'BE': '9-AAA-999',
        'LU': 'AA-9999', 'CH': 'AA-999999', 'IT': 'AA999AA', 'ES': '9999-AAA',
      };
      
      this.selectedFlagTarget.src = flagSrc;
      this.selectedCountryCodeSpanTarget.textContent = countryCode;
      this.hiddenCountryCodeTarget.value = countryCode;
      
      const mask = countryPlateMasks[countryCode] || '';
      this.plateInputTarget.value = '';
      this.plateInputTarget.placeholder = mask;
      this.plateInputTarget.dataset.mask = mask;
  }

  _createPrefTag(text) {
    const tag = document.createElement('div');
    tag.className = 'badge bg-dark d-flex align-items-center gap-2';
    tag.innerHTML = `
      <span>${text}</span>
      <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Supprimer" data-action="click->account#removeCustomPreference"></button>
    `;
    return tag;
  }
}
