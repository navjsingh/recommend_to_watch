"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ProfileMovieCard from '../../components/ProfileMovieCard';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
  year?: string;
  rating?: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState<Movie[]>([]);
  const [disliked, setDisliked] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Debug logging
  useEffect(() => {
    console.log('Profile Page - Session Status:', status);
    console.log('Profile Page - Session Data:', session);
  }, [session, status]);

  const fetchMovies = async () => {
    try {
      // Fetch liked movies
      const likedRes = await fetch('/api/interaction?liked=true');
      const likedMovies = await likedRes.json();
      
      // Fetch disliked movies
      const dislikedRes = await fetch('/api/interaction?disliked=true');
      const dislikedMovies = await dislikedRes.json();
      
      console.log('Liked movies response:', likedMovies);
      console.log('Disliked movies response:', dislikedMovies);
      
      if (Array.isArray(likedMovies)) {
        setLiked(likedMovies);
      }
      
      if (Array.isArray(dislikedMovies)) {
        setDisliked(dislikedMovies);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      console.log('No session found, redirecting to sign-in');
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }

    console.log('Session found, fetching movies for user:', session.user?.email);
    fetchMovies();
  }, [session, status, router]);

  const handleRemoveLiked = (movieId: number) => {
    setLiked(prev => prev.filter(movie => movie.id !== movieId));
  };

  const handleRemoveDisliked = (movieId: number) => {
    setDisliked(prev => prev.filter(movie => movie.id !== movieId));
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-500 text-6xl mb-4">🔒</div>
            <p className="text-gray-300 text-lg">Redirecting to sign in...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {session.user?.name ? session.user.name[0].toUpperCase() : "👤"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-800 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {session.user?.name || 'User'}
                </h1>
                <p className="text-gray-300 text-lg mb-4">{session.user?.email}</p>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                  <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium border border-green-500/30">
                    ❤️ {liked.length} Liked
                  </div>
                  <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium border border-red-500/30">
                    👎 {disliked.length} Disliked
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liked Movies Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">❤️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Liked Movies & Series</h2>
              <p className="text-gray-400">Your favorite content that you've enjoyed</p>
            </div>
            <div className="ml-auto bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold border border-green-500/30">
              {liked.length} items
            </div>
          </div>
          
          {liked.length > 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {liked.map(movie => (
                  <ProfileMovieCard 
                    key={movie.id} 
                    {...movie} 
                    onRemove={handleRemoveLiked}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-gray-700/50 text-center">
              <div className="text-gray-500 text-6xl mb-4">🎬</div>
              <h3 className="text-xl font-semibold text-white mb-2">No liked movies yet</h3>
              <p className="text-gray-400 mb-6">Start exploring and like some movies to see them here!</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Explore Movies
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center mb-16">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
          <div className="mx-8 text-gray-500 text-sm font-medium">YOUR PREFERENCES</div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>

        {/* Disliked Movies Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">👎</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Disliked Movies & Series</h2>
              <p className="text-gray-400">Content you've marked as not interested</p>
            </div>
            <div className="ml-auto bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-sm font-semibold border border-red-500/30">
              {disliked.length} items
            </div>
          </div>
          
          {disliked.length > 0 ? (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {disliked.map(movie => (
                  <ProfileMovieCard 
                    key={movie.id} 
                    {...movie} 
                    onRemove={handleRemoveDisliked}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-gray-700/50 text-center">
              <div className="text-gray-500 text-6xl mb-4">👍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No disliked movies yet</h3>
              <p className="text-gray-400 mb-6">Dislike movies you don't want to see again to avoid them in recommendations!</p>
              <button 
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Browse Content
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 