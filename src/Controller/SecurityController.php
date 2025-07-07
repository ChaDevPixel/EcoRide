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
        return $this->render('connexion.html.twig');
    }

    #[Route('/mon-compte', name: 'app_account')]
    public function account(): Response
    {
        return $this->render('compte.html.twig');
    }
}
