import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, CheckSquare, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import AddTaskModal from "@/components/add-task-modal";
import TaskCard from "@/components/task-card";
import type { Activity } from "@shared/schema";

export default function Tasks() {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch tasks (activities that are not games)
  const { data: allActivities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Filter out games and only show tasks (type = "other")
  const tasks = allActivities.filter(activity => activity.type === "other");

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
  };

  // Sort tasks by completion status and update date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;

    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  });

  const statCards = [
    { title: "Total Tasks", value: taskStats.total, icon: CheckSquare, gradient: "bg-gradient-solar" },
    { title: "Completed", value: taskStats.completed, icon: Target, gradient: "bg-gradient-neutral" },
    { title: "In Progress", value: taskStats.inProgress, icon: Clock, gradient: "bg-gradient-pulse" },
  ];

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle="Keep track of your tasks and get things done"
        actions={
          <Button
            className="bg-gradient-solar text-white hover:opacity-90 shadow-lg shadow-warning/20"
            onClick={() => setShowAddTaskModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 lg:gap-5 mb-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="glass-glow rounded-xl p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-xs lg:text-sm font-medium">{card.title}</p>
                    <p className="text-2xl lg:text-3xl font-bold text-foreground font-mono mt-1">
                      {isLoading ? <span className="shimmer inline-block w-10 h-8 rounded" /> : card.value}
                    </p>
                  </div>
                  <div className={`hidden sm:flex w-11 h-11 rounded-xl items-center justify-center ${card.gradient} shadow-lg shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div className="relative flex-1 sm:max-w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-muted border-input text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="wishlist">Planned</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            {(["grid", "list"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className={
                  viewMode === mode
                    ? "bg-gradient-solar text-white"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                }
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tasks Display */}
        {sortedTasks.length === 0 ? (
          <div className="glass-glow rounded-xl p-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">
              {tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {tasks.length === 0
                ? "Create your first task to start managing your time effectively"
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {tasks.length === 0 && (
              <Button
                onClick={() => setShowAddTaskModal(true)}
                className="bg-gradient-solar text-white hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              : "space-y-3"
          )}>
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                variant={viewMode === "list" ? "compact" : "default"}
              />
            ))}
          </div>
        )}
      </div>

      <AddTaskModal
        open={showAddTaskModal}
        onOpenChange={setShowAddTaskModal}
      />
    </>
  );
}
