import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../pages/api/auth/[...nextauth]';
import { prisma } from '../../../lib/prisma';

interface MovieRecommendation {
  id: number;
  title: string;
  image: string | null;
  type: 'movie' | 'tv';
  description: string;
  year: string;
  genres: string[];
  rating: number;
  similarityScore?: number;
  recommendationReason: string;
}

interface MovieDetails {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  media_type?: 'movie' | 'tv';
}

// Genre mapping from TMDb
const genreMap: { [key: number]: string } = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

export async function GET(request: NextRequest) {
  try {
    console.log('Recommendations API - Starting request');
    
    const session = await getServerSession(authOptions);
    console.log('Recommendations API - Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user?.email) {
      console.log('Recommendations API - Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email } 
    });
    
    if (!user) {
      console.log('Recommendations API - User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Recommendations API - User found:', user.id);

    // Get user's interactions
    const userInteractions = await prisma.interaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Recommendations API - User interactions:', userInteractions.length);

    if (userInteractions.length === 0) {
      // If no interactions, return popular content
      console.log('Recommendations API - No interactions, returning popular content');
      const popularRecommendations = await getPopularRecommendations();
      return NextResponse.json(popularRecommendations);
    }

    // Get recommendations based on user preferences
    const recommendations = await generateRecommendations(userInteractions);
    console.log('Recommendations API - Generated recommendations:', recommendations.length);
    
    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Recommendations API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

async function generateRecommendations(userInteractions: any[]): Promise<MovieRecommendation[]> {
  const likedMovies = userInteractions.filter(i => i.liked).map(i => i.movieId);
  const dislikedMovies = userInteractions.filter(i => !i.liked).map(i => i.movieId);
  
  console.log('Generate recommendations - Liked movies:', likedMovies.length);
  console.log('Generate recommendations - Disliked movies:', dislikedMovies.length);

  // Get all user interactions for collaborative filtering
  const allInteractions = await prisma.interaction.findMany({
    include: { user: true }
  });

  // Find similar users
  const similarUsers = findSimilarUsers(userInteractions, allInteractions);
  console.log('Generate recommendations - Similar users found:', similarUsers.length);
  
  // Get movie details for liked movies
  const likedMovieDetails = await Promise.all(
    likedMovies.map(id => fetchMovieDetails(id))
  );

  // Generate different types of recommendations
  let collaborativeRecs: MovieRecommendation[] = [];
  let contentBasedRecs: MovieRecommendation[] = [];
  let genreBasedRecs: MovieRecommendation[] = [];

  try {
    collaborativeRecs = await getCollaborativeRecommendations(similarUsers, likedMovies, dislikedMovies);
  } catch (error) {
    console.error('Error in collaborative recommendations:', error);
  }

  try {
    contentBasedRecs = await getContentBasedRecommendations(likedMovieDetails, dislikedMovies);
  } catch (error) {
    console.error('Error in content-based recommendations:', error);
  }

  try {
    genreBasedRecs = await getGenreBasedRecommendations(likedMovieDetails, dislikedMovies);
  } catch (error) {
    console.error('Error in genre-based recommendations:', error);
  }
  
  console.log('Generate recommendations - Collaborative:', collaborativeRecs.length);
  console.log('Generate recommendations - Content-based:', contentBasedRecs.length);
  console.log('Generate recommendations - Genre-based:', genreBasedRecs.length);

  // Combine and rank recommendations
  const allRecommendations = [
    ...collaborativeRecs.map(r => ({ ...r, weight: 0.4 })),
    ...contentBasedRecs.map(r => ({ ...r, weight: 0.35 })),
    ...genreBasedRecs.map(r => ({ ...r, weight: 0.25 }))
  ];

  // Remove duplicates and calculate final scores
  const uniqueRecs = new Map<number, MovieRecommendation & { weight: number }>();
  
  allRecommendations.forEach(rec => {
    if (uniqueRecs.has(rec.id)) {
      const existing = uniqueRecs.get(rec.id)!;
      existing.weight += rec.weight;
      existing.similarityScore = (existing.similarityScore || 0) + (rec.similarityScore || 0);
    } else {
      uniqueRecs.set(rec.id, rec);
    }
  });

  // Convert to array and sort by weight
  let finalRecommendations = Array.from(uniqueRecs.values())
    .map(({ weight, ...rec }) => ({
      ...rec,
      similarityScore: rec.similarityScore || 0
    }))
    .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
    .slice(0, 20);

  // If no recommendations found, get popular content as fallback
  if (finalRecommendations.length === 0) {
    console.log('No recommendations found, getting popular content as fallback');
    try {
      const popularRecs = await getPopularRecommendations();
      finalRecommendations = popularRecs.map(rec => ({
        ...rec,
        similarityScore: rec.similarityScore || 0
      }));
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      // Return a basic recommendation
      finalRecommendations = [{
        id: 1,
        title: 'Start exploring movies to get personalized recommendations!',
        image: null,
        type: 'movie' as const,
        description: 'Like and dislike movies to help us understand your preferences.',
        year: '2024',
        genres: ['All Genres'],
        rating: 0,
        similarityScore: 0,
        recommendationReason: 'Get started with recommendations'
      }];
    }
  }

  console.log('Generate recommendations - Final recommendations:', finalRecommendations.length);
  return finalRecommendations;
}

function findSimilarUsers(userInteractions: any[], allInteractions: any[]): string[] {
  if (userInteractions.length === 0) return [];
  
  const userMovieIds = new Set(userInteractions.map(i => i.movieId));
  const userLikes = new Set(userInteractions.filter(i => i.liked).map(i => i.movieId));
  
  const userSimilarities = new Map<string, number>();
  
  // Group interactions by user
  const userGroups = new Map<string, any[]>();
  allInteractions.forEach(interaction => {
    if (interaction.userId !== userInteractions[0]?.userId) { // Exclude current user
      if (!userGroups.has(interaction.userId)) {
        userGroups.set(interaction.userId, []);
      }
      userGroups.get(interaction.userId)!.push(interaction);
    }
  });

  // Calculate similarity scores
  userGroups.forEach((interactions, userId) => {
    const otherMovieIds = new Set(interactions.map((i: any) => i.movieId));
    const otherLikes = new Set(interactions.filter((i: any) => i.liked).map((i: any) => i.movieId));
    
    // Jaccard similarity for movie overlap
    const intersection = new Set([...userMovieIds].filter(x => otherMovieIds.has(x)));
    const union = new Set([...userMovieIds, ...otherMovieIds]);
    const movieSimilarity = intersection.size / union.size;
    
    // Similarity for like preferences
    const likeIntersection = new Set([...userLikes].filter(x => otherLikes.has(x)));
    const likeUnion = new Set([...userLikes, ...otherLikes]);
    const likeSimilarity = likeUnion.size > 0 ? likeIntersection.size / likeUnion.size : 0;
    
    const totalSimilarity = (movieSimilarity + likeSimilarity) / 2;
    userSimilarities.set(userId, totalSimilarity);
  });

  // Return top similar users
  return Array.from(userSimilarities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId]) => userId);
}

async function getCollaborativeRecommendations(similarUsers: string[], likedMovies: string[], dislikedMovies: string[]): Promise<MovieRecommendation[]> {
  const recommendations: MovieRecommendation[] = [];
  
  if (similarUsers.length === 0) return recommendations;
  
  // Get movies liked by similar users
  const similarUserInteractions = await prisma.interaction.findMany({
    where: {
      userId: { in: similarUsers },
      liked: true,
      movieId: { notIn: [...likedMovies, ...dislikedMovies] }
    }
  });

  // Count movie occurrences
  const movieCounts = new Map<string, number>();
  similarUserInteractions.forEach(interaction => {
    movieCounts.set(interaction.movieId, (movieCounts.get(interaction.movieId) || 0) + 1);
  });

  // Get top recommended movies
  const topMovies = Array.from(movieCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Fetch movie details
  for (const [movieId, count] of topMovies) {
    const movieDetails = await fetchMovieDetails(movieId);
    if (movieDetails) {
      recommendations.push({
        id: movieDetails.id,
        title: movieDetails.title,
        image: movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : null,
        type: movieDetails.media_type === 'tv' ? 'tv' as const : 'movie' as const,
        description: movieDetails.overview,
        year: (movieDetails.release_date || movieDetails.first_air_date) ? 
          (movieDetails.release_date || movieDetails.first_air_date)!.split('-')[0] : 'Unknown',
        genres: movieDetails.genre_ids.map((id: number) => genreMap[id] || 'Unknown'),
        rating: movieDetails.vote_average,
        similarityScore: count / similarUsers.length,
        recommendationReason: `Liked by ${count} users with similar taste`
      });
    }
  }

  return recommendations;
}

async function getContentBasedRecommendations(likedMovieDetails: (MovieDetails | null)[], dislikedMovies: string[]): Promise<MovieRecommendation[]> {
  const recommendations: MovieRecommendation[] = [];
  const validLikedMovies = likedMovieDetails.filter(m => m !== null) as MovieDetails[];
  
  if (validLikedMovies.length === 0) return recommendations;

  // Extract common genres from liked movies
  const genreCounts = new Map<number, number>();
  validLikedMovies.forEach(movie => {
    if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
      movie.genre_ids.forEach(genreId => {
        genreCounts.set(genreId, (genreCounts.get(genreId) || 0) + 1);
      });
    }
  });

  // Get top genres
  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genreId]) => genreId);

  // If no genres found, return empty recommendations
  if (topGenres.length === 0) {
    console.log('No genres found in liked movies, skipping content-based recommendations');
    return recommendations;
  }

  // Get popular movies in those genres
  for (const genreId of topGenres) {
    const genreMovies = await fetchPopularMoviesByGenre(genreId);
    const filteredMovies = genreMovies.filter(movie => 
      !dislikedMovies.includes(movie.id.toString()) &&
      !validLikedMovies.some(liked => liked.id === movie.id)
    );
    
    recommendations.push(...filteredMovies.slice(0, 5).map(movie => ({
      ...movie,
      similarityScore: genreCounts.get(genreId)! / validLikedMovies.length,
      recommendationReason: `Similar to your liked ${genreMap[genreId]} content`
    })));
  }

  return recommendations;
}

async function getGenreBasedRecommendations(likedMovieDetails: (MovieDetails | null)[], dislikedMovies: string[]): Promise<MovieRecommendation[]> {
  const recommendations: MovieRecommendation[] = [];
  const validLikedMovies = likedMovieDetails.filter(m => m !== null) as MovieDetails[];
  
  if (validLikedMovies.length === 0) return recommendations;

  // Get trending movies
  const trendingMovies = await fetchTrendingMovies();
  const filteredMovies = trendingMovies.filter(movie => 
    !dislikedMovies.includes(movie.id.toString()) &&
    !validLikedMovies.some(liked => liked.id === movie.id)
  );

  return filteredMovies.slice(0, 10).map(movie => ({
    ...movie,
    similarityScore: movie.rating / 10,
    recommendationReason: 'Trending now'
  }));
}

async function getPopularRecommendations(): Promise<MovieRecommendation[]> {
  try {
    console.log('Getting popular recommendations');
    const trendingMovies = await fetchTrendingMovies();
    console.log('Fetched trending movies:', trendingMovies.length);
    return trendingMovies.slice(0, 20).map(movie => ({
      ...movie,
      similarityScore: movie.rating / 10,
      recommendationReason: 'Popular and highly rated'
    }));
  } catch (error) {
    console.error('Error getting popular recommendations:', error);
    // Return fallback recommendations
    return [
      {
        id: 1,
        title: 'Start exploring movies to get personalized recommendations!',
        image: null,
        type: 'movie' as const,
        description: 'Like and dislike movies to help us understand your preferences.',
        year: '2024',
        genres: ['All Genres'],
        rating: 0,
        similarityScore: 0,
        recommendationReason: 'Get started with recommendations'
      }
    ];
  }
}

async function fetchMovieDetails(movieId: string): Promise<MovieDetails | null> {
  try {
    // Try movie first
    const movieRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.TMDB_API_KEY}`
    );
    const movieData = await movieRes.json();
    
    if (movieData.success === false) {
      // Try TV series
      const tvRes = await fetch(
        `https://api.themoviedb.org/3/tv/${movieId}?api_key=${process.env.TMDB_API_KEY}`
      );
      const tvData = await tvRes.json();
      
      if (tvData.success === false) return null;
      
      return {
        id: tvData.id,
        title: tvData.name,
        poster_path: tvData.poster_path,
        overview: tvData.overview,
        first_air_date: tvData.first_air_date,
        vote_average: tvData.vote_average,
        genre_ids: tvData.genre_ids || [],
        media_type: 'tv'
      };
    }
    
    return {
      id: movieData.id,
      title: movieData.title,
      poster_path: movieData.poster_path,
      overview: movieData.overview,
      release_date: movieData.release_date,
      vote_average: movieData.vote_average,
      genre_ids: movieData.genre_ids || [],
      media_type: 'movie'
    };
  } catch (error) {
    console.error(`Error fetching movie details for ${movieId}:`, error);
    return null;
  }
}

async function fetchPopularMoviesByGenre(genreId: number): Promise<MovieRecommendation[]> {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1`
    );
    const data = await response.json();
    
    return data.results.slice(0, 10).map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      type: 'movie' as const,
      description: movie.overview,
      year: movie.release_date ? movie.release_date.split('-')[0] : 'Unknown',
      genres: movie.genre_ids.map((id: number) => genreMap[id] || 'Unknown'),
      rating: movie.vote_average,
      recommendationReason: `Popular ${genreMap[genreId]} content`
    }));
  } catch (error) {
    console.error(`Error fetching movies for genre ${genreId}:`, error);
    return [];
  }
}

async function fetchTrendingMovies(): Promise<MovieRecommendation[]> {
  try {
    console.log('Fetching trending movies from TMDB');
    
    if (!process.env.TMDB_API_KEY) {
      console.error('TMDB_API_KEY not found');
      throw new Error('TMDB API key not configured');
    }
    
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${process.env.TMDB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('TMDB API response not ok:', response.status, response.statusText);
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('TMDB API response received, results:', data.results?.length || 0);
    
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid TMDB API response format:', data);
      throw new Error('Invalid TMDB API response format');
    }
    
    return data.results.slice(0, 20).map((item: any) => ({
      id: item.id,
      title: item.title || item.name || 'Unknown Title',
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
      type: item.media_type === 'tv' ? 'tv' as const : 'movie' as const,
      description: item.overview || 'No description available',
      year: (item.release_date || item.first_air_date) ? 
        (item.release_date || item.first_air_date).split('-')[0] : 'Unknown',
      genres: item.genre_ids ? item.genre_ids.map((id: number) => genreMap[id] || 'Unknown') : [],
      rating: item.vote_average || 0,
      recommendationReason: 'Trending now'
    }));
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    throw error; // Re-throw to be handled by caller
  }
} 