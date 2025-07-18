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