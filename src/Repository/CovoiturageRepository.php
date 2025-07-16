<?php

namespace App\Repository;

use App\Entity\Covoiturage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use DateTime; // J'ai ajouté cette ligne pour être sûr que la classe DateTime est disponible

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
            ->andWhere('c.statut = :statut')
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('startOfDay', $startOfDay)
            ->setParameter('endOfDay', $endOfDay)
            ->setParameter('statut', 'initialise')
            ->orderBy('c.heureDepart', 'ASC');

        // CORRECTION : Si la date de recherche est aujourd'hui,
        // on s'assure que l'heure de départ n'est pas déjà passée.
        $today = new DateTime('today');
        if ($startOfDay->format('Y-m-d') === $today->format('Y-m-d')) {
            $qb->andWhere('c.dateDepart >= :now')
               ->setParameter('now', new DateTime());
        }

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
            ->andWhere('c.statut = :statut')
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('date_depart', $dateDepart)
            ->setParameter('statut', 'initialise')
            ->orderBy('c.dateDepart', 'ASC')
            ->addOrderBy('c.heureDepart', 'ASC')
            ->setMaxResults(1);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
