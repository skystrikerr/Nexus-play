import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, Filter, Search, Calendar, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import type { Review } from "@shared/schema";

export default function Reviews() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['/api/reviews'],
  });

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === null || review.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const renderDifficultyStars = (difficulty?: number) => {
    if (!difficulty) return null;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            className={`w-3 h-3 rounded-full ${
              star <= difficulty
                ? 'bg-red-400'
                : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-slate-700">
              <CardHeader>
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-700 rounded"></div>
                  <div className="h-3 bg-slate-700 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">My Reviews</h1>
            <p className="text-slate-400 mt-1">
              Your thoughts and ratings on completed activities
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {reviews.length} reviews
          </Badge>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterRating === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRating(null)}
            >
              All Ratings
            </Button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filterRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(rating)}
              >
                {rating}★
              </Button>
            ))}
          </div>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="py-12 text-center">
            <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Reviews Yet</h3>
            <p className="text-slate-400 mb-4">
              Complete some activities and write reviews to share your experience!
            </p>
            <Button className="bg-primary hover:bg-primary/90">
              View Activities
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredReviews.map((review) => (
            <Card key={review.id} className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-white">{review.title}</CardTitle>
                    <div className="flex items-center gap-4">
                      {renderStars(review.rating)}
                      {review.difficulty && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">Difficulty:</span>
                          {renderDifficultyStars(review.difficulty)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </div>
                    {review.completedAt && (
                      <div className="mt-1">
                        Completed: {format(new Date(review.completedAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 leading-relaxed">{review.content}</p>
                
                {/* Stats */}
                <div className="flex gap-6 text-sm text-slate-400">
                  {review.hoursSpent && (
                    <div>⏱️ {review.hoursSpent}h spent</div>
                  )}
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    Would recommend: {review.recommendation}/5
                  </div>
                </div>

                {/* Pros and Cons */}
                {(review.pros?.length || review.cons?.length) && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {review.pros && review.pros.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-400 mb-2">👍 Pros</h4>
                        <ul className="space-y-1">
                          {review.pros.map((pro, index) => (
                            <li key={index} className="text-sm text-slate-300">
                              • {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-400 mb-2">👎 Cons</h4>
                        <ul className="space-y-1">
                          {review.cons.map((con, index) => (
                            <li key={index} className="text-sm text-slate-300">
                              • {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {review.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}