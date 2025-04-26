'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function PolicyPage() {
  const params = useParams();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const slug = params.slug as string;

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        let policyTitle = '';
        let policyFile = '';

        switch (slug) {
          case 'privacy':
            policyTitle = 'Privacy Policy';
            policyFile = 'PRIVACY_POLICY.md';
            break;
          case 'terms':
            policyTitle = 'Terms of Service';
            policyFile = 'TERMS_OF_SERVICE.md';
            break;
          case 'refund':
            policyTitle = 'Refund Policy';
            policyFile = 'REFUND_POLICY.md';
            break;
          default:
            policyTitle = 'Policy Document';
            policyFile = 'PRIVACY_POLICY.md';
        }

        setTitle(policyTitle);

        const response = await fetch(`/docs/${policyFile}`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error fetching policy document:', error);
        setContent('Error loading policy document. Please try again later.');
      }
    };

    fetchPolicy();
  }, [slug]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">{title}</h1>

        <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
}
