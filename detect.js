// Vercel API endpoint for bot detection
export default async function handler(req, res) {
  // Configure CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Apply CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { userAgent, language, timestamp, referrer, screen } = req.body;
    
    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     '8.8.8.8';
    
    // Your IPQuality API key (set as environment variable in Vercel)
    const apiKey = process.env.IPQUALITYSCORE_API_KEY;
    
    if (!apiKey) {
      return res.status(200).json({ redirectUrl: 'https://www.youtube.com/' });
    }
    
    // Call IPQualityScore API
    const apiUrl = `https://ipqualityscore.com/api/json/ip/${apiKey}/${clientIP}?user_agent=${encodeURIComponent(userAgent)}&user_language=${encodeURIComponent(language)}&strictness=1&allow_public_access_points=true`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.success) {
      return res.status(200).json({ redirectUrl: 'https://www.youtube.com/' });
    }
    
    // Bot detection logic
    const isBot = data.fraud_score >= 75 || data.proxy || data.bot_status;
    
    // Return redirect URL based on detection
    const redirectUrl = isBot ? 'https://example.com/bot' : 'https://www.youtube.com/';
    
    return res.status(200).json({ redirectUrl });
    
  } catch (error) {
    return res.status(200).json({ redirectUrl: 'https://www.youtube.com/' });
  }
}