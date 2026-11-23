const http=require('http'),fs=require('fs'),path=require('path');
const root=require('path').join(__dirname,'../client/build');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.map':'application/json'};
http.createServer((req,res)=>{
  let p=path.join(root,decodeURIComponent(req.url.split('?')[0]));
  if(!p.startsWith(root)||!fs.existsSync(p)||fs.statSync(p).isDirectory()){
    if(req.url.includes('favicon')||req.url.includes('.js')||req.url.includes('.css')){res.writeHead(404);return res.end('nf');}
    p=path.join(root,'index.html');
  }
  res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(res);
}).listen(3000,'127.0.0.1');
