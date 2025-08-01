import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Crown, Star, Lock, Zap, BarChart3, Users, Trophy, Download, Palette, Award } from "lucide-react";
import { Link } from "wouter";

interface UserSettings {
  isPremium?: boolean;
  subscriptionStatus?: string;
  subscriptionEndsAt?: string;
}

export function Premium() {
  const { user } = useAuth();
  
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      return await response.json();
    },
    enabled: !!user,
  });

  const isPremium = settings?.isPremium || false;

  const premiumFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights with custom date ranges, activity comparisons, and productivity trends",
      color: "text-purple-400"
    },
    {
      icon: Download,
      title: "Data Export",
      description: "Export your data to CSV, PDF, or JSON formats for external analysis",
      color: "text-blue-400"
    },
    {
      icon: Palette,
      title: "Custom Themes",
      description: "Personalize your experience with exclusive themes and layout options",
      color: "text-pink-400"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share activities with team members, group analytics, and collaborative goals",
      color: "text-green-400"
    },
    {
      icon: Award,
      title: "Achievement System",
      description: "Unlock exclusive badges, streaks, and milestone celebrations",
      color: "text-yellow-400"
    },
    {
      icon: Zap,
      title: "API Access",
      description: "Connect with external tools and services through our premium API",
      color: "text-orange-400"
    }
  ];

  const lockedFeatures = [
    "Advanced filtering options",
    "Custom activity categories", 
    "Bulk operations",
    "Priority customer support",
    "Early access to new features",
    "Unlimited data history"
  ];

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="container mx-auto max-w-6xl py-8">
          {/* Premium Status */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Crown className="h-12 w-12 text-yellow-400" />
              <h1 className="text-5xl font-bold text-white">NexusPlay Pro</h1>
            </div>
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold text-lg px-4 py-2">
              ACTIVE SUBSCRIPTION
            </Badge>
            <p className="text-xl text-gray-300 mt-4">
              You have access to all premium features
            </p>
          </div>

          {/* Premium Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {premiumFeatures.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-purple-500 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscription Management */}
          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Subscription Management</CardTitle>
              <CardDescription className="text-gray-400">
                Manage your NexusPlay Pro subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Status: <span className="text-green-400 font-semibold">Active</span>
                </p>
                {settings?.subscriptionEndsAt && (
                  <p className="text-gray-400 text-sm mb-6">
                    Next billing: {new Date(settings.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" className="text-gray-300 border-gray-600 hover:bg-slate-700">
                  Update Payment Method
                </Button>
                <Button variant="outline" className="text-red-400 border-red-600 hover:bg-red-600 hover:text-white">
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Lock className="h-12 w-12 text-gray-400" />
            <h1 className="text-5xl font-bold text-white">Premium Features</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock advanced capabilities and take your productivity tracking to the next level
          </p>
        </div>

        {/* Current Plan Status */}
        <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto mb-12">
          <CardContent className="pt-6 text-center">
            <Star className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Free Plan</h3>
            <p className="text-gray-400 mb-4">You're currently using the free version of NexusPlay</p>
            <Link href="/subscribe">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                Upgrade to Pro
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Locked Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {premiumFeatures.map((feature, index) => (
            <Card key={index} className="bg-slate-800/30 border-slate-700 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="h-6 w-6 text-yellow-400" />
              </div>
              <CardContent className="pt-6 opacity-75">
                <div className="flex items-center gap-3 mb-4">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                  Pro Feature
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Locked Features */}
        <Card className="bg-slate-800/50 border-slate-700 mb-12">
          <CardHeader>
            <CardTitle className="text-2xl text-white text-center flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              Additional Pro Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {lockedFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30">
                  <Crown className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500">
          <CardContent className="pt-8 text-center">
            <Crown className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Upgrade?</h2>
            <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of users who have upgraded to NexusPlay Pro for advanced tracking and insights
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/subscribe">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Upgrade to Pro - $9.99/month
                </Button>
              </Link>
              <p className="text-sm text-gray-400">Cancel anytime • 30-day money back guarantee</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}