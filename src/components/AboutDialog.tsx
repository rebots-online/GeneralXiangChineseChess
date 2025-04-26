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

const AboutDialog = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);

  // Expose the setOpen method to parent components
  useImperativeHandle(ref, () => ({
    setOpen,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>About General Xiang</DialogTitle>
          <DialogDescription>
            Learn about General Xiang Chinese Chess and our platform
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="platform">Our Platform</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
          </TabsList>
          <TabsContent value="about" className="p-4">
            <h3 className="text-lg font-semibold mb-2">General Xiang: Chinese Chess</h3>
            <p className="mb-4">
              General Xiang is a modern implementation of the traditional Chinese Chess (Xiangqi) game.
              Our goal is to make this ancient game accessible to players worldwide while preserving its
              rich strategic depth and cultural heritage.
            </p>
            <p>
              Xiangqi (象棋) has been played in China for over 2,000 years and remains one of the most
              popular board games in Asia. With General Xiang, you can learn the game through interactive
              tutorials, play against AI opponents, or challenge friends across the globe.
            </p>
          </TabsContent>
          <TabsContent value="platform" className="p-4">
            <h3 className="text-lg font-semibold mb-2">Our Decentralized Platform</h3>
            <p className="mb-4">
              General Xiang is built on a revolutionary decentralized platform that offers several advantages:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Enhanced Privacy:</strong> Your game data isn't stored on central servers, giving you greater control over your information.
              </li>
              <li>
                <strong>Improved Reliability:</strong> The decentralized architecture means no single point of failure, resulting in a more robust gaming experience.
              </li>
              <li>
                <strong>Direct Connections:</strong> Play directly with opponents without intermediary servers, reducing latency for a smoother experience.
              </li>
            </ul>
            <p>
              Our platform is designed to provide a seamless gaming experience while respecting your privacy and ensuring reliable performance.
            </p>
          </TabsContent>
          <TabsContent value="credits" className="p-4">
            <h3 className="text-lg font-semibold mb-2">Credits & Acknowledgments</h3>
            <p className="mb-4">
              General Xiang is developed by a team passionate about both traditional games and modern technology.
            </p>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Development Team</h4>
                <p>Robin Cheung, MBA and the RobinsAI.World team</p>
              </div>
              <div>
                <h4 className="font-medium">Technologies</h4>
                <p>Built with Next.js, React, and a decentralized communication framework</p>
              </div>
              <div>
                <h4 className="font-medium">Artwork & Design</h4>
                <p>Original designs inspired by traditional Xiangqi pieces and boards</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              © 2025 Robin L. M. Cheung, MBA. All rights reserved.
            </p>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

AboutDialog.displayName = 'AboutDialog';

export default AboutDialog;
