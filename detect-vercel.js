// Vercel Serverless Function - JavaScript puro
// Save as: /api/detect.js

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Configuração hardcoded para esta versão específica
    const API_KEY = 'OoX2YSquRlMr1YRSSgtbkYglLLPZur7S';
    const HUMAN_URL = 'https://www.youtube.com/';
    const BOT_URL = 'http://google.com/';
    
    // Get client IP
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     '8.8.8.8';
    
    console.log('Checking IP:', clientIP);
    
    // Build API request
    const userAgent = req.body.userAgent || '';
    const language = req.body.language || '';
    
    const apiUrl = `https://ipqualityscore.com/api/json/ip/${API_KEY}/${clientIP}?user_agent=${encodeURIComponent(userAgent)}&user_language=${encodeURIComponent(language)}&strictness=1&allow_public_access_points=true`;
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Detection failed');
    }
    
    // Bot detection logic
    let isBot = false;
    
    if (true && data.is_crawler) {
      isBot = false;
    } else {
      if (data.fraud_score >= 75) {
        isBot = true;
      } else if (data.proxy || data.vpn || data.bot_status || data.recent_abuse) {
        isBot = true;
      }
    }
    
    console.log('Detection result - IP:', clientIP, 'Bot:', isBot, 'Score:', data.fraud_score);
    
    // Return redirect URL
    const redirectUrl = isBot ? BOT_URL : HUMAN_URL;
    
    res.json({
      success: true,
      redirectUrl: redirectUrl,
      details: {
        fraud_score: data.fraud_score,
        country: data.country_code,
        isp: data.ISP
      }
    });
    
  } catch (error) {
    console.error('Detection error:', error);
    res.json({
      success: false,
      redirectUrl: 'https://www.youtube.com/'
    });
  }
}