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
  streaming: { service: string; logo: string; url: string }[];
}

export default function DetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [interaction, setInteraction] = useState<{ liked: boolean; watched: boolean } | null>(null);

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
          <div className="mb-2 text-gray-500">{movie.type} &bull; {movie.year} {movie.runtime && <> &bull; {movie.runtime} min</>}</div>
          <div className="mb-2 flex flex-wrap gap-2">
            {movie.genres.map(g => (
              <span key={g} className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{g}</span>
            ))}
          </div>
          <p className="mb-4 text-lg">{movie.description}</p>
          <div className="mb-4">
            <span className="font-semibold">Available on: </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {movie.streaming.length === 0 && <span className="text-gray-400">No streaming info</span>}
              {movie.streaming.map(stream => (
                <a
                  key={stream.service}
                  href={stream.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                >
                  {stream.logo && <Image src={stream.logo} alt={stream.service} width={24} height={24} className="inline mr-1 rounded" />}
                  Watch on {stream.service}
                </a>
              ))}
            </div>
          </div>
          <LikeWatchedButtons
            userId="demo"
            movieId={movie.id}
            liked={interaction?.liked}
            watched={interaction?.watched}
            onChange={setInteraction}
          />
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