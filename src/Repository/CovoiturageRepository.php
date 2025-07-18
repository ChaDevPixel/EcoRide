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
            ->setParameter('endOfDay', $endOfDay) // J'ai corrigé une petite typo ici (c'était une chaîne de caractères)
            ->setParameter('statuts', ['initialise', 'en_cours']);

        // ✨ NOUVELLE LOGIQUE : Filtre sur l'heure si la recherche est pour aujourd'hui ✨
        $maintenant = new DateTime();
        // On vérifie si la date de début de recherche est la même qu'aujourd'hui
        if ($startOfDay->format('Y-m-d') === $maintenant->format('Y-m-d')) {
            // Si c'est le cas, on ajoute une condition pour ne prendre que les heures futures
            $qb->andWhere('c.heureDepart > :heureActuelle')
               ->setParameter('heureActuelle', $maintenant->format('H:i:s'));
        }
        
        $qb->orderBy('c.heureDepart', 'ASC');

        // NOUVEAU : Logs de débogage pour les paramètres de date
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

        // NOUVEAU : Logs de débogage pour les paramètres de date
        error_log("DEBUG REPOSITORY: findNextAvailable - date_depart: " . $dateDepart->format('Y-m-d H:i:s.u'));
        error_log("DEBUG REPOSITORY: findNextAvailable - depart: " . $villeDepart);
        error_log("DEBUG REPOSITORY: findNextAvailable - arrivee: " . $villeArrivee);

        return $qb->getQuery()->getOneOrNullResult();
    }
}
