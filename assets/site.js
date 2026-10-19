(function(){
  var t=document.querySelector('.nav-toggle'), n=document.getElementById('sitenav');
  if(t&&n){t.addEventListener('click',function(){var o=n.classList.toggle('open');t.setAttribute('aria-expanded',o?'true':'false');});}
  // "/" focuses the search box
  document.addEventListener('keydown',function(e){
    if(e.key==='/'&&!/input|textarea|select/i.test((document.activeElement||{}).tagName||'')){
      var q=document.getElementById('q')||document.getElementById('hq'); if(q){e.preventDefault();q.focus();}
    }
  });
  // print: open all collapsible notes
  window.addEventListener('beforeprint',function(){document.querySelectorAll('details').forEach(function(d){d.dataset.wasOpen=d.open;d.open=true;});});
  window.addEventListener('afterprint',function(){document.querySelectorAll('details').forEach(function(d){d.open=d.dataset.wasOpen==='true';});});
  // open notes when linked via #notes
  function openHash(){var h=location.hash; if(h==='#notes'){var d=document.querySelector('#notes details'); if(d) d.open=true;}}
  window.addEventListener('hashchange',openHash); openHash();
})();
