import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  CheckCircle, 
  MessageSquare, 
  Plus, 
  Sparkles,
  User,
  Lightbulb,
  CheckSquare,
  Mic,
  ArrowRight,
  Clock,
  Calendar
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DateConfirmationModal } from "./DateConfirmationModal";
import { VoiceRecordingIndicator } from "./VoiceRecordingIndicator";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

interface DailyFeedProps {
  onLogout: () => void;
  onNavigateToTab: (tabId: string) => void;
}

interface ImportantMessage {
  id: string;
  source: string | null;
  content: string;
  created_at: string;
  ai_reply?: string | null;
  is_flagged: boolean;
}

export const DailyFeed = ({ onLogout, onNavigateToTab }: DailyFeedProps) => {
  const [importantMessages, setImportantMessages] = useState<ImportantMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [quickIdea, setQuickIdea] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    fetchImportantMessages();
  }, []);

  const fetchImportantMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching important messages:', error);
        return;
      }

      setImportantMessages(data || []);
    } catch (error) {
      console.error('Error fetching important messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleQuickCapture = async () => {
    if (!quickIdea.trim()) {
      onNavigateToTab('capture');
      return;
    }

    setIsCapturing(true);
    setAiResponse(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('process-idea-with-ai', {
        body: {
          idea: quickIdea.trim(),
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
      
      setQuickIdea("");
    } catch (error) {
      console.error('Error processing quick idea:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your idea. Please try again.",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDateConfirmation = async (dateInput: string) => {
    setIsCapturing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('process-idea-with-ai', {
        body: {
          idea: quickIdea.trim(),
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
      
      setQuickIdea("");
    } catch (error) {
      console.error('Error setting dates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to set task dates. Please try again.",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      const transcribedText = await stopRecording();
      if (transcribedText) {
        setQuickIdea(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
      }
    } else {
      await startRecording();
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_flagged: false })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      setImportantMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "Message marked as read",
        description: "The message has been removed from important messages",
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getSourceIcon = (source: string | null) => {
    if (!source) return <MessageSquare className="w-4 h-4 text-gray-600" />;
    
    switch (source.toLowerCase()) {
      case 'gmail':
        return <MessageSquare className="w-4 h-4 text-red-600" />;
      case 'calendar':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
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
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Voice Recording Overlay */}
      <VoiceRecordingIndicator 
        isRecording={isRecording}
        isProcessing={isProcessing}
        onStop={handleVoiceInput}
      />

      {/* Header */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning</h1>
            <p className="text-gray-500 text-sm">Capture your ideas and stay organized</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
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

      {/* Quick Idea Capture */}
      <Card className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 text-white border-0 rounded-3xl shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-300" />
            Quick Idea Capture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80 font-medium">WHAT'S ON YOUR MIND?</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceInput}
                  disabled={isProcessing}
                  className={`rounded-full p-3 transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-lg scale-110 animate-pulse' 
                      : isProcessing 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'hover:bg-white/20 hover:text-white bg-white/10'
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </Button>
                <span className="text-xs text-white/70">
                  {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'or speak'}
                </span>
              </div>
            </div>
            
            <Textarea
              placeholder="Brain dump everything here... don't worry about structure, just capture your thoughts!"
              value={quickIdea}
              onChange={(e) => setQuickIdea(e.target.value)}
              rows={4}
              className="resize-none bg-white/10 border-white/20 text-white placeholder:text-white/70 rounded-2xl focus:ring-2 focus:ring-white/50"
            />
            
            {quickIdea.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-white/80">
                <Sparkles className="h-3 w-3" />
                <span>AI will break this down into actionable tasks</span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleQuickCapture}
            disabled={isCapturing || isRecording || isProcessing}
            className="w-full h-14 text-lg font-medium bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl"
          >
            {isCapturing ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>AI is analyzing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5" />
                <span>{quickIdea.trim() ? 'Transform into Tasks' : 'Open Full Capture'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
          
          {quickIdea.trim() && (
            <p className="text-center text-xs text-white/80">
              💡 Your idea will be analyzed and broken into actionable steps
            </p>
          )}
        </CardContent>
      </Card>

      {/* Important Messages */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Important Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingMessages ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : importantMessages.length > 0 ? (
            <div className="space-y-4">
              {importantMessages.map((message) => (
                <div key={message.id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSourceIcon(message.source)}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {message.source || 'Message'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(message.created_at)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(message.id)}
                      className="h-6 w-6 p-0 hover:bg-white/50"
                    >
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-800 mb-2 line-clamp-2">
                    {message.content}
                  </p>
                  {message.ai_reply && (
                    <div className="mt-2 p-2 bg-white/60 rounded-xl">
                      <p className="text-xs text-gray-600">
                        <Sparkles className="w-3 h-3 inline mr-1" />
                        AI Insight: {message.ai_reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No important messages</h3>
              <p className="text-sm text-gray-500 mb-4">
                Connect your accounts to get AI-powered insights on your important messages
              </p>
              <Button 
                onClick={() => onNavigateToTab('account')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
              >
                Connect Accounts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => onNavigateToTab('capture')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl h-12"
          >
            <Plus className="w-5 h-5 mr-2" />
            Full Idea Capture
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onNavigateToTab('tasks')}
              className="rounded-2xl h-12"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              View Tasks
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onNavigateToTab('account')}
              className="rounded-2xl h-12"
            >
              <User className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Confirmation Modal */}
      <DateConfirmationModal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={handleDateConfirmation}
        pendingTasks={pendingTasks}
        isLoading={isCapturing}
      />
    </div>
  );
};
