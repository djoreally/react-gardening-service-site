#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cwd=process.cwd();
const command=process.argv[2]||'verify';
const readJson=p=>JSON.parse(readFileSync(join(cwd,p),'utf8'));
const writeJson=(p,v)=>{const full=join(cwd,p);mkdirSync(dirname(full),{recursive:true});writeFileSync(full,JSON.stringify(v,null,2)+'\n')};
const required=['AGENTS.md','BUILDOS.md','buildos.config.json','.buildos/state.json','.buildos/product.json','.buildos/architecture.json'];
function validateState(){const missing=required.filter(p=>!existsSync(join(cwd,p)));if(missing.length)throw new Error(`Missing BuildOS files: ${missing.join(', ')}`);const state=readJson('.buildos/state.json');const allowed=new Set(['not_started','in_progress','blocked','built','deployed','verified','green','red']);if(!allowed.has(state.status))throw new Error(`Invalid BuildOS status: ${state.status}`)}
function classify(check,out){const t=(check+' '+out).toLowerCase();if(t.includes('lint'))return'lint';if(t.includes('type'))return'typecheck';if(t.includes('test'))return'test';if(t.includes('build'))return'build';if(t.includes('auth')||t.includes('permission'))return'authorization';return'gate'}
function repair(check,cmd,error,out){const r={version:1,status:'red',phase:command,failedCheck:check,command:cmd,classification:classify(check,out),error:String(error?.message||error),output:String(out||'').slice(-12000),instructions:['Identify the root cause from this evidence.','Repair the smallest complete cause; do not bypass or weaken the gate.',`Rerun the exact failed check: ${cmd||check}.`,'Continue to later BuildOS gates only after this check passes.','If deployment previously failed, redeploy the repaired exact SHA and verify production.','Preserve this RED event in BuildOS evidence.'],humanGate:false};writeJson('.buildos/repair/latest.json',r);return r}
function run(){const config=readJson('buildos.config.json');if(command==='verify'&&config.requireChangeRecord){const d=join(cwd,'.buildos/changes');if(!existsSync(d)||!readdirSync(d).some(f=>f.endsWith('.json')))throw new Error('BuildOS requires a change record before verification.')}for(const check of config[command]||[]){if(check==='state'){validateState();console.log('✓ state');continue}const cmd=config.commands?.[check];if(!cmd)throw new Error(`No command configured for check: ${check}`);console.log(`→ ${check}: ${cmd}`);try{const out=execSync(cmd,{cwd,encoding:'utf8',env:{...process.env,BUILDOS_RUNNING:'1'}});if(out)process.stdout.write(out);console.log(`✓ ${check}`)}catch(e){const out=`${e?.stdout||''}${e?.stderr||''}`;if(e?.stdout)process.stdout.write(String(e.stdout));if(e?.stderr)process.stderr.write(String(e.stderr));const r=repair(check,cmd,e,out);console.error(JSON.stringify(r,null,2));process.exit(1)}}}
try{run()}catch(e){console.error(`✗ ${e.message}`);process.exit(1)}
