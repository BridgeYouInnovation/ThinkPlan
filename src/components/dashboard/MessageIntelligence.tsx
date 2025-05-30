
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ChevronLeft, MessageCircle, Send, Paperclip } from "lucide-react";

type Message = Tables<'messages'>;

export const MessageIntelligence = () => {
  const [messageContent, setMessageContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages",
      });
    }
  };

  const analyzeMessage = async () => {
    if (!messageContent.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const mockReply = "Based on this message, I suggest replying with: 'Thanks for reaching out! I'll review this and get back to you by tomorrow afternoon.'";
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: messageContent.trim(),
          is_flagged: true,
          ai_reply: mockReply,
          source: 'manual',
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        throw error;
      }

      setMessageContent("");
      await fetchMessages();
      
      toast({
        title: "Message analyzed!",
        description: "AI has suggested a reply and flagged it for follow-up.",
      });
    } catch (error) {
      console.error('Error analyzing message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze message",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markAsDone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_flagged: false })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setMessages(messages.map(msg => 
        msg.id === id ? { ...msg, is_flagged: false } : msg
      ));

      toast({
        title: "Message updated",
        description: "Message marked as done",
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update message",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Messages</h1>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-5 w-5 text-white" />
            <span className="text-white/90">AI Message Analysis</span>
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <label className="text-sm text-gray-500 font-medium">PASTE MESSAGE</label>
            <Textarea
              placeholder="Paste your email or WhatsApp message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
              className="resize-none border-0 bg-gray-50 rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all duration-200"
            />
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={analyzeMessage}
              disabled={!messageContent.trim() || isAnalyzing}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 rounded-2xl"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4" />
                  <span>Analyze</span>
                </div>
              )}
            </Button>
            
            <Button variant="outline" size="sm" className="h-12 w-12 rounded-2xl border-gray-200">
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No messages analyzed yet</p>
            <p className="text-sm text-gray-400 mt-1">Paste a message above to get started</p>
          </div>
        ) : (
          messages.filter(msg => msg.is_flagged).map(message => (
            <div key={message.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-full">
                    Needs Reply
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Original Message</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  
                  {message.ai_reply && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">AI Suggested Reply</h4>
                      <p className="text-sm text-blue-700 bg-blue-50 p-4 rounded-2xl leading-relaxed">
                        {message.ai_reply}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-2">
                    <Button 
                      size="sm" 
                      className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-0 rounded-full"
                    >
                      Use Reply
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsDone(message.id)}
                      className="border-gray-200 rounded-full"
                    >
                      Mark Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {messages.filter(msg => msg.is_flagged).length === 0 && messages.length > 0 && (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-gray-500">All messages handled!</p>
            <p className="text-sm text-gray-400 mt-1">No flagged messages remaining</p>
          </div>
        )}
      </div>
    </div>
  );
};
