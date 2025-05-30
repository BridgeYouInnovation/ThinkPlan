
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, Edit } from "lucide-react";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "completed";
  category: "today" | "upcoming" | "completed";
}

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Research Spanish learning apps",
      dueDate: "2024-01-15",
      status: "pending",
      category: "today"
    },
    {
      id: "2",
      title: "Download Duolingo and create account",
      dueDate: "2024-01-15",
      status: "pending",
      category: "today"
    },
    {
      id: "3",
      title: "Find local Spanish conversation groups",
      dueDate: "2024-01-18",
      status: "pending",
      category: "upcoming"
    }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { 
            ...task, 
            status: task.status === "pending" ? "completed" : "pending",
            category: task.status === "pending" ? "completed" : "today"
          }
        : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filterTasks = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => toggleTask(task.id)}
      />
      <div className="flex-1">
        <p className={`${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
          {task.title}
        </p>
        <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">
              Today ({filterTasks("today").length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({filterTasks("upcoming").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterTasks("completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {filterTasks("today").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
            {filterTasks("today").length === 0 && (
              <p className="text-gray-500 text-center py-8">No tasks for today</p>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {filterTasks("upcoming").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {filterTasks("completed").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
