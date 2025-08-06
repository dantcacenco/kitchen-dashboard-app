// notion-setup.js
// Run this script to automatically create all databases in Notion

require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');
const fs = require('fs').promises;

// Load from environment variables
const NOTION_API_KEY = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID;

const notion = new Client({ auth: NOTION_API_KEY });

// Database schemas - using Notion's exact API format
const databases = {
  transactions: {
    title: 'Transactions',
    emoji: '💰',
    properties: {
      'Name': { title: {} },  // Every database needs a title property
      'Date': { date: {} },
      'Amount': { number: { format: 'dollar' } },
      'Category': { 
        select: { 
          options: [
            { name: 'Food', color: 'green' },
            { name: 'Gas', color: 'blue' },
            { name: 'Tools/Materials', color: 'brown' },
            { name: 'Office/Tech', color: 'purple' },
            { name: 'Professional Services', color: 'yellow' },
            { name: 'Housing', color: 'red' },
            { name: 'Travel', color: 'pink' },
            { name: 'Healthcare', color: 'orange' },
            { name: 'Personal', color: 'gray' },
            { name: 'Other', color: 'default' }
          ] 
        } 
      },
      'Description': { rich_text: {} },
      'Tax_Deductible': { checkbox: {} },
      'Receipt_URL': { files: {} },
      'Payment_Method': { 
        select: { 
          options: [
            { name: 'Credit Card 1', color: 'blue' },
            { name: 'Credit Card 2', color: 'green' },
            { name: 'Cash', color: 'yellow' },
            { name: 'Bank Transfer', color: 'purple' }
          ] 
        } 
      },
      'Tags': { 
        multi_select: { 
          options: [
            { name: 'Recurring', color: 'blue' },
            { name: 'One-time', color: 'green' },
            { name: 'Emergency', color: 'red' },
            { name: 'Planned', color: 'purple' }
          ] 
        } 
      },
      'Month': { 
        formula: { 
          expression: 'formatDate(prop("Date"), "YYYY-MM")' 
        } 
      }
    }
  },
  
  goals: {
    title: 'Financial Goals',
    emoji: '🎯',
    properties: {
      'Goal_Name': { title: {} },  // This is the title property
      'Target_Amount': { number: { format: 'dollar' } },
      'Current_Amount': { number: { format: 'dollar' } },
      'Deadline': { date: {} },
      'Priority': { 
        select: { 
          options: [
            { name: 'Critical', color: 'red' },
            { name: 'High', color: 'orange' },
            { name: 'Medium', color: 'yellow' },
            { name: 'Low', color: 'gray' }
          ] 
        } 
      },
      'Category': {
        select: { 
          options: [
            { name: 'Emergency', color: 'red' },
            { name: 'House', color: 'green' },
            { name: 'Travel', color: 'blue' },
            { name: 'Tax', color: 'yellow' },
            { name: 'Investment', color: 'purple' },
            { name: 'Debt', color: 'orange' }
          ] 
        }
      },
      'Monthly_Contribution': { number: { format: 'dollar' } },
      'Progress': { 
        formula: { 
          expression: 'round(prop("Current_Amount") / prop("Target_Amount") * 100)' 
        } 
      },
      'Icon': { rich_text: {} },
      'Color': { rich_text: {} },
      'Notes': { rich_text: {} }
    }
  },
  
  achievements: {
    title: 'Achievements',
    emoji: '🏆',
    properties: {
      'Achievement_Name': { title: {} },  // This is the title property
      'Date_Earned': { date: {} },
      'Badge_Icon': { rich_text: {} },
      'Description': { rich_text: {} },
      'Points': { number: {} },
      'Category': {
        select: { 
          options: [
            { name: 'Savings', color: 'green' },
            { name: 'Streak', color: 'orange' },
            { name: 'Milestone', color: 'purple' },
            { name: 'Challenge', color: 'blue' },
            { name: 'Special', color: 'yellow' }
          ] 
        }
      },
      'Requirement': { rich_text: {} }
    }
  },
  
  shopping: {
    title: 'Shopping List',
    emoji: '🛒',
    properties: {
      'Item': { title: {} },  // This is the title property
      'Quantity': { rich_text: {} },
      'Category': {
        select: { 
          options: [
            { name: 'Groceries', color: 'green' },
            { name: 'Household', color: 'blue' },
            { name: 'Personal', color: 'purple' },
            { name: 'Other', color: 'gray' }
          ] 
        }
      },
      'Purchased': { checkbox: {} },
      'Date_Added': { created_time: {} },
      'Date_Purchased': { date: {} },
      'Recurring': { checkbox: {} },
      'Priority': {
        select: { 
          options: [
            { name: 'Urgent', color: 'red' },
            { name: 'Normal', color: 'yellow' },
            { name: 'Low', color: 'gray' }
          ] 
        }
      }
    }
  },
  
  settings: {
    title: 'Settings',
    emoji: '⚙️',
    properties: {
      'Setting_Name': { title: {} },  // This is the title property
      'Value': { rich_text: {} },
      'Category': {
        select: { 
          options: [
            { name: 'System', color: 'blue' },
            { name: 'User', color: 'green' },
            { name: 'Financial', color: 'yellow' }
          ] 
        }
      },
      'Last_Updated': { last_edited_time: {} }
    }
  }
};

// Initial data for populating databases
const initialData = {
  goals: [
    {
      'Goal_Name': { title: [{ text: { content: 'Emergency Fund' } }] },
      'Target_Amount': { number: 6000 },
      'Current_Amount': { number: 0 },
      'Category': { select: { name: 'Emergency' } },
      'Priority': { select: { name: 'Critical' } },
      'Monthly_Contribution': { number: 200 },
      'Icon': { rich_text: [{ text: { content: '🛡️' } }] },
      'Color': { rich_text: [{ text: { content: '#FF6B6B' } }] }
    },
    {
      'Goal_Name': { title: [{ text: { content: 'House Down Payment' } }] },
      'Target_Amount': { number: 20000 },
      'Current_Amount': { number: 0 },
      'Category': { select: { name: 'House' } },
      'Priority': { select: { name: 'High' } },
      'Monthly_Contribution': { number: 300 },
      'Icon': { rich_text: [{ text: { content: '🏠' } }] },
      'Color': { rich_text: [{ text: { content: '#4ECDC4' } }] }
    },
    {
      'Goal_Name': { title: [{ text: { content: 'Retirement Investment' } }] },
      'Target_Amount': { number: 0 },
      'Current_Amount': { number: 0 },
      'Category': { select: { name: 'Investment' } },
      'Priority': { select: { name: 'High' } },
      'Monthly_Contribution': { number: 700 },
      'Icon': { rich_text: [{ text: { content: '📈' } }] },
      'Color': { rich_text: [{ text: { content: '#45B7D1' } }] },
      'Notes': { rich_text: [{ text: { content: 'Target: $1M by retirement' } }] }
    },
    {
      'Goal_Name': { title: [{ text: { content: 'Tax Savings' } }] },
      'Target_Amount': { number: 0 },
      'Current_Amount': { number: 0 },
      'Category': { select: { name: 'Tax' } },
      'Priority': { select: { name: 'Critical' } },
      'Monthly_Contribution': { number: 1000 },
      'Icon': { rich_text: [{ text: { content: '💰' } }] },
      'Color': { rich_text: [{ text: { content: '#F7DC6F' } }] },
      'Notes': { rich_text: [{ text: { content: '20% of gross income' } }] }
    },
    {
      'Goal_Name': { title: [{ text: { content: 'Travel Fund' } }] },
      'Target_Amount': { number: 2000 },
      'Current_Amount': { number: 0 },
      'Category': { select: { name: 'Travel' } },
      'Priority': { select: { name: 'Medium' } },
      'Monthly_Contribution': { number: 167 },
      'Icon': { rich_text: [{ text: { content: '✈️' } }] },
      'Color': { rich_text: [{ text: { content: '#BB8FCE' } }] }
    },
    {
      'Goal_Name': { title: [{ text: { content: 'Student Loan' } }] },
      'Target_Amount': { number: 17500 },
      'Current_Amount': { number: 17500 },
      'Category': { select: { name: 'Debt' } },
      'Priority': { select: { name: 'Medium' } },
      'Monthly_Contribution': { number: 300 },
      'Icon': { rich_text: [{ text: { content: '🎓' } }] },
      'Color': { rich_text: [{ text: { content: '#EC7063' } }] }
    }
  ],
  
  settings: [
    {
      'Setting_Name': { title: [{ text: { content: 'Tax_Rate' } }] },
      'Value': { rich_text: [{ text: { content: '0.20' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Monthly_Income' } }] },
      'Value': { rich_text: [{ text: { content: '6000' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Investment_Return' } }] },
      'Value': { rich_text: [{ text: { content: '0.08' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Loan_Rate' } }] },
      'Value': { rich_text: [{ text: { content: '0.0445' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Savings_Rate' } }] },
      'Value': { rich_text: [{ text: { content: '0.0425' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Min_Loan_Payment' } }] },
      'Value': { rich_text: [{ text: { content: '200' } }] },
      'Category': { select: { name: 'Financial' } }
    },
    {
      'Setting_Name': { title: [{ text: { content: 'Location' } }] },
      'Value': { rich_text: [{ text: { content: 'Weaverville, NC' } }] },
      'Category': { select: { name: 'User' } }
    }
  ],
  
  achievements: [
    {
      'Achievement_Name': { title: [{ text: { content: 'First Dollar' } }] },
      'Description': { rich_text: [{ text: { content: 'Save your first dollar' } }] },
      'Points': { number: 10 },
      'Category': { select: { name: 'Savings' } },
      'Badge_Icon': { rich_text: [{ text: { content: '💵' } }] },
      'Requirement': { rich_text: [{ text: { content: 'Save $1' } }] }
    },
    {
      'Achievement_Name': { title: [{ text: { content: 'Week Warrior' } }] },
      'Description': { rich_text: [{ text: { content: '7-day expense tracking streak' } }] },
      'Points': { number: 50 },
      'Category': { select: { name: 'Streak' } },
      'Badge_Icon': { rich_text: [{ text: { content: '🔥' } }] },
      'Requirement': { rich_text: [{ text: { content: 'Track 7 days' } }] }
    },
    {
      'Achievement_Name': { title: [{ text: { content: 'Monthly Master' } }] },
      'Description': { rich_text: [{ text: { content: '30-day expense tracking streak' } }] },
      'Points': { number: 200 },
      'Category': { select: { name: 'Streak' } },
      'Badge_Icon': { rich_text: [{ text: { content: '🏆' } }] },
      'Requirement': { rich_text: [{ text: { content: 'Track 30 days' } }] }
    },
    {
      'Achievement_Name': { title: [{ text: { content: 'First Thousand' } }] },
      'Description': { rich_text: [{ text: { content: 'Save $1,000 total' } }] },
      'Points': { number: 100 },
      'Category': { select: { name: 'Milestone' } },
      'Badge_Icon': { rich_text: [{ text: { content: '💎' } }] },
      'Requirement': { rich_text: [{ text: { content: 'Save $1,000' } }] }
    },
    {
      'Achievement_Name': { title: [{ text: { content: 'Emergency Ready' } }] },
      'Description': { rich_text: [{ text: { content: 'Complete emergency fund' } }] },
      'Points': { number: 500 },
      'Category': { select: { name: 'Milestone' } },
      'Badge_Icon': { rich_text: [{ text: { content: '🛡️' } }] },
      'Requirement': { rich_text: [{ text: { content: '100% emergency fund' } }] }
    },
    {
      'Achievement_Name': { title: [{ text: { content: 'Tax Prepared' } }] },
      'Description': { rich_text: [{ text: { content: 'Save 3 months of taxes' } }] },
      'Points': { number: 300 },
      'Category': { select: { name: 'Milestone' } },
      'Badge_Icon': { rich_text: [{ text: { content: '💰' } }] },
      'Requirement': { rich_text: [{ text: { content: 'Save 3 months taxes' } }] }
    }
  ]
};

async function createDatabase(name, schema) {
  console.log(`Creating ${name} database...`);
  
  try {
    const response = await notion.databases.create({
      parent: { 
        type: "page_id",
        page_id: PARENT_PAGE_ID 
      },
      icon: {
        type: "emoji",
        emoji: schema.emoji
      },
      title: [
        {
          type: "text",
          text: {
            content: schema.title
          }
        }
      ],
      properties: schema.properties,
      is_inline: false
    });
    
    console.log(`✅ Created ${name} database with ID: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error(`❌ Error creating ${name} database:`, error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
}

async function populateDatabase(databaseId, dbName, data) {
  if (!data || data.length === 0) return;
  
  console.log(`Populating ${dbName} with initial data...`);
  
  for (let i = 0; i < data.length; i++) {
    try {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: data[i]
      });
      
      // Small delay to avoid rate limits
      if (i < data.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`Error adding item to ${dbName}:`, error.message);
      if (error.body) {
        console.error('Error details:', JSON.stringify(error.body, null, 2));
      }
    }
  }
  
  console.log(`✅ Populated ${dbName} with ${data.length} items`);
}

async function verifySetup() {
  // Test the API connection
  try {
    const response = await notion.pages.retrieve({ page_id: PARENT_PAGE_ID });
    console.log('✅ API connection verified');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Notion API');
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Notion setup...\n');
  
  // Check if we have the required values
  if (!NOTION_API_KEY || NOTION_API_KEY === 'your-secret-key-here') {
    console.error('❌ NOTION_API_KEY not found in .env.local');
    console.error('   Please add: NOTION_API_KEY=secret_YOUR_ACTUAL_KEY');
    return;
  }
  
  if (!PARENT_PAGE_ID || PARENT_PAGE_ID === 'your-parent-page-id-here') {
    console.error('❌ NOTION_PARENT_PAGE_ID not found in .env.local');
    console.error('   Please add: NOTION_PARENT_PAGE_ID=2474cd69c6d880cb89a8fb855233fffe');
    return;
  }
  
  // Verify API connection
  console.log('Testing API connection...');
  const isConnected = await verifySetup();
  if (!isConnected) {
    console.error('\n❓ Troubleshooting tips:');
    console.error('1. Make sure your integration is connected to the page');
    console.error('2. Verify your API key is correct');
    console.error('3. Check that the page ID is correct');
    return;
  }
  
  const createdDatabases = {};
  
  try {
    // Create all databases
    for (const [key, schema] of Object.entries(databases)) {
      const dbId = await createDatabase(key, schema);
      createdDatabases[key] = dbId;
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Populating initial data...\n');
    
    // Populate initial data
    await populateDatabase(createdDatabases.goals, 'goals', initialData.goals);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await populateDatabase(createdDatabases.settings, 'settings', initialData.settings);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await populateDatabase(createdDatabases.achievements, 'achievements', initialData.achievements);
    
    // Create .env.local file
    const envContent = `# Notion
NOTION_API_KEY=${NOTION_API_KEY}
NOTION_TRANSACTIONS_DB_ID=${createdDatabases.transactions}
NOTION_GOALS_DB_ID=${createdDatabases.goals}
NOTION_ACHIEVEMENTS_DB_ID=${createdDatabases.achievements}
NOTION_SHOPPING_DB_ID=${createdDatabases.shopping}
NOTION_SETTINGS_DB_ID=${createdDatabases.settings}

# Weather
OPENWEATHER_API_KEY=your-openweather-api-key-here

# Location (Weaverville, NC)
LOCATION_LAT=35.9857
LOCATION_LON=-82.5607
`;
    
    await fs.writeFile('.env.local', envContent);
    console.log('\n✅ Created .env.local file with database IDs');
    
    // Log summary
    console.log('\n🎉 Setup complete! Here are your database IDs:\n');
    console.log('Add these to your .env.local file:');
    console.log('```');
    console.log(`NOTION_TRANSACTIONS_DB_ID=${createdDatabases.transactions}`);
    console.log(`NOTION_GOALS_DB_ID=${createdDatabases.goals}`);
    console.log(`NOTION_ACHIEVEMENTS_DB_ID=${createdDatabases.achievements}`);
    console.log(`NOTION_SHOPPING_DB_ID=${createdDatabases.shopping}`);
    console.log(`NOTION_SETTINGS_DB_ID=${createdDatabases.settings}`);
    console.log('```');
    
    console.log('\n📝 Next steps:');
    console.log('1. Get your OpenWeatherMap API key from https://openweathermap.org/api');
    console.log('2. Update the OPENWEATHER_API_KEY in .env.local');
    console.log('3. Run: npm run dev');
    console.log('4. Open: http://localhost:3000');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    console.error('\n❓ Common issues:');
    console.error('1. Make sure the page is shared with your integration');
    console.error('2. Check that your API key has the correct permissions');
    console.error('3. Ensure you\'re using the workspace where the integration was created');
  }
}

// Run the setup
main();