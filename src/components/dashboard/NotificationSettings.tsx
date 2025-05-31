
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export const NotificationSettings = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <BellOff className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">Notifications not supported</p>
              <p className="text-xs text-orange-700">Your browser doesn't support push notifications</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          Task Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Get notified when your tasks are due soon so you never miss important deadlines.
          </p>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {isSubscribed ? 'Notifications enabled' : 'Enable notifications'}
              </p>
              <p className="text-xs text-gray-500">
                {isSubscribed 
                  ? 'You\'ll receive alerts for upcoming due dates' 
                  : 'Get reminders 24 hours before tasks are due'
                }
              </p>
            </div>
            
            <Button
              onClick={isSubscribed ? unsubscribe : subscribe}
              disabled={isLoading}
              variant={isSubscribed ? "outline" : "default"}
              size="sm"
              className="rounded-xl"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <>
                  {isSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Enable
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
