<?php

namespace App\Controller\Api;

use App\Entity\Covoiturage;
use App\Entity\Notification;
use App\Entity\Participation;
use App\Entity\Utilisateur;
use App\Entity\Avis;
use App\Repository\ParticipationRepository;
use App\Repository\VoitureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api', name: 'api_')] // Ce préfixe s'applique à toutes les routes du contrôleur
class CarpoolApiController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private Security $security;
    private SerializerInterface $serializer;
    private ValidatorInterface $validator;
    private MailerInterface $mailer; // NOUVEAU : Propriété pour le Mailer

    public function __construct(
        EntityManagerInterface $entityManager, 
        Security $security, 
        SerializerInterface $serializer, 
        ValidatorInterface $validator,
        MailerInterface $mailer // NOUVEAU : Injection du Mailer
    )
    {
        $this->entityManager = $entityManager;
        $this->security = $security;
        $this->validator = $validator;
        $this->serializer = $serializer;
        $this->mailer = $mailer; // NOUVEAU : Assignation du Mailer
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

        $covoiturages = $chauffeur->getCovoituragesConduits()->toArray();

        $jsonCovoiturages = $this->serializer->serialize($covoiturages, 'json', [
            'groups' => ['covoiturage:user_driven_read']
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
        $passager = $this->security->getUser();
        if (!$passager) {
            return $this->json(['message' => 'Utilisateur non authentifié.'], JsonResponse::HTTP_UNAUTHORIZED);
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
            $participation->setValideParPassager(false); // Initialiser à false
            $participation->setAvisSoumis(false); // Initialiser à false

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
     * Termine un covoiturage et le met en attente de validation par les participants.
     * MODIFIÉ : Envoie un vrai email aux participants.
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

        $this->entityManager->beginTransaction();
        try {
            $covoiturage->setStatut('en_attente_validation');
            $this->entityManager->persist($covoiturage);

            // Envoyer des notifications (in-app et email) à chaque participant
            foreach ($covoiturage->getParticipations() as $participation) {
                $passager = $participation->getPassager();
                
                // 1. Créer une notification in-app
                $notification = new Notification();
                $notification->setDestinataire($passager);
                $notification->setMessage(
                    sprintf(
                        'Le covoiturage %s -> %s du %s à %s est terminé. Veuillez valider le trajet dans votre espace.',
                        $covoiturage->getVilleDepart(),
                        $covoiturage->getVilleArrivee(),
                        $covoiturage->getDateDepart()->format('d/m/Y'),
                        $covoiturage->getHeureDepart()
                    )
                );
                $notification->setCovoiturageAssocie($covoiturage);
                $this->entityManager->persist($notification);

                // 2. MODIFIÉ : Envoyer un vrai e-mail
                try {
                    $email = (new Email())
                        ->from('no-reply@ecoride.com')
                        ->to($passager->getEmail())
                        ->subject('Votre covoiturage EcoRide est terminé - Validation requise')
                        ->html($this->renderView('emails/trip_ended.html.twig', [
                            'passager' => $passager,
                            'covoiturage' => $covoiturage,
                        ]));
                    $this->mailer->send($email);
                } catch (\Exception $e) {
                    // On log l'erreur d'envoi d'email mais on ne bloque pas la transaction
                    error_log('Erreur lors de l\'envoi de l\'email de fin de trajet: ' . $e->getMessage());
                }
            }

            $this->entityManager->flush();
            $this->entityManager->commit();

            return $this->json([
                'message' => 'Covoiturage terminé, en attente de validation par les participants. Notifications envoyées.', 
                'newStatus' => 'en_attente_validation'
            ]);

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            error_log("Erreur lors de la fin du covoiturage: " . $e->getMessage());
            return $this->json(['message' => 'Une erreur interne est survenue lors de la fin du covoiturage. Veuillez réessayer.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * API pour la validation du trajet et la soumission d'avis par un passager.
     * Gère le remboursement du chauffeur et la création d'avis/litiges.
     */
    #[Route('/participation/{id}/validate-review', name: 'participation_validate_review', methods: ['POST'])]
    public function validateReview(Participation $participation, Request $request): JsonResponse
    {
        /** @var Utilisateur $passager */
        $passager = $this->security->getUser();

        if (!$passager || $participation->getPassager() !== $passager) {
            return $this->json(['message' => 'Accès non autorisé. Vous n\'êtes pas le passager de cette participation.'], JsonResponse::HTTP_FORBIDDEN);
        }

        $covoiturage = $participation->getCovoiturage();

        if ($covoiturage->getStatut() !== 'en_attente_validation') {
            return $this->json(['message' => 'Ce covoiturage n\'est pas en attente de validation.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        if ($participation->isValideParPassager() || $participation->isAvisSoumis()) {
            return $this->json(['message' => 'Vous avez déjà validé ou soumis un avis pour ce trajet.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $validationStatus = $data['validationStatus'] ?? null;
        $note = $data['note'] ?? null;
        $commentaire = $data['commentaire'] ?? null;
        $raisonLitige = $data['raisonLitige'] ?? null;

        if ($validationStatus === null) {
            return $this->json(['message' => 'Le statut de validation est manquant.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->beginTransaction();
        try {
            $chauffeur = $covoiturage->getChauffeur();
            $prixParPassager = $covoiturage->getPrix();
            $commissionPlateforme = 2;
            $gainChauffeurParPassager = $prixParPassager - $commissionPlateforme;

            $participation->setValideParPassager(true);
            $participation->setAvisSoumis(true);
            $this->entityManager->persist($participation);

            $avis = new Avis();
            $avis->setAuteur($passager);
            $avis->setUtilisateur($chauffeur);
            $avis->setCovoiturage($covoiturage);
            $avis->setCommentaire($commentaire);

            if ($validationStatus) { // Le voyage s'est bien déroulé (Oui)
                if ($note === null || $note < 1 || $note > 5) {
                    throw new \Exception('La note est obligatoire et doit être entre 1 et 5 pour une validation positive.');
                }
                $avis->setNote($note);
                $avis->setValideParEmploye(false);
                $avis->setRaisonLitige(null);

                $allParticipantsValidated = true;
                foreach ($covoiturage->getParticipations() as $p) {
                    if (!$p->isValideParPassager()) {
                        $allParticipantsValidated = false;
                        break;
                    }
                }

                if ($allParticipantsValidated) {
                    $chauffeur->setCredits($chauffeur->getCredits() + ($gainChauffeurParPassager * count($covoiturage->getParticipations())));
                    $this->entityManager->persist($chauffeur);
                    $covoiturage->setStatut('termine');
                    $this->entityManager->persist($covoiturage);

                    $notificationChauffeur = new Notification();
                    $notificationChauffeur->setDestinataire($chauffeur);
                    $notificationChauffeur->setMessage(
                        sprintf(
                            'Tous les participants de votre covoiturage %s -> %s du %s ont validé le trajet. Vos crédits ont été transférés.',
                            $covoiturage->getVilleDepart(),
                            $covoiturage->getVilleArrivee(),
                            $covoiturage->getDateDepart()->format('d/m/Y')
                        )
                    );
                    $notificationChauffeur->setCovoiturageAssocie($covoiturage);
                    $this->entityManager->persist($notificationChauffeur);
                }

            } else { // Le voyage s'est mal déroulé (Non)
                if (!$raisonLitige) {
                    throw new \Exception('La raison du problème est obligatoire si le voyage s\'est mal déroulé.');
                }
                $avis->setNote(0);
                $avis->setRaisonLitige($raisonLitige);
                $avis->setValideParEmploye(false);
                
                $covoiturage->setStatut('litige');
                $this->entityManager->persist($covoiturage);

                error_log(sprintf(
                    "ALERTE EMPLOYE : Litige signalé pour le covoiturage %s -> %s du %s par %s. Raison: %s",
                    $covoiturage->getVilleDepart(),
                    $covoiturage->getVilleArrivee(),
                    $covoiturage->getDateDepart()->format('d/m/Y'),
                    $passager->getPseudo(),
                    $raisonLitige
                ));
            }

            $this->entityManager->persist($avis);
            $this->entityManager->flush();
            $this->entityManager->commit();

            return $this->json(['message' => 'Validation et avis soumis avec succès !'], JsonResponse::HTTP_OK);

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            error_log("Erreur lors de la validation/avis du covoiturage: " . $e->getMessage());
            return $this->json(['message' => 'Une erreur est survenue: ' . $e->getMessage()], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
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
     * Annule un covoiturage initié par le chauffeur.
     * Rembourse les participants et envoie des notifications (in-app et email).
     * MODIFIÉ : Envoie un vrai email aux participants.
     */
    #[Route('/covoiturage/{id}/cancel', name: 'covoiturage_cancel', methods: ['POST'])]
    public function cancelCovoiturage(Covoiturage $covoiturage): JsonResponse
    {
        /** @var Utilisateur $chauffeur */
        $chauffeur = $this->security->getUser();

        if (!$chauffeur || $covoiturage->getChauffeur() !== $chauffeur) {
            return $this->json(['message' => 'Accès non autorisé. Vous n\'êtes pas le chauffeur de ce covoiturage.'], JsonResponse::HTTP_FORBIDDEN);
        }

        if ($covoiturage->getStatut() === 'termine' || $covoiturage->getStatut() === 'annule') {
            return $this->json(['message' => 'Ce covoiturage ne peut pas être annulé car il est déjà terminé ou annulé.'], JsonResponse::HTTP_BAD_REQUEST);
        }

        $this->entityManager->beginTransaction();
        try {
            $covoiturage->setStatut('annule');
            $this->entityManager->persist($covoiturage);

            foreach ($covoiturage->getParticipations() as $participation) {
                $passager = $participation->getPassager();
                $prixVoyage = $covoiturage->getPrix();

                // Rembourser les crédits au passager
                $passager->setCredits($passager->getCredits() + $prixVoyage);
                $this->entityManager->persist($passager);

                // Créer une notification in-app pour le passager
                $notification = new Notification();
                $notification->setDestinataire($passager);
                $notification->setMessage(
                    sprintf(
                        'Votre participation au covoiturage %s -> %s du %s à %s a été annulée par le chauffeur. Vos crédits (%s) ont été restitués.',
                        $covoiturage->getVilleDepart(),
                        $covoiturage->getVilleArrivee(),
                        $covoiturage->getDateDepart()->format('d/m/Y'),
                        $covoiturage->getHeureDepart(),
                        $prixVoyage
                    )
                );
                $notification->setCovoiturageAssocie($covoiturage);
                $this->entityManager->persist($notification);

                // MODIFIÉ : Envoyer un vrai e-mail d'annulation
                try {
                    $email = (new Email())
                        ->from('no-reply@ecoride.com')
                        ->to($passager->getEmail())
                        ->subject('Annulation de votre covoiturage EcoRide')
                        ->html($this->renderView('emails/trip_canceled.html.twig', [
                            'passager' => $passager,
                            'covoiturage' => $covoiturage,
                            'prixVoyage' => $prixVoyage,
                        ]));
                    $this->mailer->send($email);
                } catch (\Exception $e) {
                    error_log('Erreur lors de l\'envoi de l\'email d\'annulation: ' . $e->getMessage());
                }

                $this->entityManager->remove($participation);
            }

            $this->entityManager->flush();
            $this->entityManager->commit();

            return $this->json(['message' => 'Covoiturage annulé avec succès. Les participants ont été remboursés et notifiés.'], JsonResponse::HTTP_OK);

        } catch (\Exception $e) {
            $this->entityManager->rollback();
            error_log("Erreur lors de l'annulation du covoiturage: " . $e->getMessage());
            return $this->json(['message' => 'Une erreur est survenue lors de l\'annulation du covoiturage. Veuillez réessayer.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    
    /**
     * Annule la participation d'un passager, le rembourse et met à jour les places.
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
            error_log($e->getMessage());
            return $this->json(['message' => 'Une erreur est survenue lors de l\'annulation.'], JsonResponse::HTTP_INTERNAL_SERVER_ERROR);
        }
    }   
}