// Optional: NODE_PATH pointing to an installed playwright package.
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
  const root=path.resolve(__dirname,'../docs');
  const server=http.createServer((req,res)=>{
    const file=path.join(root,req.url==='/'?'index.html':req.url);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
    try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file));}
    catch{res.writeHead(404);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,args:['--no-sandbox']});
    const page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Tokyo'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-09-20T23:59:50+09:00')});
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.locator('#dob-input').fill('2026-01-31');await page.locator('#dob-save').click();
    assert.match(await page.locator('#age-main').textContent(),/生後7ヶ月20日/);
    await page.locator('#dob-edit').click();
    assert.equal(await page.evaluate(()=>localStorage.getItem('papa-dob-v1')),'2026-01-31');
    await page.locator('#dob-save').click();
    await page.locator('[data-p="p-check"]').click();
    await page.locator('#checklist input').first().check();
    await page.locator('#weekly input').first().check();
    await page.clock.fastForward(40000);
    assert.equal(await page.locator('#checklist input').first().isChecked(),false);
    assert.equal(await page.locator('#weekly input').first().isChecked(),false);
    assert.match(await page.locator('#wk-label').textContent(),/2026\/9\/21/);
    await page.locator('#checklist input').first().check();await page.reload();
    await page.locator('[data-p="p-check"]').click();
    assert.equal(await page.locator('#checklist input').first().isChecked(),true);
    for(const id of ['p-home','p-age','p-care','p-mama','p-check','p-sos']){
      await page.locator('[data-p="'+id+'"]').click();
      assert.equal(await page.locator('#'+id).isVisible(),true);
      assert.equal(await page.locator('[data-p="'+id+'"]').getAttribute('aria-current'),'page');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await page.locator('[data-p="p-home"]').click();
    await page.screenshot({path:'/tmp/papa-ikuji-home.png',fullPage:true});
    await page.evaluate(()=>{localStorage.setItem('papa-check-v1','null');localStorage.setItem('papa-week-v1','[]');localStorage.setItem('papa-dob-v1','bad');});
    await page.reload();assert.equal(await page.locator('#dob-form').isVisible(),true);
    const blocked=await browser.newPage();blocked.on('pageerror',e=>errors.push(e.message));
    await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('blocked','SecurityError');}}));
    await blocked.goto('http://127.0.0.1:'+server.address().port);
    assert.equal(await blocked.locator('#storage-status').isVisible(),true);
    await blocked.locator('#dob-input').fill('2026-09-01');await blocked.locator('#dob-save').click();
    assert.equal(await blocked.locator('#dob-view').isVisible(),true);
    assert.deepEqual(errors,[]);
    console.log('PASS: mobile navigation, age, edit, midnight/Monday reset, persistence, corrupt/blocked storage, no JS errors or overflow');
  }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
