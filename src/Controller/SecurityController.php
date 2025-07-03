<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class SecurityController extends AbstractController
{
    #[Route('/connexion', name: 'app_login')]
    public function login(): Response
    {
        // Ici tu rendras ta vue twig connexion.html.twig
        return $this->render('connexion.html.twig');
    }

    #[Route('/mon-compte', name: 'app_account')]
    public function account(): Response
    {
        // Ici ta page Mon Compte (à sécuriser, accessible seulement si connecté)
        return $this->render('mon-compte.html.twig');
    }
}
