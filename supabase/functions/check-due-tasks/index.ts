
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get tasks that are due within the next 24 hours and haven't been notified
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: dueTasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select(`
        id,
        title,
        due_date,
        user_id,
        notification_sent
      `)
      .eq('status', 'pending')
      .eq('notification_sent', false)
      .lte('due_date', tomorrow.toISOString())
      .gte('due_date', new Date().toISOString())

    if (tasksError) {
      console.error('Error fetching due tasks:', tasksError)
      return new Response(JSON.stringify({ error: tasksError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`Found ${dueTasks?.length || 0} due tasks`)

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No due tasks found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Group tasks by user
    const tasksByUser = dueTasks.reduce((acc, task) => {
      if (!acc[task.user_id]) {
        acc[task.user_id] = []
      }
      acc[task.user_id].push(task)
      return acc
    }, {} as Record<string, typeof dueTasks>)

    const notificationResults = []

    // Send notifications for each user
    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      // Get user's push subscriptions
      const { data: subscriptions, error: subError } = await supabaseClient
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId)

      if (subError) {
        console.error('Error fetching subscriptions:', subError)
        continue
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscriptions found for user ${userId}`)
        continue
      }

      // Send notification to each subscription
      for (const subscription of subscriptions) {
        try {
          const taskCount = userTasks.length
          const title = taskCount === 1 
            ? `Task due soon: ${userTasks[0].title}`
            : `${taskCount} tasks due soon`
          
          const body = taskCount === 1
            ? `Due: ${new Date(userTasks[0].due_date!).toLocaleDateString()}`
            : `Check your tasks - multiple items are due soon`

          const payload = JSON.stringify({
            title,
            body,
            data: {
              url: '/',
              tasks: userTasks.map(t => t.id)
            }
          })

          // In a real implementation, you would use a proper web push library
          // For now, we'll just log what would be sent
          console.log(`Would send notification to ${subscription.endpoint}:`, payload)
          
          notificationResults.push({
            userId,
            endpoint: subscription.endpoint,
            payload,
            status: 'sent'
          })
        } catch (error) {
          console.error('Error sending notification:', error)
          notificationResults.push({
            userId,
            endpoint: subscription.endpoint,
            status: 'failed',
            error: error.message
          })
        }
      }

      // Mark tasks as notified
      const taskIds = userTasks.map(t => t.id)
      const { error: updateError } = await supabaseClient
        .from('tasks')
        .update({ notification_sent: true })
        .in('id', taskIds)

      if (updateError) {
        console.error('Error marking tasks as notified:', updateError)
      } else {
        console.log(`Marked ${taskIds.length} tasks as notified for user ${userId}`)
      }
    }

    return new Response(JSON.stringify({
      message: 'Notifications processed',
      results: notificationResults,
      tasksProcessed: dueTasks.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in check-due-tasks function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
