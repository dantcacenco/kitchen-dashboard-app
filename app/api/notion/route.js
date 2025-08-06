import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databases = {
  transactions: process.env.NOTION_TRANSACTIONS_DB_ID,
  goals: process.env.NOTION_GOALS_DB_ID,
  achievements: process.env.NOTION_ACHIEVEMENTS_DB_ID,
  shopping: process.env.NOTION_SHOPPING_DB_ID,
  settings: process.env.NOTION_SETTINGS_DB_ID,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');
  
  if (!databases[database]) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }
  
  try {
    const response = await notion.databases.query({
      database_id: databases[database],
    });
    
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const { database, properties } = body;
  
  if (!databases[database]) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }
  
  try {
    const response = await notion.pages.create({
      parent: { database_id: databases[database] },
      properties,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
