// Configuration - Replace with your actual values
const config = {
    clientId: "8b4ba9dd-3ea5-4e5f-86f1-ddba2230dcf2", // Replace with your Azure AD app client ID
    redirectUri: window.location.origin, // Automatically uses current origin
    scope: "openid profile email offline_access", // offline_access is required for refresh token
    authority: "https://login.microsoftonline.com/common", // Use 'common' for multi-tenant
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoEndpoint: "https://graph.microsoft.com/oidc/userinfo"
};

// DOM elements
const loginButton = document.getElementById('loginButton');
const resultsDiv = document.getElementById('results');
const accessTokenEl = document.getElementById('accessToken');
const refreshTokenEl = document.getElementById('refreshToken');
const userInfoEl = document.getElementById('userInfo');

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log("Initializing Microsoft OAuth flow");
    loginButton.addEventListener('click', startLogin);
    
    // Check if we're returning from a redirect with auth code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (error) {
        const errorDesc = urlParams.get('error_description');
        console.error('Authentication error:', error, errorDesc);
        showError(`Error during authentication: ${error}`, errorDesc);
        return;
    }
    
    if (code) {
        console.log("Found authorization code in URL, exchanging for tokens...");
        exchangeCodeForTokens(code);
    }
}

function showError(title, message) {
    alert(`${title}\n\n${message}`);
    console.error(title, message);
}

function startLogin() {
    console.log("Starting Microsoft login flow");
    
    // Create the authorization URL
    const authUrl = new URL(`${config.authority}/oauth2/v2.0/authorize`);
    
    const params = {
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: config.redirectUri,
        response_mode: 'query',
        scope: config.scope,
        prompt: 'consent' // Ensure consent is prompted to get refresh token
    };
    
    Object.keys(params).forEach(key => {
        authUrl.searchParams.append(key, params[key]);
    });
    
    console.log("Redirecting to Microsoft login:", authUrl.toString());
    window.location.href = authUrl.toString();
}

async function exchangeCodeForTokens(code) {
    console.log("Exchanging authorization code for tokens");
    
    try {
        // Prepare the request body
        const body = new URLSearchParams();
        body.append('client_id', config.clientId);
        body.append('code', code);
        body.append('redirect_uri', config.redirectUri);
        body.append('grant_type', 'authorization_code');
        
        console.log("Making token request to:", config.tokenEndpoint);
        const response = await fetch(config.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });
        
        const responseText = await response.text();
        console.log("Token response:", responseText);
        
        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(`Token request failed: ${errorData.error} - ${errorData.error_description}`);
            } catch (e) {
                throw new Error(`Token request failed with status ${response.status}: ${responseText}`);
            }
        }
        
        const tokens = JSON.parse(responseText);
        console.log("Tokens received:", tokens);
        
        if (!tokens.access_token) {
            throw new Error("No access token received in response");
        }
        
        // Display the tokens
        displayResults(tokens);
        
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
    } catch (error) {
        console.error('Token exchange error:', error);
        showError('Failed to exchange code for tokens', error.message);
    }
}

function displayResults(tokens) {
    console.log("Displaying results");
    // Show the results section
    resultsDiv.classList.remove('hidden');
    
    // Display the access token (truncated for security)
    accessTokenEl.textContent = tokens.access_token 
        ? `${tokens.access_token.substring(0, 30)}... (${tokens.access_token.length} chars total)` 
        : 'No access token received';
    
    // Display the refresh token (truncated for security)
    refreshTokenEl.textContent = tokens.refresh_token 
        ? `${tokens.refresh_token.substring(0, 30)}... (${tokens.refresh_token.length} chars total)` 
        : 'No refresh token received';
    
    // Get and display user info if we have an access token
    if (tokens.access_token) {
        getUserInfo(tokens.access_token);
    }
}

async function getUserInfo(accessToken) {
    console.log("Fetching user info");
    try {
        const response = await fetch(config.userInfoEndpoint, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        const responseText = await response.text();
        console.log("User info response:", responseText);
        
        if (!response.ok) {
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(`User info request failed: ${errorData.error} - ${errorData.message}`);
            } catch (e) {
                throw new Error(`User info request failed with status ${response.status}: ${responseText}`);
            }
        }
        
        const userInfo = JSON.parse(responseText);
        userInfoEl.textContent = JSON.stringify(userInfo, null, 2);
        console.log("User info received:", userInfo);
    } catch (error) {
        console.error('User info error:', error);
        userInfoEl.textContent = `Failed to fetch user info: ${error.message}`;
    }
}
