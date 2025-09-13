'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';

const protectedPaths = ['/chat', '/profile'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const pathIsProtected = protectedPaths.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (loading) {
      return; // Do nothing while loading
    }

    if (!user && pathIsProtected) {
      // If not logged in and trying to access a protected page, redirect to login
      router.replace('/login');
    }
  }, [user, loading, router, pathname, pathIsProtected]);
  
  // Show a loading spinner while auth state is being determined
  // or if we are waiting for the redirect to happen.
  if (loading || (!user && pathIsProtected)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // if the user is authenticated or the path is not protected, render the children
  return <>{children}</>;
}
