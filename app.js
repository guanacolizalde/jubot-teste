// Clean frontend script - calls serverless API
(function() {
    'use strict';
    
    // API Configuration - CHANGE THIS URL TO YOUR DEPLOYED API
    const API_ENDPOINT = 'https://your-vercel-app.vercel.app/api/detect';
    // For Netlify use: 'https://your-netlify-app.netlify.app/.netlify/edge-functions/detect'
    
    const TIMEOUT = 15000; // 15 seconds timeout
    
    // Auto-execute on page load
    document.addEventListener('DOMContentLoaded', function() {
        detectAndRedirect();
    });
    
    async function detectAndRedirect() {
        try {
            // Collect minimal client data
            const clientData = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                timestamp: Date.now(),
                referrer: document.referrer || '',
                screen: {
                    width: screen.width,
                    height: screen.height
                }
            };
            
            // Make detection request to your deployed API
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clientData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Servidor decide tudo - frontend só redireciona
            if (result.redirectUrl) {
                window.location.href = result.redirectUrl;
            }
            
        } catch (error) {
            // Falha silenciosa - usuário fica na página
        }
    }
})();