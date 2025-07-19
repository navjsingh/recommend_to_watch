import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test if tables exist by counting records
    const userCount = await prisma.user.count();
    const interactionCount = await prisma.interaction.count();
    
    console.log(`Found ${userCount} users and ${interactionCount} interactions`);
    
    await prisma.$disconnect();
    
    return res.status(200).json({
      success: true,
      message: 'Database connection successful',
      stats: {
        users: userCount,
        interactions: interactionCount
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    await prisma.$disconnect();
    
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 