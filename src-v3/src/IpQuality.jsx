import React,{useState} from 'react';
import {AgGridReact} from 'ag-grid-react';
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts';
import {ShieldCheck,Globe,Network,Activity,ExternalLink,Info} from 'lucide-react';
import {Badge,Card} from './components/ui.jsx';
import Q from './ipq.json';
const n=v=>v==null?'–':v.toLocaleString('de-AT');
const L=({h,c})=><a href={h} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline underline-offset-4">{c}<ExternalLink className="size-3"/></a>;
const v6b=v=>v==null?'–':<Badge variant={v>=50?'green':v>=10?'amber':'red'} className="tabular-nums">{v.toLocaleString('de-AT')} %</Badge>;
const cols=[
 {field:'name',headerName:'Anbieter',pinned:'left',minWidth:230,cellRenderer:p=><div className="leading-tight"><div className="font-medium">{p.value}</div><div className="text-xs text-muted-foreground">{p.data.type}</div></div>},
 {field:'asn',headerName:'ASN',width:110,cellRenderer:p=><a className="underline underline-offset-4" href={'https://bgp.he.net/AS'+p.value} target="_blank" rel="noopener">AS{p.value}</a>},
 {field:'v4ips',headerName:'IPv4-Adressen (announced)',filter:'agNumberColumnFilter',width:170,valueFormatter:p=>n(p.value)},
 {field:'v4pfx',headerName:'v4-Präfixe',filter:'agNumberColumnFilter',width:115},
 {field:'v6pfx',headerName:'v6-Präfixe',filter:'agNumberColumnFilter',width:115},
 {field:'neigh',headerName:'BGP-Nachbarn',filter:'agNumberColumnFilter',width:130},
 {field:'v6cap',headerName:'IPv6-fähig (APNIC)',filter:'agNumberColumnFilter',width:160,cellRenderer:p=>v6b(p.value)},
 {field:'drop',headerName:'Spamhaus DROP/ASN-DROP',width:190,cellRenderer:()=> <Badge variant="green"><ShieldCheck/>nicht gelistet</Badge>},
 {field:'pingFix',headerName:'RTR Ping Festnetz (ms)',filter:'agNumberColumnFilter',width:175,valueFormatter:p=>p.value==null?'–':p.value.toLocaleString('de-AT')+(p.data.nFix?` (n=${n(p.data.nFix)})`:'')},
 {field:'pingMob',headerName:'RTR Ping Mobil (ms)',filter:'agNumberColumnFilter',width:165,valueFormatter:p=>p.value==null?'–':p.value.toLocaleString('de-AT')+` (n=${n(p.data.nMob)})`},
 {field:'geo',headerName:'Geo-Stichprobe (ip-api, 5 IPs)',width:210,valueGetter:p=>Object.entries(p.data.geo).map(([k,v])=>`${k} ${v}/5`).join(', ')},
 {field:'nat',headerName:'Öffentliche IPv4 / CGNAT',minWidth:300,flex:1,wrapText:true,autoHeight:true,cellClass:'leading-snug py-2'},
 {field:'static',headerName:'Feste IP – Preis',minWidth:240,wrapText:true,autoHeight:true,cellClass:'leading-snug py-2',cellRenderer:p=><span>{p.value} <a href={p.data.src} target="_blank" rel="noopener" className="text-xs underline">Quelle</a></span>},
 {field:'mvno',headerName:'MVNOs im Netz',minWidth:200,wrapText:true,autoHeight:true},
];
export default function IpQuality({theme}){
 const rows=Q.rows;const chart=rows.map(r=>({name:r.name.split(' (')[0],'IPv6-fähig %':r.v6cap,'Ping Festnetz ms':r.pingFix,'Ping Mobil ms':r.pingMob}));
 return <div className="space-y-4" data-testid="ipq">
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   <Card className="p-4"><div className="text-sm text-muted-foreground flex items-center gap-2"><Network className="size-4"/>Netze (ASNs)</div><div className="text-2xl font-bold">{rows.length}</div><div className="text-xs text-muted-foreground">RIPEstat, Stand {Q.stand}</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground flex items-center gap-2"><ShieldCheck className="size-4"/>Spamhaus-Listung</div><div className="text-2xl font-bold">0 / {rows.length}</div><div className="text-xs text-muted-foreground">ASN-DROP + DROP-Präfixe</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground flex items-center gap-2"><Globe className="size-4"/>Bestes IPv6 (groß)</div><div className="text-2xl font-bold">Magenta 73,7 %</div><div className="text-xs text-muted-foreground">Drei Mobil nur 0,85 % (APNIC)</div></Card>
   <Card className="p-4"><div className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="size-4"/>Niedrigster Mobil-Ping</div><div className="text-2xl font-bold">Drei 20,7 ms</div><div className="text-xs text-muted-foreground">RTR-Netztest, Median 180 Tage</div></Card>
  </div>
  <Card className="p-4"><div className="mb-2 font-semibold">IPv6-Anteil & Median-Ping je Netz</div>
   <div style={{height:320}}><ResponsiveContainer><BarChart data={chart} margin={{left:0,right:10,bottom:40}}><CartesianGrid strokeDasharray="3 3" opacity={.3}/><XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Legend verticalAlign="top"/>
    <Bar dataKey="IPv6-fähig %" fill="#2563eb"/><Bar dataKey="Ping Festnetz ms" fill="#16a34a"/><Bar dataKey="Ping Mobil ms" fill="#ea580c"/></BarChart></ResponsiveContainer></div></Card>
  <div style={{height:620}}><AgGridReact theme={theme} rowData={rows} columnDefs={cols} defaultColDef={{sortable:true,filter:true,resizable:true}} rowHeight={56}/></div>
  <Card className="p-4 text-sm space-y-2"><div className="flex items-center gap-2 font-semibold"><Info className="size-4"/>Quellen & Grenzen</div>
   <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
    <li>Adressraum, Präfixe, Nachbarn: <L h="https://stat.ripe.net/docs/data_api" c="RIPEstat API"/> (routing-status, asn-neighbours), Stand {Q.stand}; Details je AS auf <L h="https://bgp.he.net/AS8447" c="bgp.he.net"/> und <L h="https://www.peeringdb.com/asn/8447" c="PeeringDB"/>.</li>
    <li>IPv6-Anteil: <L h="https://stats.labs.apnic.net/ipv6/AT" c="APNIC IPv6-Messung Österreich"/> (Anteil IPv6-fähiger Nutzer:innen, 30-Tage-Fenster).</li>
    <li>Blocklisten: <L h="https://www.spamhaus.org/drop/asndrop.json" c="Spamhaus ASN-DROP"/> und <L h="https://www.spamhaus.org/drop/drop_v4.json" c="DROP v4"/> mit allen announced Präfixen abgeglichen. Kein Treffer. Andere Listen (SBL/XBL/PBL, AbuseIPDB) bieten keine freien ASN-Aggregate – nicht ausgewertet.</li>
    <li>Ping: <L h="https://www.netztest.at" c="RTR-Netztest"/> Statistik-API, Median der letzten 180 Tage; Mobil nach SIM-Netz (232-01 A1, 232-03 Magenta, 232-05 Drei, 232-17 spusu), Festnetz nach ASN. Jitter liefert diese Statistik nicht. Wien-Energie-Wert (1,4 ms) ist vermutlich durch Messserver-Nähe begünstigt.</li>
    <li>Geolokation: Stichprobe je 1 IP aus den 5 größten Präfixen über ip-api.com – keine Genauigkeitsmessung, nur Land/Stadt laut Datenbank.</li>
    <li>CGNAT/feste IP: Herstellerunterlagen, RTR-FAQ (öffentliche IPv4 auf Verlangen), teils Foren – je Zeile verlinkt. Für Diskonter (HoT, yesss, georg, educom, XOXO, Lidl, Red Bull) wurden keine eigenen Angaben gefunden; sie nutzen das jeweilige Wirtsnetz (<L h="https://www.rtr.at/TKP/was_wir_tun/telekommunikation/konsumentenservice/information/informationen_fuer_konsumenten/TKKS_AnbieterMN.de.html" c="RTR-Liste"/>).</li>
   </ul></Card>
 </div>}
