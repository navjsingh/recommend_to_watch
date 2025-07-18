import { NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

let genreCache: { movie: Record<number, string>; tv: Record<number, string> } | null = null;

async function getGenres() {
  if (genreCache) return genreCache;
  const [movieRes, tvRes] = await Promise.all([
    axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`),
    axios.get(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`),
  ]);
  genreCache = {
    movie: Object.fromEntries(movieRes.data.genres.map((g: any) => [g.id, g.name])),
    tv: Object.fromEntries(tvRes.data.genres.map((g: any) => [g.id, g.name])),
  };
  return genreCache;
}

function mapMovie(tmdbMovie: any, genres: { movie: Record<number, string>; tv: Record<number, string> }) {
  const isTV = !!tmdbMovie.first_air_date;
  const genreMap = isTV ? genres.tv : genres.movie;
  return {
    id: tmdbMovie.id,
    title: tmdbMovie.title || tmdbMovie.name,
    image: tmdbMovie.poster_path ? TMDB_IMAGE_BASE + tmdbMovie.poster_path : '',
    type: tmdbMovie.media_type || (isTV ? 'series' : 'movie'),
    description: tmdbMovie.overview,
    year: (tmdbMovie.release_date || tmdbMovie.first_air_date || '').slice(0, 4),
    rating: tmdbMovie.vote_average,
    genres: (tmdbMovie.genre_ids || []).map((id: number) => genreMap[id]).filter(Boolean),
    streaming: [], // To be filled in details endpoint
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const page = searchParams.get('page') || '1';

  let tmdbUrl = '';
  if (query) {
    tmdbUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
  } else {
    tmdbUrl = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&page=${page}`;
  }

  try {
    const genres = await getGenres();
    const res = await axios.get(tmdbUrl);
    const results = res.data.results
      .filter((m: any) => m.media_type !== 'person')
      .map((m: any) => mapMovie(m, genres));

    // Deduplicate by id+type
    const seen = new Set();
    const uniqueResults = results.filter((item: any) => {
      const key = `${item.id}-${item.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ results: uniqueResults, page: res.data.page, total_pages: res.data.total_pages });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch from TMDb' }, { status: 500 });
  }
} 