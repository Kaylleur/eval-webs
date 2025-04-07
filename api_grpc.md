# gRPC Service 
 
**Contexte** : Les notifications doivent être créées automatiquement lors de la création d’une réservation et lors de la mise à jour de son statut. Les statuts possibles sont : `pending`, `approved`, `rejected`, `cancelled`.  
Pour la démonstration, ce microservice ne fait qu’enregistrer les notifications dans la base de données (table `notifications` vue dans le [database.md](../database.md)).
Le microservice fournira aussi une méthode pour extraire les réservations d’un utilisateur au format CSV, la stocker sur MinIO, et renvoyer une URL de téléchargement.

Le nom du package sera '**notification**'

---

## 1. Architecture et principes d’appel

### 1.1. Schéma global

1. **API REST / GraphQL** :
    - Quand l’utilisateur crée ou met à jour une réservation (avec un statut), l’API REST ou GraphQL appelle le microservice gRPC.
    - L’appel se fait par un stub gRPC (client) généré à partir du fichier `.proto`.

2. **Microservice gRPC (Notifications)** :
    - Reçoit les demandes de création ou mise à jour de notifications.
    - Stocke les données dans la table `notifications` (ou met à jour l’enregistrement existant si besoin).
    - Dans un scénario plus avancé, il pourrait déclencher de l’envoi d’e-mails ou tout autre canal de notification.

3. **Base de données** :
    - Le microservice stocke les notifications dans PostgreSQL.

---

## 2. Définition du service

Service: NotificationService

### 2.1. CreateNotification
<pre>
    input : 
    {
        "reservationId": number,
        "message": string,
        "notificationDate": string
    }
    output : 
    {
        "id": String,
        "reservationId": number,
        "message": string,
        "notificationDate": string
    }
</pre>

### 2.2. UpdateNotification
<pre>
    input : 
    {
        "id": String,
        "message": string,
        "notificationDate": string
    }
    output : 
    {
        "id": String,
        "reservationId": number,
        "message": string,
        "notificationDate": string
    }   
</pre>

### 2.3. GetNotification
<pre>
    input : 
    {
        "id": String
    }
    output : 
    {
        "id": String,
        "reservationId": number,
        "message": string,
        "notificationDate": string
    }
</pre>

### 2.4. ExportReservations
Service: ExportService
<pre>
    input : 
    {
        "userId": number
    }
    output : 
    {
        "url": string
    }
</pre>