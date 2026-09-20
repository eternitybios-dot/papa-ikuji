const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../docs/core.js');
const date=core.parseDate;
test('validates dates including leap years and corrupt saved values',()=>{
  for(const value of [null,'','bad','2026-02-30','2025-02-29','1800-01-01'])assert.equal(date(value),null);
  assert.equal(date('2024-02-29').getDate(),29);
});
test('month-end anniversaries clamp instead of overflowing',()=>{
  assert.equal(core.monthAnniversary(date('2026-01-31'),1).getDate(),28);
  assert.equal(core.monthsBetween(date('2026-01-31'),date('2026-02-28')),1);
  assert.equal(core.monthsBetween(date('2026-01-31'),date('2026-03-01')),1);
  assert.equal(core.monthsBetween(date('2024-02-29'),date('2025-02-28')),12);
  assert.equal(core.monthsBetween(date('2026-09-20'),date('2026-09-20')),0);
});
test('week starts Monday across Sunday and year boundaries',()=>{
  assert.equal(core.weekKey(date('2026-09-20')),'2026-9-14');
  assert.equal(core.weekKey(date('2026-09-21')),'2026-9-21');
  assert.equal(core.weekKey(date('2027-01-01')),'2026-12-28');
});
test('malformed storage is safe',()=>{
  for(const raw of ['null','[]','42','"a"','{',null])assert.deepEqual(core.readObject(raw),{});
  assert.deepEqual(core.readObject('{"date":"today","0":true}'),{date:'today',0:true});
});
test('blocked storage keeps session data and warns once',()=>{
  let warnings=0;
  const storage=core.createStorage(()=>{throw Error('blocked');},()=>warnings++);
  assert.equal(storage.getItem('dob'),null);
  storage.setItem('dob','2026-09-20');
  assert.equal(storage.getItem('dob'),'2026-09-20');
  storage.setItem('check','true');assert.equal(warnings,1);
});
test('existing keys are read and written',()=>{
  const values=new Map([['dob','2026-09-20']]);
  const storage=core.createStorage(()=>({getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}),()=>assert.fail());
  assert.equal(storage.getItem('dob'),'2026-09-20');
  storage.setItem('dob','2026-09-21');assert.equal(values.get('dob'),'2026-09-21');
});
