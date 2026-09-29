const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../docs/core.js');
test('paternity leave is exactly 28 inclusive calendar days across leap/month/year boundaries',()=>{
  for(const dob of ['2026-09-05','2027-05-01','2024-02-10','2026-12-20']){
    const birth=core.parseDate(dob),phases=core.buildLeavePlan(birth);
    const first=phases.find(p=>p.id===1);
    assert.equal(core.dateValue(first.to),core.dateValue(core.addDays(birth,27)));
    for(let i=1;i<phases.length;i++){
      assert.equal(core.dateValue(phases[i].from),core.dateValue(core.addDays(phases[i-1].to,1)));
      if(phases[i].to)assert.ok(phases[i].from<=phases[i].to);
    }
  }
});
test('custom leave dates reject overlap and reversed ranges, and allow no intervening return',()=>{
  const birth=core.parseDate('2026-09-05');
  assert.equal(core.buildLeavePlan(birth,{start:'2026-09-30',end:'2027-02-01'}),null);
  assert.equal(core.buildLeavePlan(birth,{start:'2027-04-01',end:'2027-03-31'}),null);
  const phases=core.buildLeavePlan(birth,{start:'2027-04-01',end:'2027-09-30'});
  assert.equal(core.dateValue(phases.find(p=>p.id===3).from),'2027-04-01');
  assert.equal(core.dateValue(phases.at(-1).from),'2027-10-01');
  assert.ok(!core.buildLeavePlan(birth,{start:'2026-10-03',end:'2027-02-01'}).some(p=>p.id===2));
});
test('separate tabs preserve both checklist changes and receive external updates',()=>{
  const data=new Map();
  const provider=()=>({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});
  const a=core.createStorage(provider,()=>assert.fail()),b=core.createStorage(provider,()=>assert.fail());
  for(const [key,field,period,next] of [['daily','date','today','tomorrow'],['weekly','week','this-week','next-week']]){
    data.set(key,JSON.stringify({[field]:period,2:true}));
    core.readChecklist(a,key,field,period,3);
    core.readChecklist(b,key,field,period,3);
    core.saveChecklistItem(a,key,field,period,0,true);
    core.saveChecklistItem(b,key,field,period,1,true);
    assert.deepEqual(core.readChecklist(a,key,field,period,3),{[field]:period,0:true,1:true,2:true});
    core.saveChecklistItem(b,key,field,period,0,false);
    assert.equal(core.readChecklist(a,key,field,period,3)[0],false);
    assert.deepEqual(core.readChecklist(a,key,field,next,3),{[field]:next,0:false,1:false,2:false});
  }
});
test('storage becoming unavailable retains the latest session edits',()=>{
  const data=new Map([['dob','2026-09-05']]);let blocked=false;
  const storage=core.createStorage(()=>({getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(blocked)throw Error('quota');data.set(k,v);}}),()=>{});
  assert.equal(storage.getItem('dob'),'2026-09-05');blocked=true;
  storage.setItem('dob','2026-09-06');
  assert.equal(storage.getItem('dob'),'2026-09-06');
});
