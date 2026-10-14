// Handoff-only convenience; applies migrations once to an EMPTY local DB.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
if(!process.argv.includes('--empty-database'))throw Error('Only use on a confirmed empty local DB: --empty-database');
if(!fs.existsSync('dist/server/wrangler.json'))throw Error('Build first');
for(const file of fs.readdirSync('drizzle').filter(f=>/^\d{4}.*\.sql$/.test(f)).sort()){
 const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file','drizzle/'+file],{stdio:'inherit'});
 if(r.error||r.status!==0)throw Error('Migration failed: '+file+'; do not replay on a partially applied DB');
}
