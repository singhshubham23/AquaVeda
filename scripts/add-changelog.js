#!/usr/bin/env node

/**
 * Changelog Entry Generator
 * Usage: node scripts/add-changelog.js
 * 
 * This script helps you add structured entries to the .logs file
 * and optionally updates docs/logs.md
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const CATEGORIES = [
  'Frontend',
  'Backend',
  'Docs',
  'Config',
  'CI/CD',
  'Ops',
  'Planning',
  'Refactor',
  'Bugfix',
  'Feature',
  'Performance'
];

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function addChangelog() {
  console.log('\n📝 Changelog Entry Generator\n');
  
  // Show categories
  console.log('Available categories:');
  CATEGORIES.forEach((cat, i) => console.log(`  ${i + 1}. ${cat}`));
  
  const categoryChoice = await question('\nSelect category (number): ');
  const category = CATEGORIES[parseInt(categoryChoice) - 1];
  
  if (!category) {
    console.log('❌ Invalid category');
    rl.close();
    return;
  }
  
  const date = new Date().toISOString().split('T')[0];
  const title = await question('Title: ');
  const description = await question('Description: ');
  const filesStr = await question('Files affected (comma-separated, optional): ');
  const files = filesStr.split(',').map(f => f.trim()).filter(f => f);
  const priority = await question('Priority (low/medium/high, default: medium): ') || 'medium';
  
  // Create entry
  const entry = {
    date,
    category,
    title,
    description,
    files,
    priority,
    status: 'completed'
  };
  
  // Read and update .logs file
  const logsPath = path.join(__dirname, '../.logs');
  let logsData = JSON.parse(fs.readFileSync(logsPath, 'utf8'));
  
  logsData.entries.unshift(entry);
  logsData.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(logsPath, JSON.stringify(logsData, null, 2));
  
  // Also append to docs/logs.md
  const logsMarkdownPath = path.join(__dirname, '../docs/logs.md');
  const markdownEntry = `[${date}] - ${category} - ${title}: ${description}`;
  
  if (fs.existsSync(logsMarkdownPath)) {
    const markdown = fs.readFileSync(logsMarkdownPath, 'utf8');
    const updatedMarkdown = markdown.replace(
      /(\[2026-[0-9]{2}-[0-9]{2}\] - .+)/,
      `${markdownEntry}\n$1`
    );
    fs.writeFileSync(logsMarkdownPath, updatedMarkdown);
  }
  
  console.log('\n✅ Changelog entry added!');
  console.log(`   Category: ${category}`);
  console.log(`   Title: ${title}`);
  console.log(`   Date: ${date}`);
  
  rl.close();
}

addChangelog().catch(console.error);
