
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
      // For now, create a mock AI reply (in the future, this will call your AI API)
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
      await fetchMessages(); // Refresh the list
      
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Message Intelligence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your email or WhatsApp message here..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            rows={4}
            className="resize-none"
          />
          
          <Button
            onClick={analyzeMessage}
            disabled={!messageContent.trim() || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Message"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No messages analyzed yet. Paste a message above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.filter(msg => msg.is_flagged).map(message => (
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">Needs Reply</Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Original Message:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {message.content}
                    </p>
                  </div>
                  
                  {message.ai_reply && (
                    <div>
                      <h4 className="font-medium mb-2">AI Suggested Reply:</h4>
                      <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                        {message.ai_reply}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Use Suggestion
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsDone(message.id)}
                    >
                      Mark as Done
                    </Button>
                  </div>
                </div>
              ))}
              
              {messages.filter(msg => msg.is_flagged).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No flagged messages. All caught up!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
