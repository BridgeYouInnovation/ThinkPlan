
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Clock, Mic, Plus, ArrowRight, LogOut, MessageCircle, Mail, Phone } from "lucide-react";

interface DailyFeedProps {
  onLogout: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const DailyFeed = ({ onLogout, onNavigateToTab }: DailyFeedProps) => {
  const [idea, setIdea] = useState("");
  const [todayTasks, setTodayTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFAB, setShowFAB] = useState(false);
  const [importantMessages, setImportantMessages] = useState([
    {
      id: 1,
      type: 'whatsapp',
      sender: 'Sarah Johnson',
      preview: 'Hey! Can we reschedule our meeting tomorrow? Something urgent came up...',
      time: '2 min ago',
      priority: 'high'
    },
    {
      id: 2,
      type: 'email',
      sender: 'Project Manager',
      preview: 'The client wants to discuss the new features we proposed. Please review...',
      time: '15 min ago',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'whatsapp',
      sender: 'Mom',
      preview: 'Don\'t forget dinner on Sunday! Let me know if you can make it.',
      time: '1 hour ago',
      priority: 'low'
    }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaysTasks();
    setShowFAB(false);
  }, []);

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', today)
        .lt('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setTodayTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleIdeaSubmit = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    
    try {
      const { data: ideaData, error: ideaError } = await supabase
        .from('ideas')
        .insert({
          content: idea.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (ideaError) throw ideaError;

      // Create mock tasks based on the idea
      const mockTasks = [
        {
          title: `Research phase for: ${idea.substring(0, 30)}...`,
          description: "Initial research and planning",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          idea_id: ideaData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        },
        {
          title: `First action step for: ${idea.substring(0, 30)}...`,
          description: "Begin implementation",
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          idea_id: ideaData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }
      ];

      const { error: tasksError } = await supabase
        .from('tasks')
        .insert(mockTasks);

      if (tasksError) throw tasksError;

      toast({
        title: "✨ Idea captured!",
        description: "We're breaking it down into actionable steps.",
      });
      
      setIdea("");
      fetchTodaysTasks();
    } catch (error) {
      console.error('Error processing idea:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process your idea. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTodayTasks(tasks => 
        tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleViewAllTasks = () => {
    if (onNavigateToTab) {
      onNavigateToTab('tasks');
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400 bg-red-50';
      case 'medium':
        return 'border-l-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Focus on what matters</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-gray-600 hover:bg-gray-100 rounded-full w-10 h-10 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* 1. Capture Your Idea */}
      <Card className="idea-capture-glow bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Capture Your Idea</h3>
          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                className="w-full border-2 border-gray-200 bg-white rounded-2xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-gray-900 placeholder-gray-600 text-base font-medium shadow-sm"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-3 text-gray-400 hover:text-purple-600 rounded-full w-8 h-8 p-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleIdeaSubmit}
              disabled={!idea.trim() || isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 rounded-2xl font-medium"
            >
              {isLoading ? "Breaking it down..." : "Break it Down"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. Today's Focus */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Today's Focus</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleViewAllTasks}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            View All Tasks <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        {todayTasks.length === 0 ? (
          <Card className="bg-gray-50 border border-gray-100 rounded-2xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No tasks for today. Start by capturing an idea!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <Card key={task.id} className="bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                    >
                      {task.status === 'completed' && (
                        <CheckSquare className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                    </div>
                    {task.due_date && (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 3. Important Messages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Important Messages</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigateToTab && onNavigateToTab('messages')}
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {importantMessages.map((message) => (
            <Card key={message.id} className={`border-l-4 rounded-2xl hover:shadow-md transition-shadow ${getPriorityColor(message.priority)}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getMessageIcon(message.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{message.sender}</p>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{message.preview}</p>
                  </div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <Button size="sm" variant="outline" className="text-xs rounded-full">
                    Quick Reply
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs rounded-full">
                    Mark Read
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-10">
        <div className="relative">
          {showFAB && (
            <div className="absolute bottom-16 right-0 space-y-3 animate-fade-in">
              <Button 
                onClick={() => onNavigateToTab && onNavigateToTab('capture')}
                className="bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full w-12 h-12 p-0"
              >
                Add Idea
              </Button>
              <Button 
                onClick={() => onNavigateToTab && onNavigateToTab('tasks')}
                className="bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full w-12 h-12 p-0"
              >
                Add Task
              </Button>
              <Button 
                onClick={() => onNavigateToTab && onNavigateToTab('messages')}
                className="bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full w-12 h-12 p-0"
              >
                Paste Message
              </Button>
            </div>
          )}
          <Button
            onClick={() => setShowFAB(!showFAB)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full w-14 h-14 p-0 shadow-lg"
          >
            <Plus className={`h-6 w-6 transition-transform duration-200 ${showFAB ? 'rotate-45' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};
