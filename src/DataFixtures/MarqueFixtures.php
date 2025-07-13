<?php
// src/DataFixtures/MarqueFixtures.php

namespace App\DataFixtures;

use App\Entity\Marque; // Assurez-vous d'importer votre entité Marque
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class MarqueFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $marques = [
           'Peugeot', 'Renault', 'Citroën', 'Dacia', 'Volkswagen', 'Audi', 'BMW', 'Mercedes-Benz', 'Opel', 'Ford', 'Fiat', 
           'Skoda', 'SEAT', 'Toyota', 'Nissan', 'Hyundai', 'Kia', 'Mazda', 'Honda', 'Volvo', 'Mini', 'Tesla', 'Suzuki', 
           'Mitsubishi', 'Jeep', 'Alfa Romeo', 'Lancia', 'Smart', 'Chevrolet', 'Lexus', 'Jaguar', 'Land Rover', 'Subaru', 'Porsche', 
           'Cupra', 'DS Automobiles', 'Saab', 'Chrysler', 'Infiniti', 'Rover', 'MG', 'Cadillac', 'Buick', 'Iveco', 'SsangYong'
        ];

        foreach ($marques as $nomMarque) {
            $marque = new Marque();
            $marque->setLibelle($nomMarque); // CHANGEMENT : setNom() remplacé par setLibelle()
            $manager->persist($marque);
        }

        $manager->flush(); // Enregistre toutes les marques dans la base de données
    }
}

