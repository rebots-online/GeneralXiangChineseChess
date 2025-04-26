'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const HelpDialog = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);

  // Expose the setOpen method to parent components
  useImperativeHandle(ref, () => ({
    setOpen,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Learn how to play and get answers to common questions
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basics">Game Basics</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          <TabsContent value="basics" className="p-4">
            <h3 className="text-lg font-semibold mb-2">Getting Started</h3>
            <p className="mb-4">
              Welcome to General Xiang! Here's how to get started with Chinese Chess:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>
                <strong>Learn the Basics:</strong> Start with our interactive tutorials to understand the board, pieces, and basic movements.
              </li>
              <li>
                <strong>Practice with AI:</strong> Play against our AI opponent to practice your skills at various difficulty levels.
              </li>
              <li>
                <strong>Challenge Friends:</strong> When you're ready, host a game and invite friends to play with you.
              </li>
            </ol>
            <p>
              Use the tutorial cards on the main page to learn the fundamental rules, opening strategies, and advanced tactics.
            </p>
          </TabsContent>
          <TabsContent value="rules" className="p-4">
            <h3 className="text-lg font-semibold mb-2">Game Rules</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="board">
                <AccordionTrigger>The Board</AccordionTrigger>
                <AccordionContent>
                  <p>The Xiangqi board consists of 9 horizontal lines and 10 vertical lines, forming a grid of 90 points. Pieces are placed on the intersections, not in the squares.</p>
                  <p className="mt-2">The board is divided by a river in the middle, and each side has a palace (the area with diagonal lines).</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pieces">
                <AccordionTrigger>The Pieces</AccordionTrigger>
                <AccordionContent>
                  <p>Each player starts with 16 pieces:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li><strong>1 General (将/帅):</strong> Moves one point horizontally or vertically within the palace.</li>
                    <li><strong>2 Advisors (士/仕):</strong> Move one point diagonally within the palace.</li>
                    <li><strong>2 Elephants (象/相):</strong> Move exactly two points diagonally and cannot cross the river.</li>
                    <li><strong>2 Horses (马/馬):</strong> Move one point horizontally or vertically, then one point diagonally outward.</li>
                    <li><strong>2 Chariots (车/車):</strong> Move any distance horizontally or vertically.</li>
                    <li><strong>2 Cannons (炮/砲):</strong> Move like chariots but must jump over exactly one piece to capture.</li>
                    <li><strong>5 Soldiers (卒/兵):</strong> Move one point forward before crossing the river; after crossing, they can move horizontally as well.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="objective">
                <AccordionTrigger>Game Objective</AccordionTrigger>
                <AccordionContent>
                  <p>The objective is to checkmate the opponent's general. A general is in check when it is under threat of capture on the opponent's next move.</p>
                  <p className="mt-2">A player wins by:</p>
                  <ul className="list-disc pl-5 mt-2">
                    <li>Checkmating the opponent's general</li>
                    <li>When the opponent resigns</li>
                    <li>When the opponent's time runs out (in timed games)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="special">
                <AccordionTrigger>Special Rules</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5">
                    <li><strong>Flying General:</strong> The two generals may not face each other directly along an open file with no pieces in between.</li>
                    <li><strong>Perpetual Check:</strong> Repeatedly putting the opponent's general in check with the same piece and move is not allowed.</li>
                    <li><strong>Stalemate:</strong> If a player has no legal moves, the game is a draw.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          <TabsContent value="faq" className="p-4">
            <h3 className="text-lg font-semibold mb-2">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="multiplayer">
                <AccordionTrigger>How do I play with friends?</AccordionTrigger>
                <AccordionContent>
                  <p>To play with friends:</p>
                  <ol className="list-decimal pl-5 mt-2">
                    <li>Click "Host Game" in the sidebar</li>
                    <li>Share the generated game code with your friend</li>
                    <li>Your friend should click "Join Game" and enter the code</li>
                    <li>Once connected, the game will start automatically</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="save">
                <AccordionTrigger>Can I save my games?</AccordionTrigger>
                <AccordionContent>
                  <p>Yes, you can save your games by clicking the "Save Game" button in the sidebar. This will save the current game state, which you can load later using the "Load Game" option.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="difficulty">
                <AccordionTrigger>How do I change the AI difficulty?</AccordionTrigger>
                <AccordionContent>
                  <p>When starting a new game against the AI, you'll be presented with difficulty options ranging from Beginner to Master. You can also adjust the difficulty during a game through the settings menu.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="platform">
                <AccordionTrigger>How does the decentralized platform work?</AccordionTrigger>
                <AccordionContent>
                  <p>Our decentralized platform uses peer-to-peer technology to connect players directly without relying on central servers. This provides enhanced privacy, improved reliability, and reduced latency.</p>
                  <p className="mt-2">Your game data is stored locally on your device, and when playing with others, the game state is shared directly between players.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

HelpDialog.displayName = 'HelpDialog';

export default HelpDialog;
