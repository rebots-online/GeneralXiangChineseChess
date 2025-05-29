
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalkthrough, WalkthroughStep } from '@/contexts/WalkthroughContext';

export interface TutorialCardProps {
  title: string;
  description: string;
  tutorialType: 'basic' | 'opening' | 'advanced';
}

const TutorialCard: React.FC<TutorialCardProps> = ({ title, description, tutorialType }) => {
  const { startWalkthrough } = useWalkthrough();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartWalkthrough = () => {
    setIsLoading(true);

    // Define walkthrough steps based on tutorial type
    let steps: WalkthroughStep[] = [];

    if (tutorialType === 'basic') {
      steps = [
        {
          id: 'board-intro',
          title: 'The Xiangqi Board',
          description: 'This is the Chinese Chess board. It consists of 9 horizontal lines and 10 vertical lines, forming a grid of 90 points where pieces are placed on the intersections.',
          targetSelector: '.board-container',
          position: 'bottom'
        },
        {
          id: 'river',
          title: 'The River',
          description: 'The middle of the board contains a river that divides the two sides. Some pieces have special movement rules when crossing the river.',
          targetSelector: '.absolute.flex.justify-between.items-center',
          position: 'right'
        },
        {
          id: 'palace',
          title: 'The Palace',
          description: 'Each side has a palace (the area with diagonal lines). The general and advisors must stay within this area.',
          targetSelector: '.absolute svg',
          position: 'right'
        },
        {
          id: 'pieces',
          title: 'The Pieces',
          description: 'Each player starts with 16 pieces: 1 general, 2 advisors, 2 elephants, 2 horses, 2 chariots, 2 cannons, and 5 soldiers. Pieces are placed on the intersections, not in the squares.',
          targetSelector: '.board-container',
          position: 'top',
          priority: 'high' // Mark this step as high priority for visibility
        },
        {
          id: 'board-setup',
          title: 'Board Setup',
          description: 'Pieces are set up symmetrically. Chariots, Horses, and Elephants are in the back, with Cannons on the row in front of them, and Soldiers along the riverbank. The General is at the center of the palace, flanked by Advisors.',
          targetSelector: '.board-container', // Suggestion: Could have a selector for initial setup view if possible
          position: 'bottom'
        },
        // Piece Movements
        {
          id: 'general-movement',
          title: 'General (帥/將)',
          description: 'The General moves one point horizontally or vertically. It cannot leave the palace. Generals cannot face each other directly on the same file without intervening pieces (Flying General rule).',
          targetSelector: '.board-container', // Suggestion: Highlight a General piece using a data-attribute e.g., [data-piece-type="general"]
          position: 'right'
        },
        {
          id: 'advisor-movement',
          title: 'Advisor (仕/士)',
          description: 'The Advisor moves one point diagonally and must stay within the palace.',
          targetSelector: '.board-container', // Suggestion: Highlight an Advisor piece
          position: 'right'
        },
        {
          id: 'elephant-movement',
          title: 'Elephant (相/象)',
          description: 'The Elephant moves two points diagonally (like a 2x2 square). It cannot jump over intervening pieces and cannot cross the river.',
          targetSelector: '.board-container', // Suggestion: Highlight an Elephant piece
          position: 'right'
        },
        {
          id: 'horse-movement',
          title: 'Horse (馬/傌)',
          description: 'The Horse moves one point horizontally or vertically, then one point diagonally outward. It can be blocked if a piece is adjacent to it, hindering its first step.',
          targetSelector: '.board-container', // Suggestion: Highlight a Horse piece
          position: 'right'
        },
        {
          id: 'chariot-movement',
          title: 'Chariot (俥/車)',
          description: 'The Chariot moves any number of points horizontally or vertically, as long as no pieces are in its path.',
          targetSelector: '.board-container', // Suggestion: Highlight a Chariot piece
          position: 'right'
        },
        {
          id: 'cannon-movement',
          title: 'Cannon (炮/砲)',
          description: 'The Cannon moves like a Chariot. To capture, it must jump over exactly one piece (friendly or enemy) along its path of attack. The jumped piece is called a "cannon platform".',
          targetSelector: '.board-container', // Suggestion: Highlight a Cannon piece
          position: 'right'
        },
        {
          id: 'soldier-movement',
          title: 'Soldier (兵/卒)',
          description: 'Before crossing the river, Soldiers move one point forward. After crossing the river, they can move one point forward or one point horizontally. Soldiers cannot move backward.',
          targetSelector: '.board-container', // Suggestion: Highlight a Soldier piece
          position: 'right'
        },
        // Winning Conditions
        {
          id: 'check',
          title: 'Check (將軍)',
          description: 'If a player\'s move threatens to capture the opponent\'s General on the next turn, the General is in "check". The threatened player must make a move to get out of check.',
          targetSelector: '.board-container', // Suggestion: Highlight the current turn indicator or a General in check
          position: 'top'
        },
        {
          id: 'checkmate',
          title: 'Checkmate (將死)',
          description: 'If the General is in check and there is no legal move to get out of check, it is "checkmate", and the player delivering the checkmate wins the game.',
          targetSelector: '.board-container',
          position: 'top'
        },
        {
          id: 'stalemate',
          title: 'Stalemate (困斃)',
          description: 'If a player has no legal moves, but their General is NOT in check, the game is a "stalemate". In Xiangqi, the player who is stalemated loses.',
          targetSelector: '.board-container',
          position: 'top'
        },
        {
          id: 'repetition-rules',
          title: 'Repetition Rules',
          description: 'Rules exist to prevent perpetual check or perpetual chase of unprotected pieces. Generally, if a position is repeated too many times due to such actions, the game might be ruled a draw or a loss for the aggressor depending on the specific ruleset.',
          targetSelector: '.board-container',
          position: 'bottom'
        }
      ];
    } else if (tutorialType === 'opening') {
      steps = [
        {
          id: 'opening-intro',
          title: 'Opening Strategies',
          description: 'The opening phase is crucial in Xiangqi. Good openings establish piece coordination and control of key areas.',
          targetSelector: '.board-container',
          position: 'bottom'
        },
        {
          id: 'central-cannon',
          title: 'Central Cannon Opening',
          description: 'A popular opening is moving the cannon to the central position, which controls the center and threatens the opponent.',
          targetSelector: '.board-container',
          position: 'right'
        },
        {
          id: 'horse-development',
          title: 'Horse Development',
          description: 'Developing horses early provides mobility and supports your attack and defense. Common horse openings include the "Corner Horse" or "Edge Horse".',
          targetSelector: '.board-container', // Suggestion: Highlight a horse that has just moved in an opening
          position: 'right'
        },
        {
          id: 'elephant-opening',
          title: 'Elephant Opening (Solid Defense)',
          description: 'Moving an Elephant to connect with its partner (e.g., E3+5 or E7+5) strengthens the central defense, protecting against early central cannon attacks. However, it can block horse development.',
          targetSelector: '.board-container', // Suggestion: Highlight an elephant in an opening position
          position: 'right'
        },
        {
          id: 'delayed-cannon-opening',
          title: 'Delayed Cannon / Half-Way Cannon',
          description: 'Instead of immediately moving the cannon to the center, it\'s moved to a position like C2=3 or C8=7 (half-way). This offers flexibility, allowing for various tactical developments based on opponent moves.',
          targetSelector: '.board-container', // Suggestion: Highlight a cannon in a delayed position
          position: 'right'
        },
        {
          id: 'same-direction-cannons',
          title: 'Same-Direction Cannons',
          description: 'Both cannons are placed on the same file, often used to control that file or to prepare for complex attacks. This requires careful coordination.',
          targetSelector: '.board-container',
          position: 'right'
        }
      ];
    } else if (tutorialType === 'advanced') {
      steps = [
        {
          id: 'tactics-intro',
          title: 'Advanced Tactics',
          description: 'Advanced tactics involve combinations of moves that create multiple threats simultaneously.',
          targetSelector: '.board-container',
          position: 'bottom'
        },
        {
          id: 'piece-sacrifice',
          title: 'Piece Sacrifice',
          description: 'Sometimes sacrificing a piece can lead to a winning position by creating unstoppable threats.',
          targetSelector: '.board-container',
          position: 'right'
        },
        {
          id: 'endgame',
          title: 'Endgame Principles',
          description: 'In the endgame, focus on activating your General (if safe), pawn promotion, and precise calculation. King and pawn endgames are very common.',
          targetSelector: '.board-container',
          position: 'top'
        },
        {
          id: 'skewering',
          title: 'Skewering (Pinning along a file/rank)',
          description: 'A tactic where a long-range piece (Chariot or Cannon) attacks two enemy pieces along a file or rank. If the more valuable piece moves, the less valuable piece behind it is captured.',
          targetSelector: '.board-container', // Suggestion: Highlight a skewer situation
          position: 'right'
        },
        {
          id: 'forking',
          title: 'Forking (Simultaneous Attack)',
          description: 'A piece (often a Horse or Cannon) attacks two or more enemy pieces at the same time. The opponent may only be able to save one.',
          targetSelector: '.board-container', // Suggestion: Highlight a fork situation
          position: 'right'
        },
        {
          id: 'discovered-check',
          title: 'Discovered Check',
          description: 'Moving a piece reveals an attack on the enemy General from another piece. The moved piece can simultaneously create another threat.',
          targetSelector: '.board-container', // Suggestion: Highlight a discovered check situation
          position: 'right'
        },
        {
          id: 'controlling-key-points',
          title: 'Controlling Key Points/Files',
          description: 'Identify and occupy critical intersections or files that restrict opponent mobility or provide invasion routes for your pieces, especially Chariots.',
          targetSelector: '.board-container',
          position: 'bottom'
        }
      ];
    }

    // Start the walkthrough after a short delay
    setTimeout(() => {
      startWalkthrough(steps);
      setIsLoading(false);
    }, 500);
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm sm:text-base">
          Learn step-by-step with our interactive walkthrough that highlights each element as you progress.
        </p>
        <Button
          onClick={handleStartWalkthrough}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? 'Starting...' : 'Start Walkthrough'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TutorialCard;
