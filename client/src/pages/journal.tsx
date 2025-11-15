import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Plus, Gamepad2, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntry, Activity } from "@shared/schema";

const journalEntrySchema = z.object({
  date: z.string(),
  activityId: z.string().min(1, "Activity is required"),
  hoursPlayed: z.number().min(0, "Hours must be positive").optional(),
  notes: z.string().optional(),
  mood: z.enum(["excited", "happy", "neutral", "frustrated", "bored"]).optional(),
});

type JournalEntryForm = z.infer<typeof journalEntrySchema>;

const moodColors = {
  excited: "bg-purple-500/20 text-purple-400",
  happy: "bg-green-500/20 text-green-400", 
  neutral: "bg-gray-500/20 text-gray-400",
  frustrated: "bg-red-500/20 text-red-400",
  bored: "bg-yellow-500/20 text-yellow-400",
};

const moodIcons = {
  excited: "🚀",
  happy: "😊",
  neutral: "😐", 
  frustrated: "😤",
  bored: "😴",
};

function JournalEntryCard({ 
  entry, 
  activity,
  onEdit, 
  onDelete 
}: { 
  entry: JournalEntry;
  activity?: Activity;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
}) {
  const moodKey = entry.mood as keyof typeof moodColors;
  
  return (
    <Card className="bg-gray-900/50 border-gray-700 hover:border-gray-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-blue-400" />
            <CardTitle className="text-lg text-white">{activity?.title || 'Unknown Activity'}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(entry)}
              className="text-gray-400 hover:text-white"
              data-testid={`button-edit-journal-${entry.id}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(entry.id)}
              className="text-red-400 hover:text-red-300"
              data-testid={`button-delete-journal-${entry.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            {format(new Date(entry.date), 'PPP')}
          </div>
          {entry.hoursPlayed && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {entry.hoursPlayed}h
            </div>
          )}
          {entry.mood && moodKey && (
            <Badge className={moodColors[moodKey]}>
              {moodIcons[moodKey]} {entry.mood}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {activity && (
          <div className="mb-2">
            <span className="text-gray-400 text-sm">Type: </span>
            <span className="text-white capitalize">{activity.type}</span>
          </div>
        )}
        {entry.notes && (
          <div className="mt-2 p-3 bg-gray-800/50 rounded-md">
            <p className="text-gray-200 text-sm leading-relaxed">{entry.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function JournalEntryModal({ 
  open, 
  onOpenChange, 
  entry 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  entry?: JournalEntry;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user's activities for selection
  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });
  
  const form = useForm<JournalEntryForm>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
      activityId: entry?.activityId || "",
      hoursPlayed: entry?.hoursPlayed || undefined,
      notes: entry?.notes || "",
      mood: (entry?.mood as "excited" | "happy" | "neutral" | "frustrated" | "bored") || undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: JournalEntryForm) => {
      return apiRequest("POST", "/api/journal", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: JournalEntryForm) => {
      return apiRequest("PUT", `/api/journal/${entry!.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update journal entry", 
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalEntryForm) => {
    if (entry) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {entry ? "Edit Journal Entry" : "Add Journal Entry"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-gray-800 border-gray-600 text-white"
                      data-testid="input-journal-date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="activityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Activity</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      data-testid="select-journal-activity"
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select an activity" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {activities.map((activity) => (
                          <SelectItem key={activity.id} value={activity.id}>
                            {activity.title} ({activity.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hoursPlayed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Hours Played</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="2.5"
                      className="bg-gray-800 border-gray-600 text-white"
                      data-testid="input-journal-hours"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Mood</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value || undefined)}
                      data-testid="select-journal-mood"
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select mood (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="">No mood selected</SelectItem>
                        <SelectItem value="excited">🚀 Excited</SelectItem>
                        <SelectItem value="happy">😊 Happy</SelectItem>
                        <SelectItem value="neutral">😐 Neutral</SelectItem>
                        <SelectItem value="frustrated">😤 Frustrated</SelectItem>
                        <SelectItem value="bored">😴 Bored</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel className="text-gray-300">Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What did you think of the activity? Any memorable moments?"
                      className="bg-gray-800 border-gray-600 text-white resize-none"
                      rows={3}
                      data-testid="textarea-journal-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                data-testid="button-cancel-journal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-save-journal"
              >
                {isPending ? "Saving..." : entry ? "Update Entry" : "Add Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Journal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();

  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });
  const isGuest = (user as any)?.isGuest;

  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
    enabled: !isGuest,
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
    enabled: !isGuest,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/journal/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete journal entry",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleModalClose = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingEntry(undefined);
    }
  };

  // Create a map for quick activity lookup
  const activityMap = activities.reduce((acc, activity) => {
    acc[activity.id] = activity;
    return acc;
  }, {} as Record<string, Activity>);

  // Group entries by date
  const entriesByDate = entries.reduce((acc: Record<string, JournalEntry[]>, entry: JournalEntry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Show login prompt for guests
  if (isGuest) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Activity Journal</h1>
            <p className="text-gray-400">Track your daily activity sessions and progress</p>
          </div>
          
          <Card className="bg-gray-900/50 border-gray-700 text-center py-12">
            <CardContent>
              <Gamepad2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">Sign In Required</h3>
              <p className="text-gray-500 mb-4">Create a free account to start tracking your activity sessions and progress</p>
              <Button 
                onClick={() => window.location.href = "/auth"}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Sign Up / Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Activity Journal</h1>
            <p className="text-gray-400">Track your daily activity sessions and progress</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-add-journal-entry"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-700 text-center py-12">
            <CardContent>
              <Gamepad2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No Journal Entries Yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your activity sessions to see your progress over time</p>
              <Button 
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-add-first-entry"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => (
              <div key={date}>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-400" />
                  {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  <Badge variant="secondary" className="ml-2">
                    {entriesByDate[date].length} {entriesByDate[date].length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {entriesByDate[date].map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      activity={activityMap[entry.activityId]}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <JournalEntryModal
          open={modalOpen}
          onOpenChange={handleModalClose}
          entry={editingEntry}
        />
      </div>
    </div>
  );
}