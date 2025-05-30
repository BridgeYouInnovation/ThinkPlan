
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

    // Get current date for context
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    let systemPrompt = `You are a productivity assistant that breaks down user ideas into specific, actionable tasks. Your job is to analyze the user's idea and create 1-3 concrete tasks that help them achieve their goal.

CURRENT DATE CONTEXT:
- Today is: ${todayStr} (${dayOfWeek})
- Use this context to interpret relative dates like "tomorrow", "this Sunday", "next week", etc.

IMPORTANT RULES:
1. Create SPECIFIC, ACTIONABLE tasks - NOT generic phases or steps
2. Each task should be something the user can immediately DO
3. NEVER repeat or restate the original idea in task titles
4. Use clear, direct language like "Buy ingredients" not "Research phase for buying ingredients"
5. Keep tasks focused and realistic
6. ALWAYS return valid JSON without markdown code blocks

For date handling:
- If the idea mentions a specific day (like "Sunday", "tomorrow", "next week"), ask the user to confirm the exact date
- If no timing is mentioned, ask when they'd like to complete this
- If timing seems flexible or ongoing, don't require a date

Examples:
- Idea: "Bake cake on Sunday" → Tasks: "Buy cake ingredients", "Preheat oven to 350°F", "Prepare cake batter and bake"
- Idea: "Learn Spanish" → Tasks: "Download language learning app", "Complete first Spanish lesson", "Practice 15 minutes daily"
- Idea: "Plan vacation to Italy" → Tasks: "Research flight prices to Rome", "Book accommodation for 5 days", "Create daily itinerary"

CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks. Do not wrap your response in \`\`\`json or any other formatting.

Response format (JSON):
{
  "message": "Brief acknowledgment of their idea",
  "tasks": [
    {
      "title": "Specific actionable task title",
      "description": "Brief helpful description",
      "priority": "high|medium|low",
      "estimated_duration": "15m|30m|1h|2h|4h|1d",
      "suggested_due_date": "YYYY-MM-DD" or null,
      "needs_user_input": true/false,
      "timeline_question": "Question about timing if needed"
    }
  ],
  "suggestions": ["Optional helpful tips"]
}`;

    let userPrompt = `Please break down this idea into actionable tasks: "${idea}"`;

    // If this is a date confirmation response, modify the prompt
    if (dateConfirmation) {
      systemPrompt = `You are parsing user input about when they want to complete tasks. Parse their natural language input and convert it to specific dates.

CURRENT DATE CONTEXT:
- Today is: ${todayStr} (${dayOfWeek})

CRITICAL INSTRUCTIONS:
1. Parse the user's natural language about dates intelligently
2. Convert relative terms like "tomorrow", "this Saturday", "next week" to actual dates
3. If you cannot determine exact dates, make reasonable assumptions based on context
4. Return ONLY valid JSON without markdown formatting or code blocks
5. Do not wrap response in \`\`\`json or any other formatting

Common date patterns to handle:
- "tomorrow" → ${new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
- "this Saturday" → calculate the coming Saturday
- "this Sunday" → calculate the coming Sunday
- "next week" → set reasonable dates within next week
- "by Friday" → use that Friday as deadline
- "start today" → today's date
- "no rush" or "whenever" → leave date as null

If the user mentions multiple dates or activities, assign appropriate dates to each task based on the context.

Return the same tasks with updated dates based on user input.

CRITICAL: Return ONLY valid JSON without any markdown formatting or code blocks.

Response format (JSON):
{
  "message": "Confirmation of the updated timeline",
  "tasks": [
    {
      "title": "Same task title as before",
      "description": "Same description as before", 
      "priority": "same priority",
      "estimated_duration": "same duration",
      "suggested_due_date": "YYYY-MM-DD based on user input",
      "needs_user_input": false,
      "timeline_question": null
    }
  ]
}`;
      userPrompt = `Original idea: "${idea}"\nUser's timing preference: "${dateConfirmation}"\n\nPlease update the task dates based on their preference and current date context.`;
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
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    let aiResponseContent = aiResult.choices[0].message.content;
    
    // Clean up any potential markdown formatting
    aiResponseContent = aiResponseContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('AI Response Content:', aiResponseContent);
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(aiResponseContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw AI Response:', aiResponseContent);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

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
