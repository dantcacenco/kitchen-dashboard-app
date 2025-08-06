import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs
const databases = {
  transactions: process.env.NOTION_TRANSACTIONS_DB_ID,
  goals: process.env.NOTION_GOALS_DB_ID,
  achievements: process.env.NOTION_ACHIEVEMENTS_DB_ID,
  shopping: process.env.NOTION_SHOPPING_DB_ID,
  settings: process.env.NOTION_SETTINGS_DB_ID,
};

// GET - Fetch data from Notion
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    
    if (!database || !databases[database]) {
      return NextResponse.json(
        { error: 'Invalid database parameter' },
        { status: 400 }
      );
    }
    
    const response = await notion.databases.query({
      database_id: databases[database],
      sorts: database === 'shopping' 
        ? [{ property: 'Date_Added', direction: 'ascending' }]
        : database === 'transactions'
        ? [{ property: 'Date', direction: 'descending' }]
        : [],
    });
    
    return NextResponse.json(response.results || []);
  } catch (error) {
    console.error('Notion GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Notion' },
      { status: 500 }
    );
  }
}

// POST - Create new entries
export async function POST(request) {
  try {
    const body = await request.json();
    const { database, data } = body;
    
    if (!database || !databases[database]) {
      return NextResponse.json(
        { error: 'Invalid database parameter' },
        { status: 400 }
      );
    }
    
    let properties = {};
    
    // Build properties based on database type
    switch (database) {
      case 'transactions':
        properties = {
          Date: { date: { start: data.Date } },
          Amount: { number: data.Amount },
          Category: { select: { name: data.Category } },
          Description: { 
            rich_text: [{ text: { content: data.Description || '' } }] 
          },
          Tax_Deductible: { checkbox: data.Tax_Deductible || false }
        };
        break;
        
      case 'shopping':
        properties = {
          Item: { 
            title: [{ text: { content: data.Item } }] 
          },
          Purchased: { checkbox: data.Purchased || false },
          Category: data.Category ? { select: { name: data.Category } } : undefined,
          Priority: { select: { name: 'Normal' } }
        };
        break;
        
      case 'goals':
        properties = {
          Goal_Name: { 
            title: [{ text: { content: data.Goal_Name } }] 
          },
          Target_Amount: { number: data.Target_Amount },
          Current_Amount: { number: data.Current_Amount || 0 },
          Category: { select: { name: data.Category } },
          Priority: { select: { name: data.Priority || 'Medium' } },
          Monthly_Contribution: { number: data.Monthly_Contribution || 0 },
          Icon: { 
            rich_text: [{ text: { content: data.Icon || '🎯' } }] 
          },
          Color: { 
            rich_text: [{ text: { content: data.Color || '#007AFF' } }] 
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Database not configured for POST' },
          { status: 400 }
        );
    }
    
    // Remove undefined properties
    Object.keys(properties).forEach(key => 
      properties[key] === undefined && delete properties[key]
    );
    
    const response = await notion.pages.create({
      parent: { database_id: databases[database] },
      properties
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create in Notion', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing entries
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { pageId, data } = body;
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID required for updates' },
        { status: 400 }
      );
    }
    
    let properties = {};
    
    // Build update properties dynamically
    if (data.Purchased !== undefined) {
      properties.Purchased = { checkbox: data.Purchased };
    }
    if (data.Current_Amount !== undefined) {
      properties.Current_Amount = { number: data.Current_Amount };
    }
    if (data.Target_Amount !== undefined) {
      properties.Target_Amount = { number: data.Target_Amount };
    }
    if (data.Monthly_Contribution !== undefined) {
      properties.Monthly_Contribution = { number: data.Monthly_Contribution };
    }
    
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update in Notion', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Archive entries
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { pageId } = body;
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID required for deletion' },
        { status: 400 }
      );
    }
    
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete from Notion' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
