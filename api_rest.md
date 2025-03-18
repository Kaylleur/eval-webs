# Api Rest

## Routes

> **Note :** Toutes les routes décrites ci-dessous sont protégées par JWT (Keycloak).  
> Pour chaque requête, le client doit inclure dans l’en-tête HTTP :  
> `Authorization: Bearer <token>`

---

### Gestion des Salles (Rooms)

#### 1. GET /api/rooms
<pre>
Query parameters (optionnels) :
- skip: number
- limit: number

Réponse :
{
  "rooms": [
    {
      "id": string,
      "name": string,
      "capacity": number,
      "location": string,
      "createdAt": string
    },
    ...
  ]
}
</pre>
Renvoie la liste paginée des salles.

#### 2. GET /api/rooms/{id}
<pre>
Path parameter :
- id : identifiant unique de la salle

Réponse :
{
  "id": string,
  "name": string,
  "capacity": number,
  "location": string,
  "createdAt": string
}
</pre>
Renvoie les détails d’une salle spécifique.

#### 3. POST /api/rooms
<pre>
Body (JSON) :
{
  "name": string,       // Obligatoire
  "capacity": number,   // Obligatoire
  "location": string    // Optionnel mais recommandé
}

Réponse (201 Created) :
{
  "id": string,
  "name": string,
  "capacity": number,
  "location": string,
  "createdAt": string
}
</pre>
Crée une nouvelle salle et renvoie l’objet créé.

#### 4. PUT /api/rooms/{id}
<pre>
Path parameter :
- id : identifiant unique de la salle à modifier

Body (JSON) :
{
  "name": string,       // Peut être inchangé ou mis à jour
  "capacity": number,
  "location": string
}

Réponse :
{
  "id": string,
  "name": string,
  "capacity": number,
  "location": string,
  "createdAt": string
}
</pre>
Met à jour les informations d’une salle existante.

#### 5. DELETE /api/rooms/{id}
<pre>
Path parameter :
- id : identifiant unique de la salle

Réponse (204 No Content) :
Aucun corps de réponse.
</pre>
Supprime une salle spécifique.

---

### Gestion des Réservations (Reservations)

#### 1. GET /api/reservations
<pre>
Query parameters (optionnels) :
- skip: number
- limit: number

Codes de statut possibles :
200 OK
400 Bad Request
401 Unauthorized

Réponse :
{
  "reservations": [
    {
      "id": string,
      "userId": number,
      "roomId": number,
      "startTime": string,
      "endTime": string,
      "createdAt": string
    },
    ...
  ]
}
</pre>
Renvoie la liste paginée des réservations.

#### 2. GET /api/reservations/{id}
<pre>
Path parameter :
- id : identifiant unique de la réservation

Codes de statut possibles :
200 OK
401 Unauthorized
404 Not Found

Réponse :
{
  "id": string,
  "userId": number,
  "roomId": number,
  "startTime": string,
  "endTime": string,
  "createdAt": string
}
</pre>
Renvoie les détails d’une réservation spécifique.

#### 3. POST /api/reservations
<pre>
Body (JSON) :
{
  "userId": number,    // Identifiant de l'utilisateur
  "roomId": number,    // Identifiant de la salle
  "startTime": string, // Format ISO8601 : "YYYY-MM-DDTHH:mm:ss"
  "endTime": string    // Idem
}

Codes de statut possibles :
201 Created
400 Bad Request
401 Unauthorized

Réponse  :
{
  "id": string,
  "userId": number,
  "roomId": number,
  "startTime": string,
  "endTime": string,
  "createdAt": string
}
</pre>
Crée une nouvelle réservation et renvoie l’objet créé.

#### 4. PUT /api/reservations/{id}
<pre>
Path parameter :
- id : identifiant unique de la réservation à modifier

Codes de statut possibles :
200 OK
400 Bad Request
401 Unauthorized
404 Not Found

Body (JSON) :
{
  "userId": number,    // Peut être inchangé ou mis à jour
  "roomId": number,
  "startTime": string,
  "endTime": string
}

Réponse :
{
  "id": string,
  "userId": number,
  "roomId": number,
  "startTime": string,
  "endTime": string,
  "createdAt": string
}
</pre>
Met à jour les informations d’une réservation existante.

#### 5. DELETE /api/reservations/{id}
<pre>
Path parameter :
- id : identifiant unique de la réservation

Codes de statut possibles :
204 No Content
401 Unauthorized
404 Not Found

Réponse :
Aucun corps de réponse.
</pre>
Supprime une réservation spécifique.

---

### Gestion des Utilisateurs (Users)

#### 0. Post /api/login
<pre>
Body (JSON) :
{
  "email": string,
  "password": string
}

Codes de statut possibles :
200 OK
400 Bad Request

Réponse :
{
    "accessToken": string
    }
</pre>

#### 1. GET /api/users
<pre>
Query parameters (optionnels) :
- skip: number
- limit: number

Codes de statut possibles :
200 OK
400 Bad Request
401 Unauthorized

Réponse :
{
  "users": [
    {
      "id": string,
      "keycloakId": string,
      "createdAt": string,
      "email": string
    },
    ...
  ]
}
</pre>
Renvoie la liste paginée des utilisateurs (tels qu’ils sont enregistrés dans la base locale pour la partie réservation).

#### 2. GET /api/users/{id}
<pre>
Path parameter :
- id : identifiant unique de l'utilisateur

Codes de statut possibles :
200 OK
401 Unauthorized
404 Not Found

Réponse :
{
  "id": string,
  "keycloakId": string,
  "createdAt": string,
  "email": string
}
</pre>
Renvoie les détails d’un utilisateur spécifique.

#### 3. POST /api/users
Attention pour créer un utilisateur l'application doit être connecté avec un compte admin de Keycloak puis utiliser l'api rest pour créer un utilisateur
<pre>
Body (JSON) :
{
  username: string,
  email: string,
  firstName: string,
  lastName: string,
  password: string, 
}

Codes de statut possibles :
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden

Réponse :
{
  "id": string,
  "keycloakId": string,
  "createdAt": string,
  "email": string
}
// Vous pouvez vérifier le contenu de init-keycloak.js
</pre>

#### 4. POST /api/users/{id}/extract
Cette route permet de générer un fichier CSV récapitulatif des réservations d’un utilisateur, et de renvoyer une URL permettant de le télécharger.
<pre>
Path parameter :
- id : identifiant unique de l'utilisateur

Codes de statut possibles :
200 OK
401 Unauthorized
404 Not Found

Réponse :
{
  "url": string
}
</pre>

---

## Documentation Swagger

Pour documenter ces routes, chaque endpoint doit être décrit dans votre configuration Swagger (OpenAPI).  
Les champs requis, les types de données, et les codes de statut (200, 201, 204, 400, 404, etc.) doivent y être précisés.  
