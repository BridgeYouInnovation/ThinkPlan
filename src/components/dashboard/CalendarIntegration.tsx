import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";

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
    if (!clientId) {
      toast({
        variant: "destructive",
        title: "Configuration error",
        description: "Google Client ID not configured. Please check your settings.",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Google OAuth 2.0 flow
      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = "https://www.googleapis.com/auth/calendar.readonly";
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`;

      // Open OAuth flow in a popup window
      const popup = window.open(authUrl, 'google-auth', 'width=500,height=600');
      
      // Listen for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          checkConnectionStatus(); // Recheck connection status
        }
      }, 1000);

      toast({
        title: "Connecting to Google Calendar",
        description: "Please authorize access in the popup window",
      });
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect your calendar. Please try again.",
      });
      setIsConnecting(false);
    }
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
    <Card className="bg-white border border-gray-100 rounded-3xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Calendar className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">Google Calendar</p>
              <p className="text-sm text-gray-500">
                {isConnected ? 'Connected and syncing' : 'Connect to sync events'}
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant={isConnected ? "outline" : "default"}
            onClick={isConnected ? disconnectCalendar : connectCalendar}
            disabled={isConnecting || !clientId}
            className="rounded-xl"
          >
            {isConnecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full border border-gray-300 border-t-blue-600 animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : isConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
          </Button>
        </div>

        {isConnected && (
          <>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Last sync:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700">
                    {lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={refreshEvents}
                    className="h-6 px-2 text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            {events.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-medium text-gray-900 mb-3">Upcoming Events</h4>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-2xl">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{event.summary}</p>
                        <p className="text-xs text-gray-500">{formatEventTime(event)}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(event.htmlLink, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming events in the next 7 days
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                <p className="text-xs text-gray-500">
                  Calendar integration helps identify scheduling conflicts and important meetings for better task prioritization.
                </p>
              </div>
            </div>
          </>
        )}

        {!isConnected && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Connect your Google Calendar to automatically sync events and get intelligent scheduling insights.
            </p>
            <div className="mt-3 p-3 bg-yellow-50 rounded-2xl">
              <p className="text-xs text-yellow-800">
                <strong>Setup required:</strong> You'll need to configure your Google Client ID in the code and set up OAuth redirect URLs.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
