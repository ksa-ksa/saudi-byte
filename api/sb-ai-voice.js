'use strict';
const limits=new Map();let total=0,reset=0,probeAt=0;
const model='gemini-3.8-flash-lite-tts';
const allowed=new Set(['Kore','Aoede']);
function fail(res,status,error){console.warn('SB_TTS',error);return res.status(status).json({error});}
function wav(pcm,rate){const h=Buffer.alloc(44);h.write('RIFF',0);h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(rate,24);h.writeUInt32LE(rate*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);return Buffer.concat([h,pcm]);}
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const probe=req.method==='GET'&&process.env.VERCEL_ENV==='preview'&&req.query?.probe==='1';
 if(req.method!=='POST'&&!probe)return fail(res,405,'method');
 if(!probe&&req.headers.origin!=='https://'+req.headers.host)return fail(res,403,'origin');
 if(!process.env.SB_AI_API_KEY)return fail(res,503,'not_configured');
 const b=probe?{text:'هلا وسهلا، أنا مساعد سعودي بايت.',voice:'Kore',dialect:'ar-SA',consent:true}:req.body;
 if(!b||b.consent!==true||typeof b.text!=='string'||!b.text.trim()||b.text.length>1400||!allowed.has(b.voice)||!['ar','ar-SA'].includes(b.dialect))return fail(res,400,'invalid_request');
 const now=Date.now();if(now>reset){total=0;reset=now+3600000;}if(probe&&now-probeAt<300000)return fail(res,429,'probe_limit');if(probe)probeAt=now;
 for(const [k,v] of limits)if(v.end<now)limits.delete(k);const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'unknown').split(',')[0];const v=limits.get(ip)||{n:0,end:now+60000};if(v.n>=4||total>=60||limits.size>1000)return fail(res,429,'voice_limit');v.n++;total++;limits.set(ip,v);
 try{
 const payload={contents:[{parts:[{text:b.text,speechMetadata:{style:b.dialect==='ar-SA'?'Natural friendly Saudi Arabic pronunciation, clear conversational pace.':'Natural clear Modern Standard Arabic pronunciation.'}}]}],generationConfig:{responseModalities:['AUDIO'],speechConfig:{voiceConfig:{prebuiltVoiceConfig:{voiceName:b.voice}}}}};
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+model+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.SB_AI_API_KEY.trim()},body:JSON.stringify(payload),signal:AbortSignal.timeout(45000)});
 const data=await r.json().catch(()=>({}));if(!r.ok){console.warn('SB_TTS provider',r.status,String(data.error?.status||''));return fail(res,502,r.status===429?'provider_quota':r.status===404?'provider_model':r.status===400?'provider_request':'provider_unavailable');}
 const part=data.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);if(!part)return fail(res,502,'empty_audio');
 const mime=part.inlineData.mimeType||'';let audio=Buffer.from(part.inlineData.data,'base64');if(!audio.length||audio.length>3900000)return fail(res,502,'audio_size');
 if(audio.subarray(0,4).toString()!=='RIFF'){if(!/audio\/(?:L16|pcm)/i.test(mime))return fail(res,502,'audio_format');const rate=Number(mime.match(/rate=(\d+)/i)?.[1]||24000);if(rate<8000||rate>48000)return fail(res,502,'audio_format');audio=wav(audio,rate);}
 if(probe)return res.status(200).json({ok:true,voice:b.voice,bytes:audio.length});
 res.setHeader('Content-Type','audio/wav');return res.status(200).send(audio);
 }catch{return fail(res,502,'provider_unavailable');}
};