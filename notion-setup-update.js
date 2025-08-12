// Add to existing notion-setup.js or create new migration script
const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function updateDatabases() {
  console.log('📊 Updating database schemas...');
  
  // Add precious_metals database
  const preciousMetalsDb = await notion.databases.create({
    parent: { type: "page_id", page_id: process.env.NOTION_PARENT_PAGE_ID },
    icon: { type: "emoji", emoji: "🥇" },
    title: [{ type: "text", text: { content: "Precious Metals" }}],
    properties: {
      "Purchase_ID": { title: {} },
      "Metal_Type": { 
        select: { 
          options: [
            { name: "Gold", color: "yellow" },
            { name: "Silver", color: "gray" }
          ] 
        }
      },
      "Purchase_Date": { date: {} },
      "Amount_Ounces": { number: {} },
      "Price_Per_Ounce": { number: { format: "dollar" } },
      "Total_Cost": { number: { format: "dollar" } },
      "Current_Value": { number: { format: "dollar" } },
      "Vendor": { rich_text: {} },
      "Notes": { rich_text: {} }
    }
  });
  
  console.log('✅ Precious Metals DB created:', preciousMetalsDb.id);
  
  // Add layouts database for custom layouts
  const layoutsDb = await notion.databases.create({
    parent: { type: "page_id", page_id: process.env.NOTION_PARENT_PAGE_ID },
    icon: { type: "emoji", emoji: "📐" },
    title: [{ type: "text", text: { content: "Dashboard Layouts" }}],
    properties: {
      "Layout_Name": { title: {} },
      "Layout_Data": { rich_text: {} },
      "Is_Active": { checkbox: {} },
      "Last_Modified": { last_edited_time: {} }
    }
  });
  
  console.log('✅ Layouts DB created:', layoutsDb.id);
  
  // Update .env.local with new database IDs
  const fs = require('fs').promises;
  const envContent = await fs.readFile('.env.local', 'utf8');
  const updatedEnv = envContent + `
NOTION_PRECIOUS_METALS_DB_ID=${preciousMetalsDb.id}
NOTION_LAYOUTS_DB_ID=${layoutsDb.id}
`;
  await fs.writeFile('.env.local', updatedEnv);
}

updateDatabases().catch(console.error);
