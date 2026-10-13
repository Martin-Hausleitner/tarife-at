import sys,asyncio
from playwright.async_api import async_playwright
U=sys.argv[1];P=sys.argv[2] if len(sys.argv)>2 else 'v7-'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch();errs=[];res={}
  for name,vp in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   pg=await (await b.new_context(viewport=vp)).new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
   await pg.goto(U,wait_until='networkidle')
   for t,k in [('tab-bi','bi'),('tab-bs','strom'),('tab-colo','colo'),('tab-tricks','tricks')]:
    await pg.click(f'[data-testid={t}]');await pg.wait_for_timeout(1500)
    res[f'{name}-{k}']=await pg.locator('[data-testid=trick]').count() if k=='tricks' else await pg.locator('.ag-row').count()
    await pg.screenshot(path=f'/workspace/screenshots/{P}{k}-{name}.png')
   await pg.close()
  print(res,'errors:',errs);await b.close()
asyncio.run(main())
