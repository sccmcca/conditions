import fs from 'fs';

const data = JSON.parse(fs.readFileSync('static/metadata.json', 'utf8'));

const migratedData = data.map(item => {
  const newItem = { ...item };
  
  // Move cluster from form to interaction
  if (newItem.form && Array.isArray(newItem.form)) {
    newItem.form = newItem.form.filter(v => v !== 'cluster');
  }
  
  if (!newItem.interaction) {
    newItem.interaction = [];
  }
  
  if (item.form && item.form.includes('cluster') && !newItem.interaction.includes('cluster')) {
    newItem.interaction.push('cluster');
  }
  
  return newItem;
});

fs.writeFileSync('static/metadata.json', JSON.stringify(migratedData, null, 2));
console.log('Migration complete. Moved cluster from form to interaction');
