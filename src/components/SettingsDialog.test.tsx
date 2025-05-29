import React, { useRef } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SettingsDialog from './SettingsDialog';
import { setSoundEnabled, setHapticsEnabled, setMasterVolume } from '@/lib/sound'; // Import setters to ensure mocks are used

// Mock the sound module functions that are used by the dialog directly or indirectly
jest.mock('@/lib/sound', () => ({
  ...jest.requireActual('@/lib/sound'), // Import and retain default behavior
  setSoundEnabled: jest.fn(),
  setHapticsEnabled: jest.fn(),
  setMasterVolume: jest.fn(),
  loadSoundSettings: jest.fn(), // Mock to prevent actual loading during tests if needed
}));

// Helper component to test the ref functionality
const TestParent = () => {
  const dialogRef = useRef<{ setOpen: (open: boolean) => void }>(null);

  return (
    <>
      <button onClick={() => dialogRef.current?.setOpen(true)}>Open Dialog</button>
      <SettingsDialog ref={dialogRef} />
    </>
  );
};

describe('SettingsDialog', () => {
  beforeEach(() => {
    // Clear mock calls and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
    // Reset documentElement class list
    document.documentElement.className = '';
  });

  test('renders dialog with correct title and description when opened', () => {
    render(<TestParent />);
    fireEvent.click(screen.getByText('Open Dialog'));

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Customize your game experience.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  describe('Sound Settings', () => {
    test('loads initial sound settings from localStorage (or defaults)', () => {
      localStorage.setItem('soundEnabled', 'false');
      localStorage.setItem('hapticsEnabled', 'false');
      localStorage.setItem('masterVolume', '0.35');

      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));
      
      expect(screen.getByLabelText('Sound Effects')).not.toBeChecked();
      expect(screen.getByLabelText('Haptic Feedback')).not.toBeChecked();
      // JSDOM input type range doesn't directly reflect value in a way RTL can easily grab by role value.
      // We'll check the displayed percentage.
      expect(screen.getByLabelText(/Volume/)).toHaveTextContent('Volume (35%)');
      // Or check the input element's value attribute directly
      const volumeSlider = screen.getByLabelText(/Volume/)?.nextElementSibling; // Assuming slider is next sibling
      expect(volumeSlider).toHaveValue('0.35');

    });

    test('toggles sound effects and saves to localStorage', () => {
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));

      const soundToggle = screen.getByLabelText('Sound Effects');
      expect(soundToggle).toBeChecked(); // Default is true

      fireEvent.click(soundToggle);
      expect(soundToggle).not.toBeChecked();
      expect(setSoundEnabled).toHaveBeenCalledWith(false);
      
      fireEvent.click(soundToggle);
      expect(soundToggle).toBeChecked();
      expect(setSoundEnabled).toHaveBeenCalledWith(true);
    });
    
    test('toggles haptic feedback and saves to localStorage', () => {
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));

      const hapticsToggle = screen.getByLabelText('Haptic Feedback');
      expect(hapticsToggle).toBeChecked(); // Default is true

      fireEvent.click(hapticsToggle);
      expect(hapticsToggle).not.toBeChecked();
      expect(setHapticsEnabled).toHaveBeenCalledWith(false);
      
      fireEvent.click(hapticsToggle);
      expect(hapticsToggle).toBeChecked();
      expect(setHapticsEnabled).toHaveBeenCalledWith(true);
    });

    test('changes volume and saves to localStorage', () => {
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));

      const volumeSlider = screen.getByLabelText(/Volume/)?.nextElementSibling;
      expect(volumeSlider).toBeInTheDocument();

      fireEvent.change(volumeSlider!, { target: { value: '0.5' } });
      expect(screen.getByLabelText(/Volume/)).toHaveTextContent('Volume (50%)');
      expect(volumeSlider).toHaveValue('0.5');
      expect(setMasterVolume).toHaveBeenCalledWith(0.5);
    });
  });

  describe('Theme Settings', () => {
    test('loads initial theme from localStorage (or defaults to system)', () => {
      localStorage.setItem('theme', 'dark');
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));
      
      expect(screen.getByLabelText('Dark')).toBeChecked();
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    test('changes theme to Light and saves to localStorage', () => {
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog')); // System default (JSDOM matches: false -> light)
      expect(document.documentElement.classList.contains('light')).toBe(true);


      const lightThemeRadio = screen.getByLabelText('Light');
      fireEvent.click(lightThemeRadio);

      expect(lightThemeRadio).toBeChecked();
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    test('changes theme to Dark and saves to localStorage', () => {
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));

      const darkThemeRadio = screen.getByLabelText('Dark');
      fireEvent.click(darkThemeRadio);

      expect(darkThemeRadio).toBeChecked();
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    test('changes theme to System and saves to localStorage', () => {
      // Mock system preference to dark for this test
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)', // system is dark
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));
      
      localStorage.setItem('theme', 'light'); // Start with light theme
      render(<TestParent />);
      fireEvent.click(screen.getByText('Open Dialog'));
      expect(document.documentElement.classList.contains('light')).toBe(true);


      const systemThemeRadio = screen.getByLabelText('System Default');
      fireEvent.click(systemThemeRadio);
      
      expect(systemThemeRadio).toBeChecked();
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'system');
      // Should apply system preference (mocked to dark)
      expect(document.documentElement.classList.contains('dark')).toBe(true); 
      expect(document.documentElement.classList.contains('light')).toBe(false);

      // Restore original matchMedia mock from setup
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: false, // default from setup
          media: query,
          onchange: null,
          addListener: jest.fn(), 
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
    });
  });

  test('Close button closes the dialog', () => {
    render(<TestParent />);
    fireEvent.click(screen.getByText('Open Dialog'));
    expect(screen.getByText('Settings')).toBeVisible();

    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(screen.queryByText('Settings')).not.toBeVisible();
  });
});
