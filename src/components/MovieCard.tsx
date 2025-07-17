import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MovieCardProps {
  id: number;
  title: string;
  image: string;
  type: string;
}

export default function MovieCard({ id, title, image, type }: MovieCardProps) {
  return (
    <Link href={`/details?id=${id}`} className="block group relative rounded-lg overflow-hidden shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200">
      <div className="relative w-full aspect-[2/3] bg-gray-200">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-center group-hover:brightness-75 transition duration-200"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-white text-lg font-semibold p-4 w-full truncate" title={title}>{title}</span>
        </div>
      </div>
      <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{type}</span>
    </Link>
  );
} 