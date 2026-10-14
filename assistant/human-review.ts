import {database} from '../db/raw';
export async function ensureHumanReviews(){await database().prepare(`CREATE TABLE IF NOT EXISTS bw_human_reviews(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,message_id TEXT NOT NULL,question TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'queued',reply TEXT,reviewer TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,UNIQUE(user_id,message_id))`).run();}
