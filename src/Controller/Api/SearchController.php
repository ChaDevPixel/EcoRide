<?php

namespace App\Controller\Api;

use App\Repository\CovoiturageRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api')]
class SearchController extends AbstractController
{
    /**
     * Recherche des covoiturages en fonction de critères.
     *
     * @param Request $request Le requête HTTP contenant les paramètres de recherche.
     * @param CovoiturageRepository $covoiturageRepository Le repository pour accéder aux données des covoiturages.
     * @param SerializerInterface $serializer Le service pour convertir les objets en JSON.
     * @return Response Une réponse JSON avec les résultats de la recherche.
     */
    #[Route('/covoiturages/search', name: 'api_covoiturage_search', methods: ['GET'])]
    public function search(Request $request, CovoiturageRepository $covoiturageRepository, SerializerInterface $serializer): Response
    {
        // 1. Récupérer les paramètres de la requête
        $villeDepart = $request->query->get('depart');
        $villeArrivee = $request->query->get('arrivee');
        $dateDepartStr = $request->query->get('date');

        // 2. Validation simple (pourrait être améliorée avec le composant Validator)
        if (!$villeDepart || !$villeArrivee || !$dateDepartStr) {
            return $this->json([
                'message' => 'Les paramètres de recherche (départ, arrivée, date) sont obligatoires.'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $dateDepart = new \DateTime($dateDepartStr);
        } catch (\Exception $e) {
            return $this->json([
                'message' => 'Le format de la date est invalide.'
            ], Response::HTTP_BAD_REQUEST);
        }

        // 3. Appeler la méthode du repository pour trouver les résultats
        $covoiturages = $covoiturageRepository->findBySearchCriteria($villeDepart, $villeArrivee, $dateDepart);

        // 4. Proposer une alternative si aucun résultat n'est trouvé (US 3)
        $nextAvailable = null;
        if (empty($covoiturages)) {
            $nextAvailable = $covoiturageRepository->findNextAvailable($villeDepart, $villeArrivee, $dateDepart);
        }

        // 5. Sérialiser les résultats en JSON
        // On utilise un groupe de sérialisation spécifique pour ne pas tout exposer.
        $jsonResponse = $serializer->serialize([
            'results' => $covoiturages,
            'nextAvailable' => $nextAvailable,
        ], 'json', ['groups' => 'covoiturage_search_read']);

        return new Response($jsonResponse, 200, ['Content-Type' => 'application/json']);
    }
}
