<?php
// src/Security/UserStatusChecker.php

namespace App\Security;

use App\Entity\Utilisateur; // Assurez-vous d'importer votre entité Utilisateur
use Symfony\Component\Security\Core\User\UserCheckerInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Security\Core\Exception\CustomUserMessageAuthenticationException;

class UserStatusChecker implements UserCheckerInterface
{
    /**
     * Vérifie l'utilisateur avant l'authentification (par exemple, avant la vérification du mot de passe).
     * C'est l'endroit idéal pour vérifier le statut de suspension.
     */
    public function checkPreAuth(UserInterface $user): void
    {
        // Vérifiez que l'utilisateur est bien une instance de votre entité Utilisateur
        if (!$user instanceof Utilisateur) {
            return; // Ne s'applique pas aux autres types d'utilisateurs si vous en avez
        }

        // Si le statut de l'utilisateur est 'suspendu', lancez une exception
        // Cette exception sera capturée par Symfony et affichera un message d'erreur à l'utilisateur.
        if ($user->getStatut() === 'suspendu') {
            throw new CustomUserMessageAuthenticationException('Votre compte a été suspendu. Veuillez contacter l\'administrateur.');
        }
    }

    /**
     * Vérifie l'utilisateur après l'authentification réussie (par exemple, après la vérification du mot de passe).
     * Pour la suspension, la vérification pré-authentification est suffisante.
     */
    public function checkPostAuth(UserInterface $user): void
    {
        // Aucune vérification nécessaire ici pour la suspension, car elle est gérée en pre-auth.
        // Vous pourriez ajouter d'autres vérifications post-authentification ici si nécessaire.
    }
}
