const request = require('request'); // "Request" library

let client_id = 'c8e6eae51c094ce79eabdfb254ff3ef7'; // Your client id
let client_secret = '7cffd0a1d1754df98b6f52d46e216d2d'; // Your secret

// your application requests authorization
let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {

        // use the access token to access the Spotify Web API
        let  token = body.access_token;
        let options = {
            url: 'https://api.spotify.com/v1/users/sjalalalalala',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            json: true
        };
        request.get(options, function(error, response, body) {
            console.log(body);
        });
    }
});