'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWalkthrough } from '@/contexts/WalkthroughContext';

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
    let steps = [];

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
          description: 'Developing horses early provides mobility and supports your attack and defense.',
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
          title: 'Endgame Techniques',
          description: 'In the endgame, understanding piece values and coordination becomes even more important.',
          targetSelector: '.board-container',
          position: 'top'
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
