// Script that uses selected environment as env config file
const fs = require('fs');
const environment = process.argv[2];
const envFileContent = require(`../env/${environment}.json`);
fs.writeFileSync(
  'src/env/env.json',
  JSON.stringify(envFileContent, undefined, 2),
);
