import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policies - General Xiang: Learn Chinese Chess & Play Opponents Across the Globe',
  description: 'Legal policies for General Xiang Chinese Chess application',
};

export default function PolicyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
