"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signIn } from 'next-auth/react';

interface MovieCardProps {
  id: number;
  title: string;
  image: string;
  type: string;
  year?: string;
  rating?: number;
}

export default function MovieCard({ id, title, image, type, year, rating }: MovieCardProps) {
  const { data: session } = useSession();
  const [interaction, setInteraction] = useState<{ liked: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/interaction?userId=demo&movieId=${id}`)
      .then(res => res.json())
      .then(data => setInteraction(data));
  }, [id]);

  const updateInteraction = async (liked: boolean | null) => {
    if (!session) {
      signIn();
      return;
    }
    const newState = {
      liked: liked !== null ? liked : interaction?.liked || false,
    };
    setInteraction(newState);
    await fetch('/api/interaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'demo', movieId: id, ...newState }),
    });
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
          {/* Bottom overlay: Like/Dislike only, always green/red, bottom left */}
          <div className="absolute bottom-2 left-2 flex gap-3 z-10">
            <button
              className={`text-2xl ${interaction?.liked ? 'scale-110' : ''} hover:scale-125 transition cursor-pointer`}
              title="Like"
              onClick={e => { e.preventDefault(); updateInteraction(true); }}
              type="button"
              style={{ lineHeight: 1 }}
            >
              {/* Like (green) */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 22V9.24l7.29-7.29c.63-.63 1.71-.18 1.71.71V7h3c1.1 0 2 .9 2 2v2c0 .55-.45 1-1 1h-7.31l.95 8.55c.09.81-.54 1.45-1.35 1.45H7z" fill="currentColor"/>
              </svg>
            </button>
            <button
              className={`text-2xl ${interaction?.liked === false ? 'scale-110' : ''} hover:scale-125 transition cursor-pointer`}
              title="Dislike"
              onClick={e => { e.preventDefault(); updateInteraction(false); }}
              type="button"
              style={{ lineHeight: 1 }}
            >
              {/* Dislike (red) */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-red-500" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 2v12.76l-7.29 7.29c-.63.63-1.71.18-1.71-.71V17H5c-1.1 0-2-.9-2-2v-2c0-.55.45-1 1-1h7.31l-.95-8.55C10.27 2.64 10.9 2 11.71 2H17z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
} 