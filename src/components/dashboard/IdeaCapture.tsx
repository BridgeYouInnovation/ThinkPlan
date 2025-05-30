
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const IdeaCapture = () => {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    
    try {
      // First, save the idea to the database
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          content: idea.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (ideaError) {
        throw ideaError;
      }

      // For now, create some mock tasks (in the future, this will call your AI API)
      const mockTasks = [
        {
          title: `Research phase for: ${idea.substring(0, 30)}...`,
          description: "Initial research and planning",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          idea_id: ideaData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        },
        {
          title: `First action step for: ${idea.substring(0, 30)}...`,
          description: "Begin implementation",
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
          idea_id: ideaData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      ];

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(mockTasks);

      if (tasksError) {
        throw tasksError;
      }

      toast({
        title: "Idea processed!",
        description: "Your idea has been saved and broken down into actionable tasks.",
      });
      setIdea("");
    } catch (error) {
      console.error('Error processing idea:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your idea. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    setIsRecording(true);
    // Placeholder for voice recording implementation
    toast({
      title: "Voice input",
      description: "Voice recording will be implemented with OpenAI integration.",
    });
    setTimeout(() => setIsRecording(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capture Your Idea</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Describe your idea... (e.g., 'I want to learn Spanish and practice speaking with natives')"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!idea.trim() || isLoading}
            className="flex-1"
          >
            {isLoading ? "Processing..." : "Break Down into Tasks"}
          </Button>
          
          <Button
            variant="outline"
            onClick={startVoiceInput}
            disabled={isRecording}
            className="px-3"
          >
            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
          </Button>
        </div>
        
        {isRecording && (
          <p className="text-sm text-red-600 text-center">
            🎤 Recording... (Demo mode)
          </p>
        )}
      </CardContent>
    </Card>
  );
};
