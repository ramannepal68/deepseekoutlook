const axios = require('axios');

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    try {
        const { code } = JSON.parse(event.body);
        
        const params = new URLSearchParams();
        params.append('client_id', process.env.MICROSOFT_CLIENT_ID);
        params.append('client_secret', process.env.MICROSOFT_CLIENT_SECRET);
        params.append('code', code);
        params.append('redirect_uri', process.env.MICROSOFT_REDIRECT_URI);
        params.append('grant_type', 'authorization_code');
        
        const response = await axios.post(
            'https://login.microsoftonline.com/common/oauth2/v2.0/token',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: error.message,
                details: error.response?.data
            })
        };
    }
};
