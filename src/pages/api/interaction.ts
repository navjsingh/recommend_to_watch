import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Interaction API - Method: ${req.method}`);
  
  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Interaction API - Session:', session ? 'Found' : 'Not found');
    
    if (!session || !session.user?.email) {
      console.log('Interaction API - Not authenticated');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    console.log('Interaction API - User found:', user ? 'Yes' : 'No');
    
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (req.method === 'POST') {
      const { movieId, liked } = req.body;
      console.log(`Interaction API - POST request for movie ${movieId}, liked: ${liked}`);
      console.log('Interaction API - Request body:', req.body);
      
      if (!movieId || typeof liked !== 'boolean') {
        console.log('Interaction API - Missing fields:', { movieId, liked });
        return res.status(400).json({ error: 'Missing fields', received: { movieId, liked } });
      }
      
      try {
        const existing = await prisma.interaction.findFirst({ 
          where: { 
            userId: user.id, 
            movieId: String(movieId) 
          } 
        });
        console.log('Interaction API - Existing interaction:', existing ? 'Found' : 'Not found');
        
        let result;
        if (existing) {
          result = await prisma.interaction.update({ 
            where: { id: existing.id }, 
            data: { liked } 
          });
          console.log('Interaction API - Updated existing interaction:', result);
        } else {
          result = await prisma.interaction.create({ 
            data: { 
              userId: user.id, 
              movieId: String(movieId), 
              liked 
            } 
          });
          console.log('Interaction API - Created new interaction:', result);
        }
        
        return res.status(200).json({ success: true, interaction: result });
      } catch (dbError) {
        console.error('Interaction API - Database error:', dbError);
        return res.status(500).json({ 
          error: 'Database error', 
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        });
      }
    }

    if (req.method === 'DELETE') {
      const { movieId } = req.query;
      console.log(`Interaction API - DELETE request for movie ${movieId}`);
      
      if (!movieId) {
        return res.status(400).json({ error: 'Missing movieId' });
      }
      
      try {
        const existing = await prisma.interaction.findFirst({ 
          where: { 
            userId: user.id, 
            movieId: String(movieId) 
          } 
        });
        
        if (existing) {
          await prisma.interaction.delete({ where: { id: existing.id } });
          console.log('Interaction API - Deleted interaction');
          return res.status(200).json({ success: true });
        } else {
          return res.status(404).json({ error: 'Interaction not found' });
        }
      } catch (dbError) {
        console.error('Interaction API - Database error in DELETE:', dbError);
        return res.status(500).json({ 
          error: 'Database error', 
          details: dbError instanceof Error ? dbError.message : 'Unknown error'
        });
      }
    }

    if (req.method === 'GET') {
      const { movieId, all, liked, disliked } = req.query;
      console.log(`Interaction API - GET request, movieId: ${movieId}, all: ${all}, liked: ${liked}, disliked: ${disliked}`);
      
      try {
        if (liked === 'true') {
          // Fetch liked movies with their details
          const likedInteractions = await prisma.interaction.findMany({ 
            where: { 
              userId: user.id,
              liked: true
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          
          console.log(`Interaction API - Found ${likedInteractions.length} liked interactions`);
          
          // Fetch movie details for each liked interaction
          const likedMovies = await Promise.all(
            likedInteractions.map(async (interaction) => {
              try {
                // Fetch movie details from TMDb API
                const movieRes = await fetch(
                  `https://api.themoviedb.org/3/movie/${interaction.movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
                );
                const movieData = await movieRes.json();
                
                if (movieData.success === false) {
                  // Try TV series if movie not found
                  const tvRes = await fetch(
                    `https://api.themoviedb.org/3/tv/${interaction.movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
                  );
                  const tvData = await tvRes.json();
                  
                  if (tvData.success === false) {
                    return null;
                  }
                  
                  return {
                    id: parseInt(interaction.movieId),
                    title: tvData.name,
                    image: tvData.poster_path ? `https://image.tmdb.org/t/p/w500${tvData.poster_path}` : null,
                    type: 'tv',
                    year: tvData.first_air_date ? tvData.first_air_date.split('-')[0] : null,
                    rating: tvData.vote_average
                  };
                }
                
                return {
                  id: parseInt(interaction.movieId),
                  title: movieData.title,
                  image: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                  type: 'movie',
                  year: movieData.release_date ? movieData.release_date.split('-')[0] : null,
                  rating: movieData.vote_average
                };
              } catch (error) {
                console.error(`Error fetching movie ${interaction.movieId}:`, error);
                return null;
              }
            })
          );
          
          const validMovies = likedMovies.filter(movie => movie !== null);
          console.log(`Interaction API - Successfully fetched ${validMovies.length} movie details`);
          
          return res.status(200).json(validMovies);
        }

        if (disliked === 'true') {
          // Fetch disliked movies with their details
          const dislikedInteractions = await prisma.interaction.findMany({ 
            where: { 
              userId: user.id,
              liked: false
            },
            orderBy: {
              createdAt: 'desc'
            }
          });
          
          console.log(`Interaction API - Found ${dislikedInteractions.length} disliked interactions`);
          
          // Fetch movie details for each disliked interaction
          const dislikedMovies = await Promise.all(
            dislikedInteractions.map(async (interaction) => {
              try {
                // Fetch movie details from TMDb API
                const movieRes = await fetch(
                  `https://api.themoviedb.org/3/movie/${interaction.movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
                );
                const movieData = await movieRes.json();
                
                if (movieData.success === false) {
                  // Try TV series if movie not found
                  const tvRes = await fetch(
                    `https://api.themoviedb.org/3/tv/${interaction.movieId}?api_key=${process.env.TMDB_API_KEY}&append_to_response=credits`
                  );
                  const tvData = await tvRes.json();
                  
                  if (tvData.success === false) {
                    return null;
                  }
                  
                  return {
                    id: parseInt(interaction.movieId),
                    title: tvData.name,
                    image: tvData.poster_path ? `https://image.tmdb.org/t/p/w500${tvData.poster_path}` : null,
                    type: 'tv',
                    year: tvData.first_air_date ? tvData.first_air_date.split('-')[0] : null,
                    rating: tvData.vote_average
                  };
                }
                
                return {
                  id: parseInt(interaction.movieId),
                  title: movieData.title,
                  image: movieData.poster_path ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}` : null,
                  type: 'movie',
                  year: movieData.release_date ? movieData.release_date.split('-')[0] : null,
                  rating: movieData.vote_average
                };
              } catch (error) {
                console.error(`Error fetching movie ${interaction.movieId}:`, error);
                return null;
              }
            })
          );
          
          const validMovies = dislikedMovies.filter(movie => movie !== null);
          console.log(`Interaction API - Successfully fetched ${validMovies.length} movie details`);
          
          return res.status(200).json(validMovies);
        }
        
        if (all === 'true') {
          const interactions = await prisma.interaction.findMany({ where: { userId: user.id } });
          console.log(`Interaction API - Found ${interactions.length} interactions for user`);
          const result = interactions.reduce((acc, i) => {
            acc[i.movieId] = { liked: i.liked };
            return acc;
          }, {} as Record<string, { liked: boolean }>);
          return res.status(200).json(result);
        }
        if (movieId) {
          const interaction = await prisma.interaction.findFirst({ 
            where: { 
              userId: user.id, 
              movieId: String(movieId) 
            } 
          });
          console.log(`Interaction API - Interaction for movie ${movieId}:`, interaction);
          return res.status(200).json(interaction ? { liked: interaction.liked } : { liked: false });
        }
        return res.status(400).json({ error: 'Missing movieId' });
      } catch (dbError) {
        console.error('Interaction API - Database error in GET:', dbError);
        return res.status(500).json({ 
          error: 'Database error', 
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
          stack: dbError instanceof Error ? dbError.stack : undefined
        });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Interaction API - Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 