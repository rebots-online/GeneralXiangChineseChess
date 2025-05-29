'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { loadSoundSettings, setSoundEnabled, setMasterVolume, setHapticsEnabled } from '@/lib/sound';

const SettingsDialog = forwardRef((props, ref) => {
  const [open, setOpen] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true); // Default to true
  const [hapticFeedback, setHapticFeedback] = useState(true); // Default to true
  const [volume, setVolume] = useState(0.7); // Default to 0.7
  const [currentTheme, setCurrentTheme] = useState('system');

  useImperativeHandle(ref, () => ({ setOpen }));

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      // Load sound settings from localStorage
      const storedSoundEnabled = localStorage.getItem('soundEnabled');
      setSoundEffects(storedSoundEnabled !== null ? storedSoundEnabled === 'true' : true);

      const storedHapticsEnabled = localStorage.getItem('hapticsEnabled');
      setHapticFeedback(storedHapticsEnabled !== null ? storedHapticsEnabled === 'true' : true);
      
      const storedVolume = localStorage.getItem('masterVolume');
      setVolume(storedVolume !== null ? parseFloat(storedVolume) : 0.7);
      
      // Load theme setting from localStorage
      const storedTheme = localStorage.getItem('theme') || 'system';
      setCurrentTheme(storedTheme);
      applyTheme(storedTheme); // Apply theme immediately
    }
  }, [open]);

  const handleSoundToggle = (checked: boolean) => {
    setSoundEffects(checked);
    setSoundEnabled(checked);
  };

  const handleHapticsToggle = (checked: boolean) => {
    setHapticFeedback(checked);
    setHapticsEnabled(checked);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    setMasterVolume(newVolume);
  };

  const applyTheme = (theme: string) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  };

  const handleThemeChange = (value: string) => {
    setCurrentTheme(value);
    localStorage.setItem('theme', value);
    applyTheme(value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your game experience.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {/* Sound Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sound</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects-switch" className="flex flex-col space-y-1">
                <span>Sound Effects</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enable or disable game sound effects.
                </span>
              </Label>
              <Switch
                id="sound-effects-switch"
                checked={soundEffects}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="haptic-feedback-switch" className="flex flex-col space-y-1">
                <span>Haptic Feedback</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Enable or disable vibration feedback (if supported).
                </span>
              </Label>
              <Switch
                id="haptic-feedback-switch"
                checked={hapticFeedback}
                onCheckedChange={handleHapticsToggle}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="volume-slider">Volume ({Math.round(volume * 100)}%)</Label>
              <input
                id="volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={!soundEffects}
              />
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Theme</h3>
            <RadioGroup value={currentTheme} onValueChange={handleThemeChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">Dark</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="theme-system" />
                <Label htmlFor="theme-system">System Default</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Select your preferred interface theme. &quot;System&quot; will use your OS preference.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

SettingsDialog.displayName = 'SettingsDialog';

export default SettingsDialog;
