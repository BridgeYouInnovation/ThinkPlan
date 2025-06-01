
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
  Mic
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

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
  const { toast } = useToast();

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

      setQuickIdea("");
      toast({
        title: "✨ Idea captured!",
        description: `Created ${data.tasks?.length || 0} tasks from your idea. Check the Tasks tab!`,
      });
      
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

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
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
            <Textarea
              placeholder="What's on your mind? Jot down any idea..."
              value={quickIdea}
              onChange={(e) => setQuickIdea(e.target.value)}
              rows={3}
              className="resize-none bg-white/10 border-white/20 text-white placeholder:text-white/70 rounded-2xl focus:ring-2 focus:ring-white/50"
            />
            <div className="flex space-x-3">
              <Button
                onClick={handleQuickCapture}
                disabled={isCapturing}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl h-12"
              >
                {isCapturing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>{quickIdea.trim() ? 'Transform to Tasks' : 'Open Capture'}</span>
                  </div>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-0"
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-white/80 text-sm">
              💡 AI will automatically break your ideas into actionable tasks
            </p>
          </div>
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
    </div>
  );
};
