/* Small, dependency-free client-side search over window.SEARCH_INDEX */
(function(){
  var IDX=window.SEARCH_INDEX||[], input=document.getElementById('q'), out=document.getElementById('results');
  if(!input||!out) return;
  var SYN={kid:['child','children','kids','baby','babies','infant','toddler','pediatric'],kids:['kid','child','children','baby','babies','infant','toddler','pediatric'],child:['kid','kids','children','baby','infant','toddler'],children:['kid','kids','child','baby','infant'],baby:['infant','babies','newborn'],infant:['baby','babies','newborn'],
    tummy:['stomach','nausea'],stomach:['nausea','tummy'],throat:['sore'],nose:['nasal','congestion','sinus'],stuffy:['congestion','nasal'],sleep:['insomnia'],itch:['itchy','rash'],burn:['burns'],flu:['influenza'],uti:['urinary','bladder']};
  function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
  IDX.forEach(function(d){d._t=norm(d.title);d._s=norm(d.section+' '+d.type);d._x=norm(d.text);});
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function reEsc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
  function wordRe(t){return new RegExp('(^|[^a-z0-9])'+reEsc(t),'i');}
  function score(d,term){
    var alts=[term].concat(SYN[term]||[]), best=0;
    alts.forEach(function(a,i){
      var w=i===0?1:0.6, re=wordRe(a), s=0;
      if(re.test(d._t)) s+=10; if(re.test(d._s)) s+=5; if(re.test(d._x)) s+=2;
      else if(d._x.indexOf(a)>=0) s+=0.5;
      best=Math.max(best,s*w);
    });
    return best;
  }
  function hl(text,terms){
    var e=esc(text); if(!terms.length) return e;
    var all=[]; terms.forEach(function(t){all.push(t);(SYN[t]||[]).forEach(function(s){all.push(s);});});
    all.sort(function(a,b){return b.length-a.length;});
    var re=new RegExp('(^|[^A-Za-z0-9])('+all.map(reEsc).join('|')+')','gi');
    return e.replace(re,function(m,p,w){return p+'<mark>'+w+'</mark>';});
  }
  function snippet(text,terms){
    var lt=text.toLowerCase(), pos=-1;
    for(var i=0;i<terms.length&&pos<0;i++){var alts=[terms[i]].concat(SYN[terms[i]]||[]);for(var j=0;j<alts.length&&pos<0;j++){pos=lt.indexOf(alts[j]);}}
    if(pos<0) pos=0;
    var start=Math.max(0,pos-70), end=Math.min(text.length,pos+170);
    return (start>0?'…':'')+text.slice(start,end)+(end<text.length?'…':'');
  }
  var TYPEORDER={'Symptom':0,'Remedy':1,'Nature\u2019s Corner Market':2,'Ingredient':3,'Ground rule (kids)':4,'Safety & kids':5,'See a doctor':6,'Local resource':7,'Community note':8};
  function run(){
    var q=norm(input.value).trim();
    var ratings=[].slice.call(document.querySelectorAll('input[name=rating]:checked')).map(function(x){return x.value;});
    var kidOnly=document.getElementById('kidonly').checked;
    var url=new URL(location.href); if(q) url.searchParams.set('q',input.value); else url.searchParams.delete('q');
    try{history.replaceState(null,'',url.toString());}catch(e){}
    if(!q&&!kidOnly&&ratings.length===3){out.innerHTML='';return;}
    var terms=q.split(/[^a-z0-9-]+/).filter(function(t){return t.length>0;});
    var res=[];
    IDX.forEach(function(d){
      if(d.rating&&ratings.indexOf(d.rating)<0) return;
      if(!d.rating&&ratings.length<3&&(d.type==='Remedy'||d.type==='Nature\u2019s Corner Market')) return;
      if(ratings.length<3&&!d.rating) return;
      if(kidOnly&&!d.kid) return;
      var s=0;
      for(var i=0;i<terms.length;i++){var v=score(d,terms[i]); if(!v) return; s+=v;}
      s+= (10-(TYPEORDER[d.type]==null?9:TYPEORDER[d.type]))*0.9;
      if(terms.length===1&&d.type==='Symptom'&&d._t.indexOf(terms[0])===0) s+=8;
      res.push([s,d]);
    });
    res.sort(function(a,b){return b[0]-a[0];});
    var top=res.slice(0,60);
    var badge={'Good evidence':'good','Some evidence':'some','Traditional use only':'trad'};
    var html='<p class="count">'+res.length+' result'+(res.length===1?'':'s')+(res.length>60?' (showing top 60)':'')+'</p><ol>';
    top.forEach(function(r){var d=r[1];
      html+='<li class="res"><a href="'+d.url+'"><div class="rt">'+hl(d.title,terms)+'</div><div class="meta"><span class="type'+(d.type==='See a doctor'?' doc':'')+'">'+esc(d.type)+'</span><span>'+esc(d.section)+'</span>'+(d.rating?'<span class="badge '+badge[d.rating]+'">'+esc(d.rating)+'</span>':'')+(d.kid?'<span class="tag">kid-safety note</span>':'')+'</div><div class="snip">'+hl(snippet(d.text,terms),terms)+'</div></a></li>';});
    html+='</ol>';
    if(!res.length) html='<p class="count">No matches. Try a simpler word like “honey”, “ear”, or “fever”, or turn evidence filters back on.</p>';
    out.innerHTML=html;
  }
  var tmr; input.addEventListener('input',function(){clearTimeout(tmr);tmr=setTimeout(run,60);});
  document.querySelectorAll('.filters input').forEach(function(x){x.addEventListener('change',run);});
  input.addEventListener('keydown',function(e){if(e.key==='ArrowDown'){var f=out.querySelector('a');if(f){e.preventDefault();f.focus();}}});
  out.addEventListener('keydown',function(e){
    if(e.key!=='ArrowDown'&&e.key!=='ArrowUp') return;
    var links=[].slice.call(out.querySelectorAll('a')), i=links.indexOf(document.activeElement);
    if(i<0) return; e.preventDefault();
    if(e.key==='ArrowDown'&&i<links.length-1) links[i+1].focus();
    if(e.key==='ArrowUp'){ if(i===0) input.focus(); else links[i-1].focus(); }
  });
  var init=new URLSearchParams(location.search).get('q'); if(init){input.value=init;}
  run();
})();
