<?php

namespace App\Repository;

use App\Entity\Covoiturage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use DateTime;

/**
 * @extends ServiceEntityRepository<Covoiturage>
 */
class CovoiturageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Covoiturage::class);
    }

    /**
     * Calcule le nombre total de crédits gagnés par la plateforme.
     * (2 crédits par participation sur les trajets terminés)
     */
    public function getTotalPlatformCredits(): int
    {
        // Supposons que le statut 'terminé' est le statut final pour le calcul des crédits
        // Et que chaque participation rapporte 2 crédits à la plateforme.
        // CORRECTION : Utilisation de c.participations (au pluriel)
        return $this->createQueryBuilder('c')
            ->select('SUM(SIZE(c.participations) * 2)') // Multiplie le nombre de participants par 2 crédits
            ->where('c.statut = :statutTermine') // Filtre par statut 'terminé'
            ->setParameter('statutTermine', 'terminé')
            ->getQuery()
            ->getSingleScalarResult() ?? 0; // Retourne 0 si aucun résultat
    }

    /**
     * Compte le nombre de covoiturages par jour.
     * Retourne un tableau associatif [date => count].
     */
    public function countByDay(): array
    {
        $qb = $this->createQueryBuilder('c')
            // CORRECTION : Utilisation de c.dateDepart au lieu de c.dateHeureDepart
            ->select('SUBSTRING(c.dateDepart, 1, 10) as tripDate, COUNT(c.id) as tripCount')
            ->groupBy('tripDate')
            ->orderBy('tripDate', 'ASC');

        $results = $qb->getQuery()->getResult();

        $data = [];
        foreach ($results as $row) {
            $data[$row['tripDate']] = (int) $row['tripCount'];
        }

        return $data;
    }

    /**
     * Calcule les crédits gagnés par la plateforme par jour.
     * Retourne un tableau associatif [date => credits].
     */
    public function getPlatformCreditsByDay(): array
    {
        // Cette méthode doit refléter la logique de getTotalPlatformCredits mais par jour
        // CORRECTION : Utilisation de c.participations (au pluriel)
        // CORRECTION : Utilisation de c.dateDepart au lieu de c.dateHeureDepart
        $qb = $this->createQueryBuilder('c')
            ->select('SUBSTRING(c.dateDepart, 1, 10) as tripDate, SUM(SIZE(c.participations) * 2) as dailyCredits')
            ->where('c.statut = :statutTermine')
            ->setParameter('statutTermine', 'terminé')
            ->groupBy('tripDate')
            ->orderBy('tripDate', 'ASC');

        $results = $qb->getQuery()->getResult();

        $data = [];
        foreach ($results as $row) {
            $data[$row['tripDate']] = (int) $row['dailyCredits'];
        }

        return $data;
    }

    /**
     * Compte le nombre total de covoiturages avec le statut 'terminé'.
     */
    public function countFinishedCovoiturages(): int
    {
        return $this->createQueryBuilder('c')
            ->select('count(c.id)')
            ->where('c.statut = :statutTermine')
            ->setParameter('statutTermine', 'terminé')
            ->getQuery()
            ->getSingleScalarResult() ?? 0;
    }

    /**
     * Trouve les covoiturages correspondant aux critères de recherche.
     * @param string $villeDepart
     * @param string $villeArrivee
     * @param \DateTimeInterface $startOfDay Le début de la journée de recherche
     * @param \DateTimeInterface $endOfDay La fin de la journée de recherche
     * @return Covoiturage[]
     */
    public function findBySearchCriteria(string $villeDepart, string $villeArrivee, \DateTimeInterface $startOfDay, \DateTimeInterface $endOfDay): array
    {
        $qb = $this->createQueryBuilder('c');

        $qb->select('c', 'chauffeur', 'v', 'm')
            ->leftJoin('c.chauffeur', 'chauffeur')
            ->leftJoin('c.voiture', 'v')
            ->leftJoin('v.marque', 'm')
            ->where('c.villeDepart = :depart')
            ->andWhere('c.villeArrivee = :arrivee')
            ->andWhere('c.dateDepart BETWEEN :startOfDay AND :endOfDay')
            ->andWhere('c.placesDisponibles > 0')
            ->andWhere('c.statut IN (:statuts)') 
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('startOfDay', $startOfDay)
            ->setParameter('endOfDay', $endOfDay)
            ->setParameter('statuts', ['initialise', 'en_cours']);

        $maintenant = new DateTime();
        if ($startOfDay->format('Y-m-d') === $maintenant->format('Y-m-d')) {
            $qb->andWhere('c.heureDepart > :heureActuelle')
               ->setParameter('heureActuelle', $maintenant->format('H:i:s'));
        }
        
        $qb->orderBy('c.heureDepart', 'ASC');

        error_log("DEBUG REPOSITORY: findBySearchCriteria - startOfDay: " . $startOfDay->format('Y-m-d H:i:s.u'));
        error_log("DEBUG REPOSITORY: findBySearchCriteria - endOfDay: " . $endOfDay->format('Y-m-d H:i:s.u'));
        error_log("DEBUG REPOSITORY: findBySearchCriteria - depart: " . $villeDepart);
        error_log("DEBUG REPOSITORY: findBySearchCriteria - arrivee: " . $villeArrivee);
        
        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve le prochain covoiturage disponible si la recherche initiale est vide.
     */
    public function findNextAvailable(string $villeDepart, string $villeArrivee, \DateTimeInterface $dateDepart): ?Covoiturage
    {
        $qb = $this->createQueryBuilder('c')
            ->select('c')
            ->where('c.villeDepart = :depart')
            ->andWhere('c.villeArrivee = :arrivee')
            ->andWhere('c.dateDepart > :date_depart') // Cherche après la date de recherche
            ->andWhere('c.placesDisponibles > 0')
            ->andWhere('c.statut IN (:statuts)')
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('date_depart', $dateDepart)
            ->setParameter('statuts', ['initialise', 'en_cours'])
            ->orderBy('c.dateDepart', 'ASC')
            ->addOrderBy('c.heureDepart', 'ASC')
            ->setMaxResults(1);

        error_log("DEBUG REPOSITORY: findNextAvailable - date_depart: " . $dateDepart->format('Y-m-d H:i:s.u'));
        error_log("DEBUG REPOSITORY: findNextAvailable - depart: " . $villeDepart);
        error_log("DEBUG REPOSITORY: findNextAvailable - arrivee: " . $villeArrivee);

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * NOUVEAU : Trouve les covoiturages qui étaient en litige mais sont maintenant terminés.
     * @return Covoiturage[]
     */
    public function findResolvedDisputes(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.statut = :statut')
            ->andWhere('c.moderationDetails IS NOT NULL') // S'assure qu'il y a eu une modération
            ->setParameter('statut', 'termine')
            ->orderBy('c.dateDepart', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
