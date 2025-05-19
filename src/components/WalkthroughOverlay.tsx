'use client';

import React, { useEffect, useRef } from 'react';
import { useWalkthrough, WalkthroughStep } from '@/contexts/WalkthroughContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const WalkthroughOverlay: React.FC = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, endWalkthrough } = useWalkthrough();
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    // Get the current step
    const step = steps[currentStep];

    // Find the target element
    const targetElement = document.querySelector(step.targetSelector);

    // Remove highlight from all elements
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
    });

    // If target element exists, highlight it
    if (targetElement) {
      // Ensure the element is visible by scrolling to it
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      targetElement.classList.add('highlighted');
      // Add a temporary style to make the element stand out
      const targetHTMLElement = targetElement as HTMLElement;
      targetHTMLElement.setAttribute('data-original-z-index', targetHTMLElement.style.zIndex || '');
      targetHTMLElement.style.zIndex = '1000'; // Increased z-index
      targetHTMLElement.style.position = 'relative';
      targetHTMLElement.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 15px 5px rgba(255, 255, 255, 0.5)';
      targetHTMLElement.style.pointerEvents = 'none'; // Prevent interaction with highlighted element

      // Position the tooltip near the target element
      if (tooltipRef.current) {
        // Add a small delay to ensure the element is in view before positioning the tooltip
        setTimeout(() => {
          if (!tooltipRef.current) return; // Additional null check after timeout

          const targetRect = targetElement.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();

          // Calculate position based on the specified position
          let top = 0;
          let left = 0;

          // Special handling for high priority steps or the "pieces" step (Step 4)
          if (step.priority === 'high' || step.id === 'pieces') {
            // Position at the top of the viewport, above the board
            top = 100; // Fixed position from the top
            left = window.innerWidth / 2 - tooltipRect.width / 2; // Centered horizontally

            // Ensure this step is fully visible by scrolling to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            switch (step.position) {
              case 'top':
                top = targetRect.top - tooltipRect.height - 20; // More space above
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
              case 'right':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.right + 20; // More space to the right
                break;
              case 'bottom':
                top = targetRect.bottom + 20; // More space below
                left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
                break;
              case 'left':
                top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
                left = targetRect.left - tooltipRect.width - 20; // More space to the left
                break;
            }
          }

          // Ensure the tooltip stays within viewport bounds
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          if (left < 20) left = 20;
          if (left + tooltipRect.width > viewportWidth - 20) {
            left = viewportWidth - tooltipRect.width - 20;
          }

          if (top < 20) top = 20;
          if (top + tooltipRect.height > viewportHeight - 20) {
            top = viewportHeight - tooltipRect.height - 20;
          }


          // Apply the position - for fixed positioning, we don't need to add scroll position
          if (tooltipRef.current) {
            tooltipRef.current.style.top = `${top}px`;
            tooltipRef.current.style.left = `${left}px`;
          }
    
        }, 300); // Short delay to ensure scrolling is complete
      }
    }

    // Add keyboard event listeners for navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        endWalkthrough();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        prevStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, currentStep, steps, nextStep, prevStep, endWalkthrough]);

  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/50 pointer-events-auto walkthrough-overlay"
      onClick={endWalkthrough}
    >
      <div
        ref={tooltipRef}
        className="fixed pointer-events-auto"
        style={{
          maxWidth: '350px',
          zIndex: 1000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="walkthrough-card animate-appear">
          <CardHeader>
            <CardTitle>{currentStepData.title}</CardTitle>
            <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{currentStepData.description}</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isFirstStep}
                className="mr-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={endWalkthrough}
              >
                Skip
              </Button>
            </div>
            <Button
              onClick={nextStep}
            >
              {isLastStep ? 'Finish' : 'Next'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

