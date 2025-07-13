<?php

namespace App\Entity;

use App\Repository\VoitureRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: VoitureRepository::class)]
class Voiture
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['covoiturage_read', 'voiture_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'voitures')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotBlank(message: 'La marque est obligatoire.')]
    #[Groups(['covoiturage_read', 'voiture_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?Marque $marque = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le modèle est obligatoire.')]
    #[Assert\Length(min: 1, max: 255)]
    #[Groups(['covoiturage_read', 'voiture_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $modele = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'L\'immatriculation est obligatoire.')]
    #[Groups(['covoiturage_read', 'voiture_read'])]
    private ?string $immatriculation = null;
    
    #[ORM\Column(length: 2)]
    #[Assert\NotBlank(message: 'Le pays d\'immatriculation est obligatoire.')]
    #[Assert\Length(exactly: 2, exactMessage: 'Le code pays doit contenir exactement 2 caractères.')]
    #[Groups(['voiture_read'])]
    private ?string $paysImmatriculation = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Assert\NotNull(message: 'La date est obligatoire.')]
    #[Assert\LessThanOrEqual('today', message: 'La date ne peut pas être dans le futur.')]
    #[Groups(['voiture_read'])]
    private ?\DateTimeInterface $datePremiereImmatriculation = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['covoiturage_read', 'voiture_read', 'covoiturage_search_read'])] // AJOUT: Groupe pour la recherche
    private ?string $energie = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['voiture_read'])]
    private ?string $couleur = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotNull]
    #[Assert\Positive(message: 'Le nombre de places doit être supérieur à 0.')]
    #[Groups(['covoiturage_read', 'voiture_read'])]
    private ?int $nombreDePlaces = null;

    #[ORM\ManyToOne(inversedBy: 'voitures')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['voiture_read'])]
    private ?Utilisateur $utilisateur = null;

    /**
     * @var Collection<int, Covoiturage>
     */
    #[ORM\OneToMany(targetEntity: Covoiturage::class, mappedBy: 'voiture')]
    private Collection $covoiturages;

    public function __construct()
    {
        $this->covoiturages = new ArrayCollection();
    }
    
    // --- Getters and Setters ---

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getMarque(): ?Marque
    {
        return $this->marque;
    }

    public function setMarque(?Marque $marque): static
    {
        $this->marque = $marque;
        return $this;
    }

    public function getModele(): ?string
    {
        return $this->modele;
    }

    public function setModele(string $modele): static
    {
        $this->modele = $modele;
        return $this;
    }

    public function getImmatriculation(): ?string
    {
        return $this->immatriculation;
    }

    public function setImmatriculation(string $immatriculation): static
    {
        $this->immatriculation = $immatriculation;
        return $this;
    }
    
    public function getPaysImmatriculation(): ?string
    {
        return $this->paysImmatriculation;
    }

    public function setPaysImmatriculation(string $paysImmatriculation): static
    {
        $this->paysImmatriculation = $paysImmatriculation;
        return $this;
    }

    public function getDatePremiereImmatriculation(): ?\DateTimeInterface
    {
        return $this->datePremiereImmatriculation;
    }

    public function setDatePremiereImmatriculation(\DateTimeInterface $datePremiereImmatriculation): static
    {
        $this->datePremiereImmatriculation = $datePremiereImmatriculation;
        return $this;
    }

    public function getEnergie(): ?string
    {
        return $this->energie;
    }

    public function setEnergie(string $energie): static
    {
        $this->energie = $energie;
        return $this;
    }

    public function getCouleur(): ?string
    {
        return $this->couleur;
    }

    public function setCouleur(string $couleur): static
    {
        $this->couleur = $couleur;
        return $this;
    }

    public function getNombreDePlaces(): ?int
    {
        return $this->nombreDePlaces;
    }

    public function setNombreDePlaces(int $nombreDePlaces): static
    {
        $this->nombreDePlaces = $nombreDePlaces;
        return $this;
    }

    public function getUtilisateur(): ?Utilisateur
    {
        return $this->utilisateur;
    }

    public function setUtilisateur(?Utilisateur $utilisateur): static
    {
        $this->utilisateur = $utilisateur;
        return $this;
    }

    /**
     * @return Collection<int, Covoiturage>
     */
    public function getCovoiturages(): Collection
    {
        return $this->covoiturages;
    }

    public function addCovoiturage(Covoiturage $covoiturage): static
    {
        if (!$this->covoiturages->contains($covoiturage)) {
            $this->covoiturages->add($covoiturage);
            $covoiturage->setVoiture($this);
        }
        return $this;
    }

    public function removeCovoiturage(Covoiturage $covoiturage): static
    {
        if ($this->covoiturages->removeElement($covoiturage)) {
            if ($covoiturage->getVoiture() === $this) {
                $covoiturage->setVoiture(null);
            }
        }
        return $this;
    }
}
