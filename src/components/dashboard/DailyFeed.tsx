import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Clock, Mic, MicOff, Plus, ArrowRight, LogOut, MessageCircle, Mail, Phone, Brain, Sparkles, Settings } from "lucide-react";
import { DateConfirmationModal } from "./DateConfirmationModal";
import { VoiceRecordingIndicator } from "./VoiceRecordingIndicator";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<'messages'>;

interface DailyFeedProps {
  onLogout: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DailyFeed = ({ onLogout, onNavigateToTab }: DailyFeedProps) => {
  const [idea, setIdea] = useState("");
  const [todayTasks, setTodayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [importantMessages, setImportantMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const { toast } = useToast();
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();

  useEffect(() => {
    fetchTodaysTasks();
    fetchImportantMessages();
    setShowFAB(false);
  }, []);

  const fetchImportantMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setImportantMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', today)
        .lt('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTodayTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

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
      fetchTodaysTasks(); // Refresh tasks
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
      fetchTodaysTasks(); // Refresh tasks
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

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTodayTasks(tasks => 
        tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleViewAllTasks = () => {
    if (onNavigateToTab) {
      onNavigateToTab('tasks');
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'email':
      case 'gmail':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400 bg-red-50';
      case 'medium':
        return 'border-l-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_flagged: false })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return;
      }

      setImportantMessages(messages => 
        messages.filter(msg => msg.id !== messageId)
      );

      toast({
        title: "Message marked as read",
        description: "Message has been removed from important messages",
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
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
              <ArrowRight className="w-3 h-3" />
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

  return (
    <div className="space-y-8 max-w-md mx-auto pb-24">
      {/* Voice Recording Overlay */}
      <VoiceRecordingIndicator 
        isRecording={isRecording}
        isProcessing={isProcessing}
        onStop={handleVoiceInput}
      />

      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Focus on what matters</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-gray-600 hover:bg-gray-100 rounded-full w-10 h-10 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
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

      {/* 1. Capture Your Idea */}
      <Card className="idea-capture-glow bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Capture Your Idea</h3>
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
                    className={`rounded-full p-3 transition-all duration-300 transform relative ${
                      isRecording 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-2xl shadow-purple-500/50 scale-110 animate-pulse' 
                        : isProcessing 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'hover:bg-gradient-to-r hover:from-purple-100 hover:to-blue-100 hover:text-purple-600 bg-gradient-to-r from-gray-50 to-gray-100 shadow-md hover:shadow-lg hover:shadow-purple-500/20'
                    }`}
                  >
                    {/* Glowing effect */}
                    {(isRecording || isProcessing) && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-ping opacity-25"></div>
                    )}
                    <Mic className={`h-5 w-5 relative z-10 ${
                      isRecording || isProcessing ? 'drop-shadow-sm' : ''
                    }`} />
                  </Button>
                  <span className="text-xs text-gray-400">
                    {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'or speak'}
                  </span>
                </div>
              </div>
              
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Brain dump everything here... don't worry about structure, just capture your thoughts!"
                rows={4}
                className="w-full border-2 border-dashed border-gray-200 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 focus:bg-white focus:border-purple-300 transition-all duration-200 resize-none text-gray-900 placeholder-gray-400 text-base font-medium shadow-sm"
              />
            </div>
            
            {idea.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Sparkles className="h-3 w-3" />
                <span>AI will break this down into actionable tasks</span>
              </div>
            )}
            
            <Button
              onClick={handleSubmit}
              disabled={!idea.trim() || isLoading || isRecording || isProcessing}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 rounded-2xl font-medium"
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
        </CardContent>
      </Card>

      {/* 2. Today's Focus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Today's Focus</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewAllTasks}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            View All Tasks <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {todayTasks.length === 0 ? (
          <Card className="bg-gray-50 border border-gray-100 rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No tasks for today. Start by capturing an idea!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <Card key={task.id} className="bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <CheckSquare className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                    </div>
                    {task.due_date && (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. Important Messages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Important Messages</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigateToTab && onNavigateToTab('account')}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            Manage <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {isLoadingMessages ? (
          <Card className="bg-gray-50 border border-gray-100 rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-6 h-6 mx-auto mb-2 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </CardContent>
          </Card>
        ) : importantMessages.length === 0 ? (
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">No important messages</h4>
                <p className="text-gray-600 text-sm mb-4">Connect your accounts to automatically detect important messages that need your attention.</p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => onNavigateToTab && onNavigateToTab('account')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Connect Accounts
                </Button>
                <p className="text-xs text-gray-500">Connect Gmail, WhatsApp, and more</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {importantMessages.map((message) => (
              <Card key={message.id} className={`border-l-4 rounded-2xl hover:shadow-md transition-shadow border-l-orange-400 bg-orange-50`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {getMessageIcon(message.source || 'unknown')}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {message.source ? message.source.charAt(0).toUpperCase() + message.source.slice(1) : 'Message'}
                        </p>
                        <span className="text-xs text-gray-500">{getTimeAgo(message.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.content}</p>
                      {message.ai_reply && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                          <p className="text-xs text-blue-800 font-medium mb-1">AI Suggested Reply:</p>
                          <p className="text-xs text-blue-700">{message.ai_reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    {message.ai_reply && (
                      <Button size="sm" variant="outline" className="text-xs rounded-full">
                        Use Reply
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => markMessageAsRead(message.id)}
                      className="text-xs rounded-full"
                    >
                      Mark Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-10">
        <div className="relative">
          {showFAB && (
            <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
              <Button 
                onClick={() => onNavigateToTab && onNavigateToTab('capture')}
                className="bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full w-12 h-12 p-0"
              >
                Add Idea
              </Button>
              <Button 
                onClick={() => onNavigateToTab && onNavigateToTab('tasks')}
                className="bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full w-12 h-12 p-0"
              >
                Add Task
              </Button>
            </div>
          )}
          <Button
            onClick={() => setShowFAB(!showFAB)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
          >
            <Plus className={`h-6 w-6 transition-transform duration-200 ${showFAB ? 'rotate-45' : ''}`} />
          </Button>
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
