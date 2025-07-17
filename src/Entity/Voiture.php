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
    // Ajout de 'covoiturage:user_driven_read' pour que l'ID de la voiture soit visible
    // lorsque le covoiturage est sérialisé via ce groupe.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:search_read', 'covoiturage:user_driven_read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'voitures')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotBlank(message: 'La marque est obligatoire.')]
    // La marque doit être exposée avec les groupes appropriés.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:search_read', 'covoiturage:user_driven_read'])]
    private ?Marque $marque = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le modèle est obligatoire.')]
    #[Assert\Length(min: 1, max: 255)]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:search_read', 'covoiturage:user_driven_read'])]
    private ?string $modele = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'L\'immatriculation est obligatoire.')]
    // L'immatriculation peut être sensible, mais pour les covoiturages de l'utilisateur, elle est souvent nécessaire.
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?string $immatriculation = null;
    
    #[ORM\Column(length: 2)]
    #[Assert\NotBlank(message: 'Le pays d\'immatriculation est obligatoire.')]
    #[Assert\Length(exactly: 2, exactMessage: 'Le code pays doit contenir exactement 2 caractères.')]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?string $paysImmatriculation = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Assert\NotNull(message: 'La date est obligatoire.')]
    #[Assert\LessThanOrEqual('today', message: 'La date ne peut pas être dans le futur.')]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?\DateTimeInterface $datePremiereImmatriculation = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:search_read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?string $energie = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?string $couleur = null;

    #[ORM\Column(type: Types::INTEGER)]
    #[Assert\NotNull]
    #[Assert\Positive(message: 'Le nombre de places doit être supérieur à 0.')]
    // Ajout de 'covoiturage:user_driven_read'.
    #[Groups(['voiture:read', 'covoiturage:read', 'covoiturage:user_driven_read'])]
    private ?int $nombreDePlaces = null;

    #[ORM\ManyToOne(inversedBy: 'voitures')]
    #[ORM\JoinColumn(nullable: false)]
    // L'utilisateur propriétaire de la voiture ne doit pas être sérialisé ici avec des groupes
    // qui pourraient créer des références circulaires (ex: si Utilisateur sérialise ses voitures).
    // Si vous avez besoin de l'utilisateur, utilisez un groupe spécifique pour la voiture elle-même
    // ou un endpoint dédié.
    // Pour le contexte des covoiturages, le chauffeur est déjà directement lié au covoiturage.
    #[Groups(['voiture:read_full'])] // Exemple de groupe si vous voulez une lecture complète de la voiture avec son propriétaire
    private ?Utilisateur $utilisateur = null;

    #[ORM\OneToMany(targetEntity: Covoiturage::class, mappedBy: 'voiture')]
    // Cette collection ne doit PAS avoir de groupe de sérialisation pour éviter les références circulaires.
    // Les covoiturages sont déjà sérialisés via d'autres chemins (ex: covoituragesConduits de l'utilisateur).
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
            // set the owning side to null (unless already changed)
            if ($covoiturage->getVoiture() === $this) {
                $covoiturage->setVoiture(null);
            }
        }
        return $this;
    }
}
