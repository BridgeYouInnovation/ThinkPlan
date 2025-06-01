
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MakeTaskPayload {
  user_email: string;
  title: string;
  description?: string;
  source: 'gmail' | 'whatsapp';
  message_content: string;
  suggested_date?: string;
  priority?: 'low' | 'medium' | 'high';
  ai_analysis?: string;
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

serve(async (req) => {
  console.log(`Received ${req.method} request to receive-make-task`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const payload: MakeTaskPayload = await req.json();
    console.log('Received payload from Make.com:', payload);

    // Validate required fields
    if (!payload.user_email || !payload.title || !payload.source) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: user_email, title, and source are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createSupabaseClient();

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', payload.user_email)
      .single();

    if (profileError || !profile) {
      console.error('User not found:', payload.user_email, profileError);
      return new Response(
        JSON.stringify({ 
          error: 'User not found. Make sure the user is registered in the app.' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse suggested date if provided
    let due_date = null;
    if (payload.suggested_date) {
      try {
        due_date = new Date(payload.suggested_date).toISOString();
      } catch (error) {
        console.warn('Invalid date format:', payload.suggested_date);
      }
    }

    // Create the task
    const taskData = {
      title: payload.title,
      description: payload.description || payload.message_content,
      user_id: profile.id,
      status: 'pending' as const,
      priority: payload.priority || 'medium',
      due_date,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Store Make.com specific data in a structured way
      source_data: {
        source: payload.source,
        original_message: payload.message_content,
        ai_analysis: payload.ai_analysis,
        created_by: 'make_automation'
      }
    };

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert(taskData)
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create task',
          details: taskError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Task created successfully:', task.id);

    // Store the original message for reference
    const messageData = {
      user_id: profile.id,
      content: payload.message_content,
      source: payload.source,
      ai_reply: payload.ai_analysis,
      is_flagged: true,
      created_at: new Date().toISOString()
    };

    const { error: messageError } = await supabase
      .from('messages')
      .insert(messageData);

    if (messageError) {
      console.warn('Failed to store original message:', messageError);
      // Don't fail the whole request for this
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        task_id: task.id,
        message: 'Task created successfully',
        user_id: profile.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in receive-make-task function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
