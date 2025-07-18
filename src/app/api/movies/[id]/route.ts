import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function getGenres() {
  const [movieRes, tvRes] = await Promise.all([
    axios.get(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`),
    axios.get(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`),
  ]);
  return {
    movie: Object.fromEntries(movieRes.data.genres.map((g: any) => [g.id, g.name])),
    tv: Object.fromEntries(tvRes.data.genres.map((g: any) => [g.id, g.name])),
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const type = req.nextUrl.searchParams.get('type') || 'movie'; // 'movie' or 'tv'
  try {
    const genres = await getGenres();
    const tmdbUrl = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`;
    const detailsRes = await axios.get(tmdbUrl);
    const details = detailsRes.data;
    const genreMap = type === 'tv' ? genres.tv : genres.movie;
    // Streaming providers
    let streaming = [];
    try {
      const provRes = await axios.get(`${TMDB_BASE_URL}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`);
      const providers = provRes.data.results?.US?.flatrate || [];
      streaming = providers.map((p: any) => ({
        service: p.provider_name,
        logo: p.logo_path ? TMDB_IMAGE_BASE + p.logo_path : '',
        url: p.provider_name === 'Netflix' ? 'https://www.netflix.com' : p.provider_name === 'Amazon Prime Video' ? 'https://www.primevideo.com' : '',
      }));
    } catch {}
    // Cast
    let cast = [];
    try {
      const creditsRes = await axios.get(`${TMDB_BASE_URL}/${type}/${id}/credits?api_key=${TMDB_API_KEY}`);
      cast = (creditsRes.data.cast || []).slice(0, 8).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile: c.profile_path ? TMDB_IMAGE_BASE + c.profile_path : '',
      }));
    } catch {}
    return NextResponse.json({
      id: details.id,
      title: details.title || details.name,
      image: details.poster_path ? TMDB_IMAGE_BASE + details.poster_path : '',
      type,
      description: details.overview,
      year: (details.release_date || details.first_air_date || '').slice(0, 4),
      genres: (details.genres || []).map((g: any) => g.name || genreMap[g.id]).filter(Boolean),
      runtime: details.runtime || details.episode_run_time?.[0] || null,
      cast,
      streaming,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch details from TMDb' }, { status: 500 });
  }
} 