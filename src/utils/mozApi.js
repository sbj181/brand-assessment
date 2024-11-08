import axios from 'axios';

export const getMozMetrics = async (url) => {
  const endpoint = `https://lsapi.seomoz.com/v2/url_metrics`;
  const headers = {
    'Authorization': `Basic ${Buffer.from(`${process.env.MOZ_ACCESS_ID}:${process.env.MOZ_SECRET_KEY}`).toString('base64')}`,
    'Content-Type': 'application/json',
  };
  try {
    const response = await axios.post(endpoint, { target: url }, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching Moz metrics:', error);
    return null;
  }
};
