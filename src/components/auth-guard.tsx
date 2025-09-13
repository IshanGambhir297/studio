'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

const publicPaths = ['/'];
const protectedPaths = ['/chat'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublic = publicPaths.includes(pathname);
  const isProtected = protectedPaths.includes(pathname);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (loading) {
      // While loading, don't do any redirects.
      // The loading screen from the provider or this guard will be shown.
      return;
    }

    // If we have a user
    if (user) {
      // and they are on the login page, redirect them to chat.
      if (isLoginPage) {
        router.replace('/chat');
      }
    } else { // If we don't have a user
      // and they are trying to access a protected page, redirect to login.
      if (isProtected) {
        router.replace('/login');
      }
    }
  }, [user, loading, router, pathname, isPublic, isProtected, isLoginPage]);
  
  // Show a loading spinner while auth state is being determined.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Prevent rendering of pages during redirection to avoid content flashing.
  if (!user && isProtected) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user && isLoginPage) {
     return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}
