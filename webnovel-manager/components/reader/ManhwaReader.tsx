'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';

interface ManhwaImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

interface ManhwaReaderProps {
  images: ManhwaImage[];
  title: string;
  backUrl?: string;
  className?: string;
}

export function ManhwaReader({ images, title, backUrl, className = '' }: ManhwaReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < images.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  return (
    <div className={`relative w-full ${isFullscreen ? 'h-screen' : 'h-[80vh]'} ${className}`}>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        {backUrl && (
          <Button
            variant="outline"
            size="icon"
            asChild
            className="bg-background/80 backdrop-blur-sm"
          >
            <Link href={backUrl}>
              <ArrowLeft size={20} />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </Button>
      </div>

      <div className="flex h-full items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousPage}
          disabled={currentPage === 0}
          className="absolute left-4 bg-background/80 backdrop-blur-sm"
        >
          <ChevronLeft size={24} />
        </Button>

        <div className="relative h-full w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary" />
            </div>
          )}
          <Image
            src={images[currentPage].url}
            alt={images[currentPage].alt}
            fill
            className="object-contain"
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            priority
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === images.length - 1}
          className="absolute right-4 bg-background/80 backdrop-blur-sm"
        >
          <ChevronRight size={24} />
        </Button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-4 py-2 rounded-full backdrop-blur-sm">
        <span className="text-sm">
          {currentPage + 1} / {images.length}
        </span>
      </div>
    </div>
  );
} 