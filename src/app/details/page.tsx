"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LikeWatchedButtons from '../../components/LikeWatchedButtons';
import Image from 'next/image';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
  description: string;
  year: number;
  genres: string[];
  streaming: { service: string; url: string }[];
}

export default function DetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [movie, setMovie] = useState<Movie | null>(null);
  const [interaction, setInteraction] = useState<{ liked: boolean; watched: boolean } | null>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/movies?q=`)
        .then(res => res.json())
        .then((data: Movie[]) => {
          const found = data.find(m => m.id === Number(id));
          setMovie(found || null);
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
          <div className="mb-2 text-gray-500">{movie.type} &bull; {movie.year}</div>
          <div className="mb-2 flex flex-wrap gap-2">
            {movie.genres.map(g => (
              <span key={g} className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{g}</span>
            ))}
          </div>
          <p className="mb-4 text-lg">{movie.description}</p>
          <div className="mb-4">
            <span className="font-semibold">Available on: </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {movie.streaming.map(stream => (
                <a
                  key={stream.service}
                  href={stream.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                >
                  {stream.service === 'Netflix' && <span className="mr-1">🍿</span>}
                  {stream.service === 'Prime' && <span className="mr-1">🍿</span>}
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
    </main>
  );
} 