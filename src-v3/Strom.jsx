import React,{useEffect,useMemo,useState,useRef} from 'react';
import {AgGridReact} from 'ag-grid-react';
import {ResponsiveContainer,LineChart,Line,BarChart,Bar,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts';
import {Zap,Leaf,ShieldCheck,TrendingUp,MapPin,Info,ExternalLink,LockOpen,Search,X,Activity} from 'lucide-react';
import {cn,Badge,Card,Input,Button} from './components/ui.jsx';
const B=import.meta.env.BASE_URL;
const eur=v=>v==null||isNaN(v)?'–':v.toLocaleString('de-AT',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const eur2=v=>v==null?'–':v.toLocaleString('de-AT',{style:'currency',currency:'EUR'});
const ct=v=>v==null?'–':v.toLocaleString('de-AT',{maximumFractionDigits:2})+' ct';
const COLORS=['#18181b','#2563eb','#16a34a','#ea580c','#9333ea','#db2777'];
// Jahreskosten (brutto) im Jahr y. Neukund:innen-Rabatt nur im Jahr 1; Bestandstarif ("aktuell") nie rabattiert.
export function yearCost(t,kwh,y,{current=false,rabatt=true}={}){if(!t.E)return null;const e=t.E[0]+t.E[1]*kwh,n=t.N[0]+t.N[1]*kwh,r=t.R[0]+t.R[1]*kwh;return e+n+((y>1||current||!rabatt)?r:0)}
export function cumCost(t,kwh,years,o){const out=[];let s=0;for(let y=1;y<=years;y++){s+=yearCost(t,kwh,y,o);out.push(s)}return out}
export function breakEven(t,cur,kwh,switchCost=0,years=5){// Monat, ab dem der neue Tarif inkl. Wechselkosten dauerhaft günstiger ist
 let a=switchCost,b=0,first=null;for(let m=1;m<=years*12;m++){const y=Math.ceil(m/12);a+=yearCost(t,kwh,y)/12;b+=yearCost(cur,kwh,y,{current:true})/12;if(a<b){if(first==null)first=m}else first=null}return first}
const Logo=({t})=>{const [err,setErr]=useState(!t.domain);return <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg border bg-white text-xs font-bold text-zinc-600">{err?(t.anbieter||'?').slice(0,2).toUpperCase():<img loading="lazy" alt="" className="size-6 object-contain" src={`https://www.google.com/s2/favicons?domain=${t.domain}&sz=64`} onError={()=>setErr(true)} onLoad={e=>e.currentTarget.naturalWidth<24&&setErr(true)}/>}</div>};
const Ext=({href,children})=>href?<a href={href} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">{children}<ExternalLink className="size-3.5"/></a>:null;
const num={filter:'agNumberColumnFilter',comparator:(a,b,na,nb,desc)=>a==null&&b==null?0:a==null?(desc?-1:1):b==null?(desc?1:-1):a-b};
export default function Strom({theme}){
 const [S,setS]=useState(null);const [plz,setPlz]=useState(localStorage.sPlz||'1070');const [kwh,setKwh]=useState(Number(localStorage.sKwh)||3500);const [years,setYears]=useState(3);
 const [curId,setCurId]=useState(localStorage.sCur||'');const [sw,setSw]=useState(0);const [q,setQ]=useState('');const [F,setF]=useState(new Set());const [sel,setSel]=useState([]);const grid=useRef();
 useEffect(()=>{fetch(B+'assets/strom.json').then(r=>r.json()).then(setS)},[]);
 useEffect(()=>{localStorage.sPlz=plz;localStorage.sKwh=kwh;localStorage.sCur=curId},[plz,kwh,curId]);
 const P=S?.plz[plz];
 const rows=useMemo(()=>{if(!P)return[];return P.tarife.map(t=>{const priced=t.jahr1>0;const T=priced?t:{...t,E:null,ap:null,jahr1:null};
  return {...T,priced,j1:priced?yearCost(T,kwh,1):null,jN:priced?cumCost(T,kwh,years).at(-1):null,j2:priced?yearCost(T,kwh,2):null}})},[P,kwh,years]);
 const priced=rows.filter(r=>r.priced);
 const cur=useMemo(()=>priced.find(r=>String(r.id)===curId)||priced.find(r=>/wien energie/i.test(r.anbieter)&&/entspannt/i.test(r.tarif))||priced[0],[priced,curId]);
 const withSave=useMemo(()=>rows.map(r=>({...r,save:r.priced&&cur?cumCost(cur,kwh,years,{current:true}).at(-1)-r.jN-sw:null,be:r.priced&&cur&&r.id!==cur.id?breakEven(r,cur,kwh,sw,years):null})),[rows,cur,kwh,years,sw]);
 const filt=r=>(!F.has('oeko')||r.oeko===100)&&(!F.has('fix')||r.garantie==='GUARANTEE')&&(!F.has('float')||r.floating)&&(!F.has('nobind')||r.ohneBindung)&&(!F.has('priced')||r.priced)&&(!F.has('at')||r.at);
 const cheapest=[...priced].sort((a,b)=>a.jN-b.jN);
 const chartSet=useMemo(()=>{const s=sel.length?sel:cheapest.slice(0,4);return [cur,...s.filter(x=>x&&cur&&x.id!==cur.id)].filter(Boolean).slice(0,6)},[sel,cheapest,cur]);
 const cumData=useMemo(()=>{const d=[{jahr:'Start'}];chartSet.forEach((t,i)=>{d[0][i]=i===0?0:sw});for(let y=1;y<=5;y++){const o={jahr:'Jahr '+y};chartSet.forEach((t,i)=>{o[i]=Math.round(cumCost(t,kwh,y,{current:i===0}).at(-1)+(i===0?0:sw))});d.push(o)}return d},[chartSet,kwh,sw]);
 const barData=useMemo(()=>[1,2,3,4,5].slice(0,Math.max(years,2)).map(y=>{const o={jahr:'Jahr '+y};chartSet.forEach((t,i)=>o[i]=Math.round(yearCost(t,kwh,y,{current:i===0})));return o}),[chartSet,kwh,years]);
 const label=(t,i)=>(i===0?'Aktuell: ':'')+t.anbieter.split(' ').slice(0,2).join(' ')+' · '+t.tarif.slice(0,22);
 const cols=useMemo(()=>[
  {field:'tarif',headerName:'Tarif',pinned:'left',minWidth:280,filter:'agTextColumnFilter',getQuickFilterText:p=>p.data.tarif+' '+p.data.anbieter,cellRenderer:p=><div className="flex items-center gap-3 overflow-hidden"><Logo t={p.data}/><div className="min-w-0 leading-tight"><div className="truncate font-semibold">{p.data.tarif}</div><div className="truncate text-xs text-muted-foreground">{p.data.anbieter}</div></div></div>},
  {field:'j1',headerName:'Jahr 1',width:115,...num,sort:'asc',valueFormatter:p=>eur(p.value),cellClass:'font-semibold tabular-nums'},
  {field:'jN',headerName:`${years} Jahre`,width:120,...num,valueFormatter:p=>eur(p.value),cellClass:'tabular-nums'},
  {field:'save',headerName:'Ersparnis ggü. aktuell',width:170,...num,cellRenderer:p=>p.value==null?<span className="text-muted-foreground">–</span>:<Badge variant={p.value>0?'green':p.value<0?'red':'secondary'} className="tabular-nums">{p.value>0?'+':''}{eur(p.value)}</Badge>},
  {field:'be',headerName:'Lohnt ab',width:110,...num,valueFormatter:p=>p.value==null?'–':p.value<=1?'sofort':`Monat ${p.value}`},
  {field:'ap',headerName:'Arbeitspreis',width:125,...num,valueFormatter:p=>ct(p.value),headerTooltip:'brutto ct/kWh, ohne Rabatt, laut E-Control'},
  {field:'gp',headerName:'Grundpreis/Mon.',width:140,...num,valueFormatter:p=>eur2(p.value)},
  {field:'rabatt',headerName:'Neukundenrabatt',width:145,...num,valueFormatter:p=>p.value?eur(p.value)+' (J1)':'–'},
  {field:'netz',headerName:'Netz+Abgaben',width:130,...num,valueFormatter:p=>eur(p.value),headerTooltip:'Netzkosten bei 3.500 kWh laut E-Control'},
  {field:'oeko',headerName:'Öko',width:95,...num,cellRenderer:p=>p.value===100?<Badge variant="green"><Leaf/>100 %</Badge>:p.value!=null?<span className="tabular-nums">{p.value} %</span>:'–'},
  {field:'garantieM',headerName:'Preisgarantie',width:140,cellRenderer:p=>p.data.floating?<Badge variant="amber"><Activity/>variabel*</Badge>:p.data.garantie==='GUARANTEE'?<Badge variant="blue"><ShieldCheck/>{p.value?p.value+' Mon.':'ja'}</Badge>:<Badge variant="secondary">{p.data.garantie==='ADJUSTING'?'anpassbar':p.data.garantie||'–'}</Badge>},
  {field:'ohneBindung',headerName:'Bindung',width:120,cellRenderer:p=>p.value?<Badge variant="secondary"><LockOpen/>keine</Badge>:<span className="text-sm text-muted-foreground">lt. Anbieter</span>},
  {field:'link',headerName:'Quelle',width:150,filter:false,sortable:false,cellRenderer:p=><div className="flex gap-2"><Ext href={p.value}>Anbieter</Ext><Ext href="https://www.e-control.at/tarifkalkulator">EC</Ext></div>},
 ],[years]);
 useEffect(()=>{grid.current?.api?.onFilterChanged()},[F]);useEffect(()=>{grid.current?.api?.setGridOption('quickFilterText',q)},[q]);
 if(!S)return <Card className="p-6 text-muted-foreground" data-testid="strom-loading">Lade Stromtarife…</Card>;
 const best=cheapest[0];
 const CH=[['priced','Mit Preis',Zap],['oeko','100 % Öko',Leaf],['fix','Preisgarantie',ShieldCheck],['float','Variabel/Spot',Activity],['nobind','Ohne Bindung',LockOpen],['at','Herkunft AT',MapPin]];
 return <div className="space-y-4" data-testid="strom-tab">
  <Card className="p-4"><div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1.6fr_0.8fr]">
   <label className="space-y-1 text-sm"><span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-4"/>Standort / Netzgebiet</span>
    <select data-testid="plz" value={plz} onChange={e=>setPlz(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2">{Object.entries(S.plz).map(([k,v])=><option key={k} value={k}>{k==='1070'?'Bandgasse 13, 1070 Wien':`${k} ${v.ort}`} – {v.netz}</option>)}</select></label>
   <label className="space-y-1 text-sm"><span className="text-muted-foreground">Verbrauch kWh/Jahr</span><Input data-testid="kwh" type="number" min={500} max={20000} step={100} value={kwh} onChange={e=>setKwh(Math.max(0,Number(e.target.value)||0))}/></label>
   <label className="space-y-1 text-sm"><span className="text-muted-foreground">Zeitraum: {years} Jahr{years>1?'e':''}</span><input data-testid="years" type="range" min={1} max={5} value={years} onChange={e=>setYears(+e.target.value)} className="w-full accent-primary"/></label>
   <label className="space-y-1 text-sm"><span className="text-muted-foreground">Mein aktueller Tarif</span><select data-testid="current" value={cur?String(cur.id):''} onChange={e=>setCurId(e.target.value)} className="h-9 w-full rounded-md border bg-background px-2">{[...priced].sort((a,b)=>a.anbieter.localeCompare(b.anbieter)).map(t=><option key={t.id} value={t.id}>{t.anbieter} · {t.tarif}</option>)}</select></label>
   <label className="space-y-1 text-sm"><span className="text-muted-foreground">Wechselkosten €</span><Input type="number" min={0} value={sw} onChange={e=>setSw(Math.max(0,Number(e.target.value)||0))}/></label>
  </div></Card>
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   <Card className="p-4"><div className="text-sm text-muted-foreground">Tarife in {plz}</div><div className="text-2xl font-bold tabular-nums" data-testid="strom-count">{rows.length}</div><div className="text-xs text-muted-foreground">{priced.length} mit berechenbarem Preis · {P.netz}</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground">Günstigster ({years} J.)</div><div className="text-2xl font-bold tabular-nums">{eur(best?.jN)}</div><div className="truncate text-xs text-muted-foreground">{best?.anbieter} · {best?.tarif}</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground">Max. Ersparnis ggü. aktuell</div><div className="text-2xl font-bold tabular-nums text-emerald-600">{eur(Math.max(0,...withSave.map(r=>r.save??-1e9)))}</div><div className="truncate text-xs text-muted-foreground">aktuell: {cur?.anbieter} · {eur(cur&&cumCost(cur,kwh,years,{current:true}).at(-1))}</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground">Börsenpreis Ø (EPEX AT)</div><div className="text-2xl font-bold tabular-nums">{S.spot?ct(S.spot.avg_ct_netto):'–'}</div><div className="text-xs text-muted-foreground">netto/kWh, {S.spot?.stunden} h, aWATTar-API</div></Card>
  </div>
  <div className="grid gap-4 xl:grid-cols-2">
   <Card className="p-4"><div className="mb-2 flex items-center gap-2 font-semibold"><TrendingUp className="size-4"/>Kumulierte Kosten über 5 Jahre</div><div className="h-72" data-testid="chart-cum"><ResponsiveContainer><LineChart data={cumData}><CartesianGrid strokeDasharray="3 3" opacity={0.3}/><XAxis dataKey="jahr" fontSize={12}/><YAxis fontSize={12} tickFormatter={v=>v.toLocaleString('de-AT')+' €'} width={70}/><Tooltip formatter={v=>eur(v)}/><Legend wrapperStyle={{fontSize:11}}/>{chartSet.map((t,i)=><Line key={t.id} dataKey={i} name={label(t,i)} stroke={COLORS[i]} strokeWidth={i?2:3} strokeDasharray={i?undefined:'6 3'} dot={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div></Card>
   <Card className="p-4"><div className="mb-2 flex items-center gap-2 font-semibold"><Zap className="size-4"/>Jahreskosten pro Jahr</div><div className="h-72" data-testid="chart-bar"><ResponsiveContainer><BarChart data={barData}><CartesianGrid strokeDasharray="3 3" opacity={0.3}/><XAxis dataKey="jahr" fontSize={12}/><YAxis fontSize={12} width={70} tickFormatter={v=>v.toLocaleString('de-AT')+' €'}/><Tooltip formatter={v=>eur(v)}/><Legend wrapperStyle={{fontSize:11}}/>{chartSet.map((t,i)=><Bar key={t.id} dataKey={i} name={label(t,i)} fill={COLORS[i]} radius={[4,4,0,0]} isAnimationActive={false}/>)}</BarChart></ResponsiveContainer></div></Card>
  </div>
  <Card className="p-4" data-testid="breakeven"><div className="mb-2 font-semibold">Ab wann lohnt sich der Wechsel? <span className="text-sm font-normal text-muted-foreground">(ggü. {cur?.anbieter} · {cur?.tarif}, Wechselkosten {eur(sw)})</span></div>
   <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{chartSet.slice(1).map((t,i)=>{const be=breakEven(t,cur,kwh,sw,5);const s=cumCost(cur,kwh,years,{current:true}).at(-1)-cumCost(t,kwh,years).at(-1)-sw;return <div key={t.id} className="rounded-lg border p-3 text-sm"><div className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{background:COLORS[i+1]}}/><span className="truncate font-medium">{t.anbieter} · {t.tarif}</span></div><div className="mt-1 text-muted-foreground">{be==null?'lohnt sich in 5 Jahren nicht':be<=1?'lohnt sich sofort':`lohnt sich ab Monat ${be}`} · {years} J.: <b className={s>0?'text-emerald-600':'text-red-600'}>{s>0?'+':''}{eur(s)}</b>{t.floating&&' · Schätzung*'}</div></div>})}</div>
   <p className="mt-2 text-xs text-muted-foreground">Tipp: Zeilen in der Tabelle anhaken (bis 5), um sie in Diagrammen und Break-even zu vergleichen. Sonst werden die 4 günstigsten gezeigt.</p></Card>
  <Card className="p-3"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full sm:w-64"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/><Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Anbieter oder Tarif…" className="pl-8"/></div>
   {CH.map(([k,l,I])=>{const on=F.has(k);return <Button key={k} size="sm" variant={on?'default':'outline'} className="rounded-full" onClick={()=>{const n=new Set(F);on?n.delete(k):n.add(k);setF(n)}}><I/>{l}</Button>})}{F.size>0&&<Button size="sm" variant="ghost" onClick={()=>setF(new Set())}><X/>Zurücksetzen</Button>}</div></Card>
  <div className="h-[640px]" data-testid="strom-grid"><AgGridReact ref={grid} theme={theme} rowData={withSave} columnDefs={cols} getRowId={p=>String(p.data.id)} rowHeight={54} defaultColDef={{sortable:true,resizable:true,filter:true,floatingFilter:false}}
   rowSelection={{mode:'multiRow',checkboxes:true,headerCheckbox:false,enableClickSelection:false,isRowSelectable:n=>n.data.priced}} onSelectionChanged={e=>setSel(e.api.getSelectedRows().slice(0,5))}
   isExternalFilterPresent={()=>F.size>0} doesExternalFilterPass={n=>filt(n.data)} tooltipShowDelay={200}/></div>
  <Card className="flex gap-3 bg-muted/40 p-4 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0"/><div className="space-y-1">
   <p><b>Quelle:</b> {S.quelle}, Stand {S.stand}, Haushalt, Standardlastprofil, ohne Smart-Meter-Tarife. Alle Beträge brutto inkl. Netzkosten, Abgaben und 20 % USt. – so wie vom Tarifkalkulator für die jeweilige PLZ/Netzgebiet berechnet.</p>
   <p><b>Annahmen:</b> Kosten für andere Verbräuche werden linear aus den E-Control-Werten für 2.500 und 3.500 kWh abgeleitet. Neukund:innen-Rabatte zählen nur im Jahr 1; der „aktuelle Tarif“ wird als Bestandskunde ohne Rabatt gerechnet. Ab Jahr 2 werden die heutigen Preise fortgeschrieben – nach Ende der Preisgarantie kann der Anbieter anpassen. <b>*Variable/Spot-Tarife</b> (Indexierung, Börsenpreis) sind reine Schätzungen auf Basis aktueller Werte. Tarife ohne Preis (Spot nur mit Smart Meter) werden nicht berechnet.</p>
   <p><b>Kündigungsfristen/Bindung</b> liefert die Quelle nur teilweise („ohne Mindestbindung“); Details bitte beim Anbieter prüfen. Angaben ohne Gewähr.</p></div></Card>
 </div>}
