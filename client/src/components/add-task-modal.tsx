import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertActivitySchema, ACTIVITY_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Briefcase, 
  Coffee, 
  Calendar,
  Clock,
  Target,
  X,
  Plus,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { z } from "zod";

const taskSchema = insertActivitySchema.extend({
  type: insertActivitySchema.shape.type.default("work"),
  status: insertActivitySchema.shape.status.default("in_progress"),
  progress: insertActivitySchema.shape.progress.default(0),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: string;
}

const taskTypes = [
  { value: ACTIVITY_TYPES.WORK, label: "Work Project", icon: Briefcase, color: "bg-blue-500/20 text-blue-400" },
  { value: ACTIVITY_TYPES.STUDY, label: "Study Session", icon: BookOpen, color: "bg-green-500/20 text-green-400" },
  { value: ACTIVITY_TYPES.OTHER, label: "Personal Task", icon: Coffee, color: "bg-purple-500/20 text-purple-400" },
];

// Removed priority levels

const taskCategories = {
  work: ["Project", "Meeting", "Research", "Development", "Review", "Documentation"],
  study: ["Assignment", "Exam Prep", "Reading", "Research", "Practice", "Course"],
  other: ["Personal", "Health", "Finance", "Home", "Creative", "Social"],
};

export default function AddTaskModal({ open, onOpenChange, defaultType = "work" }: AddTaskModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      type: defaultType as any,
      title: "",
      description: "",
      category: "",
      subcategory: "",
      status: "in_progress",
      progress: 0,
      totalHours: 0,
      imageUrl: "",
      tags: [],
      metadata: {},
    },
  });

  const selectedType = form.watch("type");
  const selectedTaskType = taskTypes.find(t => t.value === selectedType);

  const createTaskMutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      const taskData = {
        ...data,
        tags: selectedTags,
        metadata: {},
      };
      return apiRequest("POST", "/api/activities", taskData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Task Created",
        description: "Your task has been added successfully.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedTags([]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const onSubmit = (data: TaskFormData) => {
    createTaskMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-400" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Task Type Selection */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Task Type</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {taskTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = field.value === type.value;
                      return (
                        <Button
                          key={type.value}
                          type="button"
                          variant="outline"
                          className={cn(
                            "h-20 flex-col gap-2 border-slate-600 transition-all",
                            isSelected 
                              ? "border-blue-500 bg-blue-500/10 text-blue-400" 
                              : "text-slate-300 hover:border-slate-500 hover:bg-slate-800"
                          )}
                          onClick={() => field.onChange(type.value)}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Task Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Task Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder={`Enter ${selectedTaskType?.label.toLowerCase()} name...`}
                      className="bg-slate-800 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {taskCategories[selectedType as keyof typeof taskCategories]?.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe the task, goals, or requirements..."
                      className="bg-slate-800 border-slate-600 text-white min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <div className="space-y-3">
              <FormLabel className="text-white">Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  className="bg-slate-800 border-slate-600 text-white flex-1"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag} className="border-slate-600 text-slate-300">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-200">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-2 text-slate-400 hover:text-slate-200"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createTaskMutation.isPending ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}