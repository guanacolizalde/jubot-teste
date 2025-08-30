// Netlify Edge Function for bot detection
// Save as: /netlify/edge-functions/detect.js

import { Context } from "https://edge.netlify.com";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async (request: Request, context: Context) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
  
  try {
    // Get configuration from environment variables
    const API_KEY = Deno.env.get('IPQUALITYSCORE_API_KEY');
    const HUMAN_URL = Deno.env.get('HUMAN_URL') || 'https://www.youtube.com/';
    const BOT_URL = Deno.env.get('BOT_URL') || 'http://google.com/';
    
    if (!API_KEY) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Service configuration error',
        fallbackUrl: HUMAN_URL
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request data
    const clientData = await request.json();
    
    // Get client IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('cf-connecting-ip') ||
                     context.ip ||
                     '8.8.8.8';
    
    console.log(`Checking IP: ${clientIP}`);
    
    // Build IPQualityScore API request
    const strictness = 1;
    const userAgent = clientData.userAgent || '';
    const language = clientData.language || '';
    
    const apiUrl = `https://ipqualityscore.com/api/json/ip/${API_KEY}/${clientIP}?user_agent=${encodeURIComponent(userAgent)}&user_language=${encodeURIComponent(language)}&strictness=${strictness}&allow_public_access_points=true`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
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
    
    // Return only the final redirect URL - no exposed logic
    const redirectUrl = isBot ? BOT_URL : HUMAN_URL;
    
    return new Response(JSON.stringify({
      success: true,
      redirectUrl: redirectUrl,
      details: {
        fraud_score: data.fraud_score,
        country: data.country_code,
        isp: data.ISP
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Detection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Detection failed',
      fallbackUrl: Deno.env.get('HUMAN_URL') || 'https://www.youtube.com/'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};