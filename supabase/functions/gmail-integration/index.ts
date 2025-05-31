
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_CLIENT_ID = "912536761364-ekndmkc5k77j7ecirqt7v0gdq9qjffj1.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const supabaseClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let action: string | null;
    let userId: string | null = null;

    // Handle GET requests (OAuth callback)
    if (req.method === 'GET') {
      action = url.searchParams.get('action');
    } else {
      // Handle POST requests (auth initiation and fetch emails)
      const body = await req.json();
      action = body.action;
      userId = body.userId;
    }

    if (action === 'auth') {
      // Generate OAuth URL
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-integration?action=callback`;
      const scope = 'https://www.googleapis.com/auth/gmail.readonly';
      const state = userId || '';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${state}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      // Handle OAuth callback
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // userId
      
      if (!code || !state) {
        throw new Error('Missing authorization code or user ID');
      }

      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${SUPABASE_URL}/functions/v1/gmail-integration?action=callback`,
        }),
      });

      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }

      // Store tokens in Supabase
      const { error } = await supabaseClient
        .from('user_integrations')
        .upsert({
          user_id: state,
          service: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing tokens:', error);
        throw new Error('Failed to store authentication tokens');
      }

      // Redirect back to app
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://759c9db5-ec83-42a9-bee0-7ff61ad201af.lovableproject.com/?gmail=connected'
        }
      });
    }

    if (action === 'fetch-emails') {
      // Get stored tokens
      const { data: integration, error } = await supabaseClient
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service', 'gmail')
        .single();

      if (error || !integration) {
        throw new Error('Gmail not connected');
      }

      // Fetch recent emails
      const gmailResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread',
        {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`,
          },
        }
      );

      const emailList = await gmailResponse.json();
      
      if (!emailList.messages) {
        return new Response(JSON.stringify({ emails: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Fetch email details
      const emails = await Promise.all(
        emailList.messages.slice(0, 5).map(async (message: any) => {
          const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            {
              headers: {
                'Authorization': `Bearer ${integration.access_token}`,
              },
            }
          );
          return await detailResponse.json();
        })
      );

      // Process emails for AI analysis
      const processedEmails = emails.map(email => {
        const headers = email.payload.headers;
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        const date = headers.find((h: any) => h.name === 'Date')?.value || '';
        
        let body = '';
        if (email.payload.body.data) {
          body = atob(email.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        } else if (email.payload.parts) {
          const textPart = email.payload.parts.find((part: any) => part.mimeType === 'text/plain');
          if (textPart && textPart.body.data) {
            body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          }
        }

        return {
          id: email.id,
          subject,
          from,
          date,
          body: body.substring(0, 500), // Limit body length
          snippet: email.snippet
        };
      });

      return new Response(JSON.stringify({ emails: processedEmails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Gmail integration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
