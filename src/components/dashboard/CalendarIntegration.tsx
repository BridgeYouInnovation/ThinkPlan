
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle, AlertCircle, Clock, ExternalLink } from "lucide-react";

export const CalendarIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if calendar is connected by looking for stored tokens
      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('service', 'google_calendar')
        .single();

      if (integration) {
        setIsConnected(true);
        setLastSync(integration.updated_at);
        // In a real implementation, you would fetch recent events here
        fetchRecentEvents();
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error);
    }
  };

  const fetchRecentEvents = async () => {
    // Mock calendar events for demonstration
    const mockEvents = [
      {
        id: '1',
        title: 'Team Meeting',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        description: 'Weekly team sync'
      },
      {
        id: '2',
        title: 'Client Call',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        description: 'Project discussion'
      }
    ];
    setEvents(mockEvents);
  };

  const connectCalendar = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would initiate Google Calendar OAuth
      // For now, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Simulate storing the integration
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          service: 'google_calendar',
          access_token: 'mock_token',
          refresh_token: 'mock_refresh_token',
          expires_at: new Date(Date.now() + 3600000).toISOString()
        });

      if (error) throw error;

      setIsConnected(true);
      setLastSync(new Date().toISOString());
      fetchRecentEvents();
      
      toast({
        title: "Calendar connected!",
        description: "Your Google Calendar is now synchronized",
      });
    } catch (error) {
      console.error('Error connecting calendar:', error);
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to connect your calendar. Please try again.",
      });
    } finally {
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

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
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
            disabled={isConnecting}
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
                <span className="text-gray-700">
                  {lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'}
                </span>
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
                        <p className="font-medium text-gray-900 text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500">{formatEventTime(event.start)}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};
