import React, { useState } from 'react';
import AuthService from '@/services/AuthService';
import ProfileService from '@/services/ProfileService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Feedback } from '@/lib/sound';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing fields',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      Feedback.error();
      return;
    }
    
    try {
      setLoading(true);

      const auth = AuthService.getInstance();
      const user = await auth.signInWithEmailPassword(email, password);
      const profile = ProfileService.getProfile(user.id);
      if (!profile) {
        ProfileService.saveProfile({ userId: user.id, displayName: user.displayName || user.id, email: user.email });
      }

      Feedback.success();

      toast({
        title: 'Login successful',
        description: 'You have been logged in successfully.',
      });

      onLoginSuccess();
    } catch (error) {
      console.error('Login failed:', error);
      
      // Play error sound
      Feedback.error();
      
      toast({
        title: 'Login failed',
        description: 'Failed to log in. Please check your credentials and try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setLoading(true);

      const auth = AuthService.getInstance();
      await auth.signInAnonymously();
      
      // Play success sound
      Feedback.success();
      
      toast({
        title: 'Continuing as guest',
        description: 'You can play for free as a guest user.',
      });
      
      // Call the onLoginSuccess callback
      onLoginSuccess();
    } catch (error) {
      console.error('Anonymous login failed:', error);
      
      // Play error sound
      Feedback.error();
      
      toast({
        title: 'Login failed',
        description: 'Failed to continue as guest. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-md mx-auto">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome to General Zhang</h1>
        <p className="text-muted-foreground">Sign in to access premium features or continue as a guest</p>
      </div>
      
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      
      <Button
        variant="outline"
        className="w-full"
        onClick={handleAnonymousLogin}
        disabled={loading}
      >
        Continue as Guest
      </Button>
    </div>
  );
};

export default LoginForm;
