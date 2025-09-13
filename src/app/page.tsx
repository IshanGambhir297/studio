
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

// This page now acts as a router.
// It will redirect to /chat.
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat');
  }, [router]);

  // Show a loading spinner while we redirect
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
