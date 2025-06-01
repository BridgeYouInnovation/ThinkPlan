import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Crown } from "lucide-react";
import { PremiumUpgradeDialog } from "./PremiumUpgradeDialog";

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
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnection();

    // Listen for messages from popup window
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from any origin for the popup
      console.log('Received message:', event.data);
      
      if (event.data.type === 'GMAIL_AUTH_SUCCESS') {
        console.log('Gmail auth success received');
        toast({
          title: "Gmail Connected!",
          description: "Your Gmail account has been successfully connected.",
        });
        setIsConnected(true);
        setIsConnecting(false);
        checkGmailConnection();
      } else if (event.data.type === 'GMAIL_AUTH_ERROR') {
        console.log('Gmail auth error received:', event.data.error);
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
    setShowPremiumDialog(true);
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
    <>
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-600" />
            Gmail Integration
            <Crown className="w-4 h-4 text-yellow-500" />
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
                  Premium feature - Connect to analyze emails
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                onClick={connectGmail}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <Crown className="w-3 h-3 mr-1" />
                Upgrade to Connect
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-100">
            <div className="flex items-start space-x-3">
              <Crown className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-purple-900">Premium Gmail Integration</p>
                <p className="text-xs text-purple-700 mt-1">
                  Upgrade to automatically analyze important emails, create tasks from messages, and get AI-powered insights for better productivity.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PremiumUpgradeDialog 
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
      />
    </>
  );
};
