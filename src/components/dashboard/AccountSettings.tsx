
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GmailIntegration } from "./GmailIntegration";
import { CalendarIntegration } from "./CalendarIntegration";
import { 
  LogOut, 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Clock, 
  Shield, 
  Trash2,
  ExternalLink
} from "lucide-react";

interface AccountSettingsProps {
  onLogout: () => void;
}

export const AccountSettings = ({ onLogout }: AccountSettingsProps) => {
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyReminderTime, setDailyReminderTime] = useState("09:00");
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    loadSettings();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('theme');
    const savedNotifications = localStorage.getItem('notifications');
    const savedReminderTime = localStorage.getItem('dailyReminderTime');
    
    setIsDarkMode(savedTheme === 'dark');
    setNotificationsEnabled(savedNotifications !== 'false');
    setDailyReminderTime(savedReminderTime || '09:00');
  };

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme ? 'dark' : 'light'} mode`,
    });
  };

  const handleNotificationToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('notifications', newValue.toString());
    
    toast({
      title: "Notifications updated",
      description: `Notifications ${newValue ? 'enabled' : 'disabled'}`,
    });
  };

  const handleReminderTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setDailyReminderTime(newTime);
    localStorage.setItem('dailyReminderTime', newTime);
    
    toast({
      title: "Reminder time updated",
      description: `Daily reminder set for ${newTime}`,
    });
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({
        variant: "destructive",
        title: "Account deletion",
        description: "This feature will be implemented in a future update",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="text-gray-500 text-sm">Manage your profile and settings</p>
      </div>

      {/* Profile Section */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="flex-1 rounded-2xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDeleteAccount}
              className="flex-1 rounded-2xl text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Settings */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            App Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-yellow-500" />}
              <div>
                <p className="font-medium text-gray-900">Dark Mode</p>
                <p className="text-sm text-gray-500">Switch between light and dark themes</p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications</p>
                <p className="text-sm text-gray-500">Receive push notifications</p>
              </div>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationToggle} />
          </div>

          {/* Daily Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Daily Reminder</p>
                <p className="text-sm text-gray-500">Time for daily check-in</p>
              </div>
            </div>
            <input
              type="time"
              value={dailyReminderTime}
              onChange={handleReminderTimeChange}
              className="px-3 py-1 border border-gray-200 rounded-xl text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gmail Integration */}
      <GmailIntegration />

      {/* Calendar Integration */}
      <CalendarIntegration />

      {/* Privacy & Permissions */}
      <Card className="bg-white border border-gray-100 rounded-3xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            Privacy & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Profile information</span>
              </div>
              <span className="text-xs text-gray-500">Read only</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Gmail content</span>
              </div>
              <span className="text-xs text-gray-500">When connected</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Calendar events</span>
              </div>
              <span className="text-xs text-gray-500">When connected</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              We only access data you explicitly grant permission for. All processing happens securely and your data is never shared with third parties.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
