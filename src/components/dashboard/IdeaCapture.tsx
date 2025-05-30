
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, Lightbulb, Sparkles, Zap, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const IdeaCapture = () => {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      toast({
        title: "✨ Idea transformed!",
        description: "Your idea has been broken down into actionable tasks.",
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
      title: "🎤 Voice input",
      description: "Voice recording will be implemented with OpenAI integration.",
    });
    setTimeout(() => setIsRecording(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Capture Your Brilliant Ideas
          </h2>
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Share your thoughts and watch as AI transforms them into structured, actionable plans
        </p>
      </div>

      {/* Main capture card */}
      <Card className="card-hover border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-up">
        <CardHeader className="text-center pb-6">
          <CardTitle className="flex items-center justify-center space-x-2 text-xl text-gray-800">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>What's on your mind?</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="relative">
            <Textarea
              placeholder="I want to learn Spanish and practice speaking with natives..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={6}
              className="resize-none text-lg leading-relaxed border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-2xl p-6 transition-all duration-300"
            />
            {idea.length > 0 && (
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                {idea.length} characters
              </div>
            )}
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={handleSubmit}
              disabled={!idea.trim() || isLoading}
              className="flex-1 h-14 text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>AI is thinking...</span>
                </div>
              ) : showSuccess ? (
                <div className="flex items-center space-x-2 animate-bounce-gentle">
                  <Sparkles className="w-5 h-5" />
                  <span>Created!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Transform into Tasks</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={startVoiceInput}
              disabled={isRecording}
              className="h-14 px-6 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 rounded-2xl"
            >
              <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse-gentle' : 'text-gray-600'}`} />
            </Button>
          </div>
          
          {isRecording && (
            <div className="text-center animate-fade-in">
              <div className="inline-flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse-gentle"></div>
                <span className="font-medium">Listening... (Demo mode)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example ideas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-lg animate-fade-in">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" />
            Need inspiration? Try these ideas:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Plan a weekend trip to Paris with my partner",
              "Start a side business selling handmade crafts",
              "Learn to play guitar and perform at open mic nights",
              "Organize a community garden in my neighborhood"
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setIdea(example)}
                className="text-left p-3 bg-white/60 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 text-sm text-gray-700 hover:text-gray-900"
              >
                "{example}"
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
