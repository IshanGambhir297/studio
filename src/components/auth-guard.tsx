'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

const publicPaths = ['/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = publicPaths.includes(pathname);

  useEffect(() => {
    if (loading) return;

    // If user is logged in and tries to access a public-only path (like landing), redirect to chat
    if (user && isPublicPath) {
      router.replace('/chat');
      return;
    }
    
    // If user is logged in and tries to access login, redirect to chat
    if (user && pathname === '/login') {
      router.replace('/chat');
      return;
    }

    // If user is not logged in and tries to access a protected path, redirect to login
    if (!user && !isPublicPath && pathname !== '/login') {
      router.replace('/login');
      return;
    }


  }, [user, loading, router, pathname, isPublicPath]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Prevent flashing content while redirecting
  if ((!user && !isPublicPath && pathname !== '/login') || (user && pathname === '/login')) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return <>{children}</>;
}
