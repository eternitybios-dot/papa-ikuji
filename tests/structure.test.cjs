const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../docs');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
test('all referenced IDs exist and are unique',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const match of app.matchAll(/getElementById\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),match[1]);
  for(const match of html.matchAll(/data-p="([^"]+)"/g))assert.ok(ids.includes(match[1]),match[1]);
});
test('local assets exist and core loads before app',()=>{
  for(const match of html.matchAll(/(?:src|href)="([^":]+\.(?:css|js))"/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
  assert.ok(html.indexOf('src="core.js"')<html.indexOf('src="app.js"'));
});
test('obsolete safety wording removed and main emergency link available',()=>{
  assert.ok(!html.includes('365日 9〜21時'));
  assert.ok(!html.includes('48時間は家で観察'));
  assert.ok(html.includes('寝返りの兆候が出たら中止'));
  assert.ok(html.includes('href="tel:119"'));
});
