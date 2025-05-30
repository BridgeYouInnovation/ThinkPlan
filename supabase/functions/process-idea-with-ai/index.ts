
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ProcessIdeaRequest, ProcessIdeaResponse } from './types.ts';
import { generateSystemPrompt, generateDateConfirmationPrompt } from './prompts.ts';
import { callOpenAI } from './openai.ts';
import { saveIdeaAndTasks } from './database.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, userId, dateConfirmation }: ProcessIdeaRequest = await req.json();
    
    if (!idea || !userId) {
      throw new Error('Missing idea or userId');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get current date for context
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    let systemPrompt: string;
    let userPrompt: string;

    if (dateConfirmation) {
      // Handle date confirmation response
      systemPrompt = generateDateConfirmationPrompt(todayStr, dayOfWeek, today);
      userPrompt = `Original idea: "${idea}"\nUser's timing preference: "${dateConfirmation}"\n\nPlease update the task dates based on their preference and current date context.`;
    } else {
      // Handle initial idea processing
      systemPrompt = generateSystemPrompt(todayStr, dayOfWeek);
      userPrompt = `Please break down this idea into actionable tasks: "${idea}"`;
    }

    // Call OpenAI to process the idea
    const aiResponse = await callOpenAI(systemPrompt, userPrompt, openAIApiKey);

    // Check if any tasks need user input for dates
    const tasksNeedingInput = aiResponse.tasks.filter((task: any) => task.needs_user_input);
    
    if (tasksNeedingInput.length > 0 && !dateConfirmation) {
      // Return response asking for date confirmation
      const response: ProcessIdeaResponse = {
        success: true,
        needsDateConfirmation: true,
        aiResponse,
        pendingTasks: aiResponse.tasks
      };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Save to database
    const { idea: ideaData, tasks: tasksData } = await saveIdeaAndTasks(
      idea, 
      userId, 
      aiResponse, 
      dateConfirmation
    );

    const response: ProcessIdeaResponse = {
      success: true,
      aiResponse,
      idea: ideaData,
      tasks: tasksData,
      needsDateConfirmation: false
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing idea:', error);
    const errorResponse: ProcessIdeaResponse = {
      success: false,
      error: error.message
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
