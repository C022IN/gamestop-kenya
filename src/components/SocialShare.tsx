'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, MessageSquare, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
}

export default function SocialShare({ url, title, description, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');
  const encodedUrl = encodeURIComponent(fullUrl);

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:bg-blue-600 hover:text-white',
      bgColor: 'bg-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'hover:bg-sky-500 hover:text-white',
      bgColor: 'bg-sky-500'
    },
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: 'hover:bg-green-600 hover:text-white',
      bgColor: 'bg-green-600'
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'hover:bg-blue-500 hover:text-white',
      bgColor: 'bg-blue-500'
    }
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Share2 className="h-4 w-4" />
        <span>Share this article</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            onClick={() => handleShare(link.url)}
            className={`flex items-center space-x-2 ${link.color} transition-colors border-gray-300`}
          >
            <link.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{link.name}</span>
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex items-center space-x-2 hover:bg-gray-600 hover:text-white transition-colors border-gray-300"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
        </Button>
      </div>
    </div>
  );
}

// Compact version for inline sharing
export function CompactSocialShare({ url, title, description }: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
          <SocialShare
            url={url}
            title={title}
            description={description}
            className="w-48"
          />
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
