  # Database Schema

L’objectif est de stocker les informations relatives aux utilisateurs, aux salles, aux réservations et aux notifications.
La base de données sera initialisée avec NestJS et TypeORM avec la synchronisation automatique des entités.

## 1. Table `users`

Cette table stocke les informations minimales liées aux utilisateurs de l’application (même si l’authentification est gérée par Keycloak, on souhaite conserver un lien interne pour pouvoir associer les réservations à un utilisateur).

| Champ             | Type                | Description                                                      |
|-------------------|---------------------|------------------------------------------------------------------|
| `id`              | `UUID` (PK)          | Identifiant unique de l’utilisateur (Primary Key).               |
| `keycloak_id`     | `UUID` ou `VARCHAR` | Identifiant unique provenant de Keycloak (référence externe).     |
| `created_at`      | `TIMESTAMP`         | Date et heure de création de l’enregistrement.                   |
| `email`           | `VARCHAR(255)`      | Adresse e-mail de l’utilisateur (optionnel, si besoin local).    |

**Clés et contraintes :**
- **PK** : `id` est la clé primaire.
- `keycloak_id` devrait être unique si vous souhaitez garantir qu’un même utilisateur Keycloak n’ait qu’une seule entrée dans la table.

---

## 2. Table `rooms`

Cette table représente les différentes salles pouvant être réservées.

| Champ        | Type           | Description                                          |
|--------------|----------------|------------------------------------------------------|
| `id`         | `UUID` (PK)     | Identifiant unique de la salle (Primary Key).        |
| `name`       | `VARCHAR(100)` | Nom de la salle (ex: "Salle A", "Meeting Room #1").  |
| `capacity`   | `INT`          | Capacité maximale (nombre de personnes).            |
| `location`   | `VARCHAR(255)` | Informations sur l’emplacement (étage, bâtiment).   |
| `created_at` | `TIMESTAMP`    | Date et heure de création de l’enregistrement.       |

**Clés et contraintes :**
- **PK** : `id` est la clé primaire.
- `capacity` doit être non-nul (peut être défini avec un `NOT NULL` et une valeur par défaut, par exemple `0`).

---

## 3. Table `reservations`

Cette table stocke toutes les réservations effectuées par les utilisateurs.

| Champ        | Type        | Description                                                                      |
|--------------|-------------|----------------------------------------------------------------------------------|
| `id`         | `UUID` (PK)  | Identifiant unique de la réservation (Primary Key).                              |
| `user_id`    | `INT`       | Clé étrangère vers `users.id`, identifiant l’utilisateur ayant réservé la salle. |
| `room_id`    | `INT`       | Clé étrangère vers `rooms.id`, identifiant la salle réservée.                    |
| `start_time` | `TIMESTAMP` | Date et heure de début de la réservation.                                        |
| `end_time`   | `TIMESTAMP` | Date et heure de fin de la réservation.                                          |
| `created_at` | `TIMESTAMP` | Date et heure de création de la réservation.                                     |
| `status`     | `string`    | Status de la réservation                                                         |

**Clés et contraintes :**
- **PK** : `id` est la clé primaire.
- **FK** :
    - `user_id` fait référence à `users.id`.
    - `room_id` fait référence à `rooms.id`.
- Les colonnes `start_time` et `end_time` doivent être non-null pour éviter les réservations incomplètes.
- On peut ajouter une contrainte pour s’assurer que `start_time < end_time`.
- les status peuvent être `pending`, `approved`, `rejected`, `cancelled`
---


## 4. Table `notifications`

Cette table stocke les notifications envoyées ou à envoyer (pour la démonstration, nous n’enverrons pas réellement de mail, mais nous allons simuler un envoi et stocker l’info ici).

| Champ               | Type        | Description                                                                 |
|---------------------|-------------|-----------------------------------------------------------------------------|
| `id`                | `UUID` (PK) | Identifiant unique de la notification (Primary Key).                        |
| `reservation_id`    | `INT`       | Clé étrangère vers `reservations.id`, identifie la réservation concernée.   |
| `message`           | `TEXT`      | Contenu du message notifié.                                                |
| `notification_date` | `TIMESTAMP` | Date et heure de la notification (réelle ou prévue).                        |
| `is_sent`           | `BOOLEAN`   | Indique si la notification a déjà été « marquée comme envoyée ».            |

**Clés et contraintes :**
- **PK** : `id` est la clé primaire.
- **FK** :
- `reservation_id` fait référence à `reservations.id`.
- `is_sent` peut être initialisé à `FALSE` par défaut.

## 5. Exemple d'entités de TypeORM

Voici un exemple de définition des entités TypeORM pour ces tables :

```typescript
// src/entities/user.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'keycloak_id' })
  keycloakId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ nullable: true })
  email: string;
}
```

---