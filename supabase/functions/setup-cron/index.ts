
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Enable pg_cron extension
    await supabaseClient.rpc('sql', {
      query: `
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
      `
    })

    // Schedule the cron job to run every hour
    await supabaseClient.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'check-due-tasks',
          '0 * * * *', -- every hour
          $$
          SELECT
            net.http_post(
                url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/check-due-tasks',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
                body:='{}'::jsonb
            ) as request_id;
          $$
        );
      `
    })

    return new Response(JSON.stringify({ message: 'Cron job scheduled successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error setting up cron job:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
