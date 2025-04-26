'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Volume2, 
  VolumeX, 
  Vibrate, 
  VolumeIcon 
} from 'lucide-react';
import { 
  setMasterVolume, 
  setSoundEnabled, 
  setHapticsEnabled, 
  loadSoundSettings,
  initAudio,
  Feedback
} from '@/lib/sound';

interface SoundSettingsProps {
  className?: string;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ className }) => {
  const [volume, setVolume] = useState<number>(0.7);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState<boolean>(true);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true);
    loadSoundSettings();
    
    // Get stored values
    const storedSoundEnabled = localStorage.getItem('soundEnabled');
    const storedHapticsEnabled = localStorage.getItem('hapticsEnabled');
    const storedVolume = localStorage.getItem('masterVolume');
    
    if (storedSoundEnabled !== null) {
      setIsSoundEnabled(storedSoundEnabled === 'true');
    }
    
    if (storedHapticsEnabled !== null) {
      setIsHapticsEnabled(storedHapticsEnabled === 'true');
    }
    
    if (storedVolume !== null) {
      setVolume(parseFloat(storedVolume));
    }
    
    // Initialize audio context after user interaction
    const handleUserInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setMasterVolume(newVolume);
  };

  // Handle sound toggle
  const handleSoundToggle = (checked: boolean) => {
    setIsSoundEnabled(checked);
    setSoundEnabled(checked);
    Feedback.toggle();
  };

  // Handle haptics toggle
  const handleHapticsToggle = (checked: boolean) => {
    setIsHapticsEnabled(checked);
    setHapticsEnabled(checked);
    Feedback.toggle();
  };

  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          <Label htmlFor="sound-toggle">Sound Effects</Label>
        </div>
        <Switch
          id="sound-toggle"
          checked={isSoundEnabled}
          onCheckedChange={handleSoundToggle}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <VolumeIcon className="h-4 w-4" />
          <Label htmlFor="volume-slider">Volume</Label>
        </div>
        <Slider
          id="volume-slider"
          disabled={!isSoundEnabled}
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-full"
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vibrate className="h-4 w-4" />
          <Label htmlFor="haptics-toggle">Haptic Feedback</Label>
        </div>
        <Switch
          id="haptics-toggle"
          checked={isHapticsEnabled}
          onCheckedChange={handleHapticsToggle}
        />
      </div>
      
      <div className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => {
            Feedback.buttonClick();
            // Play a test sound
            if (isSoundEnabled) {
              Feedback.success();
            }
          }}
        >
          Test Sound
        </Button>
      </div>
    </div>
  );
};

export default SoundSettings;
