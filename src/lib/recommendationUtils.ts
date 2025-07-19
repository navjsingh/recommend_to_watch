// Utility functions for recommendation engine

export interface UserPreference {
  userId: string;
  movieId: string;
  liked: boolean;
  timestamp: Date;
}

export interface MovieSimilarity {
  movieId: string;
  similarityScore: number;
  commonGenres: string[];
  commonActors: string[];
}

export interface RecommendationScore {
  movieId: string;
  score: number;
  factors: {
    collaborative: number;
    contentBased: number;
    popularity: number;
    recency: number;
  };
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Find similar users based on interaction patterns
 */
export function findSimilarUsers(
  currentUserInteractions: UserPreference[],
  allUserInteractions: UserPreference[],
  minSimilarityThreshold: number = 0.1
): string[] {
  const currentUserLikes = new Set(
    currentUserInteractions
      .filter(i => i.liked)
      .map(i => i.movieId)
  );
  
  const currentUserDislikes = new Set(
    currentUserInteractions
      .filter(i => !i.liked)
      .map(i => i.movieId)
  );
  
  const userSimilarities = new Map<string, number>();
  
  // Group interactions by user
  const userGroups = new Map<string, UserPreference[]>();
  allUserInteractions.forEach(interaction => {
    if (!userGroups.has(interaction.userId)) {
      userGroups.set(interaction.userId, []);
    }
    userGroups.get(interaction.userId)!.push(interaction);
  });
  
  // Calculate similarity with each user
  userGroups.forEach((interactions, userId) => {
    const otherUserLikes = new Set(
      interactions
        .filter(i => i.liked)
        .map(i => i.movieId)
    );
    
    const otherUserDislikes = new Set(
      interactions
        .filter(i => !i.liked)
        .map(i => i.movieId)
    );
    
    // Calculate similarity for likes
    const likeSimilarity = calculateJaccardSimilarity(currentUserLikes, otherUserLikes);
    
    // Calculate similarity for dislikes
    const dislikeSimilarity = calculateJaccardSimilarity(currentUserDislikes, otherUserDislikes);
    
    // Overall similarity (weighted average)
    const totalSimilarity = (likeSimilarity * 0.7) + (dislikeSimilarity * 0.3);
    
    if (totalSimilarity >= minSimilarityThreshold) {
      userSimilarities.set(userId, totalSimilarity);
    }
  });
  
  // Return top similar users
  return Array.from(userSimilarities.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId]) => userId);
}

/**
 * Calculate content-based similarity between movies
 */
export function calculateContentSimilarity(
  movieA: { genres: string[]; actors?: string[]; director?: string },
  movieB: { genres: string[]; actors?: string[]; director?: string }
): number {
  let similarity = 0;
  let totalWeight = 0;
  
  // Genre similarity (weight: 0.6)
  const genreSimilarity = calculateJaccardSimilarity(
    new Set(movieA.genres),
    new Set(movieB.genres)
  );
  similarity += genreSimilarity * 0.6;
  totalWeight += 0.6;
  
  // Actor similarity (weight: 0.3)
  if (movieA.actors && movieB.actors) {
    const actorSimilarity = calculateJaccardSimilarity(
      new Set(movieA.actors),
      new Set(movieB.actors)
    );
    similarity += actorSimilarity * 0.3;
    totalWeight += 0.3;
  }
  
  // Director similarity (weight: 0.1)
  if (movieA.director && movieB.director) {
    const directorSimilarity = movieA.director === movieB.director ? 1 : 0;
    similarity += directorSimilarity * 0.1;
    totalWeight += 0.1;
  }
  
  return totalWeight > 0 ? similarity / totalWeight : 0;
}

/**
 * Calculate recommendation score for a movie
 */
export function calculateRecommendationScore(
  movieId: string,
  userInteractions: UserPreference[],
  similarUserInteractions: UserPreference[],
  moviePopularity: number,
  movieRecency: number
): RecommendationScore {
  const userLikes = new Set(
    userInteractions
      .filter(i => i.liked)
      .map(i => i.movieId)
  );
  
  const userDislikes = new Set(
    userInteractions
      .filter(i => !i.liked)
      .map(i => i.movieId)
  );
  
  // Skip if user has already interacted with this movie
  if (userLikes.has(movieId) || userDislikes.has(movieId)) {
    return {
      movieId,
      score: 0,
      factors: { collaborative: 0, contentBased: 0, popularity: 0, recency: 0 }
    };
  }
  
  // Collaborative filtering score
  const similarUserLikes = similarUserInteractions
    .filter(i => i.liked && i.movieId === movieId)
    .length;
  const collaborativeScore = similarUserLikes / Math.max(similarUserInteractions.length, 1);
  
  // Content-based score (simplified - would need movie details)
  const contentBasedScore = 0.5; // Placeholder
  
  // Popularity score (normalized)
  const popularityScore = Math.min(moviePopularity / 100, 1);
  
  // Recency score (newer movies get higher score)
  const recencyScore = Math.min(movieRecency / 10, 1);
  
  // Calculate final score with weights
  const finalScore = (
    collaborativeScore * 0.4 +
    contentBasedScore * 0.3 +
    popularityScore * 0.2 +
    recencyScore * 0.1
  );
  
  return {
    movieId,
    score: finalScore,
    factors: {
      collaborative: collaborativeScore,
      contentBased: contentBasedScore,
      popularity: popularityScore,
      recency: recencyScore
    }
  };
}

/**
 * Generate recommendation reason based on factors
 */
export function generateRecommendationReason(
  factors: RecommendationScore['factors'],
  similarUserCount: number = 0
): string {
  const reasons: string[] = [];
  
  if (factors.collaborative > 0.3) {
    reasons.push(`Liked by ${similarUserCount} users with similar taste`);
  }
  
  if (factors.contentBased > 0.5) {
    reasons.push('Similar to content you enjoy');
  }
  
  if (factors.popularity > 0.7) {
    reasons.push('Highly popular and well-rated');
  }
  
  if (factors.recency > 0.8) {
    reasons.push('New and trending');
  }
  
  if (reasons.length === 0) {
    reasons.push('Recommended based on your preferences');
  }
  
  return reasons.join(', ');
}

/**
 * Normalize scores to 0-1 range
 */
export function normalizeScores(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  
  return scores.map(score => 
    range > 0 ? (score - min) / range : 0.5
  );
}

/**
 * Apply diversity penalty to avoid recommending too many similar items
 */
export function applyDiversityPenalty(
  recommendations: RecommendationScore[],
  penaltyFactor: number = 0.1
): RecommendationScore[] {
  const penalized = [...recommendations];
  
  for (let i = 0; i < penalized.length; i++) {
    let penalty = 0;
    
    // Apply penalty based on position in list (encourage diversity)
    for (let j = 0; j < i; j++) {
      // This is a simplified penalty - in practice you'd compare movie features
      penalty += penaltyFactor * (1 / (i - j + 1));
    }
    
    penalized[i].score = Math.max(0, penalized[i].score - penalty);
  }
  
  return penalized.sort((a, b) => b.score - a.score);
} 