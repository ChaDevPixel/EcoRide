<?php

namespace App\Controller;

use App\Entity\Utilisateur;
use App\Repository\AvisRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AvisController extends AbstractController
{
    /**
     * Affiche tous les avis validés pour un chauffeur spécifique.
     * Accessible publiquement.
     */
    #[Route('/profil/{id}/avis', name: 'app_avis_show')]
    public function show(Utilisateur $chauffeur, AvisRepository $avisRepository): Response
    {
        // On ne récupère que les avis qui ont été validés par un employé.
        $avisValides = $avisRepository->findBy(
            [
                'utilisateur' => $chauffeur, // L'utilisateur qui a reçu les avis
                'valideParEmploye' => true
            ],
            ['creeLe' => 'DESC'] // Trier par les plus récents
        );

        return $this->render('avis.html.twig', [
            'chauffeur' => $chauffeur,
            'avis_list' => $avisValides,
        ]);
    }
}
