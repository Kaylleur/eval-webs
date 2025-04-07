const axios = require('axios');
module.exports = {
    defaultRoom: {
        name: 'Room 1',
        capacity: 10,
        location: 'Floor 1'
    },
    createRoom: ({base_url, room, token} )=> {
        return axios.post(
            `${base_url}/api/rooms`,
            room,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    }
}