// Configuration
const config = {
    clientId: "48001125-599a-489d-8ead-ce1802cc93f8",
    redirectUri: window.location.origin,
    scope: "openid profile email offline_access",
    authority: "https://login.microsoftonline.com/common",
    functionEndpoint: "/.netlify/functions/exchangeToken"
};

// ... (keep the rest of your init and UI code the same)

async function exchangeCodeForTokens(code) {
    try {
        console.log("Exchanging code via Netlify function");
        
        const response = await fetch(config.functionEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Token exchange failed');
        }
        
        const tokens = await response.json();
        displayResults(tokens);
        window.history.replaceState({}, document.title, window.location.pathname);
        
    } catch (error) {
        console.error('Token exchange error:', error);
        showError('Failed to exchange code for tokens', error.message);
    }
}
