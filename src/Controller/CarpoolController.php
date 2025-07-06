<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class CarpoolController extends AbstractController
{
    #[Route('/covoiturage', name: 'carpool_show')]
    public function carpool(): Response
    {
        return $this->render('covoiturage.html.twig');
    }
}
