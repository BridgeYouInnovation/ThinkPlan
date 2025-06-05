
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Setting up task cleanup cron job...');

    // Enable required extensions
    const { error: extensionError } = await supabaseClient.rpc('sql', {
      query: `
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        CREATE EXTENSION IF NOT EXISTS pg_net;
      `
    })

    if (extensionError) {
      console.error('Error enabling extensions:', extensionError);
      throw extensionError;
    }

    console.log('Extensions enabled successfully');

    // Remove existing cron job if it exists
    const { error: removeError } = await supabaseClient.rpc('sql', {
      query: `SELECT cron.unschedule('cleanup-completed-tasks');`
    })

    // Note: We don't throw on removeError as the job might not exist yet
    if (removeError) {
      console.log('No existing cron job to remove (this is normal on first setup)');
    }

    // Schedule the cleanup job to run every hour
    const { error: cronError } = await supabaseClient.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'cleanup-completed-tasks',
          '0 * * * *', -- every hour at minute 0
          $$
          SELECT
            net.http_post(
                url:='${Deno.env.get('SUPABASE_URL')}/functions/v1/cleanup-completed-tasks',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
                body:='{"scheduled": true}'::jsonb
            ) as request_id;
          $$
        );
      `
    })

    if (cronError) {
      console.error('Error scheduling cron job:', cronError);
      throw cronError;
    }

    console.log('Task cleanup cron job scheduled successfully to run every hour');

    return new Response(JSON.stringify({ 
      message: 'Task cleanup cron job scheduled successfully',
      schedule: 'Every hour at minute 0',
      function_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cleanup-completed-tasks`
    }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error setting up task cleanup cron job:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to setup automatic cleanup for completed tasks'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
