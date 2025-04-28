import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Feedback } from '@/lib/sound';

interface CurrencyStoreProps {
  userId: string;
  onClose: () => void;
}

// Mock currency packages
const mockPackages = [
  {
    id: 'coins_small',
    title: '100 Coins',
    description: 'Small coin package',
    price: '$0.99',
    currency: 'coins',
    amount: 100
  },
  {
    id: 'coins_medium',
    title: '500 Coins',
    description: 'Medium coin package',
    price: '$4.99',
    currency: 'coins',
    amount: 500
  },
  {
    id: 'coins_large',
    title: '1200 Coins',
    description: 'Large coin package - Best Value!',
    price: '$9.99',
    currency: 'coins',
    amount: 1200
  },
  {
    id: 'gems_small',
    title: '10 Gems',
    description: 'Small gem package',
    price: '$1.99',
    currency: 'gems',
    amount: 10
  },
  {
    id: 'gems_medium',
    title: '50 Gems',
    description: 'Medium gem package',
    price: '$8.99',
    currency: 'gems',
    amount: 50
  },
  {
    id: 'gems_large',
    title: '120 Gems',
    description: 'Large gem package - Best Value!',
    price: '$19.99',
    currency: 'gems',
    amount: 120
  }
];

const CurrencyStore: React.FC<CurrencyStoreProps> = ({ userId, onClose }) => {
  const [purchasing, setPurchasing] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchasing(true);
      
      // Play button click sound
      Feedback.buttonClick();
      
      // Simulate purchase delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would call RevenueCat
      // For now, just show a success message
      
      // Play success sound
      Feedback.success();
      
      toast({
        title: 'Purchase Successful',
        description: `You have successfully purchased this package!`,
      });
    } catch (error) {
      console.error('Failed to purchase package:', error);
      
      // Play error sound
      Feedback.error();
      
      toast({
        title: 'Purchase Failed',
        description: 'Failed to complete purchase. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      // Play button click sound
      Feedback.buttonClick();
      
      // Simulate restore delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Play success sound
      Feedback.success();
      
      toast({
        title: 'Purchases Restored',
        description: 'Your purchases have been successfully restored.',
      });
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      
      // Play error sound
      Feedback.error();
      
      toast({
        title: 'Restore Failed',
        description: 'Failed to restore purchases. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Currency Store</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRestorePurchases}>
            Restore Purchases
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      
      {/* Currency Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">🪙 Coins</CardTitle>
            <CardDescription>Use for in-game purchases</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">100</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">💎 Gems</CardTitle>
            <CardDescription>Premium currency for special items</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">5</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Available Packages */}
      <h3 className="text-xl font-semibold mb-4">Available Packages</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPackages.map((pkg) => (
          <Card key={pkg.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>{pkg.title}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pkg.price}</p>
            </CardContent>
            <CardFooter className="bg-muted/50 pt-2">
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : 'Purchase'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CurrencyStore;
