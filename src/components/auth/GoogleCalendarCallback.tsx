
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const GoogleCalendarCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast({
          variant: "destructive",
          title: "Authorization failed",
          description: "Calendar connection was cancelled or failed",
        });
        navigate('/');
        return;
      }

      if (code) {
        try {
          // Exchange code for access token using our Supabase edge function
          const { data, error } = await supabase.functions.invoke('calendar-oauth', {
            body: { code }
          });

          if (error) throw error;

          const tokenData = data;
          
          // Store the token in Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          const { error: dbError } = await supabase
            .from('user_integrations')
            .upsert({
              user_id: user.id,
              service: 'google_calendar',
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
            });

          if (dbError) throw dbError;

          toast({
            title: "Calendar connected!",
            description: "Your Google Calendar is now synchronized",
          });

          // Close the popup window if this is running in a popup
          if (window.opener) {
            window.close();
          } else {
            navigate('/');
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error);
          toast({
            variant: "destructive",
            title: "Connection failed",
            description: "Failed to complete calendar connection",
          });
          navigate('/');
        }
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Connecting your calendar...</p>
      </div>
    </div>
  );
};
