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
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    console.log(`Fetching interaction for movie ${id}`);
    fetch(`/api/interaction?movieId=${id}`)
      .then(res => res.json())
      .then(data => {
        console.log(`Interaction data for movie ${id}:`, data);
        setInteraction(data);
      })
      .catch(error => {
        console.error(`Error fetching interaction for movie ${id}:`, error);
      });
  }, [id, session]);

  const updateInteraction = async (liked: boolean | null) => {
    if (!session) {
      signIn();
      return;
    }
    
    console.log(`Updating interaction for movie ${id} to liked: ${liked}`);
    
    const newState = {
      liked: liked !== null ? liked : interaction?.liked || false,
    };
    setInteraction(newState);
    
    // Show feedback
    setFeedback(liked ? 'Added to Likes' : 'Added to Dislikes');
    
    // Hide feedback after 2 seconds
    setTimeout(() => setFeedback(null), 2000);
    
    try {
      const response = await fetch('/api/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: id, liked: newState.liked, type }),
      });
      
      const result = await response.json();
      console.log(`API response for movie ${id}:`, result);
      
      if (!response.ok) {
        console.error(`Error saving interaction for movie ${id}:`, result);
        // Show error feedback
        setFeedback(`Error: ${result.error || 'Failed to save'}`);
        setTimeout(() => setFeedback(null), 3000);
        // Revert the state if there was an error
        setInteraction(interaction);
      } else {
        // Show success feedback
        setFeedback(liked ? 'Added to Likes!' : 'Added to Dislikes!');
        setTimeout(() => setFeedback(null), 2000);
      }
    } catch (error) {
      console.error(`Network error saving interaction for movie ${id}:`, error);
      // Show error feedback
      setFeedback('Network error - please try again');
      setTimeout(() => setFeedback(null), 3000);
      // Revert the state if there was an error
      setInteraction(interaction);
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
          
          {/* Feedback overlay */}
          {feedback && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-20">
              <div className={`px-4 py-2 rounded-lg font-semibold text-sm shadow-lg animate-pulse ${
                feedback.includes('Error') || feedback.includes('Network error') 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white text-gray-800'
              }`}>
                {feedback}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
} 