'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import TutorialCard from '@/components/TutorialCard';

const TutorialsDialog = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({ setOpen }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Tutorials</DialogTitle>
          <DialogDescription>
            Learn the fundamentals, opening strategies, and advanced tactics through interactive walkthroughs.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 sm:mt-6 md:mt-8 grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <TutorialCard
            title="Basic Rules"
            description="Learn the fundamental rules of Xiangqi, including piece movements and board setup."
            tutorialType="basic"
          />
          <TutorialCard
            title="Opening Strategies"
            description="Discover effective opening strategies to gain an early advantage."
            tutorialType="opening"
          />
          <TutorialCard
            title="Advanced Tactics"
            description="Explore advanced tactics and strategies to outmaneuver your opponents."
            tutorialType="advanced"
          />
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

TutorialsDialog.displayName = 'TutorialsDialog';

export default TutorialsDialog;