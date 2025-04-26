'use client';

import React from 'react';
import Link from 'next/link';

const PolicyLinks: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      <Link href="/policy/privacy" className="hover:underline">
        Privacy Policy
      </Link>
      <span>•</span>
      <Link href="/policy/terms" className="hover:underline">
        Terms of Service
      </Link>
      <span>•</span>
      <Link href="/policy/refund" className="hover:underline">
        Refund Policy
      </Link>
    </div>
  );
};

export default PolicyLinks;
