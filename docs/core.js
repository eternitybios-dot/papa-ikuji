(function(root){
  'use strict';
  function parseDate(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y,m,d]=value.split('-').map(Number), date=new Date(y,m-1,d);
    return y>=1900&&y<=2100&&date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;
  }
  function monthAnniversary(date,months){
    const first=new Date(date.getFullYear(),date.getMonth()+months,1);
    const last=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    first.setDate(Math.min(date.getDate(),last)); return first;
  }
  function monthsBetween(a,b){
    let months=(b.getFullYear()-a.getFullYear())*12+b.getMonth()-a.getMonth();
    if(monthAnniversary(a,months)>b) months--;
    return months;
  }
  function weekKey(now=new Date()){
    const d=new Date(now); d.setDate(d.getDate()-(d.getDay()+6)%7);
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }
  function readObject(raw){
    try{const value=JSON.parse(raw);return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}
  }
  function createStorage(provider,onFailure){
    const memory=new Map(); let failed=false;
    function fail(){if(!failed){failed=true;onFailure();}}
    return {
      getItem(key){
        if(failed)return memory.get(key)??null;
        try{const value=provider().getItem(key);memory.set(key,value);return value;}catch{fail();return memory.get(key)??null;}
      },
      setItem(key,value){memory.set(key,value);try{provider().setItem(key,value);}catch{fail();}},
    };
  }
  function addDays(date,days){
    const value=new Date(date); value.setDate(value.getDate()+days); return value;
  }
  function dateValue(date){
    return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
  }
  function readChecklist(storage,key,field,period,count){
    const legacy=readObject(storage.getItem(key));
    const result={[field]:period};
    for(let i=0;i<count;i++){
      const item=readObject(storage.getItem(key+':'+i));
      result[i]=item[field]===period ? item.checked===true : legacy[field]===period&&legacy[i]===true;
    }
    return result;
  }
  function saveChecklistItem(storage,key,field,period,index,checked){
    storage.setItem(key+':'+index,JSON.stringify({[field]:period,checked:!!checked}));
  }
  function buildLeavePlan(birth,saved={}){
    const firstEnd=addDays(birth,27);
    const suggested=monthAnniversary(birth,6);
    const secondStart=parseDate(saved.start)||new Date(suggested.getFullYear(),suggested.getMonth(),1);
    const secondEnd=parseDate(saved.end)||addDays(monthAnniversary(secondStart,6),-1);
    if(secondStart<=firstEnd||secondEnd<secondStart)return null;
    const phases=[
      {id:0,name:'① 出産前・準備',from:null,to:addDays(birth,-1)},
      {id:1,name:'② 産後パパ育休 28日',from:birth,to:firstEnd},
      {id:2,name:'③ 復職期間',from:addDays(firstEnd,1),to:addDays(secondStart,-1)},
      {id:3,name:'④ 通常の育休',from:secondStart,to:secondEnd},
      {id:4,name:'⑤ 復職',from:addDays(secondEnd,1),to:null}
    ];
    return phases.filter(phase=>!phase.from||!phase.to||phase.from<=phase.to);
  }
  const api={parseDate,monthAnniversary,monthsBetween,weekKey,readObject,createStorage,addDays,dateValue,readChecklist,saveChecklistItem,buildLeavePlan};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PapaCore=api;
})(globalThis);

