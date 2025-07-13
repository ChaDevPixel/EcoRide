<?php

namespace App\Controller\Api;

use App\Entity\Covoiturage;
use App\Entity\Utilisateur;
use App\Entity\Voiture;
use App\Repository\CovoiturageRepository;
use App\Repository\UtilisateurRepository;
use App\Repository\VoitureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Serializer\Annotation\Groups; // Importez cette annotation

#[Route('/api', name: 'api_')]
class CarpoolApiController extends AbstractController
{
    private $entityManager;
    private Security $security;
    private $serializer;
    private $validator;

    public function __construct(EntityManagerInterface $entityManager, Security $security, SerializerInterface $serializer, ValidatorInterface $validator)
    {
        $this->entityManager = $entityManager;
        $this->security = $security;
        $this->serializer = $serializer;
        $this->validator = $validator;
    }

    /**
     * Ajoute un nouveau covoiturage.
     *
     * @param Request $request La requête HTTP contenant les données du covoiturage.
     * @param VoitureRepository $voitureRepository Le repository pour récupérer l'entité Voiture.
     * @return JsonResponse Une réponse JSON indiquant le succès ou l'échec de l'opération.
     */
    #[Route('/mon-compte/add-covoiturage', name: 'add_covoiturage', methods: ['POST'])]
    public function addCovoiturage(Request $request, VoitureRepository $voitureRepository): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();

        if (!$chauffeur) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des données reçues
        if (
            !isset($data['villeDepart'], $data['dateDepart'], $data['heureDepart'],
                   $data['villeArrivee'], $data['dateArrivee'], $data['heureArrivee'],
                   $data['prix'], $data['vehiculeId'], $data['estAccompagne'],
                   $data['placesDisponibles']) // 'statut' n'est pas envoyé par le JS, il est 'initialise' par défaut
        ) {
            return $this->json(['success' => false, 'message' => 'Données manquantes pour la création du covoiturage.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $voiture = $voitureRepository->find($data['vehiculeId']);

        if (!$voiture || $voiture->getUtilisateur() !== $chauffeur) {
            return $this->json(['success' => false, 'message' => 'Véhicule introuvable ou n\'appartient pas à l\'utilisateur.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Création de l'entité Covoiturage
        $covoiturage = new Covoiturage();
        $covoiturage->setVilleDepart($data['villeDepart']);
        $covoiturage->setDateDepart(new \DateTime($data['dateDepart']));
        $covoiturage->setHeureDepart($data['heureDepart']);
        $covoiturage->setVilleArrivee($data['villeArrivee']);
        $covoiturage->setDateArrivee(new \DateTime($data['dateArrivee']));
        $covoiturage->setHeureArrivee($data['heureArrivee']);
        $covoiturage->setPrix($data['prix']);
        $covoiturage->setEstAccompagne($data['estAccompagne']);
        // Assurez-vous que nombreAccompagnateurs est défini même si estAccompagne est false
        $covoiturage->setNombreAccompagnateurs($data['estAccompagne'] ? ($data['nombreAccompagnateurs'] ?? 0) : 0);
        $covoiturage->setPlacesDisponibles($data['placesDisponibles']);
        $covoiturage->setStatut('initialise'); // Statut par défaut
        $covoiturage->setChauffeur($chauffeur);
        $covoiturage->setVoiture($voiture);

        // Validation de l'entité (peut être plus détaillée avec des Assertions dans l'entité)
        $errors = $this->validator->validate($covoiturage);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getMessage();
            }
            return $this->json(['success' => false, 'message' => 'Erreur de validation: ' . implode(', ', $errorMessages)], JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($covoiturage);
        $this->entityManager->flush();

        // Sérialisation du covoiturage pour le retour au frontend
        // Utilisation des groupes de sérialisation pour s'assurer que les relations sont chargées
        // et sérialisées correctement. Assurez-vous que vos entités Covoiturage, Voiture, Marque
        // ont les annotations @Groups("covoiturage_read") sur les propriétés pertinentes.
        $serializedCovoiturage = $this->serializer->serialize($covoiturage, 'json', [
            'groups' => ['covoiturage_read', 'voiture_read', 'marque_read'], // Ajoutez les groupes pertinents
            'circular_reference_handler' => function ($object) {
                return $object->getId(); // Gère les références circulaires en retournant l'ID
            },
            // Les 'attributes' peuvent être utilisés pour affiner ce qui est inclus,
            // mais les 'groups' sont plus puissants pour les relations.
            // Si vous utilisez les groupes, assurez-vous que les annotations @Groups sont sur les entités.
            // Pour être sûr, je vais combiner les deux pour cette réponse.
            'attributes' => [
                'id', 'villeDepart', 'dateDepart', 'heureDepart', 'villeArrivee', 'dateArrivee',
                'heureArrivee', 'prix', 'estAccompagne', 'nombreAccompagnateurs', 'placesDisponibles', 'statut',
                'voiture' => ['id', 'immatriculation', 'modele', 'energie', 'nombreDePlaces', 'marque' => ['libelle']], // Assurez-vous que 'marque' est bien un objet avec 'libelle'
                'chauffeur' => ['id', 'pseudo']
            ]
        ]);

        return $this->json([
            'success' => true,
            'message' => 'Covoiturage créé avec succès !',
            'covoiturage' => json_decode($serializedCovoiturage, true)
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * Récupère la liste des covoiturages créés par l'utilisateur connecté.
     *
     * @param CovoiturageRepository $covoiturageRepository Le repository pour récupérer les entités Covoiturage.
     * @return JsonResponse Une réponse JSON contenant la liste des covoiturages.
     */
    #[Route('/user-covoiturages', name: 'get_user_covoiturages', methods: ['GET'])]
    public function getUserCovoiturages(CovoiturageRepository $covoiturageRepository): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();

        if (!$chauffeur) {
            return $this->json(['success' => false, 'message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        try {
            // Utilisation du repository pour récupérer les covoiturages de l'utilisateur
            // Assurez-vous que getCovoituragesConduits() est bien défini dans l'entité Utilisateur
            // et qu'il retourne une Collection de Covoiturage.
            $covoiturages = $chauffeur->getCovoituragesConduits()->toArray();

            usort($covoiturages, function($a, $b) {
                $dateA = new \DateTime($a->getDateDepart()->format('Y-m-d') . ' ' . $a->getHeureDepart());
                $dateB = new \DateTime($b->getDateDepart()->format('Y-m-d') . ' ' . $b->getHeureDepart());
                return $dateA <=> $dateB;
            });

            $serializedCovoiturages = $this->serializer->serialize($covoiturages, 'json', [
                'groups' => ['covoiturage_read', 'voiture_read', 'marque_read'], // Ajoutez les groupes pertinents
                'circular_reference_handler' => function ($object) {
                    return $object->getId();
                },
                'attributes' => [
                    'id', 'villeDepart', 'dateDepart', 'heureDepart', 'villeArrivee', 'dateArrivee',
                    'heureArrivee', 'prix', 'estAccompagne', 'nombreAccompagnateurs', 'placesDisponibles', 'statut',
                    'voiture' => ['id', 'immatriculation', 'modele', 'energie', 'nombreDePlaces', 'marque' => ['libelle']], // Assurez-vous que 'marque' est bien un objet avec 'libelle'
                    'chauffeur' => ['id', 'pseudo']
                ]
            ]);

            return new JsonResponse($serializedCovoiturages, JsonResponse::HTTP_OK, [], true);

        } catch (\Exception $e) {
            error_log('Erreur lors du chargement des covoiturages de l\'utilisateur: ' . $e->getMessage());
            return $this->json([
                'success' => false,
                'message' => 'Erreur interne du serveur lors du chargement des voyages. Veuillez réessayer plus tard.'
            ], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Met à jour le statut d'un covoiturage à 'en_cours'.
     *
     * @param Covoiturage $covoiturage L'entité Covoiturage à mettre à jour (résolue par ParamConverter).
     * @return JsonResponse Une réponse JSON.
     */
    #[Route('/covoiturage/{id}/start', name: 'covoiturage_start', methods: ['POST'])]
    public function startCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();

        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['success' => false, 'message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'initialise') {
            return $this->json(['success' => false, 'message' => 'Le covoiturage ne peut être démarré que s\'il est "Non démarré".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        // Vérification de la date du jour
        $today = new \DateTime();
        $today->setTime(0, 0, 0);
        $covoiturageDate = $covoiturage->getDateDepart();
        $covoiturageDate->setTime(0, 0, 0);

        if ($covoiturageDate->format('Y-m-d') !== $today->format('Y-m-d')) {
            return $this->json(['success' => false, 'message' => 'Le covoiturage ne peut être démarré qu\'à la date prévue.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('en_cours');
        $this->entityManager->flush();

        return $this->json(['success' => true, 'message' => 'Covoiturage démarré !', 'newStatus' => 'en_cours']);
    }

    /**
     * Met à jour le statut d'un covoiturage à 'termine'.
     *
     * @param Covoiturage $covoiturage L'entité Covoiturage à mettre à jour (résolue par ParamConverter).
     * @return JsonResponse Une réponse JSON.
     */
    #[Route('/covoiturage/{id}/end', name: 'covoiturage_end', methods: ['POST'])]
    public function endCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();

        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['success' => false, 'message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'en_cours') {
            return $this->json(['success' => false, 'message' => 'Le covoiturage ne peut être terminé que s\'il est "En cours".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('termine');
        $this->entityManager->flush();

        return $this->json(['success' => true, 'message' => 'Covoiturage terminé !', 'newStatus' => 'termine']);
    }
}