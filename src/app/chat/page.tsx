'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { sendMessageAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bot, LoaderCircle, LogOut, SendHorizonal, User } from 'lucide-react';
import { Icons } from '@/components/icons';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  sentiment?: string;
};

const sentimentColors: { [key: string]: string } = {
  happy: 'bg-green-200 text-green-800',
  sad: 'bg-blue-200 text-blue-800',
  anxious: 'bg-yellow-200 text-yellow-800',
  stressed: 'bg-orange-200 text-orange-800',
  neutral: 'bg-gray-200 text-gray-800',
  severe_distress: 'bg-red-200 text-red-800',
};

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [referralInfo, setReferralInfo] = useState({ open: false, message: '' });
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: Message[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newMessages.push({
            id: doc.id + '-user',
            role: 'user',
            content: data.userMessage,
            timestamp: data.timestamp,
            sentiment: data.sentiment,
          });
          if (data.aiMessage) {
            newMessages.push({
              id: doc.id + '-ai',
              role: 'assistant',
              content: data.aiMessage,
              timestamp: data.timestamp,
            });
          }
        });
        setMessages(newMessages);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isPending]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user || isPending) return;
    
    const userInput = input;
    setInput('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('message', userInput);
      formData.append('userId', user.uid);

      const result = await sendMessageAction(formData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      }

      if (result.referralMessage) {
        setReferralInfo({ open: true, message: result.referralMessage });
      }
    });
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-4">
      <Card className="flex h-full w-full max-w-4xl flex-col shadow-2xl backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Icons.Logo className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-xl font-bold tracking-tight">MentalCare</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign Out">
            <LogOut className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'mb-4 flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent">
                        <Bot className="h-5 w-5 text-accent-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                   <div
                    className={cn(
                      'flex flex-col gap-1',
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-max rounded-2xl px-4 py-2',
                        message.role === 'user'
                          ? 'rounded-br-none bg-primary text-primary-foreground'
                          : 'rounded-bl-none bg-muted'
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === 'user' && message.sentiment && (
                      <Badge
                        variant="outline"
                        className={cn('capitalize', sentimentColors[message.sentiment] || 'bg-gray-200 text-gray-800')}
                      >
                        {message.sentiment.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? 'User'} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="mb-4 flex items-start justify-start gap-3">
                   <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent">
                        <Bot className="h-5 w-5 text-accent-foreground" />
                      </AvatarFallback>
                    </Avatar>
                  <div className="max-w-md rounded-2xl rounded-bl-none bg-muted px-4 py-2">
                    <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <form
            onSubmit={handleSubmit}
            className="flex w-full items-center gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How are you feeling today?"
              className="min-h-0 flex-1 resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
              disabled={isPending}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isPending} aria-label="Send Message">
              <SendHorizonal className="h-5 w-5" />
            </Button>
          </form>
        </CardFooter>
      </Card>
      <AlertDialog open={referralInfo.open} onOpenChange={(open) => setReferralInfo({...referralInfo, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Immediate Support Recommended</AlertDialogTitle>
            <AlertDialogDescription>
              {referralInfo.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setReferralInfo({ open: false, message: '' })}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
