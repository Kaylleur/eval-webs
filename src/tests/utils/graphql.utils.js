const axios = require("axios");
const {AxiosError} = require("axios");

const BASE_URL = process.env.API_GRAPHQL_URL || 'http://localhost:4000/graphql';

/**
 * Fonction utilitaire pour envoyer des requêtes GraphQL.
 * @param {string} query - La requête ou mutation GraphQL.
 * @param {object} variables - Les variables associées à la requête/mutation.
 * @param {string} token - Le token Keycloak.
 * @returns {Promise<any>} - Retourne la partie "data" de la réponse GraphQL.
 */
const graphqlQuery = async  (query, variables, token) => {
  try {
    const response = await axios.post(
      BASE_URL,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.errors) {
      throw new Error(
        `GraphQL Errors: ${JSON.stringify(response.data.errors, null, 2)}`
      );
    }
    return response.data.data;
  } catch (error) {
    if(error instanceof AxiosError){
      console.log(error.response.data);
    }
    // console.error('Erreur lors de la requête GraphQL:', error);
    throw new Error(`Erreur GraphQL: ${error.message}`);
  }
}

module.exports = {
  graphqlRequest: graphqlQuery
}