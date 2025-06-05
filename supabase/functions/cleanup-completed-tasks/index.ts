
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting cleanup of completed tasks older than 24 hours...');

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('Cutoff time for deletion:', twentyFourHoursAgo.toISOString());

    // Find completed tasks that are older than 24 hours
    const { data: tasksToDelete, error: fetchError } = await supabaseClient
      .from('tasks')
      .select('id, title, completed_at, status')
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .lt('completed_at', twentyFourHoursAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching tasks to delete:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${tasksToDelete?.length || 0} completed tasks to delete`);

    if (tasksToDelete && tasksToDelete.length > 0) {
      // Log each task that will be deleted
      tasksToDelete.forEach(task => {
        console.log(`Will delete task: "${task.title}" (completed at: ${task.completed_at})`);
      });

      // Delete the tasks
      const taskIds = tasksToDelete.map(task => task.id);
      
      const { error: deleteError } = await supabaseClient
        .from('tasks')
        .delete()
        .in('id', taskIds);

      if (deleteError) {
        console.error('Error deleting tasks:', deleteError);
        throw deleteError;
      }

      console.log(`Successfully deleted ${tasksToDelete.length} completed tasks`);
    } else {
      console.log('No completed tasks found that are older than 24 hours');
    }

    return new Response(
      JSON.stringify({ 
        message: 'Cleanup completed successfully',
        deletedCount: tasksToDelete?.length || 0,
        deletedTasks: tasksToDelete?.map(t => ({ id: t.id, title: t.title, completed_at: t.completed_at })) || [],
        cutoffTime: twentyFourHoursAgo.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in cleanup function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
