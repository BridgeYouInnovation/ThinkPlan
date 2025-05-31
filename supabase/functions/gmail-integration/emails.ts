
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

export async function fetchEmails(authHeader: string): Promise<any[]> {
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
    console.error('User not authenticated:', userError);
    throw new Error('User not authenticated');
  }

  // Get stored tokens using admin client
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
    return [];
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

  return processEmails(emails);
}

function processEmails(emails: any[]): any[] {
  return emails.map(email => {
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
}
