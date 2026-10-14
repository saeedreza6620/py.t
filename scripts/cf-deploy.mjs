// Deploy BeautyWallet to your own Cloudflare account (free workers.dev address).
// Used as the "Deploy command" in Cloudflare Workers Builds, after `pnpm build`.
// Needs (as Cloudflare build variables, not secrets in Git):
//   CLOUDFLARE_D1_DATABASE_ID  the D1 database ID shown in the dashboard
//   WORKER_NAME                optional, default "beautywallet" -> beautywallet.<you>.workers.dev
//   D1_DATABASE_NAME           optional, default "beautywallet-db"
// Runtime secrets (AVALAI_API_KEY, ADMIN_* ...) are set in the Worker's settings, never here.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url).pathname;
const configPath=path.join(root,'dist/server/wrangler.json');
if(!fs.existsSync(configPath))throw Error('Run the build first: dist/server/wrangler.json is missing');
const id=String(process.env.CLOUDFLARE_D1_DATABASE_ID||'').trim();
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)||id.startsWith('00000000'))throw Error('Set the build variable CLOUDFLARE_D1_DATABASE_ID to your real D1 database ID');
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
config.name=process.env.WORKER_NAME||'beautywallet';
config.workers_dev=true;
config.keep_vars=true; // keep the plain-text variables you set in the dashboard
config.d1_databases=[{binding:'DB',database_name:process.env.D1_DATABASE_NAME||'beautywallet-db',database_id:id,migrations_dir:path.relative(path.dirname(configPath),path.join(root,'drizzle'))}];
fs.writeFileSync(configPath,JSON.stringify(config,null,2));
const wrangler=path.join(root,'node_modules/wrangler/bin/wrangler.js');
function run(args){console.log('> wrangler '+args.join(' '));const r=spawnSync(process.execPath,[wrangler,...args,'--config',configPath],{stdio:'inherit',env:{...process.env,CI:'true'}});if(r.status!==0)process.exit(r.status||1);}
// Applies only migrations not yet recorded in the database (tracked by Wrangler), then deploys.
run(['d1','migrations','apply','DB','--remote']);
run(['deploy']);
