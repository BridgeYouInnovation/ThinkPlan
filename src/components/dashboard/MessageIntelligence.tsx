
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  isFlagged: boolean;
  aiReply: string;
  createdAt: string;
}

export const MessageIntelligence = () => {
  const [messageContent, setMessageContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();

  const analyzeMessage = async () => {
    if (!messageContent.trim()) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis - replace with actual API call
    setTimeout(() => {
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        isFlagged: true,
        aiReply: "Based on this message, I suggest replying with: 'Thanks for reaching out! I'll review this and get back to you by tomorrow afternoon.'",
        createdAt: new Date().toLocaleString()
      };
      
      setMessages([newMessage, ...messages]);
      setMessageContent("");
      setIsAnalyzing(false);
      
      toast({
        title: "Message analyzed!",
        description: "AI has suggested a reply and flagged it for follow-up.",
      });
    }, 1500);
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
            {isAnalyzing ? "Analyzing with AI..." : "Analyze Message"}
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
              {messages.map(message => (
                <div key={message.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">Flagged for Reply</Badge>
                    <span className="text-sm text-gray-500">{message.createdAt}</span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Original Message:</h4>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {message.content}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">AI Suggested Reply:</h4>
                    <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                      {message.aiReply}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Use Suggestion
                    </Button>
                    <Button size="sm" variant="outline">
                      Mark as Done
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
