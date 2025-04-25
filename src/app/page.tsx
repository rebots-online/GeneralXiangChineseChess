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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference for dark mode
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial state based on stored preference or system preference
    const initialDarkMode = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);
    setIsDarkMode(initialDarkMode);

    // Apply dark mode class to document
    if (initialDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    // Apply or remove dark mode class
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handlePieceClick = (row: number, col: number) => {
    alert(`Clicked on piece at row ${row}, col ${col}`);
  };

  const renderPiece = (piece: string, row: number, col: number) => {
    if (piece === '-') {
      return null;
    }

    const isRedPiece = row < 5;
    const pieceColor = isRedPiece ? 'hsl(5, 100%, 27.3%)' : 'hsl(197, 37%, 24%)'; // Deep Red and Dark Blue

    const getChipStyle = () => {
      const baseStyle = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2em',
        textShadow: '1px 1px 2px black',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'absolute', // Absolute positioning
        top: '0',            // Position at the intersection
        left: '0',           // Position at the intersection
        transform: 'translate(-50%, -50%)', // Offset to center on the intersection
        border: '2px solid',
        borderColor: pieceColor,
        backgroundColor: 'white', // Always white
        color: pieceColor, // Character color
        zIndex: 10, // Ensure pieces appear above the board lines
      };
      return baseStyle;
    };

    const getTextStyle = () => {
      return {
        position: 'relative',
        zIndex: 1,
        WebkitTextStroke: `1px ${pieceColor}`,
        color: pieceColor,
        fontFamily: 'serif',
      };
    };

    return (
      <div
        key={`${row}-${col}`}
        style={getChipStyle()}
        onClick={() => handlePieceClick(row, col)}
      >
        <span style={getTextStyle()}>{piece}</span>
      </div>
    );
  };

  const getCellStyle = (rowIndex: number, colIndex: number) => {
    // Base cell style - now represents an intersection point rather than a square
    let cellStyle = {
      width: '50px',
      height: '50px',
      position: 'relative', // Relative positioning for the cell
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    };

    // Line color based on dark mode
    const lineColor = isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'hsl(var(--border))';

    // Add horizontal lines
    if (rowIndex < 9) {
      cellStyle = {
        ...cellStyle,
        borderBottom: `1px solid ${lineColor}`,
      };
    }

    // Add vertical lines
    if (colIndex < 8) {
      cellStyle = {
        ...cellStyle,
        borderRight: `1px solid ${lineColor}`,
      };
    }

    // River boundaries (rows 4 and 5)
    if (rowIndex === 4) {
      const riverColor = isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)'; // Jade Green
      cellStyle = {
        ...cellStyle,
        borderBottom: `2px dashed ${riverColor}`,
      };
    }

    // Palace boundaries
    if ((rowIndex >= 0 && rowIndex <= 2 && colIndex >= 3 && colIndex <= 5) ||
        (rowIndex >= 7 && rowIndex <= 9 && colIndex >= 3 && colIndex <= 5)) {
      // Palace color based on dark mode
      const palaceColor = isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'; // Deep Red

      // Add thicker borders for palace
      if (rowIndex === 0 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 0 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 2 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 2 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 7 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 7 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderTop: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 9 && colIndex === 3) {
        cellStyle = {
          ...cellStyle,
          borderLeft: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
      if (rowIndex === 9 && colIndex === 5) {
        cellStyle = {
          ...cellStyle,
          borderRight: `2px solid ${palaceColor}`,
          borderBottom: `2px solid ${palaceColor}`,
        };
      }
    }

    // Add position markers for soldiers and cannons
    const isPositionMarker = (
      // Soldier positions
      (rowIndex === 3 && (colIndex === 0 || colIndex === 2 || colIndex === 4 || colIndex === 6 || colIndex === 8)) ||
      (rowIndex === 6 && (colIndex === 0 || colIndex === 2 || colIndex === 4 || colIndex === 6 || colIndex === 8)) ||
      // Cannon positions
      (rowIndex === 2 && (colIndex === 1 || colIndex === 7)) ||
      (rowIndex === 7 && (colIndex === 1 || colIndex === 7))
    );

    if (isPositionMarker) {
      // Create position marker with small cross
      const markerSize = 10;
      const lineWidth = 1;

      cellStyle = {
        ...cellStyle,
        position: 'relative',
      };

      // We'll add the marker as a child element in the render function
      // since pseudo-elements can't be styled with React inline styles effectively
    }

    return cellStyle;
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={toggleTheme}>
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </Button>
      </div>
      <div className="relative p-4 rounded-md" style={{
        backgroundColor: isDarkMode ? 'hsl(36, 30%, 25%)' : 'hsl(36, 70%, 80%)'
      }}>
        <div className="grid gap-0 relative" style={{gridTemplateColumns: 'repeat(9, 50px)'}}>
          {/* Palace diagonal lines using a simpler approach with CSS */}
          <div className="absolute" style={{
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            {/* Top palace diagonals */}
            <div style={{
              position: 'absolute',
              top: '0',
              left: '150px',
              width: '150px',
              height: '150px',
              borderTop: `2px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              borderRight: '2px solid transparent',
              borderBottom: '2px solid transparent',
              borderLeft: '2px solid transparent',
              transform: 'rotate(45deg)',
              transformOrigin: 'top left'
            }}></div>

            <div style={{
              position: 'absolute',
              top: '0',
              right: '150px',
              width: '150px',
              height: '150px',
              borderTop: `2px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              borderRight: '2px solid transparent',
              borderBottom: '2px solid transparent',
              borderLeft: '2px solid transparent',
              transform: 'rotate(-45deg)',
              transformOrigin: 'top right'
            }}></div>

            {/* Bottom palace diagonals */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '150px',
              width: '150px',
              height: '150px',
              borderBottom: `2px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              borderRight: '2px solid transparent',
              borderTop: '2px solid transparent',
              borderLeft: '2px solid transparent',
              transform: 'rotate(-45deg)',
              transformOrigin: 'bottom left'
            }}></div>

            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '150px',
              width: '150px',
              height: '150px',
              borderBottom: `2px solid ${isDarkMode ? 'hsl(5, 100%, 50%)' : 'hsl(5, 100%, 27.3%)'}`,
              borderRight: '2px solid transparent',
              borderTop: '2px solid transparent',
              borderLeft: '2px solid transparent',
              transform: 'rotate(45deg)',
              transformOrigin: 'bottom right'
            }}></div>
          </div>

          {/* River text */}
          <div className="absolute flex justify-between items-center" style={{
            top: '225px',
            left: '0',
            width: '450px',
            zIndex: 1,
            padding: '0 20px'
          }}>
            <span className="text-lg font-bold" style={{
              color: isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)',
              textShadow: isDarkMode ? '0 0 3px rgba(0, 0, 0, 0.5)' : 'none'
            }}>楚河</span>
            <span className="text-lg font-bold" style={{
              color: isDarkMode ? 'hsl(146, 100%, 50%)' : 'hsl(146, 100%, 32.7%)',
              textShadow: isDarkMode ? '0 0 3px rgba(0, 0, 0, 0.5)' : 'none'
            }}>漢界</span>
          </div>

          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className="w-[50px] h-[50px] flex items-center justify-center"
                style={getCellStyle(rowIndex, colIndex)}
              >
                {renderPiece(piece, rowIndex, colIndex)}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};



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
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen antialiased text-foreground">
        <Sidebar
          width="w-80"
          side="left"
          variant="inset"
          collapsible="offcanvas"
        >
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                General Xiang
              </h2>
              <SidebarTrigger className="md:hidden" />
            </div>
            <p className="text-sm text-muted-foreground">Learn Chinese Chess & Play Globally</p>
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
              Powered by Jami
            </p>
          </SidebarFooter>
        </Sidebar>
        <main className="container mx-auto mt-8 flex flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">
                Welcome to General Xiang
              </h1>
              <p className="text-xl text-muted-foreground">Learn Chinese Chess & Play Opponents Across the Globe</p>
            </div>
            <SidebarTrigger className="hidden md:flex" />
          </div>

          <InteractiveBoard/>

          <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
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
