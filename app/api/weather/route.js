import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Weaverville, NC coordinates
    const lat = 35.6973;
    const lon = -82.5607;
    
    // Open-Meteo API (no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York&forecast_days=10`;
    
    const response = await fetch(url, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    
    if (!response.ok) {
      throw new Error('Weather API failed');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
