import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Activity } from "@shared/schema";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(10, "Review must be at least 10 characters").max(2000),
  difficulty: z.number().min(1).max(5).optional(),
  recommendation: z.number().min(1).max(5),
  hoursSpent: z.number().min(0).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.number().default(1),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface CompletionModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletionModal({ activity, isOpen, onClose }: CompletionModalProps) {
  const [step, setStep] = useState<'complete' | 'review'>('complete');
  const [prosInput, setProsInput] = useState('');
  const [consInput, setConsInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      title: `My review of ${activity.title}`,
      content: '',
      difficulty: 3,
      recommendation: 5,
      hoursSpent: activity.totalHours ?? 0,
      pros: [],
      cons: [],
      tags: [],
      isPublic: 1,
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/activities/${activity.id}/complete`, { 
      completedAt: new Date().toISOString() 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      toast({
        title: "Activity Completed! 🎉",
        description: `Congratulations on completing ${activity.title}!`,
      });
      setStep('review');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark activity as completed",
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (reviewData: ReviewForm) => apiRequest('POST', '/api/reviews', {
      ...reviewData,
      activityId: activity.id,
      completedAt: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      toast({
        title: "Review Published! ⭐",
        description: "Your review has been saved successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save review",
        variant: "destructive",
      });
    },
  });

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const handleReviewSubmit = (data: ReviewForm) => {
    reviewMutation.mutate(data);
  };

  const addTag = (type: 'pros' | 'cons' | 'tags', value: string) => {
    if (!value.trim()) return;
    
    const currentValues = form.getValues(type) || [];
    form.setValue(type, [...currentValues, value.trim()]);
    
    if (type === 'pros') setProsInput('');
    if (type === 'cons') setConsInput('');
    if (type === 'tags') setTagInput('');
  };

  const removeTag = (type: 'pros' | 'cons' | 'tags', index: number) => {
    const currentValues = form.getValues(type) || [];
    form.setValue(type, currentValues.filter((_, i) => i !== index));
  };

  const renderStars = (rating: number, onChange: (rating: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-6 h-6 cursor-pointer transition-colors ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          onClick={() => onChange(star)}
        />
      ))}
    </div>
  );

  if (step === 'complete') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Complete Activity
            </DialogTitle>
            <DialogDescription>
              Mark "{activity.title}" as completed and celebrate your achievement!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-20 h-20 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">{activity.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activity.totalHours > 0 && `${activity.totalHours} hours logged`}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Write a Review
          </DialogTitle>
          <DialogDescription>
            Share your thoughts about "{activity.title}" with the community
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleReviewSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Rating</FormLabel>
                    <FormControl>
                      {renderStars(field.value, field.onChange)}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recommendation */}
              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Would you recommend?</FormLabel>
                    <FormControl>
                      {renderStars(field.value, field.onChange)}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Difficulty */}
              {activity.type === 'game' && (
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <FormControl>
                        {renderStars(field.value || 3, (rating) => field.onChange(rating))}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Hours Spent */}
              <FormField
                control={form.control}
                name="hoursSpent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hours Spent</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Summarize your experience" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your detailed thoughts and experience..."
                      className="min-h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pros */}
            <div>
              <label className="text-sm font-medium">Pros</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={prosInput}
                  onChange={(e) => setProsInput(e.target.value)}
                  placeholder="Add a positive aspect"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('pros', prosInput))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag('pros', prosInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.watch('pros') || []).map((pro, index) => (
                  <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                    {pro}
                    <button
                      type="button"
                      onClick={() => removeTag('pros', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <label className="text-sm font-medium">Cons</label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={consInput}
                  onChange={(e) => setConsInput(e.target.value)}
                  placeholder="Add a negative aspect"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag('cons', consInput))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag('cons', consInput)}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.watch('cons') || []).map((con, index) => (
                  <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                    {con}
                    <button
                      type="button"
                      onClick={() => removeTag('cons', index)}
                      className="ml-2 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Skip Review
              </Button>
              <Button
                type="submit"
                disabled={reviewMutation.isPending}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {reviewMutation.isPending ? 'Publishing...' : 'Publish Review'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}