import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const load=async code=>import('data:text/javascript;base64,'+Buffer.from(ts.transpile(code,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
const {STARTER_DOCUMENTS}=await load(fs.readFileSync('assistant/resources/starter.ts','utf8').replace(/^import .*;$/m,''));
const code=fs.readFileSync('assistant/retrieval.ts','utf8').replace(/^import .*;$/gm,'');
const lib=await load('const STARTER_DOCUMENTS=[];const database=()=>{throw Error("test only")};\n'+code);
for(const d of STARTER_DOCUMENTS){lib.validateDocument(d);assert.ok(lib.chunkText(d.text).every(x=>x.length<=900));}
assert.throws(()=>lib.validateDocument({...STARTER_DOCUMENTS[0],url:'http://127.0.0.1'}));
assert.throws(()=>lib.validateDocument({...STARTER_DOCUMENTS[0],locator:''}));
const rows=STARTER_DOCUMENTS.map(d=>({...d,topics_json:JSON.stringify(d.topics)}));
const evaluations=JSON.parse(fs.readFileSync('public/knowledge-evaluation.json','utf8'));
let checked=0;for(const c of evaluations.cases){if(c.expectedDocument){const matches=lib.rankChunks(c.question,rows);assert.ok(matches.some(x=>x.id===c.expectedDocument),c.id);checked++;}}
assert.deepEqual(lib.rankChunks('موضوع نامرتبط خودرو',rows),[]);
assert.ok(lib.chunkText('ا'.repeat(2500)).length===3);
console.log(`PASS: source validation, chunking, retrieval ${checked} scenarios; remaining cases need answer/clinical review, not executed model evaluation`);
