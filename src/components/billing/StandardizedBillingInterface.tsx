import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  interval: string;
  features: PlanFeature[];
  popular?: boolean;
  permissions: string[];
}

interface BillingInterfaceProps {
  plans: PricingPlan[];
  onSubscribe: (planId: string) => void;
  currentPlan?: string;
}

export function StandardizedBillingInterface({ 
  plans, 
  onSubscribe, 
  currentPlan 
}: BillingInterfaceProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a subscription plan that works best for your needs
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={plans[0]?.id} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {plans.map(plan => (
              <TabsTrigger key={plan.id} value={plan.id}>
                {plan.name}
                {plan.popular && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {plans.map(plan => (
            <TabsContent key={plan.id} value={plan.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    {plan.price} <span className="text-sm font-normal">{plan.currency}/{plan.interval}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span className={feature.included ? '' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  <ul className="space-y-2">
                    {plan.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span>{permission}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={currentPlan === plan.id ? 'outline' : 'default'}
                    onClick={() => onSubscribe(plan.id)}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? 'Current Plan' : 'Subscribe'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}