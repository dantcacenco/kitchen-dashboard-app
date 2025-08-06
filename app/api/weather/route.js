import { NextResponse } from 'next/server';

export async function GET() {
  const lat = process.env.NEXT_PUBLIC_WEATHER_LAT;
  const lon = process.env.NEXT_PUBLIC_WEATHER_LON;
  
  try {
    // Open-Meteo API - completely free!
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America/New_York&forecast_days=7`
    );
    
    const data = await response.json();
    
    // Transform to a simpler format
    const weather = {
      current: {
        temp: data.current.temperature_2m,
        feels_like: data.current.apparent_temperature,
        humidity: data.current.relative_humidity_2m,
        wind_speed: data.current.wind_speed_10m,
        weather_code: data.current.weather_code,
        description: getWeatherDescription(data.current.weather_code)
      },
      daily: data.daily.time.map((date, i) => ({
        date,
        temp_max: data.daily.temperature_2m_max[i],
        temp_min: data.daily.temperature_2m_min[i],
        weather_code: data.daily.weather_code[i],
        precipitation_probability: data.daily.precipitation_probability_max[i],
        description: getWeatherDescription(data.daily.weather_code[i])
      }))
    };
    
    return NextResponse.json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

// Convert weather codes to descriptions
function getWeatherDescription(code) {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return weatherCodes[code] || 'Unknown';
}
