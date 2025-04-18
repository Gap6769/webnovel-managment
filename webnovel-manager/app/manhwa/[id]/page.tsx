'use client';

import { useEffect, useState } from 'react';
import { ManhwaReader } from '@/components/reader/ManhwaReader';
import { useParams } from 'next/navigation';

interface ManhwaImage {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

interface ManhwaResponse {
  type: string;
  images: ManhwaImage[];
}

export default function ManhwaPage() {
  const params = useParams();
  const [manhwaData, setManhwaData] = useState<ManhwaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManhwa = async () => {
      try {
        const response = await fetch(`/api/manhwa/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch manhwa data');
        }
        const data = await response.json();
        setManhwaData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManhwa();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive">Error</h2>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!manhwaData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No data available</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ManhwaReader
        images={manhwaData.images}
        title={manhwaData.images[0]?.alt || 'Manhwa Reader'}
      />
    </div>
  );
} 