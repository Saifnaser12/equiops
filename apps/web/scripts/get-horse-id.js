// Simple script to get the horse ID from the API
// This is a temporary solution - in a real app, you'd get this from user context

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getHorseId() {
  try {
    // First, let's try to get horses (we'll need to add this endpoint)
    // For now, we'll use a hardcoded approach
    console.log('Note: Using hardcoded horse ID for Desert Comet');
    console.log('In a real app, you would fetch this from the API or user context');
    return 'desert-comet-id'; // This will be replaced with actual ID
  } catch (error) {
    console.error('Error getting horse ID:', error);
    return 'desert-comet-id';
  }
}

getHorseId().then(id => {
  console.log('Horse ID:', id);
});