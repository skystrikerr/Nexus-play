import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Mail, User, Lock, AtSign, Chrome } from "lucide-react";


interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

export function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [registerData, setRegisterData] = useState<RegisterData>({ 
    email: "", password: "", username: "", firstName: "", lastName: "" 
  });
  // Present when the user arrives from a password-reset email link (/auth?reset=TOKEN)
  const resetToken = new URLSearchParams(window.location.search).get("reset");
  const [resetEmail, setResetEmail] = useState("");
  const [resetData, setResetData] = useState({
    newPassword: "", confirmPassword: ""
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => apiRequest("POST", "/api/auth/login", data),
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const guestMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/guest", {}),
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Guest Mode Failed",
        description: error.message || "Could not start guest mode",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => apiRequest("POST", "/api/auth/register", data),
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest("POST", "/api/auth/request-password-reset", { email }),
    onSuccess: () => {
      toast({
        title: "Check Your Email",
        description: "If an account exists for that email, a reset link has been sent.",
      });
      setShowPasswordReset(false);
      setResetEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Could not request a password reset",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { token: string; newPassword: string; confirmPassword: string }) =>
      apiRequest("POST", "/api/auth/reset-password", data),
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now log in with your new password.",
      });
      setResetData({ newPassword: "", confirmPassword: "" });
      // Drop the token from the URL
      window.history.replaceState({}, "", "/auth");
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    if (!registerData.username || registerData.username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(registerData.username)) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }
    
    if (registerData.password.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    registerMutation.mutate(registerData);
  };



  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    requestResetMutation.mutate(resetEmail);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match",
        variant: "destructive",
      });
      return;
    }
    if (resetData.newPassword.length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ token: resetToken, ...resetData });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(20, 184, 166, 0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(139, 92, 246, 0.10) 0%, transparent 55%)",
        }}
      />
      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold tracking-tight mb-2">
            <span className="text-foreground">Nexus</span>
            <span className="text-gradient-aurora">Play</span>
          </h1>
          <p className="text-muted-foreground">
            Track your games. Rank everything.
          </p>
        </div>

        <Card className="glass border-border/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">Welcome</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Choose your preferred way to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">


            {/* New password form — shown when arriving from a reset email link */}
            {resetToken ? (
              <Card className="bg-muted/50 border-border p-4">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Set a New Password</h3>
                    <p className="text-sm text-muted-foreground">Choose a new password for your account</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-new-password" className="text-foreground">New Password</Label>
                    <Input
                      id="reset-new-password"
                      type="password"
                      placeholder="New password (min 6 characters)"
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                      className="bg-muted border-input text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-confirm-password" className="text-foreground">Confirm New Password</Label>
                    <Input
                      id="reset-confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                      className="bg-muted border-input text-foreground"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full bg-gradient-aurora text-white hover:opacity-90"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </Card>
            ) : (
              <>
                {/* Password Reset Option */}
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setShowPasswordReset(!showPasswordReset)}
                    className="text-primary hover:text-primary/80"
                  >
                    Forgot your password?
                  </Button>
                </div>

                {/* Request Reset Link Form */}
                {showPasswordReset && (
                  <Card className="bg-muted/50 border-border p-4">
                    <form onSubmit={handleRequestReset} className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-foreground">Reset Password</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter your email and we'll send you a reset link
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-foreground">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="your@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="bg-muted border-input text-foreground"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordReset(false)}
                          className="flex-1 border-border text-muted-foreground hover:bg-muted"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={requestResetMutation.isPending}
                          className="flex-1 bg-gradient-aurora text-white hover:opacity-90"
                        >
                          {requestResetMutation.isPending ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </>
            )}

            {/* Google Sign In */}
            <Button
              onClick={() => window.location.href = '/api/auth/google'}
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>

            <Separator className="bg-border" />

            {/* Email/Password Forms */}
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="login" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-background">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="Enter your email"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-aurora text-white hover:opacity-90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-muted-foreground">Username</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        placeholder="Choose a unique username"
                        value={registerData.username}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                        className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                        required
                        minLength={3}
                        maxLength={20}
                        data-testid="input-username"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Letters, numbers, and underscores only. 3-20 characters.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-muted-foreground">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="first-name"
                          placeholder="First name"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last-name" className="text-muted-foreground">Last Name</Label>
                      <Input
                        id="last-name"
                        placeholder="Last name"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min. 6 characters)"
                        value={registerData.password}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10 bg-muted border-input text-foreground placeholder:text-muted-foreground/60"
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-aurora text-white hover:opacity-90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By creating an account you agree to our{" "}
                    <a href="/terms" className="text-primary hover:underline">Terms of Use</a> and{" "}
                    <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                  </p>
                </form>
              </TabsContent>
            </Tabs>

            {/* Guest Mode */}
            <Separator className="my-6 bg-border" />
            
            <div className="space-y-3">
              <p className="text-center text-sm text-gray-400">
                Just want to explore?
              </p>
              <Button
                onClick={() => guestMutation.mutate()}
                disabled={guestMutation.isPending}
                variant="outline"
                className="w-full border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                data-testid="button-guest-mode"
              >
                {guestMutation.isPending ? "Starting..." : "Try as Guest"}
              </Button>
              <p className="text-center text-xs text-gray-500">
                Explore the app with demo data. No account needed!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}