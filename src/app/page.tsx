"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const loader = useRef<HTMLDivElement | null>(null);

  // Fetch movies
  const fetchMovies = useCallback(async (reset = false, pageNum = 1) => {
    setLoading(true);
    const endpoint = query
      ? `/api/movies?q=${encodeURIComponent(query)}&page=${pageNum}`
      : `/api/movies?page=${pageNum}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    setMovies(prev => {
      const all = reset ? data.results : [...prev, ...data.results];
      const seen = new Set();
      return all.filter((item: any) => {
        const key = `${item.id}-${item.type}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    });
    setTotalPages(data.total_pages);
    setLoading(false);
  }, [query]);

  // Initial and query change fetch
  useEffect(() => {
    setPage(1);
    fetchMovies(true, 1);
  }, [query, fetchMovies]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 1 }
    );
    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.unobserve(loader.current);
    };
  }, [loading, page, totalPages]);

  // Fetch next page
  useEffect(() => {
    if (page === 1) return;
    fetchMovies(false, page);
  }, [page, fetchMovies]);

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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {movies.map(movie => (
          <MovieCard key={`${movie.id}-${movie.type}`} {...movie} />
        ))}
      </div>
      <div ref={loader} className="h-12 flex items-center justify-center">
        {loading && <span>Loading...</span>}
        {!loading && page >= totalPages && <span className="text-gray-400">No more results</span>}
      </div>
    </main>
  );
} 