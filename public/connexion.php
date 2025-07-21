

<!DOCTYPE html>
<html lang="fr">
<head>

  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/EcoRide/scss/main.css">
  <title>Connexion</title>

</head>

<body>

<div class="container-auth d-flex bg-light font-family-sans-serif" id="authContainer">
  <div class="form-container sign-in-container">
    <form method="post" actio="">
      <h2 class="mb-4">Se connecter</h2>
      <input type="email" class="form-control mb-2" placeholder="Email" required>
      <input type="password" class="form-control mb-2" placeholder="Mot de passe" required>
      <button type="submit" class="btn btn-success w-100">Connexion</button>
    </form>
  </div>

  <div class="form-container sign-up-container">
    <form method="post" action="">
      <h2 class="mb-4">S'inscrire</h2>
      <input type="text" class="form-control mb-2" placeholder="Nom" required>
      <input type="email" class="form-control mb-2" placeholder="Email" required>
      <input type="password" class="form-control mb-2" placeholder="Mot de passe" required>
      <button type="submit" class="btn btn-success w-100">Inscription</button>
    </form>
  </div>

  <div class="overlay-container">
    <div class="overlay bg-primary text-light">
      
      <div class="overlay-panel overlay-left d-flex flex-column align-items-center text-center justify-content-center">
        <div class="position-absolute top-0 pt-4">
          <a href="/EcoRide/index.php">
            <img src="img/logoEcoride.png" alt="Logo Ecoride" class="logo-ecoride-signin">
          </a>  
        </div>
        <div>   
          <h2>Déjà inscrit ?</h2>
          <p>Connecte-toi pour accéder à ton compte.</p>
          <button class="btn btn-light" id="signIn">Se connecter</button>
        </div>
      </div>
    
      <div class="overlay-panel overlay-right d-flex flex-column align-items-center text-center justify-content-center">
        <div class="position-absolute top-0 pt-4">
          <a href="/EcoRide/index.php">
            <img src="img/logoEcoride.png" alt="Logo Ecoride" class="logo-ecoride-signin">
          </a>
        </div>
        <div> 
          <h2>Pas encore inscrit ?</h2>
          <p>Inscris-toi pour rejoindre la communauté EcoRide !</p>
          <button class="btn btn-light" id="signUp">S'inscrire</button>
        </div>  
      </div>
    </div>
  </div>

</div>

<script>
  const container = document.getElementById('authContainer');
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');

  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
  });

  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
  });
</script>


</body>
</html>
