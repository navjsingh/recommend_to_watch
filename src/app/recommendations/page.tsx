"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

interface Recommendation {
  id: number;
  title: string;
  image: string | null;
  type: 'movie' | 'tv';
  description: string;
  year: string;
  genres: string[];
  rating: number;
  similarityScore?: number;
  recommendationReason: string;
}

export default function RecommendationsPage() {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Recommendations page - Session status:', status);
    console.log('Recommendations page - Session data:', session);
    
    if (status === 'loading') {
      console.log('Recommendations page - Still loading session');
      return;
    }
    
    if (!session) {
      console.log('Recommendations page - No session found');
      setError('Please sign in to see personalized recommendations');
      setLoading(false);
      return;
    }

    console.log('Recommendations page - Session found, fetching recommendations');
    fetchRecommendations();
  }, [session, status]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('Fetching recommendations...');
      
      const response = await fetch('/api/recommendations');
      console.log('Recommendations response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Recommendations API error:', errorData);
        throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Recommendations data received:', data.length, 'items');
      setRecommendations(data);
    } catch (err) {
      console.error('Error in fetchRecommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (movieId: number, liked: boolean) => {
    try {
      const response = await fetch('/api/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, liked }),
      });

      if (response.ok) {
        // Show temporary feedback
        const button = document.getElementById(`feedback-${movieId}`);
        if (button) {
          const originalText = button.textContent;
          button.textContent = liked ? 'Liked!' : 'Disliked!';
          button.className = `px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            liked ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`;
          
          setTimeout(() => {
            button.textContent = originalText;
            button.className = 'px-3 py-1 rounded-full text-sm font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors';
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error updating interaction:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Personalized Recommendations</h1>
          <p className="text-gray-400 mb-6">Sign in to see recommendations based on your preferences</p>
          <Link 
            href="/auth/signin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Your Recommendations</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[2/3] bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Your Recommendations</h1>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchRecommendations}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Recommendations</h1>
          <button 
            onClick={fetchRecommendations}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {recommendations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">
              Start liking and disliking movies to get personalized recommendations!
            </div>
            <Link 
              href="/search"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Explore Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((movie) => (
              <div key={movie.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <Link href={`/details?id=${movie.id}&type=${movie.type}`}>
                  <div className="relative aspect-[2/3] bg-gray-700">
                    {movie.image ? (
                      <Image
                        src={movie.image}
                        alt={movie.title}
                        fill
                        className="object-cover object-center hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                      {movie.type.toUpperCase()}
                    </div>
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      ⭐ {movie.rating.toFixed(1)}
                    </div>
                    {movie.similarityScore && (
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                        {(movie.similarityScore * 100).toFixed(0)}% match
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link href={`/details?id=${movie.id}&type=${movie.type}`}>
                    <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-400 text-sm">{movie.year}</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-400 text-sm">{movie.genres.slice(0, 2).join(', ')}</span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {movie.description}
                  </p>
                  
                  <div className="text-xs text-blue-400 mb-3 bg-blue-900/20 px-2 py-1 rounded">
                    {movie.recommendationReason}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      id={`feedback-${movie.id}`}
                      onClick={() => handleInteraction(movie.id, true)}
                      className="flex-1 px-3 py-1 rounded-full text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                    >
                      Like
                    </button>
                    <button
                      onClick={() => handleInteraction(movie.id, false)}
                      className="flex-1 px-3 py-1 rounded-full text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      Dislike
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 