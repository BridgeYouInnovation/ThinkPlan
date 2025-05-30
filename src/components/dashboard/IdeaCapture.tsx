import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Mic, MicOff, Lightbulb, Sparkles, Zap, ArrowRight, ChevronLeft, Calendar, Info, Brain, CheckSquare, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DateConfirmationModal } from "./DateConfirmationModal";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

export const IdeaCapture = () => {
  const [idea, setIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [showFirstTimeHint, setShowFirstTimeHint] = useState(() => {
    return !localStorage.getItem('hasSeenCaptureHint');
  });
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();

  const handleSubmit = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    setAiResponse(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('process-idea-with-ai', {
        body: {
          idea: idea.trim(),
          userId: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process idea');
      }

      // Check if we need date confirmation
      if (data.needsDateConfirmation) {
        setPendingTasks(data.pendingTasks);
        setShowDateModal(true);
        setAiResponse(data.aiResponse);
        return;
      }

      // Tasks were created successfully
      setAiResponse(data.aiResponse);
      
      toast({
        title: "✨ Idea transformed!",
        description: `Created ${data.tasks.length} tasks from your idea. Check the Tasks tab!`,
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

  const handleDateConfirmation = async (dateInput: string) => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('process-idea-with-ai', {
        body: {
          idea: idea.trim(),
          userId: user.id,
          dateConfirmation: dateInput
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to set dates');
      }

      setShowDateModal(false);
      setAiResponse(data.aiResponse);
      
      toast({
        title: "🎯 Tasks created!",
        description: `Created ${data.tasks.length} tasks with your preferred timing. Check the Tasks tab!`,
      });
      
      setIdea("");
    } catch (error) {
      console.error('Error setting dates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set task dates. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setIdea(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
      }
    } else {
      await startRecording();
    }
  };

  const dismissHint = () => {
    setShowFirstTimeHint(false);
    localStorage.setItem('hasSeenCaptureHint', 'true');
  };

  const TaskPreview = ({ task, index }: { task: any, index: number }) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {index + 1}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            task.priority === 'high' ? 'bg-red-100 text-red-700' :
            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {task.priority}
          </span>
        </div>
        <CheckSquare className="w-4 h-4 text-gray-400" />
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
        <p className="text-gray-600 text-xs mt-1">{task.description}</p>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {task.estimated_duration && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{task.estimated_duration}</span>
            </div>
          )}
          {task.suggested_due_date && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.suggested_due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        {task.needs_user_input && (
          <span className="text-orange-600 font-medium">Needs input</span>
        )}
      </div>
      
      {task.timeline_question && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
          <p className="text-orange-800 text-xs">{task.timeline_question}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* First Time Hint */}
      {showFirstTimeHint && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <div className="flex items-start space-x-3">
            <Brain className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-900 font-medium text-sm">Welcome to Idea Capture!</h4>
              <p className="text-green-700 text-sm mt-1">
                This is your brainstorming space. Quickly jot down raw ideas or voice thoughts. 
                AI will automatically break them into actionable tasks for you!
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={dismissHint}
                className="text-green-600 hover:text-green-700 mt-2 p-0 h-auto"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Capture Ideas</h1>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-purple-200 hover:text-white cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Quickly capture unstructured thoughts. AI will turn them into organized tasks!</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
          <p className="text-purple-100 text-sm">Let your thoughts flow freely</p>
        </div>
      </div>

      {/* AI Response Display */}
      {aiResponse && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">AI Analysis Complete</h3>
              <p className="text-gray-600 text-sm">{aiResponse.message}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 text-sm mb-3">Generated Tasks:</h4>
            {aiResponse.tasks.map((task: any, index: number) => (
              <TaskPreview key={index} task={task} index={index} />
            ))}
          </div>
          
          {aiResponse.suggestions && aiResponse.suggestions.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl p-4">
              <h5 className="font-medium text-gray-900 text-sm mb-2">💡 Suggestions:</h5>
              <ul className="space-y-1">
                {aiResponse.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="text-gray-600 text-sm">• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main capture form */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-500 font-medium">WHAT'S ON YOUR MIND?</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceInput}
                    disabled={isProcessing}
                    className={`rounded-full p-2 ${
                      isRecording 
                        ? 'bg-red-100 text-red-600 animate-pulse' 
                        : isProcessing 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-xs text-gray-400">
                    {isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : 'or type below'}
                  </span>
                </div>
              </div>
              
              <Textarea
                placeholder="Brain dump everything here... don't worry about structure, just capture your thoughts!"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={6}
                className="resize-none border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all duration-200 text-lg placeholder-gray-400"
              />
              
              {idea.length > 0 && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Sparkles className="h-3 w-3" />
                  <span>AI will break this down into actionable tasks</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">AI-Powered Breakdown</h4>
                  <p className="text-gray-600 text-xs">Your ideas become organized tasks automatically</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-green-600 font-bold text-xs">1</span>
                  </div>
                  <span className="text-gray-600">Capture</span>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Brain className="w-3 h-3 text-purple-600" />
                  </div>
                  <span className="text-gray-600">AI Process</span>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-blue-600 font-bold text-xs">✓</span>
                  </div>
                  <span className="text-gray-600">Tasks</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleSubmit}
            disabled={!idea.trim() || isLoading || isRecording || isProcessing}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 rounded-2xl shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>AI is analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>Transform into Tasks</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
          
          {idea.trim() && (
            <p className="text-center text-xs text-gray-500">
              💡 Your idea will be analyzed and broken into actionable steps
            </p>
          )}
        </div>
      </div>

      {/* Date Confirmation Modal */}
      <DateConfirmationModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={handleDateConfirmation}
        pendingTasks={pendingTasks}
        isLoading={isLoading}
      />
    </div>
  );
};
