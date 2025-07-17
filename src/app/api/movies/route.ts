import { NextResponse } from 'next/server';

const movies = [
  {
    id: 1,
    title: 'Inception',
    image: '/images/inception.jpg',
    type: 'movie',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.',
    year: 2010,
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    streaming: [
      { service: 'Netflix', url: 'https://www.netflix.com/title/70131314' },
      { service: 'Prime', url: 'https://www.amazon.com/Inception-Leonardo-DiCaprio/dp/B003UYPRGE' }
    ],
  },
  {
    id: 2,
    title: 'Stranger Things',
    image: '/images/strangerthings.jpg',
    type: 'series',
    description: 'A group of young friends witness supernatural forces and secret government exploits in their small town.',
    year: 2016,
    genres: ['Drama', 'Fantasy', 'Horror'],
    streaming: [
      { service: 'Netflix', url: 'https://www.netflix.com/title/8057281' }
    ],
  },
  {
    id: 3,
    title: 'The Dark Knight',
    image: '/images/darkknight.jpg',
    type: 'movie',
    description: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.',
    year: 2008,
    genres: ['Action', 'Crime', 'Drama'],
    streaming: [
      { service: 'Prime', url: 'https://www.amazon.com/Dark-Knight-Christian-Bale/dp/B001F7AJSE' }
    ],
  },
  {
    id: 4,
    title: 'Breaking Bad',
    image: '/images/breakingbad.jpg',
    type: 'series',
    description: 'A high school chemistry teacher turned methamphetamine producer navigates the dangers of the criminal underworld.',
    year: 2008,
    genres: ['Crime', 'Drama', 'Thriller'],
    streaming: [
      { service: 'Netflix', url: 'https://www.netflix.com/title/70143836' }
    ],
  },
  {
    id: 5,
    title: 'Interstellar',
    image: '/images/interstellar.jpg',
    type: 'movie',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    year: 2014,
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    streaming: [
      { service: 'Prime', url: 'https://www.amazon.com/Interstellar-Matthew-McConaughey/dp/B00TU9UFTS' }
    ],
  },
  {
    id: 6,
    title: 'Money Heist',
    image: '/images/moneyheist.jpg',
    type: 'series',
    description: 'A criminal mastermind plans the biggest heist in recorded history.',
    year: 2017,
    genres: ['Action', 'Crime', 'Mystery'],
    streaming: [
      { service: 'Netflix', url: 'https://www.netflix.com/title/80192098' }
    ],
  },
  // Add more movies/series as needed
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  let results = movies;
  if (query) {
    results = movies.filter(m => m.title.toLowerCase().includes(query.toLowerCase()));
  }
  return NextResponse.json(results);
} 