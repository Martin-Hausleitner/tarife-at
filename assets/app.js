(()=>{const D=window.DATA,$=s=>document.querySelector(s),ic=n=>`<svg><use href="#i-${n}"/></svg>`,esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const eur=v=>v==null?'–':v.toLocaleString('de-AT',{style:'currency',currency:'EUR'});
const gb=v=>v===-1?'∞':v==null?'–':(v>=1000?(v/1000).toLocaleString('de-AT')+' TB':v.toLocaleString('de-AT')+' GB');
const term=m=>m?`${m} Mon.`:'keine';
// P/L index
for(const svc of ['mobile','data']){const L=D.tarife.filter(t=>t.svc===svc);L.forEach(t=>{if(!t.dataGB||t.effective<3){t._raw=null;return}const dp=t.dataGB===-1?300:Math.min(t.dataGB,200)*1.5;t._raw=(Math.min(t.down,1000)+4*t.up+dp)/Math.max(t.effective,1)});
 const s=L.map(t=>t._raw).filter(x=>x!=null).sort((a,b)=>a-b);L.forEach(t=>t.pl=t._raw==null?null:Math.round(100*s.findIndex(x=>x>=t._raw)/Math.max(s.length-1,1)))}
D.router.forEach(r=>{r.network='';r._id=r.link});D.tarife.forEach(t=>t._id=t.svc+t.id);
$('#stand').textContent=`Stand ${D.stand} · ${D.tarife.length} Tarife · ${D.router.length} Router`;
$('#c-mobile').textContent=D.tarife.filter(t=>t.svc==='mobile').length;$('#c-data').textContent=D.tarife.filter(t=>t.svc==='data').length;$('#c-router').textContent=D.router.length;
const maxDown=1000,maxUp=200;
const R={
 prov:p=>{const t=p.data;if(!t||t.tariff==null)return'';return `<div class="c-prov"><img loading="lazy" src="${t.providerLogo}" alt=""><div class="t"><b>${esc(t.tariff)}</b><small>${esc(t.provider)}${t.youth?' · Jugend':''}</small></div></div>`},
 net:p=>p.value?`<span class="net ${p.value}"><i></i>${p.value}</span>`:'',
 down:p=>`<div class="bar"><span class="v">${p.value??'–'} <small>Mbit/s</small></span><div class="tr"><span style="width:${Math.min(100,(p.value||0)/maxDown*100)}%"></span></div></div>`,
 up:p=>`<div class="bar up"><span class="v">${p.value??'–'} <small>Mbit/s</small></span><div class="tr"><span style="width:${Math.min(100,(p.value||0)/maxUp*100)}%"></span></div></div>`,
 price:max=>p=>`<div class="bar price"><span class="v">${eur(p.value)}</span><div class="tr"><span style="width:${Math.min(100,(p.value||0)/max*100)}%"></span></div></div>`,
 data:p=>p.value===-1?`<span class="pill b">${ic('infinity')}Unlimitiert</span>`:gb(p.value),
 pl:p=>p.value==null?'':`<span class="pl ${p.value>=80?'s1':p.value>=55?'s2':'s3'}" title="Preis-Leistungs-Index (Perzentil)">${p.value}</span>`,
 link:p=>p.value?`<a class="lnk" href="${p.value}" target="_blank" rel="noopener" onclick="event.stopPropagation()">tarife.at ${ic('external-link')}</a>`:'',
 bool:p=>p.value?`<span class="pill g">${ic('check')}</span>`:'<span style="color:var(--mut)">–</span>',
 router:p=>{const r=p.data;if(!r||!r.imgs)return'';return `<div class="c-prov">${r.imgs[0]?`<img class="c-thumb" loading="lazy" src="${r.imgs[0]}" alt="">`:`<span class="c-thumb" style="display:grid;place-items:center">${ic('router')}</span>`}<div class="t"><b>${esc(r.name)}</b><small>${esc(r.maker)} · ${r.imgs.length} Foto${r.imgs.length==1?'':'s'}</small></div></div>`},
 sms:p=>p.value?`<span class="pill g" title="${esc(p.value)}">${ic('message-square')}SMS</span>`:'<span class="pill">unbekannt</span>',
 tel:p=>p.value&&p.value.length?`<span class="pill b" title="${esc(p.value.join(', '))}">${ic('phone')}${esc(p.value.join(' · '))}</span>`:'–',
 gh:p=>p.value?`<a class="lnk" href="${p.value}" target="_blank" rel="noopener" onclick="event.stopPropagation()">geizhals ${ic('external-link')}</a>`:''};
const num={filter:'agNumberColumnFilter'};
const tCols=svc=>[
 {field:'tariff',headerName:'Tarif',pinned:'left',minWidth:250,cellRenderer:R.prov,filter:'agTextColumnFilter',getQuickFilterText:p=>p.data.tariff+' '+p.data.provider},
 {field:'provider',headerName:'Anbieter',width:120,hide:true},
 {field:'network',headerName:'Netz',width:110,cellRenderer:R.net},
 {field:'pl',headerName:'P/L',width:85,cellRenderer:R.pl,...num,sort:'desc'},
 {field:'effective',headerName:'Effektiv/Monat',width:150,cellRenderer:R.price(svc==='mobile'?70:90),...num},
 {field:'down',headerName:'Down',width:140,cellRenderer:R.down,...num},
 {field:'up',headerName:'Up',width:130,cellRenderer:R.up,...num},
 {field:'dataGB',headerName:'Daten',width:130,cellRenderer:R.data,...num},
 ...(svc==='mobile'?[{field:'minutes',headerName:'Min.',width:95,valueFormatter:p=>p.value===-1?'∞':p.value,...num},{field:'sms',headerName:'SMS',width:90,valueFormatter:p=>p.value===-1?'∞':p.value,...num}]:[]),
 {field:'euGB',headerName:'EU-GB',width:95,valueFormatter:p=>gb(p.value),...num},
 {field:'fee',headerName:'Grundgebühr',width:120,valueFormatter:p=>eur(p.value),...num},
 {field:'activation',headerName:'Aktivierung',width:115,valueFormatter:p=>eur(p.value),...num},
 {field:'service',headerName:'Servicepausch.',width:125,valueFormatter:p=>eur(p.value),...num,hide:true},
 {field:'term',headerName:'Bindung',width:105,valueFormatter:p=>term(p.value),...num},
 {field:'five_g',headerName:'5G',width:75,cellRenderer:R.bool},
 {field:'prepaid',headerName:'Wertkarte',width:100,cellRenderer:R.bool,hide:true},
 {field:'youth',headerName:'Jugend',width:90,cellRenderer:R.bool},
 {field:'esim',headerName:'eSIM',width:80,cellRenderer:R.bool,hide:true},
 {field:'ipPublic',headerName:'Öff. IP',width:90,cellRenderer:R.bool,hide:true},
 {field:'offer',headerName:'Aktion',width:200,hide:true},
 {field:'url',headerName:'Quelle',width:115,cellRenderer:R.link,filter:false,sortable:false}];
const rCols=[{field:'name',headerName:'Gerät',pinned:'left',minWidth:300,cellRenderer:R.router,filter:'agTextColumnFilter'},
 {field:'maker',headerName:'Hersteller',width:130},{field:'price',headerName:'Bestpreis',width:150,cellRenderer:R.price(1200),...num,sort:'asc'},
 {field:'offers',headerName:'Händler',width:100,...num},{field:'sms',headerName:'SMS (1 SIM)',width:130,cellRenderer:R.sms},
 {field:'tel',headerName:'Telefonie',width:200,cellRenderer:R.tel,valueFormatter:p=>(p.value||[]).join(', ')},
 {field:'sa',headerName:'5G SA',width:90,cellRenderer:R.bool},{field:'outdoor',headerName:'Outdoor',width:95,cellRenderer:R.bool,hide:true},{field:'dualSim',headerName:'Dual-SIM',width:100,cellRenderer:R.bool},{field:'maxDown',headerName:'Max. 5G Down',width:140,cellRenderer:R.down,...num},
 {field:'wifi',headerName:'WLAN',width:100},{field:'use',headerName:'Bauform',width:200,hide:true},{field:'ports',headerName:'Anschlüsse',width:260,hide:true},
 {field:'link',headerName:'Quelle',width:115,cellRenderer:R.gh,filter:false,sortable:false}];
let tab=localStorage.tab||'mobile',dense=localStorage.dense==='1',cards=matchMedia('(max-width:760px)').matches,F=new Set(),cmp=[];
const CH={mobile:[['A1','net','A1'],['Magenta','net','Magenta'],['Drei','net','Drei'],['unl','Unlimitiert','infinity'],['5g','5G','zap'],['nobind','Ohne Bindung','lock-open'],['prepaid','Wertkarte','card-sim'],['youth','Jugend','graduation-cap'],['noyouth','Ohne Jugend','x']],
 router:[['sms','SMS-fähig','message-square'],['tel','Telefonie','phone'],['dual','Dual-SIM','card-sim'],['photo','Mit Foto','image'],['u300','≤ 300 €','scale']]};CH.data=CH.mobile;
const pass=r=>{if(tab==='router'){return(!F.has('sms')||r.sms)&&(!F.has('tel')||r.tel.length)&&(!F.has('dual')||r.dualSim)&&(!F.has('photo')||r.imgs.length)&&(!F.has('u300')||(r.price&&r.price<=300))}
 const nets=['A1','Magenta','Drei'].filter(n=>F.has(n));return(!nets.length||nets.includes(r.network))&&(!F.has('unl')||r.dataGB===-1)&&(!F.has('5g')||r.five_g)&&(!F.has('nobind')||!r.term)&&(!F.has('prepaid')||r.prepaid)&&(!F.has('youth')||r.youth)&&(!F.has('noyouth')||!r.youth)};
const rows=()=>tab==='router'?D.router:D.tarife.filter(t=>t.svc===tab);
const light=agGrid.themeQuartz.withParams({accentColor:'#5b5bf6',fontFamily:'inherit',headerFontWeight:600,borderColor:'#e6e7eb',wrapperBorderRadius:12,headerBackgroundColor:'#fafafb',rowHoverColor:'#f4f5ff',fontSize:13.5});
const dark=agGrid.themeQuartz.withPart(agGrid.colorSchemeDark).withParams({accentColor:'#8b8bff',fontFamily:'inherit',headerFontWeight:600,backgroundColor:'#121318',headerBackgroundColor:'#16171d',borderColor:'#23252d',wrapperBorderRadius:12,fontSize:13.5});
const theme=()=>document.documentElement.dataset.theme==='dark'?dark:light;
const api=agGrid.createGrid($('#grid'),{theme:theme(),rowData:[],columnDefs:[],rowHeight:dense?44:60,headerHeight:42,floatingFiltersHeight:36,animateRows:true,
 defaultColDef:{sortable:true,filter:true,floatingFilter:true,resizable:true,suppressHeaderMenuButton:false},
 rowSelection:{mode:'multiRow',checkboxes:true,headerCheckbox:false,enableClickSelection:false},selectionColumnDef:{pinned:'left',width:44},
 getRowId:p=>p.data._id,isExternalFilterPresent:()=>F.size>0,doesExternalFilterPass:n=>pass(n.data),
 tooltipShowDelay:300,onRowClicked:e=>{if(!e.event.target.closest('a,.ag-checkbox'))detail(e.data)},
 onSelectionChanged:()=>{const s=api.getSelectedRows();if(s.length>3){api.getRowNode(s[0]._id).setSelected(false);return}cmp=s;tray()},
 onFilterChanged:()=>{count();if(cards)renderCards()},onSortChanged:()=>{save();if(cards)renderCards()},onColumnMoved:save,onColumnVisible:save,onColumnResized:e=>e.finished&&save()});
function save(){localStorage['cols_'+tab]=JSON.stringify(api.getColumnState())}
function count(){$('#count').textContent=`${api.getDisplayedRowCount()} von ${rows().length} Einträgen · Mehrspaltig sortieren mit Shift+Klick · bis zu 3 Einträge zum Vergleich markieren`}
function chips(){const h=(CH[tab]).map(([k,l,i])=>`<button class="chip ${F.has(k)?'on':''}" data-k="${k}">${i==='net'?`<span class="dot" style="background:var(--${k==='A1'?'a1':k==='Magenta'?'mag':'drei'})"></span>${k}`:ic(i)+l}</button>`).join('');$('#chips').innerHTML=h;$('#sheetchips').innerHTML=h}
document.addEventListener('click',e=>{const c=e.target.closest('.chip');if(c){const k=c.dataset.k;F.has(k)?F.delete(k):F.add(k);chips();api.onFilterChanged()}});
let mounted={};function load(){const ext=tab==='calc'||tab==='net';document.querySelector('.toolbar').hidden=ext;$('#count').hidden=ext;$('#calcroot').hidden=tab!=='calc';$('#netroot').hidden=tab!=='net';
 if(ext){document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));$('#grid').hidden=true;$('#cards').hidden=true;
  if(!mounted[tab]){mounted[tab]=1;if(tab==='net')TarifeNetwork.mount($('#netroot'),{assetBase:'features/network/assets/'});else TarifeCalc.mount($('#calcroot'),{dataUrl:'features/calc/legacy-data.json'})}return}document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));F.clear();chips();
 api.setGridOption('rowData',[]);api.setGridOption('columnDefs',tab==='router'?rCols:tCols(tab));api.setGridOption('rowData',rows());const st=localStorage['cols_'+tab];if(st)api.applyColumnState({state:JSON.parse(st),applyOrder:true});
 cmp=[];tray();count();setView()}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=localStorage.tab=b.dataset.tab;load()});
$('#q').oninput=e=>{api.setGridOption('quickFilterText',e.target.value)};
$('#theme').onclick=()=>{const d=document.documentElement;d.dataset.theme=localStorage.theme=d.dataset.theme==='dark'?'light':'dark';api.setGridOption('theme',theme())};
$('#dens').onclick=()=>{dense=!dense;localStorage.dense=dense?'1':'0';api.setGridOption('rowHeight',dense?44:60);api.resetRowHeights()};
$('#reset').onclick=()=>{localStorage.removeItem('cols_'+tab);load()};
$('#view').onclick=()=>{cards=!cards;setView()};
function setView(){$('#grid').hidden=cards;$('#cards').hidden=!cards;$('#view span').textContent=cards?'Tabelle':'Karten';$('#view use').setAttribute('href',cards?'#i-table':'#i-layout-grid');if(cards)renderCards()}
$('#cols').onclick=e=>{const m=$('#colmenu');if(!m.hidden){m.hidden=true;return}m.innerHTML=api.getColumns().filter(c=>c.getColDef().headerName).map(c=>`<label><input type="checkbox" data-c="${c.getColId()}" ${c.isVisible()?'checked':''}>${c.getColDef().headerName}</label>`).join('');
 const r=e.currentTarget.getBoundingClientRect();m.style.top=r.bottom+6+'px';m.style.right=(innerWidth-r.right)+'px';m.hidden=false;m.onchange=ev=>api.setColumnsVisible([ev.target.dataset.c],ev.target.checked)};
document.addEventListener('mousedown',e=>{if(!e.target.closest('#colmenu,#cols'))$('#colmenu').hidden=true});
$('#filterbtn').onclick=()=>$('#sheet').hidden=false;$('#sheetclose').onclick=()=>$('#sheet').hidden=true;$('#sheet').onclick=e=>{if(e.target.id==='sheet')e.target.hidden=true};
function shown(){const a=[];api.forEachNodeAfterFilterAndSort(n=>a.push(n.data));return a}
function card(t){if(tab==='router')return `<article class="card" data-id="${esc(t._id)}">${t.imgs[0]?`<img class="hero" loading="lazy" src="${t.imgs[0]}" alt="">`:''}<div class="hd"><div class="t"><b>${esc(t.name)}</b><small>${esc(t.maker)} · ${t.offers} Händler</small></div></div>
 <div class="ft"><span class="price">${eur(t.price)}</span>${R.gh({value:t.link})}</div><div class="tags">${t.sms?R.sms({value:t.sms}):''}${t.tel.length?R.tel({value:t.tel}):''}${t.dualSim?'<span class="pill">Dual-SIM</span>':''}${t.wifi?`<span class="pill">${ic('wifi')}${t.wifi}</span>`:''}</div></article>`;
 return `<article class="card" data-id="${esc(t._id)}"><div class="hd"><img loading="lazy" src="${t.providerLogo}" alt=""><div class="t"><b>${esc(t.tariff)}</b><small>${esc(t.provider)} · ${R.net({value:t.network})}</small></div>${R.pl({value:t.pl})}</div>
 <div class="ft"><span class="price">${eur(t.effective)}<small> /Monat effektiv</small></span></div>
 <div class="kv"><div><small>Down/Up</small><b>${t.down}/${t.up}</b></div><div><small>Daten</small><b>${gb(t.dataGB)}</b></div><div><small>Bindung</small><b>${term(t.term)}</b></div></div>
 <div class="tags">${t.five_g?`<span class="pill b">${ic('zap')}5G</span>`:''}${t.youth?`<span class="pill y">${ic('graduation-cap')}Jugend</span>`:''}${t.prepaid?'<span class="pill">Wertkarte</span>':''}${t.offer?`<span class="pill g">${ic('gift')}${esc(t.offer)}</span>`:''}</div>
 <div class="ft"><label class="cmpbox"><input type="checkbox" data-cmp="${esc(t._id)}" ${cmp.includes(t)?'checked':''}>Vergleichen</label>${R.link({value:t.url})}</div></article>`}
let shownN=60;function renderCards(){const a=shown();$('#cards').innerHTML=a.slice(0,shownN).map(card).join('')+(a.length>shownN?`<button class="btn pri" id="more" style="grid-column:1/-1">Mehr anzeigen (${a.length-shownN})</button>`:'')}
$('#cards').onclick=e=>{if(e.target.id==='more'){shownN+=60;renderCards();return}const cb=e.target.closest('[data-cmp]');if(cb){api.getRowNode(cb.dataset.cmp).setSelected(cb.checked);return}if(e.target.closest('a,label'))return;const c=e.target.closest('.card');if(c)detail(api.getRowNode(c.dataset.id).data)};
function tray(){const t=$('#tray');t.hidden=!cmp.length;t.innerHTML=`${ic('scale')}<span>${cmp.length}/3 im Vergleich</span><button class="btn" id="docmp">Vergleichen</button><button class="btn" id="clrcmp">${ic('x')}</button>`;
 $('#docmp').onclick=compare;$('#clrcmp').onclick=()=>api.deselectAll()}
function drawer(h){$('#drawerin').innerHTML=`<button class="btn x" id="dx">${ic('x')}</button>`+h;$('#drawer').hidden=false;$('#dx').onclick=()=>$('#drawer').hidden=true}
$('#drawer').onclick=e=>{if(e.target.id==='drawer')e.target.hidden=true};addEventListener('keydown',e=>{if(e.key==='Escape'){$('#drawer').hidden=true;$('#sheet').hidden=true}});
function detail(t){if(t.name!==undefined){drawer(`<h2>${esc(t.name)}</h2><p style="color:var(--mut)">${esc(t.maker)} · ${t.offers} Händler · Bestpreis <b>${eur(t.price)}</b></p>
 <div class="gal">${t.imgs.map(s=>`<img loading="lazy" src="${s}" alt="">`).join('')||'<p>Kein Foto gefunden.</p>'}</div>
 <dl class="dl"><dt>SMS (eine SIM)</dt><dd>${t.sms?esc(t.sms)+` · <a href="${t.smsSrc}" target="_blank">Quelle</a>`:'keine Angabe gefunden'}</dd><dt>Telefonie</dt><dd>${t.tel.join(', ')||'keine Angabe in Specs'}</dd><dt>SIM</dt><dd>${esc(t.sim||'–')}${t.dualSim?' (Dual-SIM)':''}</dd>
 <dt>Modem</dt><dd>${esc(t.modem||'–')}</dd><dt>WLAN</dt><dd>${esc(t.wifi||'–')}</dd><dt>Anschlüsse</dt><dd>${esc(t.ports||'–')}</dd><dt>Bauform</dt><dd>${esc(t.use||'–')}</dd><dt>Antennen</dt><dd>${esc(t.antenna||'–')}</dd><dt>5G SA</dt><dd>${t.sa==null?'–':t.sa?'ja':'nein'}</dd><dt>Quelle</dt><dd><a href="${t.link}" target="_blank">geizhals.at</a> · Bilder: ${t.imgSrc}</dd></dl><h3 style="margin-top:22px">Open-Source-Tools: SMS des eigenen Routers auslesen</h3><ul>${(D.smsTools||[]).map(x=>`<li><a href="${x.url}" target="_blank">${esc(x.name)}</a> <small style="color:var(--mut)">${esc(x.vendor)} · ${esc((x.features||[]).join(', '))}</small></li>`).join('')}</ul>`);return}
 drawer(`<div class="c-prov" style="height:auto"><img src="${t.providerLogo}" style="width:56px;height:56px"><div class="t"><h2>${esc(t.tariff)}</h2><small>${esc(t.provider)} · Netz ${esc(t.network)} (${t.tech})</small></div></div>
 <p><span class="price" style="font-size:28px;font-weight:700">${eur(t.effective)}</span> <span style="color:var(--mut)">effektiv/Monat</span> ${R.pl({value:t.pl})}</p>
 <dl class="dl"><dt>Down / Up</dt><dd>${t.down} / ${t.up} Mbit/s</dd><dt>Daten</dt><dd>${gb(t.dataGB)} (EU: ${gb(t.euGB)})</dd>${t.svc==='mobile'?`<dt>Minuten / SMS</dt><dd>${t.minutes===-1?'∞':t.minutes} / ${t.sms===-1?'∞':t.sms}</dd>`:''}
 <dt>Grundgebühr</dt><dd>${eur(t.fee)}</dd><dt>Aktivierung</dt><dd>${eur(t.activation)}</dd><dt>Servicepauschale</dt><dd>${eur(t.service)}/Jahr</dd><dt>Bindung</dt><dd>${term(t.term)}</dd><dt>Abrechnung</dt><dd>${t.prepaid?'Wertkarte':'Vertrag'}${t.inflation?' · wertgesichert':''}</dd>
 <dt>Jugendtarif</dt><dd>${t.youth?'ja (nur mit Jugend-Schalter gelistet)':'nein'}</dd><dt>eSIM / VoLTE</dt><dd>${t.esim?'ja':'nein'} / ${t.volte?'ja':'nein'}</dd><dt>Öffentl. / feste IP</dt><dd>${t.ipPublic?'ja':'nein'} / ${t.ipStatic?'ja':'nein'}</dd>
 <dt>Aktion</dt><dd>${esc(t.offer||'–')}</dd><dt>Merkmale</dt><dd>${t.tags.map(x=>`<span class="pill">${esc(x)}</span>`).join(' ')}</dd><dt>Quelle</dt><dd><a href="${t.url}" target="_blank">tarife.at-Detailseite ${ic('external-link')}</a>${t.homepage?` · <a href="${t.homepage}" target="_blank">Anbieter</a>`:''}</dd></dl>${t.text?`<p style="color:var(--mut)">${esc(t.text)}</p>`:''}`)}
function compare(){const r=tab==='router'?[['Bild',t=>t.imgs[0]?`<img src="${t.imgs[0]}">`:''],['Preis',t=>eur(t.price)],['SMS',t=>t.sms||'–'],['Telefonie',t=>t.tel.join(', ')||'–'],['Dual-SIM',t=>t.dualSim?'ja':'nein'],['5G Down',t=>t.maxDown?t.maxDown+' Mbit/s':'–'],['WLAN',t=>t.wifi||'–'],['Link',t=>R.gh({value:t.link})]]
 :[['Logo',t=>`<img src="${t.providerLogo}">`],['Netz',t=>t.network],['Effektiv',t=>eur(t.effective)],['P/L',t=>R.pl({value:t.pl})],['Down/Up',t=>t.down+'/'+t.up],['Daten',t=>gb(t.dataGB)],['Bindung',t=>term(t.term)],['Aktivierung',t=>eur(t.activation)],['Link',t=>R.link({value:t.url})]];
 drawer(`<h2>Vergleich</h2><div class="cmp"><table><tr><th></th>${cmp.map(t=>`<td><b>${esc(t.tariff||t.name)}</b></td>`).join('')}</tr>${r.map(([k,f])=>`<tr><th>${k}</th>${cmp.map(t=>`<td>${f(t)}</td>`).join('')}</tr>`).join('')}</table></div>`)}
load()})();
