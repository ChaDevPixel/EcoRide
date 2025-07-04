<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class ResultsController extends AbstractController
{
    #[Route('/covoiturage', name: 'app_results')]
    public function home(): Response
    {
        return $this->render('covoiturage.html.twig');
    }
}
