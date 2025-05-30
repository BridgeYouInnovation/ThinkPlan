
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCapture } from "./IdeaCapture";
import { TaskList } from "./TaskList";
import { MessageIntelligence } from "./MessageIntelligence";
import { DailyFeed } from "./DailyFeed";
import { Sparkles, LogOut, Home, Lightbulb, CheckSquare, MessageCircle, User, Grid3X3 } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("daily");

  const tabs = [
    { id: "daily", label: "Dashboard", icon: Grid3X3 },
    { id: "tasks", label: "Task", icon: CheckSquare },
    { id: "capture", label: "Capture", icon: Lightbulb },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ];

  const handleNavigateToTab = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab content */}
          <div className="animate-fade-in">
            <TabsContent value="daily" className="space-y-6 mt-0">
              <DailyFeed onLogout={onLogout} onNavigateToTab={handleNavigateToTab} />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 mt-0">
              <TaskList />
            </TabsContent>

            <TabsContent value="capture" className="space-y-6 mt-0">
              <IdeaCapture />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6 mt-0">
              <MessageIntelligence />
            </TabsContent>
          </div>

          {/* Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 p-4">
            <div className="max-w-md mx-auto">
              <TabsList className="grid grid-cols-4 bg-transparent border-0 h-16 gap-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center space-y-1 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70 hover:text-white hover:bg-white/10 rounded-2xl py-3 px-2 transition-all duration-300 border-0 h-auto"
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Add some bottom padding to account for fixed navigation */}
          <div className="h-20"></div>
        </Tabs>
      </div>
    </div>
  );
};
