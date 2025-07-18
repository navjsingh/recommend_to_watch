"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import MovieCard from '../components/MovieCard';
import { SessionProvider, useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
}

export default function HomePage() {
  return (
    <SessionProvider>
      <HomePageContent />
    </SessionProvider>
  );
}

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
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
      {!session && (
        <div className="mb-6 p-4 bg-blue-100 border border-blue-300 rounded flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-blue-900 font-medium">Register or Sign in for personalized recommendations!</span>
          <div className="flex gap-2">
            <button
              className="bg-gray-900 text-white px-4 py-1 rounded font-semibold hover:bg-gray-700 transition"
              onClick={() => router.push('/auth/register')}
            >Register</button>
            <button
              className="bg-white border border-gray-900 text-gray-900 px-4 py-1 rounded font-semibold hover:bg-gray-100 transition"
              onClick={() => signIn()}
            >Sign In</button>
          </div>
        </div>
      )}
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