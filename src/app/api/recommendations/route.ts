import { NextResponse } from 'next/server';

const recommendations = [
  {
    id: 2,
    title: 'Stranger Things',
    image: '/images/strangerthings.jpg',
    type: 'series',
    description: 'A group of young friends witness supernatural forces and secret government exploits in their small town.',
    year: 2016,
    genres: ['Drama', 'Fantasy', 'Horror'],
    streaming: ['Netflix'],
  },
  {
    id: 3,
    title: 'The Dark Knight',
    image: '/images/darkknight.jpg',
    type: 'movie',
    description: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.',
    year: 2008,
    genres: ['Action', 'Crime', 'Drama'],
    streaming: ['Prime'],
  },
  {
    id: 5,
    title: 'Interstellar',
    image: '/images/interstellar.jpg',
    type: 'movie',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    year: 2014,
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    streaming: ['Prime'],
  },
];

export async function GET() {
  return NextResponse.json(recommendations);
} 