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

const ProTipsDialog = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({ setOpen }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Pro Tips</DialogTitle>
          <DialogDescription>
            Sharpen your Xiangqi skills with these professional tips.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3 text-sm">
          <p><strong>Tip 1:</strong> Control the center of the board early in the game. This provides more mobility and influence for your pieces.</p>
          <p><strong>Tip 2:</strong> Develop your Chariots quickly. They are the most powerful pieces and crucial for both attack and defense.</p>
          <p><strong>Tip 3:</strong> Pay attention to your General's safety at all times. Avoid unnecessary risks and ensure it's well-protected.</p>
          <p><strong>Tip 4:</strong> Cannons need a platform to attack. Position them strategically behind another piece to utilize their unique capturing ability.</p>
          <p><strong>Tip 5:</strong> Don't underestimate the importance of pawn advancement, especially after crossing the river, as they gain forward movement capabilities.</p>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ProTipsDialog.displayName = 'ProTipsDialog';

export default ProTipsDialog;
