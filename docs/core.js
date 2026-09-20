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
        if(memory.has(key))return memory.get(key);
        try{const value=provider().getItem(key);memory.set(key,value);return value;}catch{fail();return null;}
      },
      setItem(key,value){memory.set(key,value);try{provider().setItem(key,value);}catch{fail();}},
    };
  }
  const api={parseDate,monthAnniversary,monthsBetween,weekKey,readObject,createStorage};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.PapaCore=api;
})(globalThis);
