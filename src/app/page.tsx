"use client";

import React, { useEffect, useState } from 'react';
import MovieCard from '../components/MovieCard';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
}

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const endpoint = query ? `/api/movies?q=${encodeURIComponent(query)}` : '/api/recommendations';
    fetch(endpoint)
      .then(res => res.json())
      .then(setMovies)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <main className="p-8">
      <form className="mb-6" onSubmit={e => { e.preventDefault(); }}>
        <input
          className="border rounded p-2 w-full max-w-md"
          placeholder="Search for a movie or web series..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </form>
      <h1 className="text-2xl font-bold mb-4">Recommended for You</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {movies.map(movie => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </main>
  );
} 