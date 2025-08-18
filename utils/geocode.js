import axios from 'axios';

export async function getCoordinatesFromAddress(address) {
  try {
    if (!address) {
      throw new Error('No address provided for geocoding');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATIONIQ_API_KEY}&q=${encodedAddress}&format=json&limit=1`;

    const response = await axios.get(url);

    if (response.data && response.data.length > 0) {
      const location = response.data[0];
      return {
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
      };
    } else {
      console.error('No results found from geocoding for address:', address);
      return null;
    }
  } catch (error) {
    console.error('Geocoding failed:', error.response?.status || '', error.message);
    return null;
  }
}
