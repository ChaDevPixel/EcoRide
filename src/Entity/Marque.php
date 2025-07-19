<?php

namespace App\Entity;

use App\Repository\MarqueRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: MarqueRepository::class)]
class Marque
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    // Ajout de 'trip_info' pour permettre la sérialisation de l'ID de la marque.
    #[Groups(['marque:read', 'covoiturage:read', 'covoiturage:search_read', 'covoiturage:user_driven_read', 'voiture:read', 'trip_info'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    // Ajout de 'trip_info' pour permettre la sérialisation du libellé de la marque.
    #[Groups(['marque:read', 'covoiturage:read', 'covoiturage:search_read', 'covoiturage:user_driven_read', 'voiture:read', 'trip_info'])]
    private ?string $libelle = null;

    /**
     * @var Collection<int, Voiture>
     */
    #[ORM\OneToMany(targetEntity: Voiture::class, mappedBy: 'marque')]
    // Cette collection ne doit PAS avoir de groupe de sérialisation pour éviter les références circulaires.
    private Collection $voitures;

    public function __construct()
    {
        $this->voitures = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLibelle(): ?string
    {
        return $this->libelle;
    }

    public function setLibelle(string $libelle): static
    {
        $this->libelle = $libelle;

        return $this;
    }

    /**
     * @return Collection<int, Voiture>
     */
    public function getVoitures(): Collection
    {
        return $this->voitures;
    }

    public function addVoiture(Voiture $voiture): static
    {
        if (!$this->voitures->contains($voiture)) {
            $this->voitures->add($voiture);
            $voiture->setMarque($this);
        }

        return $this;
    }

    public function removeVoiture(Voiture $voiture): static
    {
        if ($this->voitures->removeElement($voiture)) {
            // set the owning side to null (unless already changed)
            if ($voiture->getMarque() === $this) {
                $voiture->setMarque(null);
            }
        }

        return $this;
    }
}