"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LikeWatchedButtons from '../../components/LikeWatchedButtons';
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
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [interaction, setInteraction] = useState<{ liked: boolean } | null>(null);

  useEffect(() => {
    if (id) {
      // Try both movie and tv
      fetch(`/api/movies/${id}?type=movie`)
        .then(res => res.json())
        .then(data => {
          if (data && data.title) setMovie(data);
          else {
            fetch(`/api/movies/${id}?type=tv`)
              .then(res => res.json())
              .then(data2 => setMovie(data2));
          }
        });
      fetch(`/api/interaction?userId=demo&movieId=${id}`)
        .then(res => res.json())
        .then(data => setInteraction(data));
    }
  }, [id]);

  const updateInteraction = async (liked: boolean | null) => {
    const newState = {
      liked: liked !== null ? liked : interaction?.liked || false,
    };
    setInteraction(newState);
    await fetch('/api/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo', movieId: movie?.id, ...newState }),
    });
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
          {/* Like/Dislike buttons, modern style */}
          <div className="flex gap-4 mt-6">
            <button
              className={`text-2xl text-green-500 ${interaction?.liked ? 'scale-110' : ''} hover:scale-125 transition cursor-pointer bg-black/70 rounded-full p-2`}
              title="Like"
              onClick={() => updateInteraction(true)}
              type="button"
              style={{ lineHeight: 1 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 22V9.24l7.29-7.29c.63-.63 1.71-.18 1.71.71V7h3c1.1 0 2 .9 2 2v2c0 .55-.45 1-1 1h-7.31l.95 8.55c.09.81-.54 1.45-1.35 1.45H7z" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`text-2xl text-red-500 ${interaction?.liked === false ? 'scale-110' : ''} hover:scale-125 transition cursor-pointer bg-black/70 rounded-full p-2`}
              title="Dislike"
              onClick={() => updateInteraction(false)}
              type="button"
              style={{ lineHeight: 1 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 2v12.76l-7.29 7.29c-.63.63-1.71.18-1.71-.71V17H5c-1.1 0-2-.9-2-2v-2c0-.55.45-1 1-1h7.31l-.95-8.55C10.27 2.64 10.9 2 11.71 2H17z" fill="currentColor"/>
              </svg>
            </button>
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