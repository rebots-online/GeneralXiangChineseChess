import React, { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProTipsDialog from './ProTipsDialog';

// Helper component to test the ref functionality
const TestParent = () => {
  const dialogRef = useRef<{ setOpen: (open: boolean) => void }>(null);

  return (
    <>
      <button onClick={() => dialogRef.current?.setOpen(true)}>Open Dialog</button>
      <ProTipsDialog ref={dialogRef} />
    </>
  );
};

describe('ProTipsDialog', () => {
  test('renders dialog with correct title, description, and tips when opened', () => {
    render(<TestParent />);
    const openButton = screen.getByText('Open Dialog');
    fireEvent.click(openButton);

    expect(screen.getByText('Pro Tips')).toBeInTheDocument();
    expect(screen.getByText('Sharpen your Xiangqi skills with these professional tips.')).toBeInTheDocument();
    
    // Check for a few example tips
    expect(screen.getByText(/Control the center of the board/)).toBeInTheDocument();
    expect(screen.getByText(/Develop your Chariots quickly/)).toBeInTheDocument();
    expect(screen.getByText(/Pay attention to your General's safety/)).toBeInTheDocument();
    expect(screen.getByText(/Cannons need a platform to attack/)).toBeInTheDocument();
    expect(screen.getByText(/Don't underestimate the importance of pawn advancement/)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  test('dialog can be opened and closed', () => {
    render(<TestParent />);
    const openButton = screen.getByText('Open Dialog');

    // Dialog should not be visible initially (though its content might be in the DOM if not using a portal or conditional rendering)
    // We'll check for a specific element that's only there when open, like the title.
    // A more robust way is to check for visibility if the dialog library supports it, or for the presence of a specific dialog role.
    expect(screen.queryByText('Pro Tips')).not.toBeVisible();


    fireEvent.click(openButton);
    expect(screen.getByText('Pro Tips')).toBeVisible();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);

    // Wait for the dialog to close and check visibility
    // Depending on how the dialog handles open/close (e.g., animations),
    // we might need waitFor or findBy. For this simple dialog, queryBy should work.
    expect(screen.queryByText('Pro Tips')).not.toBeVisible();
  });

  test('Close button closes the dialog', () => {
    render(<TestParent />);
    const openButton = screen.getByText('Open Dialog');
    fireEvent.click(openButton);

    expect(screen.getByText('Pro Tips')).toBeVisible();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(screen.queryByText('Pro Tips')).not.toBeVisible();
  });
});
