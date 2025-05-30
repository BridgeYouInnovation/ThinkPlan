
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic } from "lucide-react";

export const IdeaCapture = () => {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI processing - replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Idea processed!",
        description: "Your idea has been broken down into actionable tasks.",
      });
      setIdea("");
    }, 2000);
  };

  const startVoiceInput = () => {
    setIsRecording(true);
    // Placeholder for voice recording implementation
    toast({
      title: "Voice input",
      description: "Voice recording will be implemented with Supabase integration.",
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
            {isLoading ? "Processing with AI..." : "Break Down into Tasks"}
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
