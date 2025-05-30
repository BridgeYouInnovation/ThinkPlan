
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCapture } from "./IdeaCapture";
import { TaskList } from "./TaskList";
import { MessageIntelligence } from "./MessageIntelligence";
import { DailyFeed } from "./DailyFeed";
import { Sparkles, LogOut, Home, Lightbulb, CheckSquare, MessageCircle, User } from "lucide-react";

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("daily");

  const tabs = [
    { id: "daily", label: "Daily Feed", icon: Home },
    { id: "capture", label: "Capture Idea", icon: Lightbulb },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ThinkPlan
                </h1>
                <p className="text-sm text-gray-500">Your AI productivity companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-gentle"></div>
                <span className="text-sm font-medium text-green-700">All systems active</span>
              </div>
              
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="border-gray-200 hover:bg-gray-50 transition-all duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern tab navigation */}
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-4 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl p-1 min-w-[600px]">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 px-4 transition-all duration-300"
                  >
                    <IconComponent className="w-4 h-4" />
                    <span className="hidden sm:inline font-medium">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab content with animations */}
          <div className="animate-fade-in">
            <TabsContent value="daily" className="space-y-6">
              <DailyFeed />
            </TabsContent>

            <TabsContent value="capture" className="space-y-6">
              <IdeaCapture />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <TaskList />
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              <MessageIntelligence />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
