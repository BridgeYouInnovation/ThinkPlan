
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IdeaCapture } from "./IdeaCapture";
import { TaskList } from "./TaskList";
import { MessageIntelligence } from "./MessageIntelligence";
import { DailyFeed } from "./DailyFeed";

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState("daily");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ThinkPlan</h1>
        <Button variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily Feed</TabsTrigger>
          <TabsTrigger value="capture">Capture Idea</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <DailyFeed />
        </TabsContent>

        <TabsContent value="capture">
          <IdeaCapture />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskList />
        </TabsContent>

        <TabsContent value="messages">
          <MessageIntelligence />
        </TabsContent>
      </Tabs>
    </div>
  );
};
