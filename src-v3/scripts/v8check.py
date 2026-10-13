import sys,asyncio,json
from playwright.async_api import async_playwright
U=sys.argv[1];P=sys.argv[2] if len(sys.argv)>2 else 'v8-';AXE=open('/workspace/axe/node_modules/axe-core/axe.min.js').read()
TABS=['home','mobile','data','strom','heizen','bi','colo']
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();errs=[];res={}
  for theme in ['light','dark']:
   for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
    if theme=='dark' and name=='mobile': continue
    ctx=await b.new_context(viewport=vp);await ctx.add_init_script(f"localStorage.theme='{theme}';localStorage.tab4='home'")
    pg=await ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.goto(U,wait_until='networkidle')
    if theme=='dark': await pg.evaluate("document.documentElement.classList.add('dark')")
    for t in TABS:
     await pg.click(f'[data-testid=tab-{t}]') if await pg.locator(f'[data-testid=tab-{t}]').count() else await pg.click(f'text={t}')
     await pg.wait_for_timeout(1200)
     if theme=='dark': await pg.evaluate("document.documentElement.classList.add('dark')")
     await pg.add_script_tag(content=AXE)
     r=await pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa'],rules:{'aria-required-children':{enabled:false}}}).then(r=>r.violations.map(v=>[v.id,v.nodes.length,v.nodes.slice(0,2).map(n=>n.target.join(' ')+' | '+(n.failureSummary||'').slice(0,160))]))")
     imgs=await pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length")
     res[f'{theme}-{name}-{t}']={'axe':r,'brokenImg':imgs,'rows':await pg.locator('.ag-row').count()}
     await pg.screenshot(path=f'/workspace/screenshots/{P}{t}-{name}-{theme}.png')
    await ctx.close()
  print(json.dumps({k:[(a[0],a[1],a[2][:1]) for a in v["axe"]]+[v["rows"],v["brokenImg"]] for k,v in res.items()},ensure_ascii=False)[:9000]);print('errors:',errs);await b.close()
asyncio.run(main())
