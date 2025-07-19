"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProfileMovieCardProps {
  id: number;
  title: string;
  image: string;
  type: string;
  year?: string;
  rating?: number;
  onRemove: (movieId: number) => void;
}

export default function ProfileMovieCard({ id, title, image, type, year, rating, onRemove }: ProfileMovieCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    try {
      const response = await fetch(`/api/interaction?movieId=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        onRemove(id);
      } else {
        console.error('Failed to remove movie');
      }
    } catch (error) {
      console.error('Error removing movie:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="group relative rounded-lg overflow-hidden shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200">
      <Link href={`/details?id=${id}&type=${type}`} className="block">
        <div className="relative w-full aspect-[2/3] bg-gray-200">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover object-center group-hover:brightness-75 transition duration-200"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
              No Image
            </div>
          )}
          {/* Top overlay: type, year, rating as separate pills */}
          <div className="absolute top-2 left-2 flex gap-2 z-10">
            <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full capitalize font-semibold shadow">{type}</span>
            {year && <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full shadow">{year}</span>}
            {rating !== undefined && <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 shadow">★ {rating.toFixed(1)}</span>}
          </div>
          {/* Title overlay on hover */}
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white text-lg font-semibold p-4 w-full truncate" title={title}>{title}</span>
          </div>
        </div>
      </Link>
      
      {/* Remove button - top right corner */}
      <button
        onClick={handleRemove}
        disabled={isRemoving}
        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 z-20 opacity-0 group-hover:opacity-100 disabled:opacity-50"
        title="Remove from list"
      >
        {isRemoving ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        )}
      </button>
    </div>
  );
} 