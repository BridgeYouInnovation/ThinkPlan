import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, AlertCircle, Clock, ExternalLink, Crown } from "lucide-react";
import { PremiumUpgradeDialog } from "./PremiumUpgradeDialog";

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  htmlLink: string;
}

export const CalendarIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>("");
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    fetchClientId();
  }, []);

  const fetchClientId = async () => {
    try {
      // Get the Google Client ID from Supabase secrets via edge function
      const { data, error } = await supabase.functions.invoke('calendar-oauth', {
        body: { action: 'get_client_id' }
      });
      
      if (error) throw error;
      if (data?.client_id) {
        setClientId(data.client_id);
      }
    } catch (error) {
      console.error('Error fetching client ID:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service', 'google_calendar')
        .single();

      if (integration && integration.access_token) {
        setIsConnected(true);
        setLastSync(integration.updated_at);
        setAccessToken(integration.access_token);
        await fetchCalendarEvents(integration.access_token);
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  const fetchCalendarEvents = async (token: string) => {
    try {
      const now = new Date();
      const timeMin = now.toISOString();
      const timeMax = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, need to refresh or reconnect
          await handleTokenExpired();
          return;
        }
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        variant: "destructive",
        title: "Error fetching events",
        description: "Failed to load calendar events. Please try reconnecting.",
      });
    }
  };

  const handleTokenExpired = async () => {
    setIsConnected(false);
    setAccessToken(null);
    setEvents([]);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('service', 'google_calendar');
    }

    toast({
      variant: "destructive",
      title: "Calendar disconnected",
      description: "Your calendar access has expired. Please reconnect.",
    });
  };

  const connectCalendar = async () => {
    setShowPremiumDialog(true);
  };

  const disconnectCalendar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('service', 'google_calendar');

      if (error) throw error;

      setIsConnected(false);
      setLastSync(null);
      setEvents([]);
      setAccessToken(null);
      
      toast({
        title: "Calendar disconnected",
        description: "Your calendar integration has been removed",
      });
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disconnect calendar",
      });
    }
  };

  const refreshEvents = async () => {
    if (accessToken) {
      await fetchCalendarEvents(accessToken);
      
      // Update last sync time
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_integrations')
          .update({ updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('service', 'google_calendar');
        
        setLastSync(new Date().toISOString());
      }
      
      toast({
        title: "Events refreshed",
        description: "Calendar events have been updated",
      });
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const startTime = event.start.dateTime || event.start.date;
    if (!startTime) return 'No time';
    
    const date = new Date(startTime);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Starting soon';
    } else if (diffHours < 24) {
      return `in ${diffHours} hours`;
    } else {
      const diffDays = Math.round(diffHours / 24);
      return `in ${diffDays} days`;
    }
  };

  return (
    <>
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Calendar Integration
            <Crown className="w-4 h-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Google Calendar</p>
                <p className="text-sm text-gray-500">
                  Premium feature - Connect to sync events
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={connectCalendar}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Crown className="w-3 h-3 mr-1" />
              Upgrade to Connect
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-2xl border border-purple-100">
              <div className="flex items-start space-x-2">
                <Crown className="w-4 h-4 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">Premium Calendar Sync</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Upgrade to automatically sync events, identify scheduling conflicts, and get intelligent scheduling insights for better task prioritization.
                  </p>
                </div>
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
