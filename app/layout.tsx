import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LMS - Learning Management System',
  description: 'Learn and grow with our courses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}