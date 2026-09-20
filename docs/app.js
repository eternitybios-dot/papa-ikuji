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
const DKEY='papa-dob-v1';
const dobInput=document.getElementById('dob-input');
function renderAge(){
  const v=storage.getItem(DKEY);
  const form=document.getElementById('dob-form'), view=document.getElementById('dob-view');
  document.querySelectorAll('.card.age').forEach(c=>c.classList.remove('now'));
  if(!parseDate(v)){form.style.display='';view.style.display='none';return;}
  form.style.display='none'; view.style.display='';
  const dob=parseDate(v), now=new Date(); now.setHours(0,0,0,0);
  const main=document.getElementById('age-main'), sub=document.getElementById('age-sub'), stage=document.getElementById('age-stage'), ev=document.getElementById('events');
  if(dob>now){
    const days=Math.round((dob-now)/86400000);
    main.textContent='出産まで '+days+'日'; sub.textContent='予定日 '+dob.toLocaleDateString('ja-JP');
    stage.innerHTML='産後パパ育休の申出は原則<b>2週間前</b>まで。入院バッグ・チャイルドシート・沐浴用品・液体ミルクの備蓄・実家との役割分担を今のうちに。';
    ev.innerHTML=EVENTS.slice(0,4).map(e=>'<div class="ev"><span class="m">生後'+e[0]+'ヶ月</span><span>'+e[1]+(e[2]?'<span class="pill">'+e[2]+'</span>':'')+'</span></div>').join('');
    return;
  }
  const m=monthsBetween(dob,now);
  const anniv=monthAnniversary(dob,m);
  const d=Math.round((now-anniv)/86400000);
  main.textContent=m>=12?Math.floor(m/12)+'歳'+(m%12)+'ヶ月':'生後'+m+'ヶ月'+d+'日';
  sub.textContent='誕生日 '+dob.toLocaleDateString('ja-JP');
  let cur=null;
  document.querySelectorAll('.card.age').forEach(c=>{const lo=+c.dataset.min, hi=+c.dataset.max; if(m>=lo&&m<hi){c.classList.add('now'); cur=c;}});
  stage.innerHTML=cur?'今の時期：<b>'+cur.querySelector('.age-tag').textContent+'</b>「'+cur.querySelector('h3').textContent+'」。「発達・年齢」タブで<b>今ここ</b>の印を確認。':'';
  const upcoming=EVENTS.filter(e=>e[0]>=m).slice(0,4), recent=EVENTS.filter(e=>e[0]<m).slice(-1);
  ev.innerHTML=recent.map(e=>'<div class="ev past"><span class="m">生後'+e[0]+'ヶ月</span><span>'+e[1]+'</span></div>').join('')+
    upcoming.map(e=>'<div class="ev"><span class="m">'+(e[0]>=12?Math.floor(e[0]/12)+'歳'+(e[0]%12?e[0]%12+'ヶ月':''):'生後'+e[0]+'ヶ月')+'</span><span>'+e[1]+(e[2]?'<span class="pill">'+e[2]+'</span>':'')+'</span></div>').join('');
  if(!upcoming.length) ev.innerHTML+='<div class="ev"><span class="m">これから</span><span>就学準備・約束を守る・話を聞く。ここまでよく頑張りました。</span></div>';
}
document.getElementById('dob-save').onclick=()=>{ if(!dobInput.reportValidity()||!parseDate(dobInput.value)) return; try{storage.setItem(DKEY,dobInput.value)}catch(_){}; renderAge(); };
document.getElementById('dob-edit').onclick=()=>{
  dobInput.value=storage.getItem(DKEY)||'';
  document.getElementById('dob-form').style.display='';
  dobInput.focus();
};
renderAge();

/* Check on resume AND before a checkbox change; preserve existing storage keys. */
function refreshCalendar(){
  const next=new Date().toDateString(), nextWeek=weekKey();
  if(next!==today){
    today=next; state={date:today}; storage.setItem(KEY,JSON.stringify(state));
    list.querySelectorAll('input').forEach(input=>{input.checked=false;input.closest('label').classList.remove('done');});
    update(); renderAge();
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

