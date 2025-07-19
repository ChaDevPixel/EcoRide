<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250719112952 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE covoiturage CHANGE moderation_details moderation_details JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE utilisateur ADD statut VARCHAR(20) DEFAULT \'actif\' NOT NULL, CHANGE telephone telephone VARCHAR(50) DEFAULT NULL, CHANGE adresse adresse VARCHAR(255) DEFAULT NULL, CHANGE date_naissance date_naissance DATE DEFAULT NULL, CHANGE photo photo VARCHAR(255) DEFAULT NULL, CHANGE pseudo pseudo VARCHAR(50) DEFAULT NULL, CHANGE preferences preferences JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE messenger_messages CHANGE delivered_at delivered_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE covoiturage CHANGE moderation_details moderation_details LONGTEXT DEFAULT NULL COLLATE `utf8mb4_bin`');
        $this->addSql('ALTER TABLE messenger_messages CHANGE delivered_at delivered_at DATETIME DEFAULT \'NULL\' COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE utilisateur DROP statut, CHANGE telephone telephone VARCHAR(50) DEFAULT \'NULL\', CHANGE adresse adresse VARCHAR(255) DEFAULT \'NULL\', CHANGE date_naissance date_naissance DATE DEFAULT \'NULL\', CHANGE photo photo VARCHAR(255) DEFAULT \'NULL\', CHANGE pseudo pseudo VARCHAR(50) DEFAULT \'NULL\', CHANGE preferences preferences LONGTEXT DEFAULT NULL COLLATE `utf8mb4_bin`');
    }
}
