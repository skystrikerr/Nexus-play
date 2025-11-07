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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, Plus } from "lucide-react";
import type { Activity } from "@shared/schema";

const timeLogSchema = z.object({
  duration: z.number().min(0.1).max(24),
  notes: z.string().optional(),
});

type TimeLogData = z.infer<typeof timeLogSchema>;

interface TimeLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Activity;
}

export default function TimeLogModal({ open, onOpenChange, task }: TimeLogModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TimeLogData>({
    resolver: zodResolver(timeLogSchema),
    defaultValues: {
      duration: 0.5,
      notes: "",
    },
  });

  const logTimeMutation = useMutation({
    mutationFn: async (data: TimeLogData) => {
      // Create session entry for the current date
      await apiRequest("POST", "/api/sessions", {
        activityId: task.id,
        date: new Date().toISOString().split('T')[0],
        duration: data.duration,
        notes: data.notes,
      });

      // Update task's total hours
      const newTotalHours = (task.totalHours || 0) + data.duration;
      await apiRequest("PUT", `/api/activities/${task.id}`, {
        totalHours: newTotalHours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Time Logged",
        description: `Added ${form.getValues().duration} hours to ${task.title}`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log time. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    logTimeMutation.mutate(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5" />
            Log Time - {task.title}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Hours Worked</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      min="0.1"
                      max="24"
                      placeholder="0.5"
                      className="bg-slate-800 border-slate-600 text-white"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did you work on?"
                      className="bg-slate-800 border-slate-600 text-white resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
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
                disabled={logTimeMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                {logTimeMutation.isPending ? "Logging..." : "Log Time"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}