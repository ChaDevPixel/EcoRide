<?php

namespace App\Repository;

use App\Entity\Covoiturage;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Covoiturage>
 */
class CovoiturageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Covoiturage::class);
    }

    // ... (les autres méthodes comme findForUser, etc.)

    /**
     * Trouve les covoiturages correspondant aux critères de recherche.
     * Respecte l'US 3 : recherche par ville et date, places disponibles > 0.
     *
     * @param string $villeDepart
     * @param string $villeArrivee
     * @param \DateTimeInterface $dateDepart
     * @return Covoiturage[]
     */
    public function findBySearchCriteria(string $villeDepart, string $villeArrivee, \DateTimeInterface $dateDepart): array
    {
        $qb = $this->createQueryBuilder('c');

        $qb->select('c', 'u', 'v', 'm') // Sélectionne le covoiturage et ses relations
            ->leftJoin('c.chauffeur', 'u')
            ->leftJoin('c.voiture', 'v')
            ->leftJoin('v.marque', 'm')
            ->where('c.villeDepart = :depart')
            ->andWhere('c.villeArrivee = :arrivee')
            // Compare uniquement la partie 'date' (ignore l'heure)
            ->andWhere('DATE(c.dateDepart) = :date_depart')
            // US 3: Seuls les itinéraires avec au minimum une place disponible
            ->andWhere('c.placesDisponibles > 0')
            // On ne montre que les voyages non commencés
            ->andWhere('c.statut = :statut')
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('date_depart', $dateDepart->format('Y-m-d'))
            ->setParameter('statut', 'initialise')
            ->orderBy('c.heureDepart', 'ASC');

        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve le prochain covoiturage disponible si la recherche initiale est vide.
     * Respecte la suggestion de l'US 3.
     *
     * @param string $villeDepart
     * @param string $villeArrivee
     * @param \DateTimeInterface $dateDepart
     * @return Covoiturage|null
     */
    public function findNextAvailable(string $villeDepart, string $villeArrivee, \DateTimeInterface $dateDepart): ?Covoiturage
    {
        $qb = $this->createQueryBuilder('c');

        $qb->select('c')
            ->where('c.villeDepart = :depart')
            ->andWhere('c.villeArrivee = :arrivee')
            // Cherche à une date ultérieure
            ->andWhere('DATE(c.dateDepart) > :date_depart')
            ->andWhere('c.placesDisponibles > 0')
            ->andWhere('c.statut = :statut')
            ->setParameter('depart', $villeDepart)
            ->setParameter('arrivee', $villeArrivee)
            ->setParameter('date_depart', $dateDepart->format('Y-m-d'))
            ->setParameter('statut', 'initialise')
            ->orderBy('c.dateDepart', 'ASC')
            ->addOrderBy('c.heureDepart', 'ASC')
            ->setMaxResults(1); // On ne veut que le tout premier

        return $qb->getQuery()->getOneOrNullResult();
    }
}