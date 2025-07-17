"use client";

import React, { useState } from 'react';
import MovieCard from '../../components/MovieCard';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/movies?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Search Movies & Web Series</h1>
      <form className="mb-4" onSubmit={handleSearch}>
        <input
          className="border rounded p-2 w-full"
          placeholder="Search for a movie or web series..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {results.map(movie => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>
    </main>
  );
} 