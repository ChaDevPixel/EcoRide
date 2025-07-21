<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\AvisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AvisController extends AbstractController
{

    #[Route('/profil/{id}/avis', name: 'app_avis_show')]
    public function show(Utilisateur $chauffeur, AvisRepository $avisRepository): Response
    {
        $avisValides = $avisRepository->findBy(
            [
                'utilisateur' => $chauffeur, 
                'valideParEmploye' => true
            ],
            ['creeLe' => 'DESC']
        );

        return $this->render('avis.html.twig', [
            'chauffeur' => $chauffeur,
            'avis_list' => $avisValides,
        ]);
    }
}
