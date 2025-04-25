'use client';

import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  SidebarInset, // Import SidebarInset
} from '@/components/ui/sidebar';
import {useEffect, useState} from 'react';

const PlaceholderBoard = () => (
  <Image
    src="https://picsum.photos/400/300"
    alt="Placeholder Xiangqi Board"
    width={400}
    height={300}
    className="rounded-md shadow-md"
  />
);

const TutorialCard = ({title, description}: { title: string, description: string }) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore
        magna aliqua.
      </p>
      <Button>Learn More</Button>
    </CardContent>
  </Card>
);

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Load the sidebar state from localStorage when the component mounts
    const storedState = localStorage.getItem('sidebarState');
    if (storedState) {
      setIsSidebarOpen(JSON.parse(storedState));
    }
  }, []);

  useEffect(() => {
    // Save the sidebar state to localStorage whenever it changes
    localStorage.setItem('sidebarState', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen antialiased text-foreground">
        <Sidebar
          width="w-80"
          side="left"
          variant="inset"
          collapsible="icon"
        >
          <SidebarHeader>
            <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Xiangqi Master
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                Game Options
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    New Game
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    Load Game
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarSeparator/>
            <SidebarGroup>
              <SidebarGroupLabel>
                Learn
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    Tutorials
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    Pro Tips
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarTrigger/>
            <p className="text-xs text-muted-foreground">
              Powered by Firebase Studio
            </p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="p-4">
          <main className="container mx-auto mt-8 flex flex-col gap-4">
            <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
              Welcome to Xiangqi Master
            </h1>
            <p className="text-muted-foreground">Sharpen your skills in the ancient game of Chinese Chess.</p>

            <PlaceholderBoard/>

            <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <TutorialCard
                title="Basic Rules"
                description="Learn the fundamental rules of Xiangqi, including piece movements and board setup."
              />
              <TutorialCard
                title="Opening Strategies"
                description="Discover effective opening strategies to gain an early advantage."
              />
              <TutorialCard
                title="Advanced Tactics"
                description="Explore advanced tactics and strategies to outmaneuver your opponents."
              />
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
