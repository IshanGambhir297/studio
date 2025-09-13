import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '@/components/auth-guard';

export const metadata: Metadata = {
  title: {
    default: 'MentalCare - Your AI Mental Health Assistant',
    template: '%s | MentalCare',
  },
  description:
    'An AI-powered chat application to support your mental wellness journey.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <AuthGuard>{children}</AuthGuard>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
