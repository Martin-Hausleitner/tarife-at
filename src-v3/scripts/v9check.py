import sys,asyncio,json
from playwright.async_api import async_playwright
U=sys.argv[1];TABS=sys.argv[2].split(',');AXE=open('/workspace/axe/node_modules/axe-core/axe.min.js').read()
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();errs=[];res={}
  for theme in ['dark','light']:
   for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
    ctx=await b.new_context(viewport=vp);pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)[:200]))
    for t in TABS:
     tt,v=(t.split(':')+[None])[:2]
     await pg.add_init_script(f"localStorage.theme='{theme}';localStorage.tab4='{tt}'") if False else None
     await pg.goto(U);await pg.evaluate(f"localStorage.theme='{theme}';localStorage.tab4='{tt}'");await pg.reload(wait_until='networkidle');await pg.wait_for_timeout(900)
     if v: await pg.click(f'[data-testid=view-{v}] >> nth=0');await pg.wait_for_timeout(900)
     await pg.add_script_tag(content=AXE)
     r=await pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa'],rules:{'aria-required-children':{enabled:false}}}).then(r=>r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>[v.id,v.nodes.length,v.nodes.slice(0,2).map(n=>n.target.join(' ')+' | '+(n.failureSummary||'').slice(0,140))]))")
     bi=await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length")
     res[f'{theme}-{name}-{t}']=[r,bi]
     await pg.screenshot(path=f"/workspace/screenshots/v9-{t.replace(':','-')}-{name}-{theme}.png")
    await ctx.close()
  for k,v in res.items():
   if v[0] or v[1]: print(k,json.dumps(v,ensure_ascii=False)[:700])
  print('errors:',set(errs));await b.close()
asyncio.run(main())
