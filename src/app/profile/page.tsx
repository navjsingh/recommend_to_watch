"use client";

import React, { useEffect, useState } from 'react';
import MovieCard from '../../components/MovieCard';

interface Movie {
  id: number;
  title: string;
  image: string;
  type: string;
}

export default function ProfilePage() {
  const [liked, setLiked] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);

  useEffect(() => {
    // Fetch all interactions for demo user
    fetch('/api/interaction?userId=demo&all=true')
      .then(res => res.json())
      .then(async (interactions) => {
        const res = await fetch('/api/movies?q=');
        const movies: Movie[] = await res.json();
        setLiked(movies.filter(m => interactions[m.id]?.liked));
        setWatched(movies.filter(m => interactions[m.id]?.watched));
      });
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>
      <div className="mb-4">User info will appear here.</div>
      <div className="mb-4">
        <h2 className="font-semibold mb-2">Liked Movies/Series</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {liked.map(movie => <MovieCard key={movie.id} {...movie} />)}
        </div>
      </div>
      <div>
        <h2 className="font-semibold mb-2">Watched Movies/Series</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {watched.map(movie => <MovieCard key={movie.id} {...movie} />)}
        </div>
      </div>
    </main>
  );
} 