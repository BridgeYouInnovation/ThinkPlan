import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ExternalLink, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  snippet: string;
}

export const GmailIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnection();
    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('gmail') === 'connected') {
      toast({
        title: "Gmail Connected!",
        description: "Your Gmail account has been successfully connected.",
      });
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for messages from popup window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
        toast({
          title: "Gmail Connected!",
          description: "Your Gmail account has been successfully connected.",
        });
        setIsConnected(true);
        setIsConnecting(false);
        checkGmailConnection();
      } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
        toast({
          variant: "destructive",
          title: "Connection failed",
          description: event.data.error || "Failed to connect Gmail",
        });
        setIsConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service', 'gmail')
        .single();

      setIsConnected(!!integration);
    } catch (error) {
      console.error('Error checking Gmail connection:', error);
    }
  };

  const connectGmail = async () => {
    try {
      setIsConnecting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to connect Gmail",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { action: 'auth', userId: user.id }
      });

      if (error) {
        throw error;
      }

      if (data?.authUrl) {
        // Open in popup window instead of redirecting
        const popup = window.open(
          data.authUrl,
          'gmail-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Poll for popup closure
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            setIsConnecting(false);
            // Check if connection was successful
            setTimeout(checkGmailConnection, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect Gmail. Please try again.",
      });
      setIsConnecting(false);
    }
  };

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('gmail-integration', {
        body: { action: 'fetch-emails', userId: user.id }
      });

      if (error) {
        throw error;
      }

      setEmails(data?.emails || []);
      toast({
        title: "Emails loaded",
        description: `Found ${data?.emails?.length || 0} recent emails`,
      });
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        variant: "destructive",
        title: "Failed to fetch emails",
        description: "Could not load your Gmail messages",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectGmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('service', 'gmail');

      if (error) {
        throw error;
      }

      setIsConnected(false);
      setEmails([]);
      toast({
        title: "Gmail disconnected",
        description: "Your Gmail account has been disconnected",
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast({
        variant: "destructive",
        title: "Disconnection failed",
        description: "Failed to disconnect Gmail",
      });
    }
  };

  return (
    <Card className="bg-white border border-gray-100 rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Mail className="w-5 h-5 text-red-600" />
          Gmail Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Gmail Account</p>
              <p className="text-sm text-gray-500">
                {isConnected ? "Connected and ready" : "Connect to analyze emails"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected && <CheckCircle className="w-4 h-4 text-green-500" />}
            <Button 
              size="sm" 
              variant={isConnected ? "outline" : "default"}
              onClick={isConnected ? disconnectGmail : connectGmail}
              disabled={isConnecting}
              className="rounded-xl"
            >
              {isConnecting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </div>

        {/* Email Actions */}
        {isConnected && (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <Button 
                onClick={fetchEmails}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Load Recent Emails</span>
                  </div>
                )}
              </Button>
            </div>

            {/* Recent Emails */}
            {emails.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recent Emails</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 bg-gray-50 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {email.subject || 'No Subject'}
                        </p>
                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                          Unread
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{email.from}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {email.snippet}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!isConnected && (
          <div className="bg-blue-50 p-4 rounded-2xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Gmail Integration</p>
                <p className="text-xs text-blue-700 mt-1">
                  Connect your Gmail to automatically analyze important emails and get AI-powered insights for better productivity.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
