
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Mail, 
  MessageSquare, 
  Plus, 
  Sparkles,
  User,
  ExternalLink
} from "lucide-react";

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
        return <Mail className="w-4 h-4 text-red-600" />;
      case 'calendar':
        return <Calendar className="w-4 h-4 text-blue-600" />;
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
            <p className="text-gray-500 text-sm">Here's what needs your attention</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

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
            Capture New Idea
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => onNavigateToTab('tasks')}
              className="rounded-2xl h-12"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
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

      {/* Connect Services */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Connect Gmail and more</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your accounts to get AI-powered insights and never miss important information.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Gmail</p>
                  <p className="text-xs text-gray-500">Smart email insights</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigateToTab('account')}
                className="rounded-xl"
              >
                Connect
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Calendar</p>
                  <p className="text-xs text-gray-500">Schedule optimization</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onNavigateToTab('account')}
                className="rounded-xl"
              >
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule Preview */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Connect your calendar to see today's events</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onNavigateToTab('account')}
              className="mt-3 rounded-xl"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
