'use client';

import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setIsLoading(true);
    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Success', description: 'Account created successfully!' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Success', description: 'Signed in successfully!' });
      }
      router.push('/chat');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      toast({ title: 'Success', description: 'Signed in with Google!' });
      router.push('/chat');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Error',
        description: error.message,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-2">
        <Icons.Logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight text-white">MentalCare</h1>
      </div>
      <Tabs defaultValue="email" className="w-full max-w-sm">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="google">Google</TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Welcome</CardTitle>
              <CardDescription>
                Sign in or create an account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                className="w-full"
                onClick={() => handleAuthAction('signIn')}
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAuthAction('signUp')}
                disabled={isLoading || isGoogleLoading}
              >
                 {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Sign Up
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="google">
          <Card className="backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Google Sign-In</CardTitle>
              <CardDescription>
                Use your Google account for quick access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8C0 120.3 106.5 8 244 8s244 112.3 244 253.8zM138.3 379.6c-24.8-15.4-44.5-38.3-57.1-65.4H244v-1.1H138.3C134.9 275.9 133 240 133 205.1v-3.7H244v-1.1H133c12.6-27.1 32.3-50 57.1-65.4l-11.5-32.9C152.4 125.7 133 165.1 133 208.5c0 43.4 19.4 82.8 46.8 108.2l11.5-32.9zM244 503.9c68.3-1.7 129.2-31.5 173.8-77.9l-36-24.4c-25.2 30.2-63.3 50.1-104.9 50.1-41.6 0-79.7-19.9-104.9-50.1l-36 24.4C114.8 472.4 175.7 502.2 244 503.9zM417.2 291.5l11.5 32.9c27.4-25.4 46.8-64.8 46.8-108.2 0-43.4-19.4-82.8-46.8-108.2l-11.5 32.9c24.8 15.4 44.5 38.3 57.1 65.4H244v1.1h173.2c3.4 37.6 1.4 73.5-5.7 108.2H244v1.1h173.2z"
                    ></path>
                  </svg>
                )}
                Sign in with Google
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
