
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAuthUrl, handleOAuthCallback } from "./oauth.ts";
import { fetchEmails } from "./emails.ts";
import { corsHeaders, createErrorResponse, createSuccessResponse } from "./utils.ts";

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log('Processing action:', action);

    // Handle OAuth callback first - this comes as a GET request from Google
    if (action === 'callback') {
      console.log('Processing OAuth callback from Google');
      return await handleOAuthCallback(url);
    }

    // For all other actions, we expect a POST with JSON body
    if (req.method !== 'POST') {
      throw new Error('Invalid request method');
    }

    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request body');
    }

    const requestAction = body.action;
    const userId = body.userId;
    
    console.log('Request action:', requestAction, 'userId:', userId);

    if (requestAction === 'auth') {
      const authUrl = await generateAuthUrl(userId);
      return createSuccessResponse({ authUrl });
    }

    if (requestAction === 'fetch-emails') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        console.error('Missing authorization header for fetch-emails');
        throw new Error('Missing authorization header for fetch-emails');
      }

      const emails = await fetchEmails(authHeader);
      return createSuccessResponse({ emails });
    }

    throw new Error('Invalid action');

  } catch (error) {
    return createErrorResponse(error.message);
  }
});
