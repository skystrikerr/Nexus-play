import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Filter, Search, CheckSquare, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/sidebar";
import AddTaskModal from "@/components/add-task-modal";
import TaskCard from "@/components/task-card";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Activity } from "@shared/schema";

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  dueSoon: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function Tasks() {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isMobile = useIsMobile();

  // Fetch tasks (activities that are not games)
  const { data: allActivities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter out games and only show task-type activities
  const tasks = allActivities.filter(activity => 
    activity.type !== "game" && 
    ["work", "study", "other"].includes(activity.type)
  );

  // Apply filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    
    const priority = (task.metadata as any)?.priority || "medium";
    const matchesPriority = priorityFilter === "all" || priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Calculate task statistics
  const taskStats: TaskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    overdue: tasks.filter(t => {
      const dueDate = (t.metadata as any)?.dueDate;
      return dueDate && new Date(dueDate) < new Date() && t.status !== "completed";
    }).length,
    dueSoon: tasks.filter(t => {
      const dueDate = (t.metadata as any)?.dueDate;
      return dueDate && 
             new Date(dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) && 
             new Date(dueDate) >= new Date() &&
             t.status !== "completed";
    }).length,
    byPriority: {
      high: tasks.filter(t => (t.metadata as any)?.priority === "high").length,
      medium: tasks.filter(t => (t.metadata as any)?.priority === "medium").length,
      low: tasks.filter(t => (t.metadata as any)?.priority === "low").length,
    }
  };

  // Sort tasks by priority and due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by completion status
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    
    // Then by priority (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aPriority = (a.metadata as any)?.priority || "medium";
    const bPriority = (b.metadata as any)?.priority || "medium";
    const priorityDiff = priorityOrder[bPriority as keyof typeof priorityOrder] - priorityOrder[aPriority as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    const aDue = (a.metadata as any)?.dueDate;
    const bDue = (b.metadata as any)?.dueDate;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    if (aDue && bDue) return new Date(aDue).getTime() - new Date(bDue).getTime();
    
    // Finally by update date
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-bg">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <Sidebar />
      
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-400" />
              Task Manager
            </h1>
            <p className="text-slate-400 mt-2">
              Organize your work, study sessions, and personal tasks
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddTaskModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">Total Tasks</span>
            </div>
            <p className="text-2xl font-bold text-white">{taskStats.total}</p>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-sm text-slate-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{taskStats.completed}</p>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{taskStats.inProgress}</p>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-sm text-slate-400">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{taskStats.overdue}</p>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400">🔥</span>
              <span className="text-sm text-slate-400">Due Soon</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{taskStats.dueSoon}</p>
          </div>
          
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-400">🔴</span>
              <span className="text-sm text-slate-400">High Priority</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{taskStats.byPriority.high}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="wishlist">Planned</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="study">Study</SelectItem>
                <SelectItem value="other">Personal</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="border-slate-600"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="border-slate-600"
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks Display */}
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            </h3>
            <p className="text-slate-500 mb-6">
              {tasks.length === 0 
                ? "Create your first task to start managing your time effectively"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {tasks.length === 0 && (
              <Button 
                onClick={() => setShowAddTaskModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              : "space-y-3"
          )}>
            {sortedTasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                variant={viewMode === "list" ? "compact" : "default"}
                onClick={() => {
                  // Handle task edit - could open edit modal
                  console.log("Edit task:", task.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskModal 
        open={showAddTaskModal} 
        onOpenChange={setShowAddTaskModal} 
      />
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}