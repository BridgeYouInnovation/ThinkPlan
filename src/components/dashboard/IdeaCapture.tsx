
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mic, Lightbulb, Sparkles, Zap, ArrowRight, ChevronLeft, Calendar } from "lucide-react";
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

      const mockTasks = [
        {
          title: `Research phase for: ${idea.substring(0, 30)}...`,
          description: "Initial research and planning",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          idea_id: ideaData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        },
        {
          title: `First action step for: ${idea.substring(0, 30)}...`,
          description: "Begin implementation",
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
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
    toast({
      title: "🎤 Voice input",
      description: "Voice recording will be implemented with OpenAI integration.",
    });
    setTimeout(() => setIsRecording(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Add Task</h1>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main capture form */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your Task Name"
              className="w-full text-lg placeholder-gray-400 border-0 border-b border-gray-200 focus:border-purple-500 focus:outline-none py-3 bg-transparent"
            />
            
            <div className="space-y-3">
              <label className="text-sm text-gray-500 font-medium">RECENT MEET</label>
              <div className="flex items-center space-x-3">
                {/* Avatar placeholders */}
                {['John', 'Ranak', 'Parkaa', 'Mahmud'].map((name, index) => (
                  <div key={name} className="flex flex-col items-center space-y-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                      index === 0 ? 'bg-pink-400' : 
                      index === 1 ? 'bg-red-400' : 
                      index === 2 ? 'bg-purple-500' : 'bg-teal-400'
                    }`}>
                      {name[0]}
                    </div>
                    <span className="text-xs text-gray-500">{name}</span>
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm text-gray-500 font-medium">DATE</label>
              <div className="flex items-center justify-between">
                <span className="text-gray-900">May 01, 2020</span>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-500 font-medium">START TIME</label>
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">10:00 AM</span>
                  <ChevronLeft className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-500 font-medium">END TIME</label>
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">01:00 PM</span>
                  <ChevronLeft className="w-4 h-4 text-gray-400 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-500 font-medium">DESCRIPTION</label>
              <Textarea
                placeholder="Describe your idea or task..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={4}
                className="resize-none border-0 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-500 font-medium">BOARD</label>
              <div className="flex space-x-2">
                <Button size="sm" className="bg-orange-100 text-orange-600 hover:bg-orange-200 border-0 rounded-full">
                  URGENT
                </Button>
                <Button size="sm" className="bg-green-100 text-green-600 hover:bg-green-200 border-0 rounded-full">
                  RUNNING
                </Button>
                <Button size="sm" className="bg-purple-100 text-purple-600 hover:bg-purple-200 border-0 rounded-full">
                  ONGOING
                </Button>
                <Button variant="outline" size="sm" className="border-dashed border-gray-300 rounded-full">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!idea.trim() || isLoading}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 rounded-2xl shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Creating Task...</span>
              </div>
            ) : showSuccess ? (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>Created!</span>
              </div>
            ) : (
              "Create New Task"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
