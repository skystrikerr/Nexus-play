import { useState, useEffect } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertActivitySchema, ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, Gamepad2, BookOpen, Dumbbell, Briefcase, Coffee, Heart, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { Activity } from "@shared/schema";

const formSchema = insertActivitySchema.extend({
  rating: insertActivitySchema.shape.rating.optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditActivityModalProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const activityTypeIcons = {
  [ACTIVITY_TYPES.GAME]: Gamepad2,
  [ACTIVITY_TYPES.STUDY]: BookOpen,
  [ACTIVITY_TYPES.WORK]: Briefcase,
  [ACTIVITY_TYPES.EXERCISE]: Dumbbell,
  [ACTIVITY_TYPES.READING]: BookOpen,
  [ACTIVITY_TYPES.HOBBY]: Heart,
  [ACTIVITY_TYPES.OTHER]: Coffee,
};

const activityTypeLabels = {
  [ACTIVITY_TYPES.GAME]: "Gaming",
  [ACTIVITY_TYPES.STUDY]: "Study",
  [ACTIVITY_TYPES.WORK]: "Work",
  [ACTIVITY_TYPES.EXERCISE]: "Exercise",
  [ACTIVITY_TYPES.READING]: "Reading",
  [ACTIVITY_TYPES.HOBBY]: "Hobby",
  [ACTIVITY_TYPES.OTHER]: "Other",
};

const statusLabels = {
  [ACTIVITY_STATUSES.WISHLIST]: "Wishlist",
  [ACTIVITY_STATUSES.IN_PROGRESS]: "In Progress",
  [ACTIVITY_STATUSES.COMPLETED]: "Completed",
  [ACTIVITY_STATUSES.DROPPED]: "Dropped",
  [ACTIVITY_STATUSES.ON_HOLD]: "On Hold",
};

const getCategoryLabel = (type: string) => {
  switch (type) {
    case ACTIVITY_TYPES.GAME: return "Platform";
    case ACTIVITY_TYPES.STUDY: return "Subject";
    case ACTIVITY_TYPES.WORK: return "Department";
    case ACTIVITY_TYPES.EXERCISE: return "Type";
    case ACTIVITY_TYPES.READING: return "Genre";
    default: return "Category";
  }
};

const getSubcategoryLabel = (type: string) => {
  switch (type) {
    case ACTIVITY_TYPES.GAME: return "Genre";
    case ACTIVITY_TYPES.STUDY: return "Topic";
    case ACTIVITY_TYPES.WORK: return "Project";
    case ACTIVITY_TYPES.EXERCISE: return "Intensity";
    case ACTIVITY_TYPES.READING: return "Author";
    default: return "Subcategory";
  }
};

export default function EditActivityModal({ activity, open, onOpenChange }: EditActivityModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: ACTIVITY_TYPES.GAME,
      category: "",
      subcategory: "",
      status: ACTIVITY_STATUSES.WISHLIST,
      rating: undefined,
      progress: 0,
      totalHours: 0,
      imageUrl: "",
      externalId: "",
      description: "",
      tags: [],
      metadata: null,
    },
  });

  // Pre-fill form when activity changes
  useEffect(() => {
    if (activity && open) {
      form.reset({
        title: activity.title,
        type: activity.type,
        category: activity.category || "",
        subcategory: activity.subcategory || "",
        status: activity.status,
        rating: activity.rating || undefined,
        progress: activity.progress || 0,
        totalHours: activity.totalHours || 0,
        imageUrl: activity.imageUrl || "",
        externalId: activity.externalId || "",
        description: activity.description || "",
        tags: activity.tags || [],
        metadata: activity.metadata || null,
      });
      setSelectedRating(activity.rating || 0);
      setImagePreview(activity.imageUrl || "");
    }
  }, [activity, open, form]);

  const watchedType = form.watch("type");

  const updateActivityMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest("PUT", `/api/activities/${activity?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Activity Updated",
        description: "Your changes have been saved.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update activity",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateActivityMutation.mutate({
      ...data,
      rating: selectedRating || undefined,
    });
  };

  const ActivityIcon = activityTypeIcons[watchedType as keyof typeof activityTypeIcons] || Coffee;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Edit Activity
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Activity Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(activityTypeLabels).map(([value, label]) => {
                        const Icon = activityTypeIcons[value as keyof typeof activityTypeIcons];
                        return (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title & Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Activity title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getCategoryLabel(watchedType)}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${getCategoryLabel(watchedType).toLowerCase()}`}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getSubcategoryLabel(watchedType)}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${getSubcategoryLabel(watchedType).toLowerCase()}`}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/image.jpg"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        setImagePreview(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-40 rounded-lg object-cover"
                        onError={() => setImagePreview("")}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Progress & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-6 h-6 cursor-pointer transition-colors",
                      star <= selectedRating
                        ? "text-yellow-400 fill-current"
                        : "text-slate-600 hover:text-yellow-200"
                    )}
                    onClick={() => setSelectedRating(star === selectedRating ? 0 : star)}
                  />
                ))}
                {selectedRating > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">{selectedRating}.0</span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateActivityMutation.isPending}>
                {updateActivityMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
