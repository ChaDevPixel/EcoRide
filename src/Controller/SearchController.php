<?php

namespace App\Controller;

use App\Entity\Covoiturage; // <-- J'ai ajouté cette ligne
use App\Repository\CovoiturageRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class SearchController extends AbstractController
{
    #[Route('/covoiturage', name: 'carpool_show', methods: ['GET'])]
    public function search(Request $request, CovoiturageRepository $covoiturageRepository): Response
    {
        $villeDepart = $request->query->get('depart');
        $villeArrivee = $request->query->get('arrivee');
        $dateDepartStr = $request->query->get('date');

        $covoiturages = [];
        $nextAvailable = null;

        if ($villeDepart && $villeArrivee && $dateDepartStr) {
            try {
                $dateDepart = new \DateTime($dateDepartStr);

                // Calcul du début et de la fin de la journée
                $startOfDay = (clone $dateDepart)->setTime(0, 0, 0);
                $endOfDay = (clone $dateDepart)->setTime(23, 59, 59);

                // Appel de la méthode du repository
                $covoiturages = $covoiturageRepository->findBySearchCriteria($villeDepart, $villeArrivee, $startOfDay, $endOfDay);

                if (empty($covoiturages)) {
                    $nextAvailable = $covoiturageRepository->findNextAvailable($villeDepart, $villeArrivee, $dateDepart);
                }

            } catch (\Exception $e) {
                $this->addFlash('error', 'Le format de la date est invalide.');
            }
        }

        return $this->render('covoiturage.html.twig', [
            'covoiturages' => $covoiturages,
            'nextAvailable' => $nextAvailable,
            'search_depart' => $villeDepart,
            'search_arrivee' => $villeArrivee,
            'search_date' => $dateDepartStr,
        ]);
    }

    /**
     * Affiche les détails d'un covoiturage spécifique.
     */
    #[Route('/covoiturage/{id}', name: 'carpool_detail', methods: ['GET'])]
    public function detail(Covoiturage $covoiturage): Response
    {
        // Grâce au ParamConverter de Symfony, l'objet Covoiturage
        // est automatiquement récupéré de la base de données via l'ID dans l'URL.

        return $this->render('detailS.html.twig', [
            'trip' => $covoiturage,
        ]);
    }
}