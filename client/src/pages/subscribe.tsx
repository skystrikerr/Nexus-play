import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Crown, Star, Zap, BarChart3, Users, Calendar, Trophy } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/dashboard',
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome to NexusPlay Pro!",
        description: "Your subscription is now active with all premium features.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
      >
        Subscribe to NexusPlay Pro
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create subscription payment intent
    apiRequest("POST", "/api/get-or-create-subscription")
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Subscription error:', error);
        setLoading(false);
      });
  }, []);

  const freeFeatures = [
    "Track unlimited activities",
    "Basic analytics dashboard", 
    "Calendar view",
    "Gaming session tracking",
    "Task management",
    "Community features"
  ];

  const proFeatures = [
    "Advanced analytics & insights",
    "Export data to CSV/PDF",
    "Custom activity categories", 
    "Priority support",
    "Extended gaming platform integrations",
    "Team collaboration features",
    "Custom themes & layouts",
    "Achievement badges system",
    "Detailed progress reports",
    "API access for integrations"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="container mx-auto max-w-4xl py-8">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading subscription details...</p>
          </div>
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
            <Crown className="h-12 w-12 text-yellow-400" />
            <h1 className="text-5xl font-bold text-white">NexusPlay Pro</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Unlock advanced features and take your productivity tracking to the next level
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
          <Card className="bg-slate-800/50 border-slate-700 relative">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-6 w-6 text-blue-400" />
                <CardTitle className="text-2xl text-white">Free Plan</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Perfect for getting started with activity tracking
              </CardDescription>
              <div className="text-4xl font-bold text-white mt-4">
                $0<span className="text-xl text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {freeFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
              <Separator className="bg-slate-600 my-6" />
              <Button 
                variant="outline" 
                className="w-full text-gray-300 border-gray-600 hover:bg-slate-700"
                disabled
              >
                Current Plan
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-purple-500 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold">
                POPULAR
              </Badge>
            </div>
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                <CardTitle className="text-2xl text-white">Pro Plan</CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                Advanced features for power users and teams
              </CardDescription>
              <div className="text-4xl font-bold text-white mt-4">
                $9.99<span className="text-xl text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-2">Cancel anytime</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-purple-300 font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Everything in Free, plus:
              </div>
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Form */}
        {clientSecret && (
          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                <Crown className="h-6 w-6 text-yellow-400" />
                Upgrade to Pro
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your payment details to unlock all premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            </CardContent>
          </Card>
        )}

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <BarChart3 className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
              <p className="text-gray-400">
                Detailed insights, custom reports, and data export capabilities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Team Features</h3>
              <p className="text-gray-400">
                Collaborate with teams, share progress, and group analytics
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 text-center">
            <CardContent className="pt-6">
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Premium Support</h3>
              <p className="text-gray-400">
                Priority support, feature requests, and direct developer access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-400">
                  Yes! You can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">What happens to my data if I downgrade?</h3>
                <p className="text-gray-400">
                  Your data is never lost. Free plan users can still access all their activities and basic features. Pro-specific data like advanced reports will be preserved if you upgrade again.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Do you offer discounts for students or teams?</h3>
                <p className="text-gray-400">
                  Yes! Contact our support team for educational discounts and team pricing options.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}