const {parseDate, monthAnniversary, monthsBetween, weekKey, readObject, createStorage}=PapaCore;
const storage=createStorage(()=>window.localStorage,()=>{
  const message=document.getElementById('storage-status');
  message.hidden=false;
  message.textContent='端末への保存を利用できません。この画面では使えますが、閉じると変更が失われる場合があります。';
});
/* ---------- tabs ---------- */
const pages=document.querySelectorAll('.page');
document.querySelectorAll('nav.tabs button').forEach(b=>{
  b.setAttribute('aria-controls',b.dataset.p);
  if(b.classList.contains('on')) b.setAttribute('aria-current','page');
  b.onclick=()=>{
  document.querySelectorAll('nav.tabs button').forEach(x=>x.removeAttribute('aria-current'));
  b.setAttribute('aria-current','page');
  document.querySelectorAll('nav.tabs button').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); pages.forEach(p=>p.classList.toggle('on',p.id===b.dataset.p));
  window.scrollTo({top:0});
};
});
document.getElementById('priority-age-link').onclick=()=>document.querySelector('nav.tabs button[data-p="p-age"]').click();

/* ---------- simple / full mode ---------- */
const MODE_KEY='papa-mode-v1';
const modeSimple=document.getElementById('mode-simple');
const modeFull=document.getElementById('mode-full');
function setMode(mode,remember=true){
  const simple=mode==='simple';
  document.body.classList.toggle('simple',simple);
  modeSimple.classList.toggle('on',simple);
  modeFull.classList.toggle('on',!simple);
  modeSimple.setAttribute('aria-pressed',String(simple));
  modeFull.setAttribute('aria-pressed',String(!simple));
  if(remember) storage.setItem(MODE_KEY,simple?'simple':'full');
}
modeSimple.onclick=()=>setMode('simple');
modeFull.onclick=()=>setMode('full');
setMode(storage.getItem(MODE_KEY)==='simple'?'simple':'full',false);

/* ---------- daily checklist ---------- */
const ITEMS=[
 ["おむつ替え・着替えをした","回数が信頼残高になる"],
 ["お風呂〜保湿〜着替えまでやった","保湿までがお風呂"],
 ["寝かしつけをした","同じ手順を3〜7日続ける"],
 ["食事・ミルクの準備と片付けをした","作る〜洗うまでがワンセット"],
 ["洗濯を最後までやった","干す→畳む→しまうまで"],
 ["掃除・ゴミ出しをした","名もなき家事に気づく"],
 ["子どもの声・指さしに言葉で返した","応答的な関わりが脳を育てる"],
 ["絵本を読んだ・歌った","1日1冊が目安"],
 ["仕上げ磨きをした（歯が生えていれば）","寝る前1回は省かない"],
 ["今日の飲み・排泄・睡眠・機嫌を把握した","受診時に聞かれる4項目"],
 ["ママに感謝を具体的に伝えた","「何が」助かったかまで言う"],
 ["ママが連続で眠れる時間を作った","夜間は交代制が理想"],
 ["ママの話を15分聞いた","解決策より共感ファースト"],
 ["自分も休憩・深呼吸をした","パパのメンタルも育児資源"],
];
const KEY='papa-check-v1';
let state=readObject(storage.getItem(KEY));
let today=new Date().toDateString();
if(state.date!==today) state={date:today};
storage.setItem(KEY,JSON.stringify(state));
const list=document.getElementById('checklist');
ITEMS.forEach((it,i)=>{
  const l=document.createElement('label'); l.className='check'+(state[i]?' done':'');
  l.innerHTML='<input type="checkbox" '+(state[i]?'checked':'')+'><span>'+it[0]+'<small>'+it[1]+'</small></span>';
  l.querySelector('input').onchange=e=>{const checked=e.target.checked; refreshCalendar(); state[i]=checked; state.date=today; e.target.checked=checked;
    try{storage.setItem(KEY,JSON.stringify(state))}catch(_){}
    l.classList.toggle('done',e.target.checked); update();};
  list.appendChild(l);
});
function update(){
  const n=ITEMS.filter((_,i)=>state[i]).length, p=Math.round(n/ITEMS.length*100);
  document.getElementById('pct').textContent=p+'%（'+n+'/'+ITEMS.length+'）';
  document.getElementById('bar').style.width=p+'%';
}
update();

/* ---------- weekly missions (reset every Monday) ---------- */
const WEEKLY=[
 ["ママに2時間のフリータイムを作った","家で寝てもらうだけでもOK"],
 ["夫婦ミーティング15分をした","きつかったこと／来週の分担／感謝1つ"],
 ["健診・予防接種・保育園の予定を確認した","共有カレンダーに入れる"],
 ["家の危険箇所を1つ減らした","誤飲・転落・やけど・溺水の目で見回す"],
 ["外遊び・散歩に連れて行った","幼児は毎日60分が目安"],
 ["ママの体調・気持ちを直接聞いた","眠れてる？楽しめてる？"],
 ["自分の睡眠・気分をチェックした","パパの産後うつも約1割"],
];
const WKEY='papa-week-v1'; let wk=weekKey();
let wstate=readObject(storage.getItem(WKEY));
if(wstate.week!==wk) wstate={week:wk};
storage.setItem(WKEY,JSON.stringify(wstate));
document.getElementById('wk-label').textContent=wk.replace(/-/g,'/')+' の週';
const wl=document.getElementById('weekly');
WEEKLY.forEach((it,i)=>{
  const l=document.createElement('label'); l.className='check'+(wstate[i]?' done':'');
  l.innerHTML='<input type="checkbox" '+(wstate[i]?'checked':'')+'><span>'+it[0]+'<small>'+it[1]+'</small></span>';
  l.querySelector('input').onchange=e=>{const checked=e.target.checked; refreshCalendar(); wstate[i]=checked; e.target.checked=checked;
    try{storage.setItem(WKEY,JSON.stringify(wstate))}catch(_){}
    l.classList.toggle('done',e.target.checked);};
  wl.appendChild(l);
});

/* ---------- age tracker ---------- */
const EVENTS=[
 [0,"出生届（14日以内）・児童手当・健康保険・医療費助成の申請","パパ担当"],
 [1,"1ヶ月健診（産院）／ママの1ヶ月健診にも同行",""],
 [2,"予防接種デビュー：ロタ・B型肝炎・肺炎球菌・5種混合","ロタ1回目は生後14週6日まで"],
 [3,"3〜4ヶ月健診（保健センター）／首すわりの確認",""],
 [5,"離乳食スタートのサインを確認（5〜6ヶ月）","BCG（標準は5〜8ヶ月）"],
 [6,"寝返り・転落対策／歯が生えたら歯みがき開始","初めての食材は平日午前に"],
 [7,"2回食へ／6〜7ヶ月の健診は自治体・医療機関に確認",""],
 [9,"3回食・手づかみ食べ／9〜10ヶ月健診（実施・費用は自治体・医療機関に確認）／誤飲・溺水・やけど対策","つかまり立ちの時期"],
 [12,"1歳の予防接種：MR・水痘・ヒブと肺炎球菌の追加（おたふくは任意）","離乳完了期へ・牛乳OK"],
 [15,"ひとり歩き・言葉の確認（18ヶ月まで幅あり）",""],
 [18,"1歳6ヶ月児健診（言葉・歩行・指さし）","イヤイヤ期の準備"],
 [24,"二語文・トイトレのサインを観察／フッ素塗布の相談",""],
 [36,"3歳児健診（家で視力・聴力チェック）／日本脳炎1期",""],
 [48,"友達との遊び・ルール理解／自転車はヘルメット",""],
 [60,"MR2期（年長の1年間）／就学前健診・学童の情報収集",""],
];
const STAGES=[
  {label:'新生児 0〜2ヶ月',points:['夜間対応を分担して、ママの連続睡眠をつくる','あおむけ・硬い寝床・顔まわりに物なしで寝かせる','泣いて限界のときは安全な場所に置き、交代して深呼吸する']},
  {label:'3〜5ヶ月',points:['寝返りに備え、手を離すときは床に置く','お風呂や寝る前の手順を毎日同じにする','声かけ・歌・うつぶせ遊びは必ず見守って楽しむ']},
  {label:'6〜8ヶ月',points:['初めての食材は平日午前に少量から試す','ボタン電池・磁石・薬などを床から遠ざける','夜泣き対応と寝る前の仕上げ磨きを分担する']},
  {label:'9〜11ヶ月',points:['階段・キッチン・窓まわりの安全対策を先回りする','食事は座って、手づかみ食べを見守る','指さしや声に言葉を添えて一緒に見る']},
  {label:'1歳〜1歳半',points:['食事は座ってゆっくり。窒息しやすい食材を避ける','予防接種と1歳6ヶ月健診を予定に入れる','外遊びと実況中継で、歩く力と言葉を育てる']},
  {label:'1歳半〜3歳',points:['イヤイヤには予告・共感・2択で対応する','毎日体を動かし、絵本を一緒に読む','仕上げ磨きとトイレ練習は失敗を責めずに続ける']},
  {label:'3歳〜就学前',points:['話を目線を合わせて最後まで聞く','道路・水・遊具の安全ルールを一緒に練習する','健診・予防接種・就学準備を家族で確認する']},
];
const DKEY='papa-dob-v1';
const SKEY='papa-stage-v1';
const dobInput=document.getElementById('dob-input');
const ageCards=[...document.querySelectorAll('.card.age')];
const agePicker=document.getElementById('age-picker-options');
const priorityList=document.getElementById('priority-list');
const priorityStage=document.getElementById('priority-stage');
const priorityNote=document.getElementById('priority-note');
const pickerButtons=STAGES.map((stage,i)=>{
  const b=document.createElement('button');
  b.type='button'; b.className='age-picker-button'; b.dataset.stage=String(i);
  b.setAttribute('aria-pressed','false'); b.textContent=stage.label;
  agePicker.appendChild(b);
  return b;
});
ageCards.forEach((card,i)=>{
  card.dataset.stageIndex=String(i);
  const button=document.createElement('button');
  button.type='button'; button.className='age-open'; button.textContent='この時期を読む';
  button.setAttribute('aria-controls',`age-card-${i}`);
  button.setAttribute('aria-expanded','false');
  card.id=`age-card-${i}`;
  card.querySelector('h3').after(button);
  button.onclick=()=>selectStage(i,true);
});
function renderPriorities(index){
  const stage=STAGES[index]||STAGES[0];
  priorityStage.textContent=stage.label;
  const hasDob=parseDate(storage.getItem(DKEY));
  priorityNote.textContent=hasDob?'誕生日から月齢に合わせて選んでいます。':'誕生日未登録。発達・年齢で選んだ時期を表示しています。';
  priorityList.innerHTML=stage.points.map(point=>`<li>${point}</li>`).join('');
}
function selectStage(index,remember){
  index=Math.max(0,Math.min(STAGES.length-1,Number(index)||0));
  ageCards.forEach((card,i)=>{
    const selected=i===index;
    card.classList.toggle('age-primary',selected);
    card.classList.toggle('age-collapsed',!selected);
    const button=card.querySelector('.age-open');
    button.textContent=selected?'選択中':'この時期を読む';
    button.disabled=selected;
    button.setAttribute('aria-expanded',String(selected));
  });
  pickerButtons.forEach((button,i)=>{
    const selected=i===index;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  if(remember && !parseDate(storage.getItem(DKEY))){
    try{storage.setItem(SKEY,String(index))}catch(_){}
  }
  renderPriorities(index);
}
pickerButtons.forEach((button,i)=>button.onclick=()=>selectStage(i,true));
const storedStage=Number(storage.getItem(SKEY));
selectStage(Number.isInteger(storedStage)&&storedStage>=0&&storedStage<STAGES.length?storedStage:0,false);
function renderAge(){
  const v=storage.getItem(DKEY);
  const form=document.getElementById('dob-form'), view=document.getElementById('dob-view');
  document.querySelectorAll('.card.age').forEach(c=>c.classList.remove('now'));
  if(!parseDate(v)){
    form.style.display='';view.style.display='none';
    const saved=Number(storage.getItem(SKEY));
    selectStage(Number.isInteger(saved)&&saved>=0&&saved<STAGES.length?saved:0,false);
    return;
  }
  form.style.display='none'; view.style.display='';
  const dob=parseDate(v), now=new Date(); now.setHours(0,0,0,0);
  const main=document.getElementById('age-main'), sub=document.getElementById('age-sub'), stage=document.getElementById('age-stage'), ev=document.getElementById('events');
  if(dob>now){
    const days=Math.round((dob-now)/86400000);
    main.textContent='出産まで '+days+'日'; sub.textContent='予定日 '+dob.toLocaleDateString('ja-JP');
    selectStage(0,false);
    stage.innerHTML='産後パパ育休の申出は原則<b>2週間前</b>まで。入院バッグ・チャイルドシート・沐浴用品・液体ミルクの備蓄・実家との役割分担を今のうちに。';
    ev.innerHTML=EVENTS.slice(0,4).map(e=>'<div class="ev"><span class="m">生後'+e[0]+'ヶ月</span><span>'+e[1]+(e[2]?'<span class="pill">'+e[2]+'</span>':'')+'</span></div>').join('');
    return;
  }
  const m=monthsBetween(dob,now);
  const anniv=monthAnniversary(dob,m);
  const d=Math.round((now-anniv)/86400000);
  main.textContent=m>=12?Math.floor(m/12)+'歳'+(m%12)+'ヶ月':'生後'+m+'ヶ月'+d+'日';
  sub.textContent='誕生日 '+dob.toLocaleDateString('ja-JP');
  let cur=null, stageIndex=0;
  document.querySelectorAll('.card.age').forEach((c,i)=>{const lo=+c.dataset.min, hi=+c.dataset.max; if(m>=lo&&m<hi){c.classList.add('now'); cur=c; stageIndex=i;}});
  selectStage(stageIndex,false);
  stage.innerHTML=cur?'今の時期：<b>'+cur.querySelector('.age-tag').textContent+'</b>「'+cur.querySelector('h3').textContent+'」。「発達・年齢」タブで<b>今ここ</b>の印を確認。':'';
  const upcoming=EVENTS.filter(e=>e[0]>=m).slice(0,4), recent=EVENTS.filter(e=>e[0]<m).slice(-1);
  ev.innerHTML=recent.map(e=>'<div class="ev past"><span class="m">生後'+e[0]+'ヶ月</span><span>'+e[1]+'</span></div>').join('')+
    upcoming.map(e=>'<div class="ev"><span class="m">'+(e[0]>=12?Math.floor(e[0]/12)+'歳'+(e[0]%12?e[0]%12+'ヶ月':''):'生後'+e[0]+'ヶ月')+'</span><span>'+e[1]+(e[2]?'<span class="pill">'+e[2]+'</span>':'')+'</span></div>').join('');
  if(!upcoming.length) ev.innerHTML+='<div class="ev"><span class="m">これから</span><span>就学準備・約束を守る・話を聞く。ここまでよく頑張りました。</span></div>';
}
/* ---------- leave plan timeline ---------- */
function renderLeave(){
  const timeline=document.getElementById('leave-timeline');
  if(!timeline)return;
  const raw=storage.getItem(DKEY);
  const parsed=parseDate(raw);
  const birth=parsed||new Date('2026-10-15T00:00:00');
  const addDays=(date,days)=>{const value=new Date(date);value.setDate(value.getDate()+days);return value;};
  const fmt=date=>(date.getMonth()+1)+'/'+date.getDate();
  const ageAt=date=>{
    if(date<birth)return '出産前';
    const months=monthsBetween(birth,date);
    if(months<1)return '生後'+Math.round((date-birth)/86400000)+'日';
    return '生後'+months+'ヶ月';
  };
  const now=new Date(); now.setHours(0,0,0,0);
  const firstEnd=addDays(birth,29);
  const secondStart=new Date('2027-04-01T00:00:00');
  const secondEnd=new Date('2027-09-30T00:00:00');
  const phases=[
    {id:0,name:'① 出産前・準備',from:null,to:addDays(birth,-1),age:'〜出産'},
    {id:1,name:'② 産後パパ育休 1ヶ月',from:birth,to:firstEnd,age:ageAt(birth)+'〜'+ageAt(firstEnd)},
    {id:2,name:'③ 復職期間',from:addDays(firstEnd,1),to:addDays(secondStart,-1),age:ageAt(addDays(firstEnd,1))+'〜'+ageAt(addDays(secondStart,-1))},
    {id:3,name:'④ 育休 6ヶ月',from:secondStart,to:secondEnd,age:ageAt(secondStart)+'〜'+ageAt(secondEnd)},
    {id:4,name:'⑤ 復職（ここからが本番）',from:addDays(secondEnd,1),to:null,age:ageAt(addDays(secondEnd,1))+'〜'}
  ];
  const current=phases.findIndex(phase=>(phase.from===null||now>=phase.from)&&(phase.to===null||now<=phase.to));
  timeline.innerHTML=phases.map(phase=>
    '<div class="ev'+(phase.id===current?'':(phase.to&&now>phase.to?' past':''))+'"><span class="m">'+(phase.from?fmt(phase.from):'今')+'〜'+(phase.to?fmt(phase.to):'')+'</span><span>'+
    (phase.id===current?'<b>'+phase.name+'</b>':phase.name)+'<br><small style="color:var(--muted)">'+phase.age+'</small></span></div>'
  ).join('')+(parsed?'':'<div class="source">※ 誕生日未登録のため、予定日を2026年10月15日として仮計算しています。</div>');
  document.querySelectorAll('.card.phase').forEach(card=>card.classList.toggle('now',+card.dataset.phase===current));
}

document.getElementById('dob-save').onclick=()=>{ if(!dobInput.reportValidity()||!parseDate(dobInput.value)) return; try{storage.setItem(DKEY,dobInput.value)}catch(_){}; renderAge(); renderLeave(); };
document.getElementById('dob-edit').onclick=()=>{
  dobInput.value=storage.getItem(DKEY)||'';
  document.getElementById('dob-form').style.display='';
  dobInput.focus();
  renderLeave();
};
renderAge();
renderLeave();

/* Check on resume AND before a checkbox change; preserve existing storage keys. */
function refreshCalendar(){
  const next=new Date().toDateString(), nextWeek=weekKey();
  if(next!==today){
    today=next; state={date:today}; storage.setItem(KEY,JSON.stringify(state));
    list.querySelectorAll('input').forEach(input=>{input.checked=false;input.closest('label').classList.remove('done');});
    update(); renderAge(); renderLeave();
  }
  if(nextWeek!==wk){
    wk=nextWeek; wstate={week:wk}; storage.setItem(WKEY,JSON.stringify(wstate));
    wl.querySelectorAll('input').forEach(input=>{input.checked=false;input.closest('label').classList.remove('done');});
    document.getElementById('wk-label').textContent=wk.replace(/-/g,'/')+' の週';
  }
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCalendar();});
window.addEventListener('focus',refreshCalendar);
setInterval(refreshCalendar,30000);
