const axios = require('axios');

module.exports = {
    defaultUser: {
        username: 'user1',
        email: 'user1@email.com',
        password: 'password',
        firstName: 'User',
        lastName: 'One'
    },
    createUser: ({base_url, user, token} )=> {
        return axios.post(
            `${base_url}/api/users`,
            room,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    },
    getUser: ({base_url, userId, token} )=> {
        return axios.get(
            `${base_url}/api/users/${userId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    },
    getUsers: ({base_url, token, params} )=> {
        const url = new URL(`${base_url}/api/users`);
        if (params && params.skip) url.searchParams.append('skip', params.skip);
        if (params && params.limit) url.searchParams.append('limit', params.limit);
        return axios.get(
            url.toString(),
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }
}