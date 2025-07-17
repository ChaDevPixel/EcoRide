<?php

namespace App\Controller\Api;

use App\Entity\Covoiturage;
use App\Entity\Notification;
use App\Entity\Participation;
use App\Entity\Utilisateur;
use App\Repository\ParticipationRepository;
use App\Repository\VoitureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')]
class CarpoolApiController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private SerializerInterface $serializer;
    private ValidatorInterface $validator;

    public function __construct(EntityManagerInterface $entityManager, Security $security, SerializerInterface $serializer, ValidatorInterface $validator)
    {
        $this->entityManager = $entityManager;
        $this->security = $security;
        $this->serializer = $serializer;
        $this->validator = $validator;
    }

    /**
     * Ajoute un nouveau covoiturage.
     */
    #[Route('/mon-compte/add-covoiturage', name: 'add_covoiturage', methods: ['POST'])]
    public function addCovoiturage(Request $request, VoitureRepository $voitureRepository): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $voiture = $voitureRepository->find($data['vehiculeId'] ?? 0);

        if (!$voiture || $voiture->getUtilisateur() !== $chauffeur) {
            return $this->json(['message' => 'Véhicule introuvable ou n\'appartient pas à l\'utilisateur.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage = new Covoiturage();
        $covoiturage->setVilleDepart($data['villeDepart']);
        $covoiturage->setDateDepart(new \DateTime($data['dateDepart']));
        $covoiturage->setHeureDepart($data['heureDepart']);
        $covoiturage->setVilleArrivee($data['villeArrivee']);
        $covoiturage->setDateArrivee(new \DateTime($data['dateArrivee']));
        $covoiturage->setHeureArrivee($data['heureArrivee']);
        $covoiturage->setPrix($data['prix']);
        $covoiturage->setEstAccompagne($data['estAccompagne']);
        $covoiturage->setNombreAccompagnateurs($data['estAccompagne'] ? ($data['nombreAccompagnateurs'] ?? 0) : 0);
        $covoiturage->setPlacesDisponibles($data['placesDisponibles']);
        $covoiturage->setStatut('initialise');
        $covoiturage->setChauffeur($chauffeur);
        $covoiturage->setVoiture($voiture);

        $errors = $this->validator->validate($covoiturage);
        if (count($errors) > 0) {
            return $this->json($errors, JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->persist($covoiturage);
        $this->entityManager->flush();

        $jsonCovoiturage = $this->serializer->serialize($covoiturage, 'json', [
            'groups' => ['covoiturage:read', 'voiture:read', 'marque:read', 'chauffeur:read']
        ]);

        return new JsonResponse([
            'message' => 'Covoiturage créé avec succès !',
            'covoiturage' => json_decode($jsonCovoiturage)
        ], JsonResponse::HTTP_CREATED);
    }

    /**
     * Récupère les covoiturages où l'utilisateur est chauffeur.
     */
    #[Route('/user-covoiturages', name: 'get_user_covoiturages', methods: ['GET'])]
    public function getUserCovoiturages(): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        // Récupère les covoiturages conduits par l'utilisateur
        // La méthode getCovoituragesConduits() retourne une Doctrine Collection.
        // Il est important que les entités associées (Voiture, Marque, Participations, Passagers)
        // aient les groupes de sérialisation corrects pour éviter les références circulaires.
        $covoiturages = $chauffeur->getCovoituragesConduits()->toArray();

        // Utilisation d'un groupe de sérialisation plus spécifique pour cette route.
        // Assurez-vous que ce groupe est défini dans vos entités (voir explications ci-dessous).
        $jsonCovoiturages = $this->serializer->serialize($covoiturages, 'json', [
            'groups' => ['covoiturage:user_driven_read'] // Nouveau groupe plus spécifique
        ]);

        return new JsonResponse($jsonCovoiturages, JsonResponse::HTTP_OK, [], true);
    }

    /**
     * Récupère les voyages auxquels l'utilisateur participe.
     */
    #[Route('/user-participations', name: 'get_user_participations', methods: ['GET'])]
    public function getUserParticipations(ParticipationRepository $participationRepository): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        $participations = $participationRepository->findBy(['passager' => $user]);

        $jsonParticipations = $this->serializer->serialize($participations, 'json', [
            'groups' => ['participation:read', 'covoiturage_for_participation:read', 'chauffeur:read', 'voiture:read', 'marque:read']
        ]);

        return new JsonResponse($jsonParticipations, JsonResponse::HTTP_OK, [], true);
    }

    /**
     * Permet à un utilisateur de participer à un covoiturage.
     */
    #[Route('/covoiturage/{id}/participer', name: 'covoiturage_participate', methods: ['POST'])]
    public function participate(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $passager */
        $passager = $this->getUser();
        if (!$passager) {
            return $this->json(['message' => 'Vous devez être connecté pour participer.'], JsonResponse::HTTP_UNAUTHORIZED);
        }

        if ($covoiturage->getChauffeur() === $passager) {
            return $this->json(['message' => 'Vous ne pouvez pas participer à votre propre covoiturage.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if ($covoiturage->getStatut() !== 'initialise') {
            return $this->json(['message' => 'Ce covoiturage n\'est plus ouvert aux inscriptions.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if ($covoiturage->getPlacesDisponibles() <= 0) {
            return $this->json(['message' => 'Ce covoiturage est complet.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        foreach ($covoiturage->getParticipations() as $existingParticipation) {
            if ($existingParticipation->getPassager() === $passager) {
                return $this->json(['message' => 'Vous participez déjà à ce covoiturage.'], JsonResponse::HTTP_BAD_REQUEST);
            }
        }

        $prix = $covoiturage->getPrix();
        if ($passager->getCredits() < $prix) {
            return $this->json(['message' => 'Crédits insuffisants pour participer à ce voyage.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->beginTransaction();
        try {
            // Débiter le passager
            $passager->setCredits($passager->getCredits() - $prix);
            
            // Décrémenter les places disponibles
            $covoiturage->setPlacesDisponibles($covoiturage->getPlacesDisponibles() - 1);

            // Créer la participation
            $participation = new Participation();
            $participation->setPassager($passager);
            $participation->setCovoiturage($covoiturage);

            // Créer la notification pour le chauffeur
            $chauffeur = $covoiturage->getChauffeur();
            $notification = new Notification();
            $notification->setDestinataire($chauffeur);
            $notification->setMessage(
                sprintf(
                    '%s participe à votre covoiturage %s -> %s du %s à %s.',
                    $passager->getPseudo(),
                    $covoiturage->getVilleDepart(),
                    $covoiturage->getVilleArrivee(),
                    $covoiturage->getDateDepart()->format('d/m/Y'),
                    $covoiturage->getHeureDepart()
                )
            );
            $notification->setCovoiturageAssocie($covoiturage);

            // Persister toutes les entités modifiées ou créées
            $this->entityManager->persist($participation);
            $this->entityManager->persist($passager);
            $this->entityManager->persist($covoiturage);
            $this->entityManager->persist($notification);

            $this->entityManager->flush();
            $this->entityManager->commit();

            return $this->json(['message' => 'Participation enregistrée avec succès ! Vous allez être redirigé.'], JsonResponse::HTTP_OK);

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            // Log the exception for debugging
            error_log($e->getMessage()); 
            return $this->json(['message' => 'Une erreur interne est survenue. Veuillez réessayer.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Démarre un covoiturage.
     */
    #[Route('/covoiturage/{id}/start', name: 'covoiturage_start', methods: ['POST'])]
    public function startCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'initialise') {
            return $this->json(['message' => 'Le covoiturage ne peut être démarré que s\'il est "Non démarré".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('en_cours');
        $this->entityManager->flush();

        return $this->json(['message' => 'Covoiturage démarré !', 'newStatus' => 'en_cours']);
    }

    /**
     * Termine un covoiturage et le met en attente de validation.
     */
    #[Route('/covoiturage/{id}/end', name: 'covoiturage_end', methods: ['POST'])]
    public function endCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();
        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['message' => 'Accès non autorisé.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() !== 'en_cours') {
            return $this->json(['message' => 'Le covoiturage ne peut être terminé que s\'il est "En cours".'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $covoiturage->setStatut('en_attente_validation');
        
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Covoiturage terminé, en attente de validation pour le paiement.', 
            'newStatus' => 'en_attente_validation'
        ]);
    }

    /**
     * Route pour l'employé pour valider le paiement et transférer les crédits.
     */
    #[Route('/covoiturage/{id}/validate-payment', name: 'covoiturage_validate_payment', methods: ['POST'])]
    public function validatePayment(Covoiturage $covoiturage): JsonResponse
    {
        // $this->denyAccessUnlessGranted('ROLE_EMPLOYE');

        if ($covoiturage->getStatut() !== 'en_attente_validation') {
            return $this->json(['message' => 'Ce paiement ne peut pas être validé (statut incorrect).'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $chauffeur = $covoiturage->getChauffeur();
        $prixParPassager = $covoiturage->getPrix();
        $commissionPlateforme = 2;
        $gainChauffeurParPassager = $prixParPassager - $commissionPlateforme;

        foreach ($covoiturage->getParticipations() as $participation) {
            $chauffeur->setCredits($chauffeur->getCredits() + $gainChauffeurParPassager);
        }

        $covoiturage->setStatut('termine');
        $this->entityManager->flush();

        return $this->json(['message' => 'Paiement validé et crédits transférés au chauffeur.']);
    }


    /**
     * MODIFIÉ : Annule la participation d'un passager, le rembourse et met à jour les places.
     */
    #[Route('/participation/{id}', name: 'delete_participation', methods: ['DELETE'])]
    public function deleteParticipation(Participation $participation): JsonResponse
    {
        /** @var Utilisateur $user */
        $user = $this->getUser();

        if (!$user || $participation->getPassager() !== $user) {
            return $this->json(['message' => 'Action non autorisée.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($participation->getCovoiturage()->getStatut() !== 'initialise') {
            return $this->json(['message' => 'Vous ne pouvez pas annuler un voyage déjà commencé ou terminé.'], JsonResponse::HTTP_BAD_REQUEST);
        }
        
        $covoiturage = $participation->getCovoiturage();
        $passager = $participation->getPassager();
        $prixVoyage = $covoiturage->getPrix();

        $this->entityManager->beginTransaction();
        try {
            // 1. Rembourser les crédits au passager
            $passager->setCredits($passager->getCredits() + $prixVoyage);

            // 2. Mettre à jour le nombre de places disponibles
            $covoiturage->setPlacesDisponibles($covoiturage->getPlacesDisponibles() + 1);

            // 3. Créer une notification pour le chauffeur
            $chauffeur = $covoiturage->getChauffeur();
            $notification = new Notification();
            $notification->setDestinataire($chauffeur);
            $notification->setMessage(
                sprintf(
                    '%s a annulé sa participation à votre covoiturage %s -> %s du %s à %s.',
                    $passager->getPseudo(),
                    $covoiturage->getVilleDepart(),
                    $covoiturage->getVilleArrivee(),
                    $covoiturage->getDateDepart()->format('d/m/Y'),
                    $covoiturage->getHeureDepart()
                )
            );
            $notification->setCovoiturageAssocie($covoiturage);

            // 4. Persister les changements et supprimer la participation
            $this->entityManager->persist($passager);
            $this->entityManager->persist($covoiturage);
            $this->entityManager->persist($notification);
            $this->entityManager->remove($participation);

            $this->entityManager->flush();
            $this->entityManager->commit();

            return $this->json([
                'message' => 'Participation annulée avec succès. Vos crédits ont été restitués.',
                'newCredits' => $passager->getCredits()
            ], JsonResponse::HTTP_OK);

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            // Log the exception for debugging
            error_log($e->getMessage());
            return $this->json(['message' => 'Une erreur est survenue lors de l\'annulation.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
