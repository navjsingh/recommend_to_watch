"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile: string;
}

interface Provider {
  service: string;
  logo: string;
  url: string;
}

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
  description: string;
  year: string;
  genres: string[];
  runtime?: number;
  cast: CastMember[];
  streaming: Provider[];
}

export default function DetailsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const id = searchParams?.get('id');
  const type = searchParams?.get('type') || 'movie';
  const [movie, setMovie] = useState<Movie | null>(null);
  const [interaction, setInteraction] = useState<{ liked: boolean } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (id && type) {
      fetch(`/api/movies/${id}?type=${type}`)
        .then(res => res.json())
        .then(data => setMovie(data));
      
      if (session) {
        fetch(`/api/interaction?movieId=${id}`)
          .then(res => res.json())
          .then(data => setInteraction(data));
      }
    }
  }, [id, type, session]);

  const updateInteraction = async (liked: boolean | null) => {
    if (!session) {
      // Handle not authenticated
      return;
    }

    const newState = {
      liked: liked !== null ? liked : interaction?.liked || false,
    };
    setInteraction(newState);
    await fetch('/api/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId: movie?.id, liked: newState.liked }),
    });
  };

  const removeInteraction = async () => {
    if (!session || !movie) return;
    
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/interaction?movieId=${movie.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setInteraction(null);
      }
    } catch (error) {
      console.error('Error removing interaction:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  if (!id) return <div className="p-8">No movie/series selected.</div>;
  if (!movie) return <div className="p-8">Loading...</div>;

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="relative w-full md:w-64 aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden shadow-lg">
          <Image
            src={movie.image}
            alt={movie.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <div className="mb-2 text-gray-500">
            <span className="inline-block bg-black/60 text-white px-2 py-0.5 rounded-full text-xs font-semibold mr-2">
              {movie.type.toUpperCase()}
            </span>
            {movie.year} {movie.runtime && <> &bull; {movie.runtime} min</>}
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            {movie.genres.map(g => (
              <span key={g} className="bg-black/60 text-white px-2 py-1 rounded text-xs font-medium shadow">{g}</span>
            ))}
          </div>
          <p className="mb-4 text-lg">{movie.description}</p>
          <div className="mb-4">
            <span className="font-semibold">Available on: </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {movie.streaming.length === 0 && <span className="text-gray-400">No streaming info</span>}
              {movie.streaming.map(stream => {
                let providerUrl = '';
                if (movie.title) {
                  if (stream.service.toLowerCase().includes('netflix')) {
                    providerUrl = `https://www.netflix.com/search?q=${encodeURIComponent(movie.title)}`;
                  } else if (stream.service.toLowerCase().includes('prime')) {
                    providerUrl = `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(movie.title)}`;
                  } else if (stream.service.toLowerCase().includes('disney')) {
                    providerUrl = `https://www.disneyplus.com/search?q=${encodeURIComponent(movie.title)}`;
                  } else if (stream.service.toLowerCase().includes('hulu')) {
                    providerUrl = `https://www.hulu.com/search?q=${encodeURIComponent(movie.title)}`;
                  } else {
                    providerUrl = stream.url || '#';
                  }
                }
                return (
                  <a
                    key={stream.service}
                    href={providerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 text-white font-medium shadow hover:bg-gray-700 transition-colors border border-gray-800"
                    style={{ minWidth: 0 }}
                  >
                    {stream.logo && <Image src={stream.logo} alt={stream.service} width={24} height={24} className="inline rounded-full" />}
                    <span className="truncate max-w-[100px]">{stream.service}</span>
                  </a>
                );
              })}
            </div>
          </div>
          
          {/* Interaction Section */}
          <div className="mt-6">
            {session ? (
              interaction ? (
                // Show current status and remove option
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    interaction.liked 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <span className="text-lg">
                      {interaction.liked ? '❤️' : '👎'}
                    </span>
                    <span className="font-medium">
                      {interaction.liked ? 'Liked' : 'Disliked'}
                    </span>
                  </div>
                  <button
                    onClick={removeInteraction}
                    disabled={isRemoving}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full transition-colors disabled:opacity-50"
                  >
                    {isRemoving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Removing...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                        </svg>
                        Remove
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Show like/dislike options
                <div className="flex gap-4">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
                    onClick={() => updateInteraction(true)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 22V9.24l7.29-7.29c.63-.63 1.71-.18 1.71.71V7h3c1.1 0 2 .9 2 2v2c0 .55-.45 1-1 1h-7.31l.95 8.55c.09.81-.54 1.45-1.35 1.45H7z" fill="currentColor"/>
                    </svg>
                    Like
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    onClick={() => updateInteraction(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 2v12.76l-7.29 7.29c-.63.63-1.71.18-1.71-.71V17H5c-1.1 0-2-.9-2-2v-2c0-.55.45-1 1-1h7.31l-.95-8.55C10.27 2.64 10.9 2 11.71 2H17z" fill="currentColor"/>
                    </svg>
                    Dislike
                  </button>
                </div>
              )
            ) : (
              // Not authenticated
              <div className="text-gray-500 text-sm">
                Sign in to like or dislike this content
              </div>
            )}
          </div>
        </div>
      </div>
      {movie.cast && movie.cast.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Cast</h2>
          <div className="flex flex-wrap gap-4">
            {movie.cast.map(cast => (
              <div key={cast.id} className="w-24 text-center">
                {cast.profile ? (
                  <Image src={cast.profile} alt={cast.name} width={96} height={128} className="rounded mb-1 object-cover" />
                ) : (
                  <div className="w-24 h-32 bg-gray-200 rounded mb-1 flex items-center justify-center text-gray-400">No Image</div>
                )}
                <div className="text-xs font-medium truncate">{cast.name}</div>
                <div className="text-xs text-gray-500 truncate">{cast.character}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
} 