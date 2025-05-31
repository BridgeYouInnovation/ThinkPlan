
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
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Use service role key for all database operations
const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);

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
      console.log('GET request with action:', action);
    } else {
      // Handle POST requests (auth initiation and fetch emails)
      const body = await req.json();
      action = body.action;
      userId = body.userId;
      console.log('POST request with action:', action, 'userId:', userId);
    }

    if (action === 'auth') {
      // Generate OAuth URL with correct Supabase function URL
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-integration?action=callback`;
      console.log('Redirect URI:', redirectUri);
      
      const scope = 'https://www.googleapis.com/auth/gmail.readonly';
      const state = userId || '';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `include_granted_scopes=true&` +
        `state=${state}`;

      console.log('Generated auth URL:', authUrl);

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'callback') {
      // Handle OAuth callback
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // userId
      const error = url.searchParams.get('error');
      
      console.log('OAuth callback - code:', !!code, 'state:', state, 'error:', error);
      
      if (error) {
        console.error('OAuth error:', error);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Gmail Auth Error</title>
            <script>
              window.addEventListener('load', function() {
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'GMAIL_AUTH_ERROR',
                      error: '${error}'
                    }, '*');
                  }
                } catch (e) {
                  console.error('Error posting message:', e);
                }
                setTimeout(() => window.close(), 1000);
              });
            </script>
          </head>
          <body>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
      }
      
      if (!code || !state) {
        console.error('Missing code or state - code:', !!code, 'state:', state);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Gmail Auth Error</title>
            <script>
              window.addEventListener('load', function() {
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'GMAIL_AUTH_ERROR',
                      error: 'Missing authorization code or user ID'
                    }, '*');
                  }
                } catch (e) {
                  console.error('Error posting message:', e);
                }
                setTimeout(() => window.close(), 1000);
              });
            </script>
          </head>
          <body>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
      }

      // Exchange code for tokens
      const redirectUri = `${SUPABASE_URL}/functions/v1/gmail-integration?action=callback`;
      console.log('Token exchange redirect URI:', redirectUri);
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      const tokens = await tokenResponse.json();
      console.log('Token response status:', tokenResponse.status);
      console.log('Token response:', tokens);
      
      if (!tokens.access_token) {
        console.error('Failed to get access token:', tokens);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Gmail Auth Error</title>
            <script>
              window.addEventListener('load', function() {
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'GMAIL_AUTH_ERROR',
                      error: 'Failed to get access token'
                    }, '*');
                  }
                } catch (e) {
                  console.error('Error posting message:', e);
                }
                setTimeout(() => window.close(), 1000);
              });
            </script>
          </head>
          <body>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
      }

      // Store tokens in Supabase using admin client
      console.log('Storing tokens for user:', state);
      const { error: dbError } = await supabaseAdmin
        .from('user_integrations')
        .upsert({
          user_id: state,
          service: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString()
        });

      if (dbError) {
        console.error('Error storing tokens:', dbError);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Gmail Auth Error</title>
            <script>
              window.addEventListener('load', function() {
                try {
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'GMAIL_AUTH_ERROR',
                      error: 'Failed to store authentication tokens'
                    }, '*');
                  }
                } catch (e) {
                  console.error('Error posting message:', e);
                }
                setTimeout(() => window.close(), 1000);
              });
            </script>
          </head>
          <body>
            <p>Authentication failed. This window will close automatically.</p>
          </body>
          </html>
        `, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
      }

      console.log('Successfully stored tokens for user:', state);

      // Return HTML that closes the popup and sends success message to parent
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Connected</title>
          <script>
            window.addEventListener('load', function() {
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({
                    type: 'GMAIL_AUTH_SUCCESS'
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 1000);
            });
          </script>
        </head>
        <body>
          <p>Gmail connected successfully! This window will close automatically.</p>
        </body>
        </html>
      `, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' }
      });
    }

    if (action === 'fetch-emails') {
      // For this action, we need user authentication, so create a client with the auth header
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        throw new Error('Missing authorization header for fetch-emails');
      }

      const supabaseWithAuth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      });

      // Get current user
      const { data: { user }, error: userError } = await supabaseWithAuth.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get stored tokens using admin client (since we need to access the tokens)
      const { data: integration, error } = await supabaseAdmin
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service', 'gmail')
        .single();

      if (error || !integration) {
        console.error('No Gmail integration found for user:', user.id, error);
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
