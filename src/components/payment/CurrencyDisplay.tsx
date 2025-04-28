import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CurrencyStore from './CurrencyStore';

interface CurrencyDisplayProps {
  userId: string;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ userId }) => {
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showStore, setShowStore] = useState(false);

  useEffect(() => {
    // Simulate loading currencies
    const loadCurrencies = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would fetch from RevenueCat
        // For now, just use placeholder values
        setTimeout(() => {
          setCoins(100);
          setGems(5);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to load currencies:', error);
        setLoading(false);
      }
    };

    loadCurrencies();
  }, [userId]);

  const handleOpenStore = () => {
    setShowStore(true);
  };

  const handleCloseStore = () => {
    setShowStore(false);
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="animate-pulse flex gap-2">
            <div className="h-8 w-16 bg-muted rounded"></div>
            <div className="h-8 w-16 bg-muted rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded-md">
              <span className="text-amber-600 dark:text-amber-400">🪙</span>
              <span className="font-medium">{coins}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-950 px-2 py-1 rounded-md">
              <span className="text-blue-600 dark:text-blue-400">💎</span>
              <span className="font-medium">{gems}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenStore}>
              + Get More
            </Button>
          </>
        )}
      </div>
      
      {/* Currency Store Dialog */}
      <AlertDialog open={showStore} onOpenChange={setShowStore}>
        <AlertDialogContent className="max-w-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Currency Store</AlertDialogTitle>
          </AlertDialogHeader>
          <CurrencyStore userId={userId} onClose={handleCloseStore} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CurrencyDisplay;
