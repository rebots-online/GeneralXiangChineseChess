'use client';

import React from 'react';
import Link from 'next/link';
import PolicyLinks from './PolicyLinks';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              © 2025 General Xiang: Learn Chinese Chess & Play Opponents Across the Globe
            </p>
          </div>
          <PolicyLinks />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
