
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, userId } = await req.json();
    
    if (!idea || !userId) {
      throw new Error('Missing idea or userId');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call OpenAI to process the idea
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a friendly, helpful assistant that turns ideas into actionable tasks. Your goal is to:

1. Break down the user's idea into 2-4 simple, clear tasks
2. Sound natural and human - like a supportive friend giving advice
3. Assign realistic due dates based on priority and logical sequence
4. If a task doesn't have an obvious timeline, ask the user to confirm a deadline
5. Don't overwhelm with too many tasks
6. Suggest helpful extras like reminders, grouping, or best times to work

Response format should be JSON:
{
  "message": "A friendly, natural response acknowledging their idea",
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Brief helpful description",
      "priority": "high|medium|low",
      "estimated_duration": "30m|1h|2h|etc",
      "suggested_due_date": "YYYY-MM-DD" or null,
      "needs_user_input": true/false,
      "timeline_question": "Optional question about when to do this"
    }
  ],
  "suggestions": [
    "Optional helpful suggestions like setting reminders, grouping tasks, etc"
  ]
}`
          },
          {
            role: 'user',
            content: idea
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const aiResponse = JSON.parse(aiResult.choices[0].message.content);

    // Save the original idea
    const { data: ideaData, error: ideaError } = await supabase
      .from('ideas')
      .insert({
        content: idea,
        user_id: userId,
        ai_response: aiResponse
      })
      .select()
      .single();

    if (ideaError) {
      throw ideaError;
    }

    // Create tasks from AI response
    const tasksToInsert = aiResponse.tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      user_id: userId,
      idea_id: ideaData.id,
      status: 'pending',
      priority: task.priority || 'medium',
      estimated_duration: task.estimated_duration,
      due_date: task.suggested_due_date ? new Date(task.suggested_due_date).toISOString() : null,
      needs_user_input: task.needs_user_input || false,
      timeline_question: task.timeline_question || null
    }));

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (tasksError) {
      throw tasksError;
    }

    return new Response(JSON.stringify({
      success: true,
      aiResponse,
      idea: ideaData,
      tasks: tasksData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing idea:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
