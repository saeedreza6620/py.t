import http from 'node:http';let n=0;
http.createServer((q,r)=>{let b='';q.on('data',c=>b+=c);q.on('end',()=>{n++;const last=(JSON.parse(b||'{}').messages||[]).slice(-1)[0]||{};
 r.writeHead(200,{'Content-Type':'application/json'});r.end(JSON.stringify({id:'x'+n,object:'chat.completion',created:1,model:'m',choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content:JSON.stringify({reply:'جواب '+n+' به: '+String(last.content||'').slice(0,30),chips:[]})}}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}))})}).listen(3999);
