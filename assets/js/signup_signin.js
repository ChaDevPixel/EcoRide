document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('authContainer');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');

    if (container && signUpButton && signInButton) {
        
        signUpButton.addEventListener('click', () => {
            container.classList.add('right-panel-active');
        });

        signInButton.addEventListener('click', () => {
            container.classList.remove('right-panel-active');
        });
    }
});
