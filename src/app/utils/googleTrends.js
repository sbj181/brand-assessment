export async function getTrends(url) {
  try {
    const response = await fetch('/api/trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch trends data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching trends:', error);
    throw error;
  }
} 