const fs = require('fs');
const data = JSON.parse(fs.readFileSync('static/metadata.json', 'utf8'));

const elementValues = ['ceiling', 'chair', 'door', 'fence', 'floor', 'gate', 'object', 'roof', 'stair', 'vehicle', 'vessel', 'wall', 'window', 'chainlink'];
const formValues = ['box', 'cluster', 'corner', 'line', 'repetition', 'room', 'round', 'tube', 'tunnel', 'void', 'wave', 'wedge', 'corrugated', 'drape', 'monolith'];
const interactionValues = ['wrapped'];

const migratedData = data.map(item => {
  const newItem = { ...item };
  
  // Initialize new categories
  newItem.element = [];
  newItem.form = [];
  newItem.interaction = [];
  
  // Migrate tectonic values to new categories
  if (item.tectonic && Array.isArray(item.tectonic)) {
    item.tectonic.forEach(value => {
      if (elementValues.includes(value)) {
        newItem.element.push(value);
      } else if (formValues.includes(value)) {
        newItem.form.push(value);
      } else if (interactionValues.includes(value)) {
        newItem.interaction.push(value);
      }
    });
  }
  
  // Remove old tectonic property
  delete newItem.tectonic;
  
  return newItem;
});

fs.writeFileSync('static/metadata.json', JSON.stringify(migratedData, null, 2));
console.log('Migration complete. Updated static/metadata.json');
