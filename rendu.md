# Objectif et Rendu

Ce document décrit les objectifs du projet, la structure attendue pour le dépôt GitHub (avec un `docker-compose` permettant de lancer tous les services), la façon de lancer les tests automatiques, ainsi qu'une proposition de barème de notation pour l’évaluation.

---

## 1. Objectif du projet

L’objectif est de réaliser une plateforme de réservation de salles répondant aux exigences suivantes :

1. **Architecture multi-services** :
    - Une **API REST** documentée via Swagger, protégée par Keycloak.
    - Une **API GraphQL** (Apollo Server ou équivalent), également protégée par Keycloak.
    - Un **microservice gRPC** chargé de gérer, entre autres, la génération de fichiers CSV et l’envoi (ou stockage) de notifications.

2. **Base de données** :
    - Utilisation de **PostgreSQL** (conteneurisé via Docker).
    - Schéma indiqué dans le fichier `database.md`.

3. **MinIO** :
    - Stockage d’objets (CSV récapitulatif des réservations par utilisateur).
    - Retour d’une URL permettant le téléchargement du fichier.

4. **Authentification** :
    - Gérée par **Keycloak** (conteneurisé également).
    - Les deux APIs (REST et GraphQL) exigent un jeton JWT valide.


---

## 2. Structure du dépôt

Le dépôt GitHub doit contenir les éléments suivants :

1. **Dossier `api-rest`** :
    - Code source de l’API REST.
    - Fichier `Dockerfile` pour construire l’image Docker.
    - Fichier `swagger.yaml` pour la documentation Swagger.

2. **Dossier `api-graphql`** :
    - Code source de l’API GraphQL.
    - Fichier `Dockerfile` pour construire l’image Docker.

3. **Dossier `grpc-service`** :
    - Code source du microservice gRPC.
    - Fichier `Dockerfile` pour construire l’image Docker.
    - Fichier `proto/service.proto` pour définir les messages et services gRPC.

4. **Dossier `docs`** :
    - Tous fichiers de documentation (Markdown, PDF, etc.).

5. **Dossier `tests`** :
    - Tests fourni par moi

6. **Racine du dépôt** :
    - Fichier `docker-compose.yml` permettant de lancer tous les services.

## 3. Barème de notation

Le barème de notation est le suivant :

### 1. API REST (note sur 20 + 2 bonus)

| Critère                                                   | Points  |
|-----------------------------------------------------------|---------|
| **Tests fonctionnels**                                    | 8 pts   |
| **Contraintes fonctionnelles** (unicité, sécurité, etc.)  | 4 pts   |
| **Swagger complet**                                       | 4 pts   |
| **Extraction CSV + intégration gRPC**                     | 4 pts   |
| **Qualité de code (bonus)**                               | +2 pts  |

> La somme des critères principaux fait 20 points.  
> 2 points supplémentaires peuvent être accordés en bonus pour la qualité de code.

---

### 2. API GraphQL (note sur 10 + 2 bonus)

| Critère                                                   | Points |
|-----------------------------------------------------------|--------|
| **Tests fonctionnels**                                    | 7 pts  |
| **Contraintes fonctionnelles** (validations, sécurité…)   | 3 pts  |
| **Qualité de code (bonus)**                               | +2 pts  |

> Total : 10 points.
> 2 points supplémentaires peuvent être accordés en bonus pour la qualité de code (structuration, lisibilité, etc.).

---

### 3. gRPC (note sur 20 + 2 bonus)

| Critère                                                   | Points  |
|-----------------------------------------------------------|---------|
| **Tests fonctionnels**                                    | 8 pts   |
| **Fichier `.proto` complet**                              | 4 pts   |
| **Contraintes** (validation, robustesse, etc.)            | 4 pts   |
| **Partie extraction** (CSV, MinIO, etc.)                  | 4 pts   |
| **Qualité de code (bonus)**                               | +2 pts  |

> La somme des critères principaux fait 20 points.  
> 2 points supplémentaires peuvent être accordés en bonus pour la qualité de code (structuration, lisibilité, etc.).

---

### 4. Projet dans sa globalité (note sur 20)

| Critère                                   | Points |
|-------------------------------------------|--------|
| **docker-compose** (démarrage, cohérence) | 3 pts  |
| **Documentation** (clarté, exhaustivité)  | 5 pts  |
| **Répartition du code entre les élèves**  | 12 pts |

> Total : 20 points.

---

### Récapitulatif

- **API REST** : /20 (+2 bonus)
- **API GraphQL** : /10 (+2 bonus) 
- **gRPC** : /20 (+2 bonus)
- **Projet dans sa globalité** : /20

> **Note** : Sur l'ensemble du projet la répartition de code sera un critère individuel, qui sera adapté en fonction de la contribution de chacun.

Les bonus ne sont pas inclus dans la note maximale indiquée, mais peuvent faire augmenter la note finale en récompensant un code particulièrement propre et maintenable.  
