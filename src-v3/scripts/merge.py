import json,glob,os,re,shutil
from PIL import Image
W='/workspace';OUT=W+'/tarife-v3/public/assets/logos';os.makedirs(OUT,exist_ok=True)
P=json.load(open(W+'/brand-kit/providers.json'))
norm=lambda s:re.sub(r'[^a-z0-9]','',(s or '').lower().replace('ä','ae').replace('ö','oe').replace('ü','ue'))
logos={}  # domain -> {f,c}
for p in P:
  d=p['domain'];src=W+'/brand-kit/'+(p.get('logo') or '')
  if d in logos or not os.path.isfile(src): continue
  if src.endswith('.svg'): fn=d+'.svg';shutil.copy(src,OUT+'/'+fn)
  else:
    try:
      im=Image.open(src).convert('RGBA');im.thumbnail((128,128));fn=d+'.webp';im.save(OUT+'/'+fn,'WEBP',quality=85)
    except Exception: continue
  c=p.get('theme_color') or next((x for x in p.get('brand_colors') or [] if x.lower() not in('#ffffff','#000000','#fff','#000','#bcbcbc','#e0e0e0')),None)
  logos[d]={'f':'assets/logos/'+fn,'c':c,'n':p['name']}
name2d={}
for p in P: name2d.setdefault(norm(p['name']),p['domain'])
def dom_for(name,repo):
  n=norm(name)
  if n in name2d: return name2d[n]
  for k,d in name2d.items():
    if len(k)>3 and (k in n or n.startswith(k)): return d
  r=repo.replace('opencli-','');parts=r.rsplit('-',1)
  for cand in [r.replace('-at','.at'),parts[0]+'.'+parts[-1] if len(parts)>1 else r,r.replace('-','.')]:
    if cand in logos: return cand
  for d in logos:
    if d.split('.')[0]==parts[0]: return d
  return None
SKIP={'opencli-tarife-at','opencli-e-control-business-at','opencli-geizhals-at','opencli-rtr-at','opencli-peeringdb-at','opencli-connectors','opencli-factory'}
SKIPF={'regionen.json','marktpreise.json','alle.json','bericht.json','verfuegbarkeit-bandgasse13.json'}
f2=lambda *v:next((float(x) for x in v if isinstance(x,(int,float)) and not isinstance(x,bool)),None)
rows=[];seen=set()
files=sorted(glob.glob(W+'/opencli-*/exports/*.json')+glob.glob(W+'/repos/opencli-*/exports/*.json'))
for f in files:
  repo=f.split('/')[-3];fn=os.path.basename(f)
  if repo in SKIP or fn in SKIPF: continue
  try:d=json.load(open(f))
  except Exception: continue
  L=d if isinstance(d,list) else next((v for v in d.values() if isinstance(v,list) and v and isinstance(v[0],dict)),[])
  src=None if isinstance(d,list) else d.get('source')
  for r in L:
    a=r.get('anbieter') or r.get('quelle') or repo; t=r.get('tarif') or r.get('name') or r.get('bezeichnung')
    if not t: continue
    k=(str(r.get('kategorie','')) +' '+str(r.get('segment',''))+' '+str(r.get('tarifkategorie',''))+' '+fn+' '+str(t)).lower()
    e=(r.get('energie') or '').lower()
    if 'wert' in r and 'kennzahl' in r: cat='heizen'
    elif e: cat='heizen' if e in('gas','fernwaerme','fernwärme','waerme') else 'strom'
    elif 'business' in k or 'gewerbe' in k: cat='business'
    elif re.search(r'internet|cube|glasfaser|fiber|kabel|dsl|breitband|hausanschluss|bandbreite|router|home',k) or repo in('opencli-fiberplus-at','opencli-lampert-at','opencli-liwest-at','opencli-kabelplus-at','opencli-salzburg-ag-at','opencli-nessus-at','opencli-kufnet-at','opencli-wvnet-at'): cat='internet'
    else: cat='handy'
    preis=f2(r.get('preis_eur'),r.get('preis_aktion_eur'),r.get('grundgebuehr_eur'),r.get('preis_regulaer_eur'),r.get('grundgebuehr_netto_eur'))
    o={'cat':cat,'anbieter':a,'tarif':str(t)[:120],'repo':repo,
       'preis':preis,'down':f2(r.get('downlink_mbit'),r.get('down_mbit')),'up':f2(r.get('uplink_mbit'),r.get('up_mbit')),
       'daten':r.get('daten') if isinstance(r.get('daten'),str) else (str(r.get('daten_gb'))+' GB' if r.get('daten_gb') else None),
       'netz':r.get('netz'),'g5':bool(r.get('fuenf_g') or r.get('boost_5g')),'bindung':f2(r.get('bindung_monate')),
       'unl':'unlim' in str(r.get('daten','')).lower() or r.get('daten_gb')==-1,
       'ct':f2(r.get('arbeitspreis_ct'),r.get('arbeitspreis_ct_brutto')),'gp':f2(r.get('grundpreis_eur_monat'),r.get('grundpreis_eur_monat_brutto')),
       'garantie':f2(r.get('preisgarantie_monate')),'oeko':bool(r.get('oeko')),'floating':bool(r.get('floating')),'energie':r.get('energie'),
       'wert':f2(r.get('wert')),'einheit':r.get('einheit'),'region':r.get('region') or r.get('land') or r.get('plz'),'stand':r.get('stand') or r.get('zeitpunkt') or r.get('periode'),
       'link':r.get('link') or r.get('source_url') or r.get('detail_url') or r.get('url') or r.get('quelle') if str(r.get('quelle','')).startswith('http') or r.get('link') or r.get('source_url') or r.get('detail_url') or r.get('url') else src,
       'fixip':bool(re.search(r'fix|statisch|static',json.dumps(r,ensure_ascii=False).lower()) and cat!='heizen' and cat!='strom')}
    if cat=='heizen': o['preis']=None
    key=(cat,norm(a),norm(o['tarif']),o['preis'],o['ct'],o['wert'],str(o['region']),str(o['stand']))
    if key in seen: continue
    seen.add(key);dm=dom_for(a,repo);o['dom']=dm
    rows.append({k:v for k,v in o.items() if v not in(None,False,'')})
# map main-site providers too
extra={}
for n in ['A1','Magenta','Drei','HoT','yesss!','spusu','educom','georg','XOXO','Lidl Connect','Red Bull MOBILE','bob','Wien Energie','VERBUND','EVN','Energie AG','Kelag']:
  d=dom_for(n,'');extra[n]=d
json.dump({'rows':rows,'logos':logos,'name2dom':{k:v for k,v in name2d.items() if v in logos}},open(W+'/tarife-v3/src/more.json','w'),ensure_ascii=False,separators=(',',':'))
import collections;print(collections.Counter(r['cat'] for r in rows),'logos',len(logos),'rows w/ logo',sum(1 for r in rows if r.get('dom') in logos)/len(rows))
print(collections.Counter(r['repo'] for r in rows if r.get('dom') not in logos))
