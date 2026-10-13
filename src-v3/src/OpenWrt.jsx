import React,{useMemo,useRef,useState,useCallback} from 'react';
import {AgGridReact} from 'ag-grid-react';
import {Router,Search,X,LayoutGrid,Table2,ExternalLink,Check,Minus,Zap,CreditCard,Cpu,Euro,Image as Img,MessageSquare,Wifi,Cable,ShieldCheck,ShieldAlert} from 'lucide-react';
import {cn,Button,Badge,Card,Input,Sheet} from './components/ui.jsx';
import DATA from './openwrt.json';
const B=import.meta.env.BASE_URL,A=p=>p?B+p:p;
const R=DATA.items.map(r=>({...r,_id:r.id,imgs:r.imgs||[],is5g:/5G/.test(r.gen||'')}));
const eur=v=>v==null?'–':v.toLocaleString('de-AT',{style:'currency',currency:'EUR'});
const Ext=({href,children})=>href?<a href={href} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:underline dark:text-sky-400">{children}<ExternalLink className="size-3.5"/></a>:null;
const Thumb=({r,size='size-11'})=><div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border bg-white',size)}>{r.imgs[0]?<img loading="lazy" src={A(r.imgs[0])} alt="" className="max-h-full max-w-full object-contain"/>:<Router className="size-5 text-zinc-400"/>}</div>;
const YN=({v})=>v===true?<Badge variant="green"><Check/>ja</Badge>:v===false?<Minus className="size-4 text-muted-foreground/50"/>:<span className="text-xs text-muted-foreground">?</span>;
const Gen=({v})=>v?<Badge variant={/5G/.test(v)?'default':'secondary'}>{/5G/.test(v)?<Zap/>:null}{v}</Badge>:null;
const OW=({r})=>r.owrtOfficial?<Badge variant="green" title={r.owrt}><ShieldCheck/>offiziell</Badge>:<Badge variant="amber" title={r.owrt}><ShieldAlert/>OpenWrt-basiert</Badge>;
const txt=(f,h,w=180,extra={})=>({field:f,headerName:h,minWidth:w,filter:'agTextColumnFilter',valueFormatter:p=>p.value??'–',...extra});
const cols=[
 {field:'name',headerName:'Gerät',pinned:'left',minWidth:300,filter:'agTextColumnFilter',cellRenderer:p=><div className="flex items-center gap-3 overflow-hidden"><Thumb r={p.data}/><div className="min-w-0 leading-tight"><div className="truncate font-semibold">{p.data.name}</div><div className="truncate text-xs text-muted-foreground">{p.data.maker}</div></div></div>},
 {field:'gen',headerName:'Netz',minWidth:130,cellRenderer:p=><Gen v={p.value}/>},
 {field:'owrtOfficial',headerName:'OpenWrt',minWidth:150,cellRenderer:p=><OW r={p.data}/>},
 txt('owrt','Firmware / OpenWrt-Release',300),
 txt('cat','Modem / Kategorie',220),
 txt('sims','SIM-Slots',170),
 {field:'dual',headerName:'Dual-SIM',minWidth:110,cellRenderer:p=><YN v={p.value}/>},
 {field:'esim',headerName:'eSIM',minWidth:100,cellRenderer:p=><YN v={p.value}/>},
 txt('sms','SMS lesen (eigenes Tool)',260),
 txt('wifi','WLAN',190),
 txt('ports','Ports',230),
 {field:'price',headerName:'Geizhals ab',minWidth:130,filter:'agNumberColumnFilter',valueFormatter:p=>eur(p.value),cellRenderer:p=>p.data.gh?<Ext href={p.data.gh}>{eur(p.value)}</Ext>:eur(p.value)},
 {field:'url',headerName:'Links',minWidth:220,sortable:false,filter:false,cellRenderer:p=><div className="flex gap-3"><Ext href={p.data.url}>Hersteller</Ext><Ext href={p.data.owrtUrl}>OpenWrt</Ext></div>},
];
const CH=[['5g','5G',Zap,r=>r.is5g],['dual','Dual-SIM',CreditCard,r=>r.dual],['esim','eSIM',Cpu,r=>r.esim],['off','Offiziell OpenWrt',ShieldCheck,r=>r.owrtOfficial],['price','Mit Preis',Euro,r=>r.price],['photo','Mit Foto',Img,r=>r.imgs.length]];
function Detail({r}){return <div className="space-y-4">
 <div className="grid place-items-center rounded-xl border bg-white p-4" style={{minHeight:220}}>{r.imgs[0]?<img src={A(r.imgs[0])} alt={r.name} className="max-h-64 object-contain"/>:<Router className="size-16 text-zinc-300"/>}</div>
 <div className="flex flex-wrap gap-2"><Gen v={r.gen}/><OW r={r}/>{r.dual&&<Badge variant="secondary"><CreditCard/>Dual-SIM</Badge>}{r.esim&&<Badge variant="secondary"><Cpu/>eSIM</Badge>}</div>
 <dl className="divide-y rounded-lg border text-sm">{[['Firmware / OpenWrt',r.owrt],['Modem',r.cat],['SIM-Slots',r.sims],['SMS lesen',r.sms],['WLAN',r.wifi],['Ports',r.ports],['Geizhals ab',r.price!=null?eur(r.price):null]].map(([k,v])=><div key={k} className="grid grid-cols-3 gap-2 px-3 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2">{v||'–'}</dd></div>)}</dl>
 <div className="flex flex-wrap gap-4"><Ext href={r.url}>Herstellerseite</Ext><Ext href={r.owrtUrl}>OpenWrt-Firmware</Ext><Ext href={r.gh}>Geizhals</Ext></div>
 {r.imgSrc&&<p className="text-xs text-muted-foreground">Foto: Hersteller ({new URL(r.imgSrc).hostname})</p>}</div>}
export default function OpenWrtTab({theme}){
 const [F,setF]=useState(new Set());const [q,setQ]=useState('');const [cards,setCards]=useState(matchMedia('(max-width:768px)').matches);const [det,setDet]=useState(null);const grid=useRef();const [n,setN]=useState(R.length);
 const pass=r=>CH.every(([k,,,f])=>!F.has(k)||f(r));
 const list=useMemo(()=>R.filter(r=>pass(r)&&(!q||JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))),[F,q]);
 const onF=useCallback(()=>{const a=grid.current?.api;if(a)setN(a.getDisplayedRowCount())},[]);
 React.useEffect(()=>{grid.current?.api?.onFilterChanged()},[F]);React.useEffect(()=>{grid.current?.api?.setGridOption('quickFilterText',q)},[q]);
 return <>
 <Card className="p-4 text-sm text-muted-foreground"><b className="text-foreground">OpenWrt-Router mit SIM-Slot</b> – Einzel-SIM oder Dual-SIM-Failover. „Offiziell“ = Image auf downloads.openwrt.org (25.12.5 bzw. 24.10.x); „OpenWrt-basiert“ = Herstellerfirmware auf OpenWrt-Basis (GL.iNet, RutOS, Cudy). Leere Felder = auf Hersteller-/OpenWrt-Seite nicht verifiziert.</Card>
 <Card className="p-3"><div className="flex flex-wrap items-center gap-2">
  <div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtern…" className="pl-8"/></div>
  {CH.map(([k,l,I])=>{const on=F.has(k);return <Button key={k} size="sm" variant={on?'default':'outline'} className="rounded-full" onClick={()=>{const s=new Set(F);on?s.delete(k):s.add(k);setF(s)}}><I/>{l}</Button>})}
  {F.size>0&&<Button size="sm" variant="ghost" onClick={()=>setF(new Set())}><X/>Zurücksetzen</Button>}
  <div className="ml-auto inline-flex rounded-md border p-0.5"><Button size="sm" variant={cards?'ghost':'secondary'} onClick={()=>setCards(false)}><Table2/><span className="hidden sm:inline">Tabelle</span></Button><Button size="sm" variant={cards?'secondary':'ghost'} onClick={()=>setCards(true)}><LayoutGrid/><span className="hidden sm:inline">Karten</span></Button></div>
 </div><div className="mt-2 px-1 text-xs text-muted-foreground">{cards?list.length:n} von {R.length} Geräten · Quellen: openwrt.org, Herstellerseiten, Geizhals</div></Card>
 <div className={cn(cards&&'hidden')} style={{height:'calc(100vh - 150px)',minHeight:520}}>
  <AgGridReact ref={grid} theme={theme} rowData={R} columnDefs={cols} rowHeight={64} animateRows defaultColDef={{sortable:true,filter:true,floatingFilter:true,resizable:true}} getRowId={p=>p.data._id}
   isExternalFilterPresent={()=>F.size>0} doesExternalFilterPass={x=>pass(x.data)} onModelUpdated={onF} onRowClicked={e=>{if(!e.event.target.closest('a'))setDet(e.data)}}/></div>
 {cards&&<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{list.map(r=><Card key={r._id} className="cursor-pointer p-4 transition hover:shadow-md" onClick={()=>setDet(r)}>
  <div className="flex gap-3"><Thumb r={r} size="size-20"/><div className="min-w-0 flex-1"><div className="font-semibold leading-tight">{r.name}</div><div className="text-xs text-muted-foreground">{r.maker}</div><div className="mt-2 flex flex-wrap gap-1.5"><Gen v={r.gen}/><OW r={r}/>{r.dual&&<Badge variant="secondary"><CreditCard/>Dual-SIM</Badge>}{r.esim&&<Badge variant="secondary"><Cpu/>eSIM</Badge>}</div></div></div>
  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs"><span className="text-muted-foreground"><CreditCard className="mr-1 inline size-3"/>{r.sims||'–'}</span><span className="text-muted-foreground"><Wifi className="mr-1 inline size-3"/>{r.wifi||'–'}</span><span className="col-span-2 text-muted-foreground"><Cable className="mr-1 inline size-3"/>{r.ports||'–'}</span><span className="col-span-2 text-muted-foreground"><MessageSquare className="mr-1 inline size-3"/>{r.sms||'–'}</span></div>
  <div className="mt-3 flex items-center justify-between"><span className="font-semibold tabular-nums">{r.price!=null?eur(r.price):<span className="text-xs font-normal text-muted-foreground">kein Preis</span>}</span><div className="flex gap-3"><Ext href={r.url}>Hersteller</Ext><Ext href={r.owrtUrl}>OpenWrt</Ext></div></div></Card>)}</div>}
 <Sheet open={!!det} onOpenChange={o=>!o&&setDet(null)} title={det?.name||''} desc={det?`${det.maker} · ${det.gen||''}`:''}>{det&&<Detail r={det}/>}</Sheet>
 </>}
