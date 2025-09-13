'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

const protectedPaths = ['/chat', '/profile'];
const publicPaths = ['/login', '/'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    const pathIsProtected = protectedPaths.some(p => pathname.startsWith(p));
    const pathIsPublic = publicPaths.includes(pathname);

    if (!user && pathIsProtected) {
      // If not logged in and trying to access a protected page, redirect to login
      router.replace('/login');
    } else if (user && (pathname === '/login')) {
      // If logged in and on the login page, redirect to chat
      router.replace('/chat');
    }
  }, [user, loading, router, pathname]);
  
  // Show a loading spinner while auth state is being determined or during redirects.
  if (loading || (!user && protectedPaths.some(p => pathname.startsWith(p))) || (user && pathname === '/login')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}
