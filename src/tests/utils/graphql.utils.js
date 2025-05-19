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
const graphqlQuery = async (query, variables, token) => {
  const response = await axios.post(
    BASE_URL,
    {query, variables},
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.data.errors) {
    //console.log(response.data.errors)
    throw response.data.errors;
  }
  return response.data.data;
}

module.exports = {
  graphqlRequest: graphqlQuery
}