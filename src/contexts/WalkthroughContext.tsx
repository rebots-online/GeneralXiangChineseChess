'use client';

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

// Define the step interface for walkthrough
export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  priority?: 'normal' | 'high'; // Optional priority for special handling
}

interface WalkthroughContextType {
  isActive: boolean;
  currentStep: number;
  steps: WalkthroughStep[];
  startWalkthrough: (steps: WalkthroughStep[], onComplete?: () => void) => void;
  nextStep: () => void;
  prevStep: () => void;
  endWalkthrough: () => void;
}

const WalkthroughContext = createContext<WalkthroughContextType | undefined>(undefined);

export const useWalkthrough = () => {
  const context = useContext(WalkthroughContext);
  if (!context) {
    throw new Error('useWalkthrough must be used within a WalkthroughProvider');
  }
  return context;
};

interface WalkthroughProviderProps {
  children: ReactNode;
}

export const WalkthroughProvider: React.FC<WalkthroughProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WalkthroughStep[]>([]);
  const onCompleteRef = useRef<(() => void) | undefined>();

  // Start a new walkthrough with the provided steps
  const startWalkthrough = (newSteps: WalkthroughStep[], onComplete?: () => void) => {
    if (newSteps.length === 0) return;

    setSteps(newSteps);
    setCurrentStep(0);
    setIsActive(true);
    onCompleteRef.current = onComplete;

    // We're not adding a class that prevents scrolling
    // This allows users to scroll to see the board during the walkthrough
  };

  // Move to the next step
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endWalkthrough();
    }
  };

  // Move to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // End the walkthrough
  const endWalkthrough = () => {
    setIsActive(false);
    setSteps([]);
    setCurrentStep(0);

    if (onCompleteRef.current) {
      onCompleteRef.current();
      onCompleteRef.current = undefined;
    }

    // Remove any highlighted elements
    const highlightedElements = document.querySelectorAll('.highlighted');
    highlightedElements.forEach(el => {
      el.classList.remove('highlighted');
      // Restore original styles
      const htmlElement = el as HTMLElement;
      const originalZIndex = htmlElement.getAttribute('data-original-z-index');
      if (originalZIndex !== null) {
        htmlElement.style.zIndex = originalZIndex;
        htmlElement.removeAttribute('data-original-z-index');
      }
      htmlElement.style.boxShadow = '';
      htmlElement.style.position = '';
      htmlElement.style.pointerEvents = ''; // Restore pointer events
    });
  };

  return (
    <WalkthroughContext.Provider
      value={{
        isActive,
        currentStep,
        steps,
        startWalkthrough,
        nextStep,
        prevStep,
        endWalkthrough,
      }}
    >
      {children}
    </WalkthroughContext.Provider>
  );
};
