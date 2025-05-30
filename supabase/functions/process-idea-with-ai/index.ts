
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
    const { idea, userId, dateConfirmation } = await req.json();
    
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

    let systemPrompt = `You are a smart, human-like productivity assistant. A user just submitted an idea they want to act on. Your job is to help them **move forward immediately** by creating **1 to 3 simple, real-world tasks** (maximum 4) that are specific, actionable, and do **not repeat or restate the original idea**.

Each task should:
- Be a **clear instruction** the user can act on right away
- Be **short and focused**, like something you'd write in a to-do list
- Include a **realistic due date** (e.g., "Today", "Tomorrow", or a date within 3–5 days depending on urgency and effort required)
- Use natural everyday language (not headings like "Research Phase" or "First Step")

If the timing of a task is unclear, set needs_user_input to true and include a polite question asking the user to confirm a suggested date. You may assume the user works during the day unless otherwise specified.

Response format should be JSON:
{
  "message": "A friendly, natural response acknowledging their idea",
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Brief helpful description",
      "priority": "high|medium|low",
      "estimated_duration": "15m|30m|1h|2h|4h|1d",
      "suggested_due_date": "YYYY-MM-DD" or null,
      "needs_user_input": true/false,
      "timeline_question": "Optional question about when to do this"
    }
  ],
  "suggestions": [
    "Optional helpful suggestions like setting reminders, grouping tasks, etc"
  ]
}`;

    let userPrompt = `Here is the user's idea: "${idea}"`;

    // If this is a date confirmation response, modify the prompt
    if (dateConfirmation) {
      systemPrompt = `The user has provided date preferences for their tasks. Update the due dates based on their input and return the final tasks with proper dates set.

Response format should be JSON:
{
  "message": "Confirmation message about the updated dates",
  "tasks": [
    {
      "title": "Task title (same as before)",
      "description": "Task description (same as before)",
      "priority": "high|medium|low",
      "estimated_duration": "15m|30m|1h|2h|4h|1d",
      "suggested_due_date": "YYYY-MM-DD",
      "needs_user_input": false,
      "timeline_question": null
    }
  ]
}`;
      userPrompt = `Original idea: "${idea}"\nUser's date preferences: "${dateConfirmation}"\n\nPlease set appropriate due dates based on the user's preferences.`;
    }

    // Call OpenAI to process the idea
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
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

    // Check if any tasks need user input for dates
    const tasksNeedingInput = aiResponse.tasks.filter((task: any) => task.needs_user_input);
    
    if (tasksNeedingInput.length > 0 && !dateConfirmation) {
      // Return response asking for date confirmation
      return new Response(JSON.stringify({
        success: true,
        needsDateConfirmation: true,
        aiResponse,
        pendingTasks: aiResponse.tasks
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save the original idea (only on first call, not date confirmation)
    let ideaData;
    if (!dateConfirmation) {
      const { data: newIdeaData, error: ideaError } = await supabase
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
      ideaData = newIdeaData;
    }

    // Create tasks from AI response
    const tasksToInsert = aiResponse.tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      user_id: userId,
      idea_id: ideaData?.id || null,
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
      tasks: tasksData,
      needsDateConfirmation: false
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
