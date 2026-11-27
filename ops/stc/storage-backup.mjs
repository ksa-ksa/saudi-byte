import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,root=process.argv[2]||"stc-backup/storage";
if(!url||!key) throw new Error("Missing Supabase credentials");
const sb=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const manifest={captured_at:new Date().toISOString(),buckets:[]};
async function walk(bucket,prefix=""){
 const {data,error}=await sb.storage.from(bucket).list(prefix,{limit:100,offset:0,sortBy:{column:"name",order:"asc"}});
 if(error) throw new Error(error.message);
 for(const item of data||[]){
  const p=prefix?prefix+"/"+item.name:item.name;
  if(item.id==null&&item.metadata==null){await walk(bucket,p);continue;}
  const {data:file,error:e}=await sb.storage.from(bucket).download(p);
  if(e) throw new Error(bucket+"/"+p+": "+e.message);
  const dest=path.join(root,bucket,p); await mkdir(path.dirname(dest),{recursive:true});
  await writeFile(dest,Buffer.from(await file.arrayBuffer()));
  manifest.buckets.find(x=>x.id===bucket).objects.push({path:p,size:item.metadata?.size??null,mimetype:item.metadata?.mimetype??null});
 }
}
const {data:buckets,error}=await sb.storage.listBuckets(); if(error) throw new Error(error.message);
for(const b of buckets||[]){manifest.buckets.push({id:b.id,name:b.name,public:b.public,objects:[]});await walk(b.id);}
await mkdir(root,{recursive:true});await writeFile(path.join(root,"storage-manifest.json"),JSON.stringify(manifest,null,2));
console.log("Captured "+manifest.buckets.reduce((n,b)=>n+b.objects.length,0)+" objects in "+manifest.buckets.length+" buckets.");
