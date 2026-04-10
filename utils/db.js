const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

function read() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
