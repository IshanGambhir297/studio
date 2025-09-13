'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFormState, useFormStatus } from 'react-dom';
import { updateUserProfileAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  dob: z.date({
    required_error: 'A date of birth is required.',
  }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
      Save Changes
    </Button>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.displayName || '',
      phone: '',
    },
  });

  const [state, formAction] = useFormState(updateUserProfileAction, null);

  useEffect(() => {
    if (user) {
      // Set display name from Auth
      if (user.displayName) {
        form.setValue('fullName', user.displayName);
      }

      // Fetch user data from Firestore
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.dob) {
                try {
                    const dobDate = new Date(userData.dob);
                    if (!isNaN(dobDate.getTime())) {
                    form.setValue('dob', dobDate);
                    }
                } catch (e) {
                    console.error("Error parsing date from firestore", e)
                }
            }
            if(userData.phone) {
                form.setValue('phone', userData.phone);
            }
        }
      };
      fetchUserData();
    }
  }, [user, form]);


  useEffect(() => {
    if (state?.success) {
      toast({
        title: 'Success',
        description: state.success,
      });
      router.push('/chat');
    }
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state, router, toast]);

  const onAction = (formData: FormData) => {
    const values = form.getValues();
    formData.set('fullName', values.fullName);
    if(values.dob) {
      formData.set('dob', values.dob.toISOString());
    }
    if(values.phone) {
        formData.set('phone', values.phone);
    }
    formAction(formData);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md backdrop-blur-sm">
        <Form {...form}>
          <form action={onAction}>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormDescription>
                        Your phone number will not be shared.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <SubmitButton />
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
