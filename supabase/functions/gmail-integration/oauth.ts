
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = "912536761364-ekndmkc5k77j7ecirqt7v0gdq9qjffj1.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function generateAuthUrl(userId: string): Promise<string> {
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
  return authUrl;
}

export async function handleOAuthCallback(url: URL): Promise<Response> {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // userId
  const error = url.searchParams.get('error');
  
  console.log('OAuth callback - code:', !!code, 'state:', state, 'error:', error);
  
  if (error) {
    console.error('OAuth error:', error);
    return createErrorResponse('Authentication failed', error);
  }
  
  if (!code || !state) {
    console.error('Missing code or state - code:', !!code, 'state:', state);
    return createErrorResponse('Authentication failed', 'Missing authorization code or user ID');
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
    return createErrorResponse('Authentication failed', 'Failed to get access token');
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
    return createErrorResponse('Authentication failed', 'Failed to store authentication tokens');
  }

  console.log('Successfully stored tokens for user:', state);
  return createSuccessResponse();
}

function createErrorResponse(title: string, error: string): Response {
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
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

function createSuccessResponse(): Response {
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
