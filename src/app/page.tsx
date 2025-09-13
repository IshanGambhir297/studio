
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Icons } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Icons.Logo className="mr-2 h-6 w-6" />
            <span className="font-bold">MentalCare</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center">
              <Button asChild>
                <Link href="/chat">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container relative flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Your Personal AI Mental Health Assistant
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              MentalCare is here to listen. Engage in a conversation with an empathetic AI that understands your feelings and offers supportive words when you need them most.
            </p>
            <div className="mt-10">
              <Button size="lg" asChild>
                <Link href="/chat">
                  Start Your First Conversation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
