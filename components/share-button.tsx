"use client"

import React from 'react';
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface ShareButtonProps {
  publicLink: string;
  className?: string;
}

export function ShareButton({ publicLink, className }: ShareButtonProps) {
  const copyToClipboard = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(publicLink)
        .then(() => toast.success('Public link copied to clipboard!'))
        .catch(err => {
          console.error('Failed to copy link:', err);
          toast.error('Failed to copy link.');
        });
    } else {
      toast.error('Clipboard API not available.');
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={copyToClipboard} className={className} title="Copy public share link">
        <Share2 className="h-4 w-4"/>
      <span className="sr-only">Copy Public Link</span>
    </Button>
  );
} 