
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
} from '@/app/actions';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid e-mail address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

type Action = 'signIn' | 'signUp';

export default function LoginPage() {
  const { toast } = useToast();
  const [action, setAction] = useState<Action>('signIn');
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('email', values.email);
      formData.append('password', values.password);

      const result =
        action === 'signIn'
          ? await signInWithEmail(formData)
          : await signUpWithEmail(formData);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: result.error,
        });
      }
    });
  };

  const handleGoogleSignIn = () => {
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Google Sign-In Error',
          description: result.error,
        });
      }
    });
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-sm shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Icons.Logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            {action === 'signIn'
              ? 'Sign in to your account to continue.'
              : 'Create an account to get started.'}
            <br />
            For demo, sign up with{' '}
            <span className="font-semibold">demo@example.com</span> /{' '}
            <span className="font-semibold">123456</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="name@example.com"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...field}
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : action === 'signIn' ? (
                  'Sign In'
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.Logo className="mr-2 h-4 w-4" />
            )}{' '}
            Google
          </Button>

          <div className="mt-4 text-center text-sm">
            {action === 'signIn' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setAction('signUp');
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  Sign Up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="p-0"
                  onClick={() => {
                    setAction('signIn');
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  Sign In
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
