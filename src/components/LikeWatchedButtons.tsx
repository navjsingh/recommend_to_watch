import React, { useState } from 'react';

interface Props {
  userId: string;
  movieId: number;
  type: 'movie' | 'tv';
  liked?: boolean;
  watched?: boolean;
  onChange?: (state: { liked: boolean; watched: boolean }) => void;
}

export default function LikeWatchedButtons({ userId, movieId, type, liked = false, watched = false, onChange }: Props) {
  const [likeState, setLikeState] = useState(liked);
  const [watchedState, setWatchedState] = useState(watched);

  const update = async (newLiked: boolean, newWatched: boolean) => {
    setLikeState(newLiked);
    setWatchedState(newWatched);
    await fetch('/api/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, movieId, liked: newLiked, watched: newWatched, type }),
    });
    onChange?.({ liked: newLiked, watched: newWatched });
  };

  return (
    <div className="flex gap-2 mt-2">
      <button
        className={`px-3 py-1 rounded ${likeState ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        onClick={() => update(true, watchedState)}
      >Like</button>
      <button
        className={`px-3 py-1 rounded ${!likeState ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        onClick={() => update(false, watchedState)}
      >Dislike</button>
      <button
        className={`px-3 py-1 rounded ${watchedState ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        onClick={() => update(likeState, !watchedState)}
      >Watched</button>
    </div>
  );
} 