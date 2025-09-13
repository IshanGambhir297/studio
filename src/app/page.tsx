
'use client';

import { useEffect, useRef, useState, useTransition, useMemo } from 'react';
import { app, db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { sendMessageAction, deleteHistoryAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Bot,
  LoaderCircle,
  SendHorizonal,
  User,
  PanelLeft,
  Search,
  Trash2,
  LogOut,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Timestamp;
  sentiment?: string;
};

const sentimentColors: { [key: string]: string } = {
  happy: 'bg-green-200 text-green-800 border-green-300',
  sad: 'bg-blue-200 text-blue-800 border-blue-300',
  anxious: 'bg-yellow-200 text-yellow-800 border-yellow-300',
  stressed: 'bg-orange-200 text-orange-800 border-orange-300',
  neutral: 'bg-gray-200 text-gray-800 border-gray-300',
  severe_distress: 'bg-red-200 text-red-800 border-red-300',
};

function ChatPage() {
  const { toast } = useToast();
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [referralInfo, setReferralInfo] = useState({ open: false, message: '' });
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isSheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!app.options.apiKey) {
      toast({
        variant: 'destructive',
        title: 'Firebase Configuration Error',
        description: 'Firebase is not configured. Please check your environment variables.',
      });
      return;
    }
    
    if (!user) {
      setMessages([]);
      return;
    }

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
    }, (error) => {
      console.error("Error fetching conversations: ", error);
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not connect to the database. Please check the console for details.',
      });
    });
    return () => unsubscribe();
  }, [toast, user]);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isPending]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isPending || !user) return;

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

  const handleDeleteHistory = async () => {
    if (!user) return;
    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.append('userId', user.uid);
      const result = await deleteHistoryAction(formData);
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Your conversation history has been deleted.',
        });
        setSheetOpen(false);
      }
    });
  };

  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((message) =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messages, searchQuery]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-transparent p-4">
      <Card className="flex h-full w-full max-w-4xl flex-col shadow-2xl backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <PanelLeft className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search history..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!user}
                      />
                    </div>
                    <Separator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full" disabled={isDeleting || !user}>
                          {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                          Delete History
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your entire conversation history. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteHistory}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
              </SheetContent>
            </Sheet>
            <Icons.Logo className="h-8 w-8 text-primary" />
            <h1 className="font-headline text-xl font-bold tracking-tight">
              Mindful AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <LoaderCircle className="h-6 w-6 animate-spin" />
            ) : user ? (
              <>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Sign Out</span>
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0) || <User />}
                  </AvatarFallback>
                </Avatar>
              </>
            ) : (
              <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            )}
          </div>
        </CardHeader>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-80 flex-col border-r bg-background/50 p-4 md:flex">
             <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!user}
                />
              </div>
              <Separator className="mb-4" />
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isDeleting || !user}>
                    {isDeleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
                    Delete History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your entire conversation history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHistory}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
          </div>
          <div className="flex flex-1 flex-col">
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full" viewportRef={viewportRef}>
                <div className="p-6">
                {!user && !loading && (
                    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center">
                      <h2 className="text-2xl font-semibold">Welcome to Mindful AI</h2>
                      <p className="mt-2 text-muted-foreground">Please sign in to begin your conversation.</p>
                      <Button onClick={signInWithGoogle} className="mt-6">
                        Sign in with Google
                      </Button>
                    </div>
                  )}
                  {user && filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'mb-4 flex items-start gap-3',
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
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
                          'flex max-w-md flex-col gap-2 rounded-2xl px-4 py-2',
                          message.role === 'user'
                            ? 'rounded-br-none bg-primary text-primary-foreground'
                            : 'rounded-bl-none bg-muted'
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.role === 'user' && message.sentiment && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'w-min self-start border capitalize',
                              sentimentColors[message.sentiment] ||
                                'border-gray-300 bg-gray-200 text-gray-800'
                            )}
                          >
                            {message.sentiment.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                           <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
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
                  {user && filteredMessages.length === 0 && !isPending && (
                     <div className="text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No messages found for your search.' : 'No messages yet. Start the conversation!'}
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
                  placeholder={user ? "How are you feeling today?" : "Please sign in to send a message."}
                  className="min-h-0 flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  disabled={isPending || !user}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isPending || !user}
                  aria-label="Send Message"
                >
                  <SendHorizonal className="h-5 w-5" />
                </Button>
              </form>
            </CardFooter>
          </div>
        </div>
      </Card>
      <AlertDialog
        open={referralInfo.open}
        onOpenChange={(open) => setReferralInfo({ ...referralInfo, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Immediate Support Recommended</AlertDialogTitle>
            <AlertDialogDescription>
              {referralInfo.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setReferralInfo({ open: false, message: '' })}
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ChatPage;
