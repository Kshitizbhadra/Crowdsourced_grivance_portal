import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';

// Simple in-memory cache: key = "lat3dp,lng3dp" → ward string
const wardCache = new Map();

/**
 * Round coordinate to 3 decimal places for cache key (~111m precision)
 */
const cacheKey = (lat, lng) =>
  `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;

/**
 * Reverse-geocode lat/lng to ward/neighbourhood using OpenStreetMap Nominatim.
 * Returns a human-readable ward name or "Unknown Ward" on failure.
 */
export const detectWard = async (lat, lng) => {
  const key = cacheKey(lat, lng);

  if (wardCache.has(key)) {
    return wardCache.get(key);
  }

  try {
    const response = await axios.get(NOMINATIM_BASE, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        'accept-language': 'en',
      },
      headers: {
        'User-Agent': 'CrowdSourcedCivicPortal/1.0 (contact@civic.gov.in)',
      },
      timeout: 5000,
    });

    const addr = response.data?.address || {};

    // Priority: suburb > neighbourhood > quarter > city_district > county > city
    const ward =
      addr.suburb ||
      addr.neighbourhood ||
      addr.quarter ||
      addr.city_district ||
      addr.county ||
      addr.city ||
      addr.town ||
      'Unknown Ward';

    wardCache.set(key, ward);

    // Evict cache if it grows too large (> 1000 entries)
    if (wardCache.size > 1000) {
      const firstKey = wardCache.keys().next().value;
      wardCache.delete(firstKey);
    }

    return ward;
  } catch (err) {
    console.warn(`[Nominatim] Ward detection failed for (${lat},${lng}):`, err.message);
    return 'Unknown Ward';
  }
};
