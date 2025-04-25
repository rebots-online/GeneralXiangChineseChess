'use client';

import {useEffect, useState} from 'react';
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
} from '@/components/ui/sidebar';

const pieceStyle = {
  fontSize: '2em',
  textAlign: 'center',
  lineHeight: '1.5em',
};

const initialBoardState = [
  ['車', '馬', '象', '士', '將', '士', '象', '馬', '車'],
  ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
  ['-', '炮', '-', '-', '-', '-', '-', '炮', '-'],
  ['卒', '-', '卒', '-', '卒', '-', '卒', '-', '卒'],
  ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
  ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
  ['兵', '-', '兵', '-', '兵', '-', '兵', '-', '兵'],
  ['-', '砲', '-', '-', '-', '-', '-', '砲', '-'],
  ['-', '-', '-', '-', '-', '-', '-', '-', '-'],
  ['俥', '傌', '相', '仕', '帥', '仕', '相', '傌', '俥'],
];

const InteractiveBoard = () => {
  const [board, setBoard] = useState(initialBoardState);

  const handlePieceClick = (row: number, col: number) => {
    alert(`Clicked on piece at row ${row}, col ${col}`);
  };

  const renderPiece = (piece: string, row: number, col: number) => {
    const isRedPiece = row < 5; // Red pieces are on the top half of the board
    const pieceColor = isRedPiece ? 'text-red-500' : 'text-blue-500';

    return (
      <span key={`${row}-${col}`} style={pieceStyle} className={`${pieceColor} piece`}>
        {piece}
      </span>
    );
  };

  return (
    <div className="grid gap-0" style={{gridTemplateColumns: 'repeat(9, 50px)'}}>
      {board.map((row, rowIndex) =>
        row.map((piece, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="w-[50px] h-[50px] flex items-center justify-center border"
            onClick={() => handlePieceClick(rowIndex, colIndex)}
          >
            {renderPiece(piece, rowIndex, colIndex)}
          </div>
        ))
      )}
      <style jsx>{`
        .piece {
          text-shadow: 1px 1px 2px black;
          position: relative;
        }

        .piece::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0.3;
          z-index: -1;
        }
      `}</style>
    </div>
  );
};

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
    const storedState = localStorage.getItem('sidebarState');
    if (storedState) {
      setIsSidebarOpen(JSON.parse(storedState));
    }
  }, []);

  useEffect(() => {
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
        <main className="container mx-auto mt-8 flex flex-col gap-4 p-4">
          <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
            Welcome to Xiangqi Master
          </h1>
          <p className="text-muted-foreground">Sharpen your skills in the ancient game of Chinese Chess.</p>

          <InteractiveBoard/>

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
      </div>
    </SidebarProvider>
  );
}
