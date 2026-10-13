import React,{useEffect,useMemo,useRef,useState,useCallback} from 'react';
import {AgGridReact} from 'ag-grid-react';import {AllCommunityModule,ModuleRegistry,themeQuartz,colorSchemeDark} from 'ag-grid-community';
import {Smartphone,Wifi,Router,Calculator,MapPin,Moon,Sun,Search,Columns3,LayoutGrid,Table2,Infinity as Inf,Zap,LockOpen,CreditCard,GraduationCap,X,MessageSquare,Phone,Image as Img,Euro,ExternalLink,Check,Minus,Scale,Signal,Command as Cmd,Rows3,Trophy} from 'lucide-react';
import {cn,Button,Badge,Card,Input,Tabs,TabsList,TabsTrigger,TabsContent,Switch,Sheet,Dialog,Command,CommandInput,CommandList,CommandEmpty,CommandGroup,CommandItem,DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuCheckboxItem} from './components/ui.jsx';
import {Rail,BottomNav,TopBar,ViewTabs,Feed,Gallery,Charts,CompareSide,CatViews,RightBar,ACC,fromMore,fromTarif,fromRouter,fromBiz} from './X.jsx';import M2 from './more.json';
import OpenWrtTab from './OpenWrt.jsx';import {BizTab,TricksTab} from './Biz.jsx';import BZ from './biz.json';import {Building2 as BiIcon,Factory as BsIcon,Server as CoIcon,PiggyBank as SpIcon} from 'lucide-react';import StromTab from './Strom.jsx';import {MoreGrid,Overview,PLogo,Empty,Skeleton,rows as MR} from './More.jsx';import {LayoutDashboard,Flame,Bookmark,BookmarkPlus} from 'lucide-react';import IpQualityTab from './IpQuality.jsx';import {ShieldCheck as IpIcon} from 'lucide-react';import {PlugZap as StromIcon} from 'lucide-react';import {Cpu as OwIcon} from 'lucide-react';
ModuleRegistry.registerModules([AllCommunityModule]);
const D=window.DATA,B=import.meta.env.BASE_URL,A=p=>p?B+p:p;
for(const svc of ['mobile','data']){const L=D.tarife.filter(t=>t.svc===svc);L.forEach(t=>{if(!t.dataGB||t.effective<3){t._raw=null;return}const dp=t.dataGB===-1?300:Math.min(t.dataGB,200)*1.5;t._raw=(Math.min(t.down,1000)+4*t.up+dp)/Math.max(t.effective,1)});
 const s=L.map(t=>t._raw).filter(x=>x!=null).sort((a,b)=>a-b);L.forEach(t=>t.pl=t._raw==null?null:Math.round(100*s.findIndex(x=>x>=t._raw)/Math.max(s.length-1,1)))}
D.tarife.forEach(t=>t._id=t.svc+t.id);D.router.forEach(r=>{r._id=r.link;r.tel=r.tel||[];r.imgs=r.imgs||[]});
const eur=v=>v==null?'–':v.toLocaleString('de-AT',{style:'currency',currency:'EUR'});
const gb=v=>v===-1?'∞':v==null?'–':(v>=1000?(v/1000).toLocaleString('de-AT')+' TB':v.toLocaleString('de-AT')+' GB');
const NETC={A1:'bg-rose-500',Magenta:'bg-fuchsia-500',Drei:'bg-orange-500'};
const Net=({v})=>v?<Badge variant="outline" className="font-medium"><span className={cn('size-2 rounded-full',NETC[v]||'bg-zinc-400')}/>{v}</Badge>:null;
const Bar=({v,max,unit='Mbit/s',cls='bg-primary'})=><div className="w-full"><div className="text-sm font-medium tabular-nums">{v??'–'} <span className="text-xs text-muted-foreground">{unit}</span></div><div className="mt-1 h-1.5 w-full rounded-full bg-muted"><div className={cn('h-full rounded-full',cls)} style={{width:Math.min(100,(v||0)/max*100)+'%'}}/></div></div>;
const PL=({v})=>v==null?null:<Badge variant={v>=80?'green':v>=55?'amber':'red'} className="tabular-nums" title="Preis-Leistungs-Index (Perzentil 0–100)"><Trophy/>{v}</Badge>;
const Yes=({v})=>v?<Badge variant="green"><Check/>ja</Badge>:<Minus className="size-4 text-muted-foreground/50"/>;
const Logo=({src,alt})=><PLogo name={alt} src={src}/>;
const Thumb=({r,size='size-11'})=><div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-white',size)}>{r.imgs[0]?<img loading="lazy" src={A(r.imgs[0])} alt="" className="max-h-full max-w-full object-contain"/>:<Router className="size-5 text-zinc-400"/>}</div>;
const Ext=({href,children})=>href?<a href={href} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">{children}<ExternalLink className="size-3.5"/></a>:null;
const num={filter:'agNumberColumnFilter'};
const tCols=svc=>[
 {field:'tariff',headerName:'Tarif',pinned:'left',minWidth:260,filter:'agTextColumnFilter',getQuickFilterText:p=>p.data.tariff+' '+p.data.provider,cellRenderer:p=><div className="flex items-center gap-3 overflow-hidden"><Logo src={p.data.providerLogo} alt={p.data.provider}/><div className="min-w-0 leading-tight"><div className="truncate font-semibold">{p.data.tariff}</div><div className="truncate text-xs text-muted-foreground">{p.data.provider}{p.data.youth?' · Jugend':''}</div></div></div>},
 {field:'provider',headerName:'Anbieter',width:120,hide:true},
 {field:'network',headerName:'Netz',width:115,cellRenderer:p=><Net v={p.value}/>},
 {field:'pl',headerName:'P/L',width:95,...num,sort:'desc',cellRenderer:p=><PL v={p.value}/>},
 {field:'effective',headerName:'Effektiv/Monat',width:150,...num,cellRenderer:p=><Bar v={p.value!=null?eur(p.value):null} unit="" max={1} cls="hidden"/>},
 {field:'down',headerName:'Download',width:140,...num,cellRenderer:p=><Bar v={p.value} max={1000}/>},
 {field:'up',headerName:'Upload',width:130,...num,cellRenderer:p=><Bar v={p.value} max={200} cls="bg-emerald-500"/>},
 {field:'dataGB',headerName:'Daten',width:135,...num,cellRenderer:p=>p.value===-1?<Badge variant="violet"><Inf/>Unlimitiert</Badge>:<span className="tabular-nums">{gb(p.value)}</span>},
 ...(svc==='mobile'?[{field:'minutes',headerName:'Min.',width:95,...num,valueFormatter:p=>p.value===-1?'∞':p.value},{field:'sms',headerName:'SMS',width:90,...num,valueFormatter:p=>p.value===-1?'∞':p.value}]:[]),
 {field:'euGB',headerName:'EU-GB',width:100,...num,valueFormatter:p=>gb(p.value)},
 {field:'fee',headerName:'Grundgebühr',width:125,...num,valueFormatter:p=>eur(p.value)},
 {field:'activation',headerName:'Aktivierung',width:120,...num,valueFormatter:p=>eur(p.value)},
 {field:'service',headerName:'Servicepauschale',width:140,...num,hide:true,valueFormatter:p=>eur(p.value)},
 {field:'term',headerName:'Bindung',width:110,...num,valueFormatter:p=>p.value?p.value+' Mon.':'keine'},
 {field:'five_g',headerName:'5G',width:85,cellRenderer:p=><Yes v={p.value}/>},
 {field:'prepaid',headerName:'Wertkarte',width:105,hide:true,cellRenderer:p=><Yes v={p.value}/>},
 {field:'youth',headerName:'Jugend',width:95,cellRenderer:p=><Yes v={p.value}/>},
 {field:'esim',headerName:'eSIM',width:85,hide:true,cellRenderer:p=><Yes v={p.value}/>},
 {field:'ipPublic',headerName:'Öff. IP',width:95,hide:true,cellRenderer:p=><Yes v={p.value}/>},
 {field:'offer',headerName:'Aktion',width:220,hide:true},
 {field:'url',headerName:'Quelle',width:120,filter:false,sortable:false,cellRenderer:p=><Ext href={p.value}>tarife.at</Ext>}];
const rCols=[{field:'name',headerName:'Gerät',pinned:'left',minWidth:320,filter:'agTextColumnFilter',cellRenderer:p=><div className="flex items-center gap-3 overflow-hidden"><Thumb r={p.data}/><div className="min-w-0 leading-tight"><div className="truncate font-semibold">{p.data.name}</div><div className="truncate text-xs text-muted-foreground">{p.data.maker} · {p.data.imgs.length} Foto{p.data.imgs.length==1?'':'s'}</div></div></div>},
 {field:'maker',headerName:'Hersteller',width:130},{field:'price',headerName:'Bestpreis',width:130,...num,sort:'asc',valueFormatter:p=>eur(p.value)},
 {field:'offers',headerName:'Händler',width:100,...num},{field:'sms',headerName:'SMS (1 SIM)',width:130,cellRenderer:p=>p.value?<Badge variant="green" title={p.value}><MessageSquare/>SMS</Badge>:<Badge variant="secondary">unbekannt</Badge>},
 {field:'tel',headerName:'Telefonie',width:210,valueFormatter:p=>(p.value||[]).join(', '),cellRenderer:p=>p.value?.length?<Badge variant="blue" title={p.value.join(', ')}><Phone/>{p.value.join(' · ')}</Badge>:<Minus className="size-4 text-muted-foreground/50"/>},
 {field:'sa',headerName:'5G SA',width:95,cellRenderer:p=><Yes v={p.value}/>},{field:'outdoor',headerName:'Outdoor',width:100,hide:true,cellRenderer:p=><Yes v={p.value}/>},{field:'dualSim',headerName:'Dual-SIM',width:105,cellRenderer:p=><Yes v={p.value}/>},
 {field:'maxDown',headerName:'Max. 5G Down',width:145,...num,cellRenderer:p=><Bar v={p.value} max={5000}/>},
 {field:'wifi',headerName:'WLAN',width:100},{field:'use',headerName:'Bauform',width:200,hide:true},{field:'ports',headerName:'Anschlüsse',width:260,hide:true},
 {field:'link',headerName:'Quelle',width:120,filter:false,sortable:false,cellRenderer:p=><Ext href={p.value}>geizhals</Ext>}];
const CH={mobile:[['A1','A1',null],['Magenta','Magenta',null],['Drei','Drei',null],['unl','Unlimitiert',Inf],['5g','5G',Zap],['nobind','Ohne Bindung',LockOpen],['prepaid','Wertkarte',CreditCard],['youth','Jugend',GraduationCap],['noyouth','Ohne Jugend',X]],
 router:[['sms','SMS-fähig',MessageSquare],['tel','Telefonie',Phone],['dual','Dual-SIM',CreditCard],['sa','5G SA',Zap],['photo','Mit Foto',Img],['u300','≤ 300 €',Euro]]};CH.data=CH.mobile;
const pass=(tab,F,r)=>{if(tab==='router')return(!F.has('sms')||r.sms)&&(!F.has('tel')||r.tel.length)&&(!F.has('dual')||r.dualSim)&&(!F.has('sa')||r.sa)&&(!F.has('photo')||r.imgs.length)&&(!F.has('u300')||(r.price&&r.price<=300));
 const nets=['A1','Magenta','Drei'].filter(n=>F.has(n));return(!nets.length||nets.includes(r.network))&&(!F.has('unl')||r.dataGB===-1)&&(!F.has('5g')||r.five_g)&&(!F.has('nobind')||!r.term)&&(!F.has('prepaid')||r.prepaid)&&(!F.has('youth')||r.youth)&&(!F.has('noyouth')||!r.youth)};
const P={fontFamily:'inherit',fontSize:13.5,headerFontWeight:700,wrapperBorderRadius:12,borderRadius:6,spacing:7,headerHeight:42};
const light=themeQuartz.withParams({...P,accentColor:'#18181b',backgroundColor:'#ffffff',foregroundColor:'#09090b',borderColor:'#71717a',headerBackgroundColor:'#f4f4f5',headerTextColor:'#18181b',rowHoverColor:'#f4f4f5',selectedRowBackgroundColor:'#f4f4f5',oddRowBackgroundColor:'#ffffff'});
const dark=themeQuartz.withPart(colorSchemeDark).withParams({...P,accentColor:'#fafafa',backgroundColor:'#0c0c0e',foregroundColor:'#fafafa',borderColor:'#a1a1aa',headerBackgroundColor:'#18181b',headerTextColor:'#fafafa',rowHoverColor:'#27272a',selectedRowBackgroundColor:'#27272a'});
const legacy=()=>({tarife:D.tarife.filter(t=>t.down&&t.effective>0).map(t=>({anbieter:t.provider,tarif:t.tariff,netz:t.network,down:t.down,up:t.up,preis:eur(t.effective),preis_sort:t.effective})),
 router:D.router.filter(r=>r.price).map(r=>({geraet:r.name,typ:r.use||'5G-Router',preis_sort:r.price,neu:eur(r.price)}))});
function Ext2({tab,mod}){const ref=useRef();useEffect(()=>{if(ref.current.dataset.m)return;ref.current.dataset.m=1;if(mod==='net'){window.TarifeNetwork.mount(ref.current,{assetBase:B+'features/network/assets/'});setTimeout(()=>ref.current?.querySelectorAll('.tn-table-wrap').forEach(e=>{e.tabIndex=0;e.setAttribute('aria-label','Tabelle')}),800)}else window.TarifeCalc.mount(ref.current,{data:legacy()})},[]);return <Card className="bg-white p-4 text-zinc-950 sm:p-6" style={{colorScheme:"light"}}><div ref={ref}/></Card>}
const Stat=({icon:I,label,value,hint})=><Card className="p-4"><div className="flex items-center justify-between text-sm text-muted-foreground">{label}<I className="size-4"/></div><div className="mt-1 text-2xl font-bold tabular-nums">{value}</div><div className="text-xs text-muted-foreground">{hint}</div></Card>;
export default function App(){
 const [tab,setTab]=useState(localStorage.tab4||'home');const [dark2,setDark]=useState(document.documentElement.classList.contains('dark'));
 const [F,setF]=useState(new Set());const [q,setQ]=useState('');const [dense,setDense]=useState(localStorage.dense==='1');
 const [cards,setCards]=useState(matchMedia('(max-width:768px)').matches);const [det,setDet]=useState(null);const [cmp,setCmp]=useState([]);const [cmpOpen,setCmpOpen]=useState(false);
 const [k,setK]=useState(false);const [cols,setCols]=useState([]);const [shown,setShown]=useState([]);const [lim,setLim]=useState(40);const grid=useRef();
 const isGrid=['mobile','data','router'].includes(tab);
 const rows=useMemo(()=>tab==='router'?D.router:D.tarife.filter(t=>t.svc===tab),[tab]);
 const colDefs=useMemo(()=>tab==='router'?rCols:tCols(tab),[tab]);
 useEffect(()=>{localStorage.tab4=tab;setF(new Set());setCmp([]);setQ('');setLim(40)},[tab]);
 useEffect(()=>{document.documentElement.classList.toggle('dark',dark2);localStorage.theme=dark2?'dark':'light'},[dark2]);
 useEffect(()=>{const h=e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setK(v=>!v)}};addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[]);
 const refresh=useCallback(()=>{const a=grid.current?.api;if(!a)return;const out=[];a.forEachNodeAfterFilterAndSort(n=>out.push(n.data));setShown(out);setCols(a.getColumns().filter(c=>!c.getColDef().pinned).map(c=>({id:c.getColId(),name:c.getColDef().headerName,vis:c.isVisible()})))},[]);
 useEffect(()=>{grid.current?.api?.onFilterChanged()},[F]);
 useEffect(()=>{grid.current?.api?.setGridOption('quickFilterText',q)},[q]);
 const fallback=useMemo(()=>rows.filter(r=>pass(tab,F,r)&&(!q||JSON.stringify([r.tariff,r.provider,r.name]).toLowerCase().includes(q.toLowerCase()))),[rows,F,q,tab]);
 const list=shown.length||grid.current?.api?shown:fallback;
 const toggleCmp=r=>setCmp(c=>c.some(x=>x._id===r._id)?c.filter(x=>x._id!==r._id):c.length>=3?[...c.slice(1),r]:[...c,r]);
 const onSel=e=>{const s=e.api.getSelectedRows();if(s.length>3){e.api.getRowNode(s[0]._id).setSelected(false);return}setCmp(s)};
 useEffect(()=>{const a=grid.current?.api;if(!a)return;a.forEachNode(n=>{const on=cmp.some(x=>x._id===n.data._id);if(n.isSelected()!==on)n.setSelected(on)})},[cmp]);
 const nMob=D.tarife.filter(t=>t.svc==='mobile').length,nDat=D.tarife.length-nMob,cheapUnl=Math.min(...D.tarife.filter(t=>t.dataGB===-1&&t.effective>0).map(t=>t.effective));
 const isR=tab==='router';
 const [view,setView]=useState('feed');useEffect(()=>setView('feed'),[tab]);
 const go=t=>{setTab(t);scrollTo(0,0)};const acc=ACC[tab]||'#1d9bf0';
 const items=useMemo(()=>isGrid?list.map(r=>isR?fromRouter(r,A):fromTarif(r,A)):[],[list,isGrid,isR]);
 const side=useMemo(()=>{const pick=(arr,f)=>arr.filter(x=>f(x)>0).sort((a,b)=>f(a)-f(b))[0];const u=pick(D.tarife.filter(t=>t.dataGB===-1&&t.svc==='mobile'),t=>t.effective),d5=pick(D.tarife.filter(t=>t.svc==='data'&&t.dataGB===-1),t=>t.effective),r=pick(D.router.filter(r=>r.sa),r=>r.price),st=pick(MR.filter(r=>r.cat==='strom'&&r.ct),r=>r.ct),bi=pick(BZ.bi,r=>r.preis);
  const deals=[u&&{k:'Handy unlimitiert',tab:'mobile',name:u.tariff,prov:u.provider,logo:u.providerLogo,v:eur(u.effective)},d5&&{k:'5G-Internet unlimitiert',tab:'data',name:d5.tariff,prov:d5.provider,logo:d5.providerLogo,v:eur(d5.effective)},r&&{k:'5G-SA-Router',tab:'router',name:r.name,prov:r.maker,v:eur(r.price)},st&&{k:'Strom Arbeitspreis',tab:'strom',name:st.tarif,prov:st.anbieter,v:st.ct.toFixed(2)+' ct'},bi&&{k:'Business-Internet',tab:'bi',name:bi.tarif,prov:bi.anbieter,v:eur(bi.preis)}].filter(Boolean);
  const sp=arr=>{const v=arr.filter(x=>x>0).sort((a,b)=>a-b);const n=10,m=v[Math.floor(v.length*.95)]||1;return Array.from({length:n},(_,k)=>v.filter(x=>x>=k*m/n&&x<(k+1)*m/n).length)};
  const trends=[{tab:'mobile',cat:'Handy',tag:'Unlimitiert',n:D.tarife.filter(t=>t.dataGB===-1).length,spark:sp(D.tarife.map(t=>t.effective))},{tab:'heizen',cat:'Heizen',tag:'Pelletpreise',n:MR.filter(r=>r.cat==='heizen').length,spark:sp(MR.filter(r=>r.cat==='heizen').map(r=>r.wert))},{tab:'bs',cat:'Business',tag:'Gewerbestrom',n:BZ.strom.length,spark:sp(BZ.strom.map(r=>r.gesamt_eur_jahr_brutto))},{tab:'colo',cat:'Server',tag:'Colocation',n:BZ.colo.length,spark:sp(BZ.colo.map(r=>r.netze))},{tab:'router',cat:'Hardware',tag:'5GRouter',n:D.router.length,spark:sp(D.router.map(r=>r.price))},{tab:'bi',cat:'Business',tag:'FixeIP',n:BZ.bi.length,spark:sp(BZ.bi.map(r=>r.preis))}];
  return {deals,trends,provs:Object.entries(M2.logos)}},[]);
 const counts={mobile:nMob,data:nDat,router:D.router.length,openwrt:26,heizen:MR.filter(r=>r.cat==='heizen').length,bi:BZ.bi.length,bs:BZ.strom.length,colo:BZ.colo.length,tricks:BZ.tricks.length};
 const T=t=>dark2?dark:light;const mr=c=>MR.filter(r=>r.cat===c).map(fromMore);
 return <div className="mx-auto flex min-h-screen max-w-[1640px]">
 <Rail tab={tab} go={go} dark={dark2} setDark={setDark} openK={()=>setK(true)} counts={counts}/>
 <main className="min-w-0 flex-1 border-r pb-20 md:pb-0"><TopBar tab={tab} dark={dark2} setDark={setDark} openK={()=>setK(true)} sub={({"home": "Alles auf einen Blick", "mobile": "Handytarife – tarife.at + Anbieter", "data": "Mobiles Internet, 5G, Glasfaser", "router": "5G-Router mit Fotos (Geizhals)", "openwrt": "Router mit SIM-Slot", "strom": "E-Control + Versorger", "heizen": "Pellets, Heizöl, Gas, Fernwärme", "ipq": "IP-Reputation der Netze", "bi": "Business-Internet & fixe IPs", "bs": "Gewerbestrom nach Verbrauch", "colo": "Rechenzentren in Österreich", "tricks": "Legale Spartricks", "calc": "Rechner", "net": "Bandgasse 13, 1070 Wien"})[tab]+' · Stand '+D.stand}/>
 <div className="space-y-5 p-3 sm:p-4">
  {tab==='home'&&<><Overview go={go} counts={{mobile:nMob,data:nDat,router:D.router.length,strom:984,bi:BZ.bi.length,bs:BZ.strom.length,colo:BZ.colo.length,tricks:BZ.tricks.length}}/><CatViews key='home' items={MR.map(fromMore)} accent={acc}><MoreGrid cat='handy' theme={dark2?dark:light}/></CatViews></>}{tab==='heizen'&&<CatViews key='hz' items={mr('heizen')} accent={acc}><MoreGrid cat='heizen' title='Heizen: Pellets, Heizöl, Gas, Fernwärme & Energiepreisindizes' theme={dark2?dark:light}/></CatViews>}{tab==='strom'&&<CatViews key='st' items={mr('strom')} accent={acc}><MoreGrid cat='strom' title='Strom direkt von den Versorgern (OpenCLI)' theme={dark2?dark:light}/></CatViews>}{tab==='openwrt'&&<OpenWrtTab theme={dark2?dark:light}/>}
  {tab==='strom'&&<StromTab theme={dark2?dark:light}/>}
  {tab==='ipq'&&<IpQualityTab theme={dark2?dark:light}/>}{tab==='bi'&&<CatViews key='bi' items={[...BZ.bi.map(r=>fromBiz('bi',r)),...mr('business')]} accent={acc}><MoreGrid cat='business' title='Business-Tarife direkt vom Anbieter (OpenCLI)' theme={dark2?dark:light}/><BizTab kind='bi' theme={dark2?dark:light}/></CatViews>}{tab==='bs'&&<CatViews key='bs' items={BZ.strom.map(r=>fromBiz('strom',r))} accent={acc}><BizTab kind='strom' theme={dark2?dark:light}/></CatViews>}{tab==='colo'&&<CatViews key='colo' items={BZ.colo.map(r=>fromBiz('colo',r))} accent={acc}><BizTab kind='colo' theme={dark2?dark:light}/></CatViews>}{tab==='tricks'&&<TricksTab/>}
  {!isGrid&&tab!=='openwrt'&&tab!=='strom'&&tab!=='ipq'&&!['bi','bs','colo','tricks','home','heizen'].includes(tab)&&<Ext2 key={tab} mod={tab}/>}
  {isGrid&&<><Card className="overflow-hidden rounded-2xl p-0"><ViewTabs view={view} setView={setView} accent={acc}/>{view==='feed'&&<Feed items={items} accent={acc} onOpen={it=>setDet(it.raw)}/>}{view==='gallery'&&<Gallery items={items} accent={acc} onOpen={it=>setDet(it.raw)}/>}{view==='charts'&&<Charts items={items} accent={acc}/>}{view==='compare'&&<CompareSide key={tab} items={items} accent={acc}/>}</Card>
  <Card className="sticky top-[62px] z-20 rounded-2xl p-3 shadow-sm"><div className="flex flex-wrap items-center gap-2">
   <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtern…" className="pl-8"/></div>
   {CH[tab].map(([key,l,I])=>{const on=F.has(key);return <Button key={key} size="sm" variant={on?'default':'outline'} className="rounded-full" onClick={()=>{const n=new Set(F);on?n.delete(key):n.add(key);setF(n)}}>{I?<I/>:<span className={cn('size-2 rounded-full',NETC[key])}/>}{l}</Button>})}
   {F.size>0&&<Button size="sm" variant="ghost" onClick={()=>setF(new Set())}><X/>Zurücksetzen</Button>}<Views tab={tab} F={F} q={q} apply={(f,qq)=>{setF(new Set(f));setQ(qq)}}/>
   <div className="ml-auto flex items-center gap-2">
    <label className="hidden items-center gap-2 text-sm md:flex"><Rows3 className="size-4 text-muted-foreground"/>Kompakt<Switch checked={dense} onCheckedChange={v=>{setDense(v);localStorage.dense=v?'1':'0'}}/></label>
    <div className="inline-flex rounded-md border p-0.5"><Button aria-label="Tabelle" size="sm" variant={cards?'ghost':'secondary'} onClick={()=>setCards(false)}><Table2/><span className="hidden sm:inline">Tabelle</span></Button><Button aria-label="Karten" size="sm" variant={cards?'secondary':'ghost'} onClick={()=>setCards(true)}><LayoutGrid/><span className="hidden sm:inline">Karten</span></Button></div>
    <DropdownMenu><DropdownMenuTrigger asChild><Button aria-label="Spalten" size="sm" variant="outline"><Columns3/><span className="hidden sm:inline">Spalten</span></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Spalten anzeigen</DropdownMenuLabel><DropdownMenuSeparator/>
     {cols.map(c=><DropdownMenuCheckboxItem key={c.id} checked={c.vis} onCheckedChange={v=>{grid.current.api.setColumnsVisible([c.id],v);refresh()}}>{c.name}</DropdownMenuCheckboxItem>)}</DropdownMenuContent></DropdownMenu>
   </div></div>
   <div className="mt-2 px-1 text-xs text-muted-foreground">{list.length} von {rows.length} Einträgen · Shift+Klick für Mehrfach-Sortierung · bis zu 3 zum Vergleich markieren</div></Card>
  <div className={cn((cards||view!=='table')&&'hidden')} style={{height:'calc(100vh - 150px)',minHeight:520}}>
   <AgGridReact ref={grid} key={tab} theme={dark2?dark:light} rowData={rows} columnDefs={colDefs} rowHeight={dense?46:64} animateRows
    defaultColDef={{sortable:true,filter:true,floatingFilter:true,resizable:true}} rowSelection={{mode:'multiRow',checkboxes:true,headerCheckbox:false,enableClickSelection:false}} selectionColumnDef={{pinned:'left',width:48}}
    getRowId={p=>p.data._id} isExternalFilterPresent={()=>F.size>0} doesExternalFilterPass={n=>pass(tab,F,n.data)} onGridReady={refresh} onModelUpdated={refresh}
    onRowClicked={e=>{if(!e.event.target.closest('a,.ag-checkbox,.ag-selection-checkbox'))setDet(e.data)}} onSelectionChanged={onSel}/></div>
  {view==='table'&&cards&&list.length===0&&<Empty onReset={()=>{setF(new Set());setQ('')}}/>}{view==='table'&&cards&&<><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.slice(0,lim).map(r=><ItemCard key={r._id} r={r} isR={isR} sel={cmp.some(x=>x._id===r._id)} onCmp={()=>toggleCmp(r)} onOpen={()=>setDet(r)}/>)}</div>
   {lim<list.length&&<div className="flex justify-center"><Button variant="outline" onClick={()=>setLim(lim+40)}>Mehr laden ({list.length-lim} weitere)</Button></div>}</>}
  {tab==='mobile'&&<MoreGrid cat='handy' title='Handytarife direkt vom Anbieter (OpenCLI)' theme={dark2?dark:light}/>}{tab==='data'&&<MoreGrid cat='internet' title='Internet & Glasfaser direkt vom Anbieter (OpenCLI)' theme={dark2?dark:light}/>}
  </>}
  <footer className="border-t pt-4 text-xs text-muted-foreground">Daten: tarife.at, Geizhals (Stand {D.stand}). Angaben ohne Gewähr; P/L-Index = Perzentil aus (Down + 4×Up + Daten) ÷ Effektivpreis. Tabelle: AG Grid Community (MIT) · UI: shadcn/ui-Stil, Radix, Lucide.</footer>
 </div></main>
 <RightBar go={go} deals={side.deals} trends={side.trends} provs={side.provs} openK={()=>setK(true)}/><BottomNav tab={tab} go={go}/>
 {cmp.length>0&&isGrid&&<div className="fixed inset-x-0 bottom-20 md:bottom-4 z-40 flex justify-center px-4"><Card className="flex items-center gap-3 p-2 pl-4 shadow-xl"><Scale className="size-4"/><span className="text-sm font-medium">{cmp.length}/3 im Vergleich</span>
  <div className="hidden gap-1 sm:flex">{cmp.map(r=><Badge key={r._id} variant="secondary" className="max-w-[160px]"><span className="truncate">{r.tariff||r.name}</span><X className="cursor-pointer" onClick={()=>toggleCmp(r)}/></Badge>)}</div>
  <Button size="sm" onClick={()=>setCmpOpen(true)}>Vergleichen</Button><Button size="sm" variant="ghost" onClick={()=>setCmp([])}><X/></Button></Card></div>}
 <Sheet open={!!det} onOpenChange={o=>!o&&setDet(null)} title={det?(det.tariff||det.name):''} desc={det?(det.provider?`${det.provider} · Netz ${det.network}`:`${det.maker} · Geizhals`):''}>{det&&<Detail r={det} onCmp={()=>toggleCmp(det)} sel={cmp.some(x=>x._id===det._id)}/>}</Sheet>
 <Sheet side="bottom" open={cmpOpen} onOpenChange={setCmpOpen} title="Vergleich" desc="Bis zu 3 Einträge nebeneinander">{cmpOpen&&<Compare items={cmp} isR={isR}/>}</Sheet>
 <Dialog open={k} onOpenChange={setK} title="Suche"><Command loop><CommandInput placeholder="Tarif, Anbieter, Router oder Befehl…"/><CommandList><CommandEmpty>Nichts gefunden.</CommandEmpty>
  <CommandGroup heading="Navigation">{[['mobile','Handytarife',Smartphone],['data','Internet / 5G',Wifi],['router','5G-Router',Router],['openwrt','OpenWrt-Router (SIM)',OwIcon],['calc','Rechner',Calculator],['strom','Strom',Zap],['net','Standort Bandgasse 13',MapPin]].map(([v,l,I])=><CommandItem key={v} onSelect={()=>{setTab(v);setK(false)}}><I/>{l}</CommandItem>)}
   <CommandItem onSelect={()=>{setDark(!dark2);setK(false)}}>{dark2?<Sun/>:<Moon/>}Design umschalten</CommandItem></CommandGroup>
  <CommandGroup heading="Tarife">{D.tarife.map(t=><CommandItem key={t._id} value={`${t.provider} ${t.tariff} ${t._id}`} onSelect={()=>{setK(false);setDet(t)}}><img src={A(t.providerLogo)} className="size-5 rounded bg-white object-contain p-0.5" alt=""/><span className="truncate">{t.provider} · {t.tariff}</span><span className="ml-auto text-xs text-muted-foreground tabular-nums">{eur(t.effective)}</span></CommandItem>)}</CommandGroup>
  <CommandGroup heading="Router">{D.router.map(r=><CommandItem key={r._id} value={`${r.name} ${r._id}`} onSelect={()=>{setK(false);setDet(r)}}><Router/><span className="truncate">{r.name}</span><span className="ml-auto text-xs text-muted-foreground">{eur(r.price)}</span></CommandItem>)}</CommandGroup>
 </CommandList></Command></Dialog>
 </div>}
function ItemCard({r,isR,sel,onCmp,onOpen}){return <Card className="group cursor-pointer p-4 transition hover:shadow-md" onClick={onOpen}>
 <div className="flex items-start gap-3">{isR?<Thumb r={r} size="size-16"/>:<Logo src={r.providerLogo} alt={r.provider}/>}<div className="min-w-0 flex-1"><div className="font-semibold leading-tight">{r.tariff||r.name}</div><div className="text-xs text-muted-foreground">{isR?r.maker:r.provider}</div>
  <div className="mt-2 flex flex-wrap gap-1">{isR?<>{r.sms&&<Badge variant="green"><MessageSquare/>SMS</Badge>}{r.tel.length>0&&<Badge variant="blue"><Phone/>Telefonie</Badge>}{r.sa&&<Badge variant="violet"><Zap/>5G SA</Badge>}{r.dualSim&&<Badge variant="secondary">Dual-SIM</Badge>}</>
   :<><Net v={r.network}/><PL v={r.pl}/>{r.dataGB===-1&&<Badge variant="violet"><Inf/>Unlimitiert</Badge>}{r.five_g&&<Badge variant="blue"><Zap/>5G</Badge>}{!r.term&&<Badge variant="secondary">ohne Bindung</Badge>}</>}</div></div>
  <div className="text-right"><div className="text-lg font-bold tabular-nums">{eur(isR?r.price:r.effective)}</div><div className="text-xs text-muted-foreground">{isR?'Bestpreis':'pro Monat'}</div></div></div>
 {!isR&&<div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2 text-center text-xs"><div><div className="font-semibold tabular-nums">{r.down??'–'}</div><div className="text-muted-foreground">Mbit ↓</div></div><div><div className="font-semibold tabular-nums">{r.up??'–'}</div><div className="text-muted-foreground">Mbit ↑</div></div><div><div className="font-semibold">{gb(r.dataGB)}</div><div className="text-muted-foreground">Daten</div></div></div>}
 <div className="mt-3 flex items-center justify-between"><Ext href={isR?r.link:r.url}>{isR?'geizhals':'tarife.at'}</Ext><Button size="sm" variant={sel?'default':'outline'} onClick={e=>{e.stopPropagation();onCmp()}}><Scale/>{sel?'Im Vergleich':'Vergleichen'}</Button></div></Card>}
const Row=({k,v})=>v==null||v===''||(Array.isArray(v)&&!v.length)?null:<div className="flex justify-between gap-4 border-b py-2 text-sm last:border-0"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;
function Detail({r,onCmp,sel}){const isR=!r.provider;const [i,setI]=useState(0);return <div className="space-y-4">
 {isR?<div><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-xl border bg-white">{r.imgs[i]?<img src={A(r.imgs[i])} className="max-h-full max-w-full object-contain" alt=""/>:<Router className="size-12 text-zinc-300"/>}</div>
  {r.imgs.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto">{r.imgs.map((s,j)=><button key={s} onClick={()=>setI(j)} className={cn('size-14 shrink-0 overflow-hidden rounded-md border bg-white',j===i&&'ring-2 ring-ring')}><img src={A(s)} className="h-full w-full object-contain" alt=""/></button>)}</div>}</div>
 :<div className="flex items-center gap-3"><Logo src={r.providerLogo} alt=""/><Net v={r.network}/><PL v={r.pl}/>{r.five_g&&<Badge variant="blue"><Zap/>5G</Badge>}{r.dataGB===-1&&<Badge variant="violet"><Inf/>Unlimitiert</Badge>}</div>}
 <Card className="flex items-end justify-between bg-muted/40 p-4"><div><div className="text-xs text-muted-foreground">{isR?'Bestpreis Geizhals':'Effektiv pro Monat'}</div><div className="text-3xl font-bold tabular-nums">{eur(isR?r.price:r.effective)}</div></div><Button variant={sel?'default':'outline'} onClick={onCmp}><Scale/>{sel?'Im Vergleich':'Vergleichen'}</Button></Card>
 {r.text&&<p className="text-sm leading-relaxed text-muted-foreground">{r.text}</p>}
 <div>{isR?<><Row k="Hersteller" v={r.maker}/><Row k="Händler" v={r.offers}/><Row k="Max. Download" v={r.maxDown&&r.maxDown+' Mbit/s'}/><Row k="Modem" v={r.modem}/><Row k="SIM" v={r.sim}/><Row k="Dual-SIM" v={r.dualSim?'ja':'nein'}/><Row k="5G SA" v={r.sa?'ja':'nein'}/><Row k="WLAN" v={r.wifi}/><Row k="Anschlüsse" v={r.ports}/><Row k="Antenne" v={r.antenna}/><Row k="Bauform" v={r.use}/><Row k="SMS" v={r.sms}/><Row k="Telefonie" v={r.tel.join(', ')}/></>
 :<><Row k="Download / Upload" v={`${r.down??'–'} / ${r.up??'–'} Mbit/s`}/><Row k="Daten" v={gb(r.dataGB)}/><Row k="EU-Daten" v={gb(r.euGB)}/><Row k="Minuten / SMS" v={r.svc==='mobile'?`${r.minutes===-1?'∞':r.minutes} / ${r.sms===-1?'∞':r.sms}`:null}/><Row k="Grundgebühr" v={eur(r.fee)}/><Row k="Aktivierung" v={eur(r.activation)}/><Row k="Servicepauschale" v={eur(r.service)}/><Row k="Bindung" v={r.term?r.term+' Monate':'keine'}/><Row k="Technologie" v={r.tech}/><Row k="eSIM" v={r.esim==null?null:r.esim?'ja':'nein'}/><Row k="VoLTE" v={r.volte==null?null:r.volte?'ja':'nein'}/><Row k="Öffentliche IP" v={r.ipPublic==null?null:r.ipPublic?'ja':'nein'}/><Row k="Aktion" v={r.offer}/></>}</div>
 {!isR&&r.tags?.length>0&&<div className="flex flex-wrap gap-1">{r.tags.map(t=><Badge key={t} variant="outline">{t}</Badge>)}</div>}
 {isR&&r.smsSrc&&<Ext href={r.smsSrc}>SMS-Tool / Quelle</Ext>}
 <div className="flex gap-2">{isR?<Button asChild href={r.link} target="_blank" rel="noopener" className="flex-1"><ExternalLink/>Auf Geizhals ansehen</Button>:<><Button asChild href={r.url} target="_blank" rel="noopener" className="flex-1"><ExternalLink/>Auf tarife.at</Button>{r.homepage&&<Button asChild variant="outline" href={r.homepage} target="_blank" rel="noopener">Anbieter</Button>}</>}</div></div>}
function Compare({items,isR}){const F=isR?[['Preis',r=>eur(r.price)],['Max. Down',r=>r.maxDown&&r.maxDown+' Mbit/s'],['5G SA',r=>r.sa?'✓':'–'],['Dual-SIM',r=>r.dualSim?'✓':'–'],['SMS',r=>r.sms?'✓':'–'],['Telefonie',r=>r.tel.join(', ')||'–'],['WLAN',r=>r.wifi],['Händler',r=>r.offers]]
 :[['Effektiv/Monat',r=>eur(r.effective)],['P/L-Index',r=>r.pl??'–'],['Netz',r=>r.network],['Down/Up',r=>`${r.down}/${r.up} Mbit/s`],['Daten',r=>gb(r.dataGB)],['EU-GB',r=>gb(r.euGB)],['Bindung',r=>r.term?r.term+' Mon.':'keine'],['Aktivierung',r=>eur(r.activation)],['5G',r=>r.five_g?'✓':'–']];
 return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th/>{items.map(r=><th key={r._id} className="min-w-[160px] p-2 text-left align-top"><div className="flex items-center gap-2">{isR?<Thumb r={r}/>:<Logo src={r.providerLogo} alt=""/>}<div><div className="font-semibold">{r.tariff||r.name}</div><div className="text-xs font-normal text-muted-foreground">{r.provider||r.maker}</div></div></div></th>)}</tr></thead>
 <tbody>{F.map(([l,f])=><tr key={l} className="border-t"><td className="p-2 text-muted-foreground">{l}</td>{items.map(r=><td key={r._id} className="p-2 font-medium tabular-nums">{f(r)}</td>)}</tr>)}</tbody></table></div>}

function Views({tab,F,q,apply}){const key='views_'+tab;const [v,setV]=useState(()=>JSON.parse(localStorage[key]||'[]'));
 const save=()=>{const name=[...F].join('+')||q||'Ansicht';const n=[...v.filter(x=>x.name!==name),{name,f:[...F],q}].slice(-5);setV(n);localStorage[key]=JSON.stringify(n)};
 return <div className="flex items-center gap-1"><Button size="sm" variant="outline" onClick={save} disabled={!F.size&&!q} title="Aktuelle Filter als Ansicht speichern"><BookmarkPlus/>Ansicht speichern</Button>
  {v.map(x=><Button key={x.name} size="sm" variant="secondary" className="rounded-full" onClick={()=>apply(x.f,x.q)}><Bookmark/>{x.name}<X className="opacity-60" onClick={e=>{e.stopPropagation();const n=v.filter(y=>y.name!==x.name);setV(n);localStorage[key]=JSON.stringify(n)}}/></Button>)}</div>}
