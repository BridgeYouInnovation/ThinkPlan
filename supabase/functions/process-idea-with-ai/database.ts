
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AIResponse } from './types.ts';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function saveIdeaAndTasks(
  idea: string,
  userId: string,
  aiResponse: AIResponse,
  dateConfirmation?: string
) {
  const supabase = createSupabaseClient();
  
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

  return { idea: ideaData, tasks: tasksData };
}
