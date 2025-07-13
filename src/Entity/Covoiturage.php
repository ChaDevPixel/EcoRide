<?php

namespace App\Entity;

use App\Repository\CovoiturageRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups; // Pour la sérialisation JSON

#[ORM\Entity(repositoryClass: CovoiturageRepository::class)]
class Covoiturage
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])]
    private ?string $villeDepart = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?\DateTimeInterface $dateDepart = null;

    #[ORM\Column(length: 5)] // Format HH:MM
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $heureDepart = null;

    #[ORM\Column(length: 255)]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $villeArrivee = null;

    #[ORM\Column(type: Types::DATE_MUTABLE)]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?\DateTimeInterface $dateArrivee = null;

    #[ORM\Column(length: 5)] // Format HH:MM
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $heureArrivee = null;

    #[ORM\Column]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?int $prix = null; // Prix en crédits

    #[ORM\Column]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?bool $estAccompagne = false;

    #[ORM\Column(nullable: true)] // Peut être nul si non accompagné
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?int $nombreAccompagnateurs = null;

    #[ORM\Column]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?int $placesDisponibles = null; // Places pour les autres utilisateurs

    #[ORM\Column(length: 50)] // Ex: 'initialise', 'en_cours', 'termine'
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $statut = null;

    #[ORM\ManyToOne(inversedBy: 'covoituragesConduits')] // MODIFIÉ: inversedBy doit correspondre à la propriété dans Utilisateur
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['covoiturage_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?Utilisateur $chauffeur = null;

    #[ORM\ManyToOne(targetEntity: Voiture::class, inversedBy: 'covoiturages')] // MODIFIÉ: inversedBy doit correspondre à la propriété dans Voiture
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(["covoiturage_read", "covoiturage_search_read"])] // AJOUT: Groupe pour la recherche
    private ?Voiture $voiture = null;

    /**
     * @var Collection<int, Utilisateur>
     */
    #[ORM\ManyToMany(targetEntity: Utilisateur::class, mappedBy: 'covoituragesPassager')] // MODIFIÉ: mappedBy doit correspondre à la propriété dans Utilisateur
    private Collection $passagers; // Les passagers qui rejoignent le covoiturage (nom plus clair)

    public function __construct()
    {
        $this->passagers = new ArrayCollection(); // MODIFIÉ
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getVilleDepart(): ?string
    {
        return $this->villeDepart;
    }

    public function setVilleDepart(string $villeDepart): static
    {
        $this->villeDepart = $villeDepart;

        return $this;
    }

    public function getDateDepart(): ?\DateTimeInterface
    {
        return $this->dateDepart;
    }

    public function setDateDepart(\DateTimeInterface $dateDepart): static
    {
        $this->dateDepart = $dateDepart;

        return $this;
    }

    public function getHeureDepart(): ?string
    {
        return $this->heureDepart;
    }

    public function setHeureDepart(string $heureDepart): static
    {
        $this->heureDepart = $heureDepart;

        return $this;
    }

    public function getVilleArrivee(): ?string
    {
        return $this->villeArrivee;
    }

    public function setVilleArrivee(string $villeArrivee): static
    {
        $this->villeArrivee = $villeArrivee;

        return $this;
    }

    public function getDateArrivee(): ?\DateTimeInterface
    {
        return $this->dateArrivee;
    }

    public function setDateArrivee(\DateTimeInterface $dateArrivee): static
    {
        $this->dateArrivee = $dateArrivee;

        return $this;
    }

    public function getHeureArrivee(): ?string
    {
        return $this->heureArrivee;
    }

    public function setHeureArrivee(string $heureArrivee): static
    {
        $this->heureArrivee = $heureArrivee;

        return $this;
    }

    public function getPrix(): ?int
    {
        return $this->prix;
    }

    public function setPrix(int $prix): static
    {
        $this->prix = $prix;

        return $this;
    }

    public function isEstAccompagne(): ?bool
    {
        return $this->estAccompagne;
    }

    public function setEstAccompagne(bool $estAccompagne): static
    {
        $this->estAccompagne = $estAccompagne;

        return $this;
    }

    public function getNombreAccompagnateurs(): ?int
    {
        return $this->nombreAccompagnateurs;
    }

    public function setNombreAccompagnateurs(?int $nombreAccompagnateurs): static
    {
        $this->nombreAccompagnateurs = $nombreAccompagnateurs;

        return $this;
    }

    public function getPlacesDisponibles(): ?int
    {
        return $this->placesDisponibles;
    }

    public function setPlacesDisponibles(int $placesDisponibles): static
    {
        $this->placesDisponibles = $placesDisponibles;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;

        return $this;
    }

    public function getChauffeur(): ?Utilisateur
    {
        return $this->chauffeur;
    }

    public function setChauffeur(?Utilisateur $chauffeur): static
    {
        $this->chauffeur = $chauffeur;

        return $this;
    }

    public function getVoiture(): ?Voiture
    {
        return $this->voiture;
    }

    public function setVoiture(?Voiture $voiture): static
    {
        $this->voiture = $voiture;

        return $this;
    }

    /**
     * @return Collection<int, Utilisateur>
     */
    public function getPassagers(): Collection // MODIFIÉ
    {
        return $this->passagers;
    }

    public function addPassager(Utilisateur $passager): static // MODIFIÉ
    {
        if (!$this->passagers->contains($passager)) {
            $this->passagers->add($passager);
            $passager->addCovoiturage($this); // Assurez-vous que cette méthode existe dans Utilisateur
        }

        return $this;
    }

    public function removePassager(Utilisateur $passager): static // MODIFIÉ
    {
        if ($this->passagers->removeElement($passager)) {
            $passager->removeCovoiturage($this); // Assurez-vous que cette méthode existe dans Utilisateur
        }

        return $this;
    }
}