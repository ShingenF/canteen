/* ================= 模式 ================= */
const MP = new URLSearchParams(location.search).has('mp');
document.documentElement.classList.add(MP ? 'mp' : 'web');

Object.assign(CANTEENS[1],{walk:4,x:338,y:292,short:'一食堂'});
Object.assign(CANTEENS[2],{walk:7,x:202,y:232,short:'二食堂'});
Object.assign(CANTEENS[3],{walk:11,x:75,y:140,short:'三食堂'});

/* ================= 状态 ================= */
const S={meal:nowMeal(),budget:0,taste:'',noQueue:false,seed:1,rank:'red',draft:{rate:0,tags:[]},
  feed:'all',dim:'meal',dimv:{meal:nowMeal(),canteen:1,taste:'辣',budget:10,special:'new'},map:{sel:0,snap:'peek'},q:''};
const MEALN={早:'早餐',午:'午餐',晚:'晚餐'};
const myLikes=()=>LS.get('cr_likes',[]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pic=d=>`<img src="img/${d.id}.jpg" alt="${d.name}">`;
const hash=s=>{let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const ava=u=>`<i class="ava" style="background:hsl(${hash(u)%360} 60% 62%)">${u.slice(-2,-1)||u[0]}</i>`;

function candidates(){
  let l=DISHES.filter(d=>d.meals.includes(S.meal)&&(!S.budget||d.price<=S.budget)&&(!S.taste||d.tags.includes(S.taste))&&!isBadWin(WIN[d.w]));
  if(S.noQueue){const f=l.filter(d=>queue(WIN[d.w])<=5);if(f.length)l=f}
  return l;
}
function recommend(){
  return candidates().map(d=>{const q=queue(WIN[d.w]);return{d,q,s:dishStat(d).avg*20-(S.noQueue?q*3:q*.6)+(d.newDays?4:0)+rnd(d.id+S.seed*7.3)*16}}).sort((a,b)=>b.s-a.s).slice(0,3);
}
function whyText(d,q){const st=dishStat(d),a=[];
  a.push(q<=4?`现在几乎不用排队`:`现在排队约 ${q} 分钟`);
  if(S.budget)a.push(`在 ${S.budget} 元预算内`);
  if(d.newDays)a.push(`上新第 ${d.newDays} 天`);
  const top=reviewsOf(d).find(r=>r.rate>=4);if(top)a.push(`“${top.text.slice(0,14)}…”`);
  return a.slice(0,3).join(' · ');
}
function topTag(d){const m={};reviewsOf(d).forEach(r=>r.tags.forEach(t=>m[t]=(m[t]||0)+1));const e=Object.entries(m).sort((a,b)=>b[1]-a[1])[0];return e?e[0]:''}

/* ================= 组件 ================= */
// 点评/外卖式菜品行
function dishRow(d,o={}){const st=dishStat(d),w=WIN[d.w],c=CANTEENS[w.c],q=queue(w),bad=isBadWin(w),want=myWants().includes(d.id),tt=topTag(d);
  return `<a class="drow ${bad?'isbad':''}" href="#/dish/${d.id}">
  <div class="ph">${pic(d)}${o.rank?`<b class="rkb ${o.rank<=3?'t':''}">${o.rank}</b>`:d.newDays?'<b class="cb new">新品</b>':bad?'<b class="cb bad">避雷</b>':''}</div>
  <div class="bd"><h3>${d.name}</h3>
   <div class="l2"><b class="sc ${rc(st.avg)}">★ ${st.avg.toFixed(1)}</b><span>${st.n}人评价</span><span class="${q<=5?'qok':''}">排队约${q}分钟</span></div>
   <div class="l3">${c.name} · ${w.name} · ${w.floor}</div>
   ${o.why?`<div class="why">${o.why}</div>`:`<div class="tg">${bad?winReasons(w).slice(0,2).map(t=>`<em class="r">${t}</em>`).join(''):(tt&&!BAD_TAGS.includes(tt)?`<em class="o">${tt}</em>`:'')+d.tags.map(t=>`<em>${t}</em>`).join('')}</div>`}
   <div class="pr"><span class="price"><small>¥</small>${d.price}</span><button class="plus ${want?'on':''}" data-act="want" data-id="${d.id}" aria-label="想吃">${want?'✓':'+'}</button></div>
  </div></a>`}
function pill(k,label,active){return `<button class="pill ${active?'on':''}" data-act="sheet" data-k="${k}">${label}<i>▾</i></button>`}
const FOPT={meal:[['早','早餐'],['午','午餐'],['晚','晚餐']],budget:[[0,'不限预算'],[10,'10 元以内'],[15,'15 元以内'],[20,'20 元以内']],taste:[['','不限口味'],['辣','想吃辣'],['清淡','清淡'],['面食','面食'],['米饭','米饭']]};
const FNAME={meal:'餐段',budget:'预算',taste:'口味'};

/* ================= 首页 ================= */
const V={};
const KING=[['🎲','帮我选','lucky'],['🏆','红榜必吃','#/rank','red'],['💣','避雷黑榜','#/rank','black'],['✨','新品尝鲜','menu','special','new'],['⏱️','不排队','menu','special','fast'],
  ['💰','10元吃饱','menu','budget',10],['🌶️','想吃辣','menu','taste','辣'],['🥗','清淡','menu','taste','清淡'],['🥟','早餐','menu','meal','早'],['🗺️','食堂地图','#/map']];
function feedItems(){
  const mine=myReviews().map(r=>({...r,d:DMAP[r.dish]})).filter(x=>x.d);
  const seed=[];DISHES.forEach(d=>d.seed.forEach((r,i)=>seed.push({...r,d,key:d.id+'-'+i})));
  seed.sort((a,b)=>rnd(hash(a.key))-rnd(hash(b.key)));
  let all=mine.map((r,i)=>({...r,key:'m'+i})).concat(seed);
  if(S.feed==='good')all=all.filter(r=>r.rate>=4);
  if(S.feed==='bad')all=all.filter(r=>r.rate<=2);
  if(S.feed==='new')all=all.filter(r=>r.d.newDays);
  return all;
}
function feedCard(r){const likes=myLikes(),on=likes.includes(r.key),n=(hash(r.key)%180)+6+(on?1:0),w=WIN[r.d.w];
  return `<a class="fc" href="#/dish/${r.d.id}"><div class="fimg ${hash(r.key)%3===0?'tall':''}">${pic(r.d)}${r.rate<=2?'<b class="cb bad">踩雷</b>':r.rate===5?'<b class="cb good">推荐</b>':''}<span class="loc">📍${CANTEENS[w.c].short} · ${w.name}</span></div>
  <div class="fb"><h4>${r.d.name}｜${esc(r.text)}</h4>
  <div class="fs"><span class="stars">${'★'.repeat(r.rate)}<i>${'★'.repeat(5-r.rate)}</i></span><span class="price">¥${r.d.price}</span></div>
  <div class="fu">${ava(r.user||'我')}<span>${r.mine?'我':r.user}</span><button class="like ${on?'on':''}" data-act="like" data-k="${r.key}">${on?'♥':'♡'} ${n}</button></div></div></a>`}

V.home=()=>{
  const rec=recommend(),bads=Object.values(WIN).filter(isBadWin).sort((a,b)=>winStat(a).avg-winStat(b).avg);
  const news=DISHES.filter(d=>d.newDays).sort((a,b)=>a.newDays-b.newDays);
  const near=Object.values(CANTEENS).slice().sort((a,b)=>crowd(a)-crowd(b))[0];
  return `
  <a class="search" href="#/search"><span>🔍</span>搜菜品、窗口，例如"拉面"</a>
  ${MP?'':`<button class="demo" data-act="phone"><b>📱 打开 iPhone 真机，体验小程序版</b><span>可直接点按操作 ›</span></button>`}
  <section class="card king">${KING.map(k=>`<button data-act="king" data-a="${k[2]}" data-k="${k[3]||''}" data-v="${k[4]??''}"><i>${k[0]}</i>${k[1]}</button>`).join('')}</section>

  <section class="card mod">
    <div class="modh"><h2>${MEALN[S.meal]}吃什么</h2><span class="sub">已帮你避开 ${bads.length} 个踩雷窗口</span><button class="lnk" data-act="shuffle">↻ 换一批</button></div>
    <div class="fbar">${pill('meal',MEALN[S.meal],true)}${pill('budget',S.budget?S.budget+'元内':'预算',!!S.budget)}${pill('taste',S.taste||'口味',!!S.taste)}<button class="pill ${S.noQueue?'on':''}" data-act="toggleQ">⏱ 不排队</button></div>
    <div class="rows">${rec.length?rec.map((r,i)=>dishRow(r.d,{rank:i+1,why:'💡 '+whyText(r.d,r.q)})).join(''):'<div class="empty">这个条件下没有合适的菜，放宽预算或口味试试</div>'}</div>
    <button class="lucky" data-act="lucky">🎲 还是纠结？帮我选一个</button>
  </section>

  ${bads.length?`<section class="card mod badmod">
    <div class="modh"><h2>⚠️ 今日避雷</h2><span class="sub">差评集中的窗口，去之前看一眼</span><a class="lnk" href="#/rank" data-act="set" data-k="rank" data-v="black">黑榜 ›</a></div>
    <div class="bads">${bads.map(w=>{const ds=winDishes(w).sort((a,b)=>dishStat(a).avg-dishStat(b).avg),q=ds.flatMap(d=>reviewsOf(d)).find(r=>r.rate<=2);
      return `<a class="badw" href="#/win/${w.id}"><div class="bph">${ds.slice(0,2).map(d=>`<div>${pic(d)}<span>${d.name} ${dishStat(d).avg.toFixed(1)}</span></div>`).join('')}</div>
      <div class="binfo"><h3>${CANTEENS[w.c].name} · ${w.name}<b>${winStat(w).avg.toFixed(1)}分</b></h3>
      <div class="tg">${winReasons(w).slice(0,3).map(t=>`<em class="r">${t}</em>`).join('')}</div>
      ${q?`<p class="quote">“${esc(q.text)}”</p>`:''}${w.trend?`<p class="trend">📉 ${w.trend}</p>`:''}</div></a>`}).join('')}</div>
  </section>`:''}

  <section class="card mod">
    <div class="modh"><h2>✨ 本周新品</h2><span class="sub">评价少，等你尝鲜</span><button class="lnk" data-act="king" data-a="menu" data-k="special" data-v="new">全部 ›</button></div>
    <div class="hscroll">${news.map(d=>{const st=dishStat(d);return `<a class="newc" href="#/dish/${d.id}"><div class="nph">${pic(d)}<b class="cb new">第${d.newDays}天</b></div><h3>${d.name}</h3><div class="l3"><b class="sc ${rc(st.avg)}">★${st.avg.toFixed(1)}</b> ${st.n}人尝鲜</div><div class="price"><small>¥</small>${d.price}</div></a>`}).join('')}</div>
  </section>

  <a class="card nearby" href="#/canteen/${near.id}"><span class="dot" style="background:${crowdTxt(crowd(near))[1]}"></span><div><b>${near.name}现在${crowdTxt(crowd(near))[0]}</b><p>步行 ${near.walk} 分钟 · 三个食堂里人最少</p></div><span class="lnk">看地图 ›</span></a>

  <section class="feedsec">
    <div class="ftabs">${[['all','同学都在吃'],['good','好评'],['bad','踩雷'],['new','新品']].map(t=>`<button class="${S.feed===t[0]?'on':''}" data-act="set" data-k="feed" data-v="${t[0]}">${t[1]}</button>`).join('')}</div>
    <div class="feed">${feedItems().map(feedCard).join('')||'<div class="empty">暂时没有内容</div>'}</div>
  </section>`};

/* ================= 找菜（外卖式：顶部维度 + 左侧栏 + 右侧列表） ================= */
const DIMS=[
 ['meal','餐段',[['早','早餐'],['午','午餐'],['晚','晚餐']]],
 ['canteen','食堂',[[1,'一食堂'],[2,'二食堂'],[3,'三食堂']]],
 ['taste','口味',[['辣','想吃辣'],['清淡','清淡'],['面食','面食'],['米饭','米饭']]],
 ['budget','预算',[[10,'10元内'],[15,'15元内'],[20,'20元内']]],
 ['special','场景',[['new','新品尝鲜'],['fast','不排队'],['top','口碑必吃'],['bad','避雷区']]]
];
function dimFilter(k,v){return d=>k==='meal'?d.meals.includes(v):k==='canteen'?WIN[d.w].c==v:k==='taste'?d.tags.includes(v):k==='budget'?d.price<=v:
  v==='new'?d.newDays>0:v==='fast'?queue(WIN[d.w])<=5:v==='top'?dishStat(d).avg>=4.5:isBadWin(WIN[d.w])}
V.menu=()=>{
  const dim=DIMS.find(x=>x[0]===S.dim),v=S.dimv[S.dim];
  let list=DISHES.filter(dimFilter(S.dim,v));
  const showBad=S.dim==='special'&&v==='bad';
  const good=list.filter(d=>showBad||!isBadWin(WIN[d.w])).sort((a,b)=>showBad?dishStat(a).avg-dishStat(b).avg:dishStat(b).avg-dishStat(a).avg);
  const bad=showBad?[]:list.filter(d=>isBadWin(WIN[d.w]));
  const wants=myWants().length;
  return `<div class="menu">
   <div class="dims">${DIMS.map(x=>`<button class="${S.dim===x[0]?'on':''}" data-act="dim" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
   <div class="mbody">
    <div class="side">${dim[2].map(o=>{const n=DISHES.filter(dimFilter(S.dim,o[0])).length;return `<button class="${v==o[0]?'on':''}" data-act="dimv" data-v="${o[0]}">${o[1]}<small>${n}</small></button>`}).join('')}</div>
    <div class="mlist">
      <div class="mh"><b>${dim[2].find(o=>o[0]==v)[1]}</b> ${good.length+bad.length} 道 · ${showBad?'评分从低到高':'按口碑排序'}</div>
      ${good.map(d=>dishRow(d)).join('')||'<div class="empty">这里暂时没有菜</div>'}
      ${bad.length?`<div class="mh warn">⚠️ 以下窗口在黑榜，谨慎选择</div>${bad.map(d=>dishRow(d)).join('')}`:''}
    </div>
   </div>
   <a class="cartbar ${wants?'':'empty0'}" href="#/me"><span class="cart">🍽️${wants?`<b>${wants}</b>`:''}</span><span class="ct">${wants?`想吃清单 · ${wants} 道`:'点 ＋ 把想吃的菜加进清单'}</span><span class="go">${wants?'去看看':'想吃清单'}</span></a>
  </div>`};

/* ================= 食堂地图 + 抽屉 ================= */
function mapSvg(){
  const pin=c=>{const p=crowd(c),[t,col]=crowdTxt(p),sel=S.map.sel===c.id;
    return `<g class="pin ${sel?'sel':''}" data-act="pin" data-id="${c.id}" transform="translate(${c.x},${c.y})">
      <g class="pg"><rect x="-37" y="-66" width="74" height="24" rx="12" fill="#fff" stroke="${sel?'#2b2420':'#e2ddd6'}" stroke-width="${sel?1.6:1}"/>
      <circle cx="-25" cy="-54" r="4" fill="${col}"/><text x="-17" y="-50" font-size="11" font-weight="700" fill="#2b2420">${c.short}</text><text x="20" y="-50" font-size="9.5" fill="${col}" font-weight="700">${t}</text>
      <path d="M0 0C-9-11-14-17-14-24a14 14 0 1 1 28 0c0 7-5 13-14 24z" fill="${sel?'#ff6b35':col}" stroke="#fff" stroke-width="2"/><text x="0" y="-19" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">食</text></g></g>`};
  const B=(x,y,w,h,t)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#e6e0d6" stroke="#d6cfc3"/><text x="${x+w/2}" y="${y+h/2+4}" text-anchor="middle" font-size="10" fill="#8b7f76">${t}</text>`;
  return `<svg class="mapsvg" viewBox="0 0 390 720" preserveAspectRatio="xMidYMin slice">
   <rect width="390" height="720" fill="#eef2e4"/>
   <rect x="0" y="0" width="390" height="30" fill="#e3ecd6"/>
   <g stroke="#fff" stroke-linecap="round" fill="none"><path d="M0 200H390" stroke-width="16"/><path d="M0 365H390" stroke-width="16"/><path d="M150 0V720" stroke-width="14"/><path d="M292 0V720" stroke-width="14"/><path d="M0 100H150" stroke-width="8"/><path d="M150 285H292" stroke-width="7"/></g>
   <g stroke="#f3e9c9" stroke-width="1.5" stroke-dasharray="6 6" fill="none"><path d="M0 200H390"/><path d="M0 365H390"/></g>
   <ellipse cx="222" cy="320" rx="46" ry="24" fill="#bfe0f2"/><text x="222" y="324" text-anchor="middle" font-size="10" fill="#6aa3c4">未名湖</text>
   <rect x="18" y="222" width="114" height="124" rx="16" fill="#cfe6bd"/><ellipse cx="75" cy="284" rx="42" ry="50" fill="none" stroke="#fff" stroke-width="5"/><text x="75" y="288" text-anchor="middle" font-size="10" fill="#7da25c">操场</text>
   ${B(18,40,114,44,'西区宿舍')}${B(18,152,114,34,'体育馆')}${B(168,40,106,56,'教学楼 A')}${B(168,112,106,60,'图书馆')}${B(308,40,66,130,'东区宿舍')}${B(308,218,66,50,'实验楼')}${B(168,384,106,50,'行政楼')}${B(18,384,114,50,'校医院')}${B(308,384,66,50,'快递站')}
   <rect x="46" y="112" width="58" height="30" rx="5" fill="#ffe1cf" stroke="#ffc7a8"/><rect x="172" y="212" width="60" height="30" rx="5" fill="#ffe1cf" stroke="#ffc7a8"/><rect x="312" y="278" width="60" height="30" rx="5" fill="#ffe1cf" stroke="#ffc7a8"/>
   <circle cx="262" cy="200" r="16" fill="#3b82f6" opacity=".18"/><circle cx="262" cy="200" r="6.5" fill="#3b82f6" stroke="#fff" stroke-width="2.5"/><text x="262" y="226" text-anchor="middle" font-size="9.5" fill="#3b82f6" font-weight="700">我的位置</text>
   ${Object.values(CANTEENS).filter(c=>c.id!==S.map.sel).map(pin).join('')}${S.map.sel?pin(CANTEENS[S.map.sel]):''}
  </svg>`}
function winLine(w){const st=winStat(w),bad=isBadWin(w),ds=winDishes(w).sort((a,b)=>dishStat(b).avg-dishStat(a).avg);
  return `<a class="wl ${bad?'isbad':''}" href="#/win/${w.id}"><div class="wph">${pic(ds[0])}</div><div class="bd"><h3>${w.name}${bad?'<em class="r">避雷</em>':''}<b class="sc ${rc(st.avg)}">${st.avg.toFixed(1)}</b></h3>
   <div class="l3">${w.floor} · 排队约 ${queue(w)} 分钟 · ${st.n} 人评价</div><div class="tg">${(bad?winReasons(w).slice(0,3).map(t=>`<em class="r">${t}</em>`):w.tags.map(t=>`<em>${t}</em>`)).join('')}</div>
   <div class="l3">${ds.slice(0,3).map(d=>d.name).join(' · ')}</div></div></a>`}
function drawerBody(){
  const c=CANTEENS[S.map.sel];
  if(!c)return {head:`<h2>附近食堂</h2><p>点地图上的标记查看详情，按当前拥挤度排序</p>`,body:Object.values(CANTEENS).slice().sort((a,b)=>crowd(a)-crowd(b)).map(c=>{const p=crowd(c),[t,col]=crowdTxt(p),ws=Object.values(WIN).filter(w=>w.c===c.id),bad=ws.filter(isBadWin).length;
    return `<button class="cl" data-act="pin" data-id="${c.id}"><span class="dot" style="background:${col}"></span><div><b>${c.name}</b><p>步行 ${c.walk} 分钟 · ${ws.length} 个窗口${bad?` · <span class="red">${bad} 个避雷</span>`:''}</p></div><em style="color:${col}">${t}</em></button>`}).join('')};
  const p=crowd(c),[t,col]=crowdTxt(p),ws=Object.values(WIN).filter(w=>w.c===c.id).sort((a,b)=>winStat(b).avg-winStat(a).avg),bads=ws.filter(isBadWin);
  const tops=DISHES.filter(d=>WIN[d.w].c===c.id&&!isBadWin(WIN[d.w])).sort((a,b)=>dishStat(b).avg-dishStat(a).avg).slice(0,6);
  const avgQ=Math.round(ws.reduce((s,w)=>s+queue(w),0)/ws.length);
  return {head:`<div class="dh1"><h2>${c.name}</h2><em style="color:${col};background:${col}1f">${t}</em><button class="x" data-act="unpin">×</button></div><p>步行 ${c.walk} 分钟 · ${c.area} · 营业 ${c.hours}</p>`,
   body:`<div class="dstat"><div><b>${ws.length}</b><span>窗口</span></div><div><b>${avgQ}<small>分钟</small></b><span>平均排队</span></div><div><b class="${bads.length?'red':''}">${bads.length}</b><span>避雷窗口</span></div><div><b>${Math.round(p*100)}<small>%</small></b><span>上座率</span></div></div>
    <p class="ddesc">💬 ${c.desc}</p>
    ${bads.length?`<div class="dwarn">⚠️ 这里的 <b>${bads.map(w=>w.name).join('、')}</b> 在黑榜上：${winReasons(bads[0]).slice(0,3).join('、')}</div>`:''}
    <h4>必吃菜</h4><div class="hscroll">${tops.map(d=>`<a class="newc sm" href="#/dish/${d.id}"><div class="nph">${pic(d)}</div><h3>${d.name}</h3><div class="l3"><b class="sc g">★${dishStat(d).avg.toFixed(1)}</b> ¥${d.price}</div></a>`).join('')}</div>
    <h4>全部窗口 <small>按口碑排序</small></h4>${ws.map(winLine).join('')}`}}
V.map=()=>{const d=drawerBody();
  return `<div class="mapwrap">${mapSvg()}
   <div class="legend"><span><i style="background:var(--good)"></i>空闲</span><span><i style="background:var(--warn)"></i>适中</span><span><i style="background:var(--bad)"></i>拥挤</span></div>
   <div class="drawer" id="drawer"><div class="dhead"><i class="grip"></i>${d.head}</div><div class="dbody">${d.body}</div></div></div>`};
V.canteen=id=>{if(CANTEENS[id]){S.map.sel=id;if(S.map.snap==='peek')S.map.snap='half'}return V.map()};
function initDrawer(){
  const el=document.getElementById('drawer');if(!el)return;
  const H=el.parentElement.clientHeight,snaps={peek:H-132,half:Math.round(H*.44),full:28};
  el.style.height=H+'px';
  const body=el.querySelector('.dbody'),head=el.querySelector('.dhead');
  const set=(n,anim)=>{S.map.snap=n;el.style.transition=anim?'transform .3s cubic-bezier(.2,.8,.2,1)':'none';el.style.transform=`translateY(${snaps[n]}px)`;body.style.height=Math.max(0,H-snaps[n]-head.offsetHeight)+'px'};
  set(S.map.snap,false);
  let sy=null,st=0,moved=false,y=0;
  head.addEventListener('pointerdown',e=>{if(e.target.closest('[data-act]'))return;sy=e.clientY;st=snaps[S.map.snap];moved=false;y=st;try{head.setPointerCapture(e.pointerId)}catch(_){};el.style.transition='none'});
  head.addEventListener('pointermove',e=>{if(sy==null)return;if(Math.abs(e.clientY-sy)>4)moved=true;y=Math.min(snaps.peek,Math.max(snaps.full,st+e.clientY-sy));el.style.transform=`translateY(${y}px)`;body.style.height=Math.max(0,H-y-head.offsetHeight)+'px'});
  const up=()=>{if(sy==null)return;sy=null;
    if(!moved){set(S.map.snap==='peek'?'half':S.map.snap==='half'?'full':'peek',true);return}
    set(Object.entries(snaps).sort((a,b)=>Math.abs(a[1]-y)-Math.abs(b[1]-y))[0][0],true)};
  head.addEventListener('pointerup',up);head.addEventListener('pointercancel',up);
}

/* ================= 榜单 / 窗口 / 菜品 / 搜索 / 我的 ================= */
function winCard(w){const st=winStat(w),c=CANTEENS[w.c],ds=winDishes(w).sort((a,b)=>dishStat(a).avg-dishStat(b).avg);
  return `<a class="badw" href="#/win/${w.id}"><div class="bph">${ds.slice(0,2).map(d=>`<div>${pic(d)}<span>${d.name} ${dishStat(d).avg.toFixed(1)}</span></div>`).join('')}</div>
   <div class="binfo"><h3>${c.name} · ${w.name}<b>${st.avg.toFixed(1)}分</b></h3><div class="tg">${winReasons(w).map(t=>`<em class="r">${t}</em>`).join('')}</div>${w.trend?`<p class="trend">📉 ${w.trend}</p>`:''}<p class="l3">${w.floor} · ${st.n} 人评价</p></div></a>`}
V.rank=()=>{
  const red=DISHES.slice().sort((a,b)=>dishStat(b).avg-dishStat(a).avg).slice(0,10);
  const black=Object.values(WIN).filter(isBadWin).sort((a,b)=>winStat(a).avg-winStat(b).avg);
  const lowD=DISHES.slice().sort((a,b)=>dishStat(a).avg-dishStat(b).avg).slice(0,4);
  return `<div class="tabs"><button class="${S.rank==='red'?'on':''}" data-act="set" data-k="rank" data-v="red">🏆 红榜 · 必吃</button><button class="${S.rank==='black'?'on':''}" data-act="set" data-k="rank" data-v="black">💣 黑榜 · 避雷</button></div>
  ${S.rank==='red'?`<section class="card mod"><div class="modh"><h2>全校必吃 TOP 10</h2><span class="sub">你的评价会实时计入</span></div><div class="rows grid2">${red.map((d,i)=>dishRow(d,{rank:i+1})).join('')}</div></section>`
  :`<section class="card mod badmod"><div class="modh"><h2>避雷窗口</h2><span class="sub">综合评分低于 3.3</span></div><div class="bads">${black.map(winCard).join('')||'<div class="empty">目前没有上黑榜的窗口 🎉</div>'}</div></section>
    <section class="card mod"><div class="modh"><h2>评分最低的菜</h2></div><div class="rows grid2">${lowD.map(d=>dishRow(d)).join('')}</div></section>`}`};
V.win=id=>{const w=WIN[id];if(!w)return V.home();const c=CANTEENS[w.c],st=winStat(w),bad=isBadWin(w);
  return `<div class="crumb"><a href="#/canteen/${c.id}">${c.name}</a> / ${w.name}</div>
  <section class="card mod"><div class="dtitle"><div><h1>${w.name}</h1><div class="l3"><a href="#/canteen/${c.id}" class="or">${c.name} · ${w.floor} ›</a></div></div><b class="big ${rc(st.avg)}">${st.avg.toFixed(1)}</b></div>
   <div class="stat3"><div><b>${st.n}</b><span>累计评价</span></div><div><b>${queue(w)} 分钟</b><span>当前排队</span></div><div><b>${winDishes(w).length}</b><span>在售菜品</span></div></div>
   ${bad?`<div class="dwarn">⚠️ 该窗口在黑榜上：${winReasons(w).join('、')}${w.trend?' · 📉 '+w.trend:''}</div>`:`<div class="tg" style="margin-top:10px">${w.tags.map(t=>`<em class="o">${t}</em>`).join('')}</div>`}</section>
  <section class="card mod"><div class="modh"><h2>菜品</h2></div><div class="rows grid2">${winDishes(w).sort((a,b)=>dishStat(b).avg-dishStat(a).avg).map(d=>dishRow(d)).join('')}</div></section>`};
V.dish=id=>{const d=DMAP[id];if(!d)return V.home();const w=WIN[d.w],c=CANTEENS[w.c],st=dishStat(d),rs=reviewsOf(d),want=myWants().includes(d.id);
  const tagCount={};rs.forEach(r=>r.tags.forEach(t=>tagCount[t]=(tagCount[t]||0)+1));
  return `<div class="crumb"><a href="#/canteen/${c.id}">${c.name}</a> / <a href="#/win/${w.id}">${w.name}</a> / ${d.name}</div>
  <div class="detail"><div>
   <section class="card nop"><div class="bigph">${pic(d)}</div><div class="pad">
    <div class="dtitle"><div><h1>${d.name}</h1><div class="l3"><a href="#/win/${w.id}" class="or">${c.name} · ${w.name} · ${w.floor} ›</a></div></div><div class="price big"><small>¥</small>${d.price}</div></div>
    <div class="tg" style="margin-top:8px">${d.newDays?'<em class="g">新品 · 第 '+d.newDays+' 天</em>':''}${isBadWin(w)?'<em class="r">所在窗口在黑榜</em>':''}${d.tags.map(t=>`<em>${t}</em>`).join('')}</div>
    <div class="stat3"><div><b class="sc ${rc(st.avg)}">${st.avg.toFixed(1)}</b><span>${st.n} 人评价</span></div><div><b>${queue(w)} 分钟</b><span>当前排队</span></div><div><b>${d.meals.split('').map(m=>m).join('·')}</b><span>供应餐段</span></div></div>
    ${Object.keys(tagCount).length?`<div class="tg" style="margin-top:10px">${Object.entries(tagCount).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<em class="${BAD_TAGS.includes(t)?'r':'o'}">${t} ${n}</em>`).join('')}</div>`:''}
    <button class="btn ${want?'':'ghost'} block" style="margin-top:14px" data-act="want" data-id="${d.id}">${want?'✓ 已加入想吃清单':'＋ 加入想吃清单'}</button></div>
   </section>
   <section class="card mod"><div class="modh"><h2>写评价</h2><span class="sub">吃过就说一句，帮同学避雷</span></div>
    <div class="pick" id="pick">${[1,2,3,4,5].map(i=>`<span data-act="star" data-v="${i}" class="${S.draft.rate>=i?'on':''}">★</span>`).join('')}</div>
    <div class="rtags">${GOOD_TAGS.concat(BAD_TAGS).map(t=>`<button class="pill ${S.draft.tags.includes(t)?'on':''}" data-act="rtag" data-v="${t}">${t}</button>`).join('')}</div>
    <textarea id="rtext" placeholder="味道、分量、排队情况……随便说说"></textarea>
    <button class="btn block" data-act="submit" data-id="${d.id}">发布评价</button>
   </section></div>
   <section class="card mod"><div class="modh"><h2>同学评价</h2><span class="sub">${rs.length} 条精选</span></div>${rs.map(r=>`<div class="rv"><div class="u">${ava(r.user||'我')}<b>${r.mine?'我':r.user}</b><span>${r.time}</span></div><div>${stars(r.rate)} ${r.tags.map(t=>`<em class="tgi ${BAD_TAGS.includes(t)?'r':''}">${t}</em>`).join('')}</div><p>${esc(r.text)}</p></div>`).join('')}</section>
  </div>`};
function searchResults(){const q=S.q.trim();if(!q)return `<div class="empty">试试搜：拉面、叉烧、米线、一食堂</div>`;
  const l=DISHES.filter(d=>{const w=WIN[d.w];return (d.name+w.name+CANTEENS[w.c].name+d.tags.join('')).includes(q)}).sort((a,b)=>dishStat(b).avg-dishStat(a).avg);
  return l.length?l.map(d=>dishRow(d)).join(''):`<div class="empty">没有找到“${esc(q)}”相关的菜</div>`}
V.search=()=>`<div class="search real"><span>🔍</span><input id="q" placeholder="搜菜品、窗口、食堂" value="${esc(S.q)}" autocomplete="off"></div>
  <section class="card mod"><div class="rows grid2" id="sres">${searchResults()}</div></section>`;
V.me=()=>{const rv=myReviews(),ws=myWants().map(i=>DMAP[i]).filter(Boolean);
  return `<section class="card me"><div class="avab">🧑‍🎓</div><div><h2>同学你好</h2><div class="l3">已写 ${rv.length} 条评价 · 想吃 ${ws.length} 道菜</div></div></section>
  <section class="card mod"><div class="modh"><h2>想吃清单</h2><span class="sub">${ws.length} 道</span></div><div class="rows grid2">${ws.length?ws.map(d=>dishRow(d)).join(''):'<div class="empty">还没有想吃的菜，去<a href="#/menu" class="or">找菜</a>点 ＋ 加进来</div>'}</div></section>
  <section class="card mod"><div class="modh"><h2>我的评价</h2>${rv.length?'<button class="lnk" data-act="clear">清空演示数据</button>':''}</div>${rv.length?rv.map(r=>`<a class="rv" href="#/dish/${r.dish}"><div class="u"><b>${DMAP[r.dish]?.name||''}</b><span>${r.time}</span></div><div>${stars(r.rate)} ${r.tags.map(t=>`<em class="tgi">${t}</em>`).join('')}</div><p>${esc(r.text)}</p></a>`).join(''):'<div class="empty">吃过的菜评一句，榜单会实时变化</div>'}</section>
  <a class="card nearby" href="#/about"><div><b>📐 产品设计思路</b><p>痛点、功能取舍与后续规划</p></div><span class="lnk">›</span></a>`};
V.about=()=>`<section class="card about">
  <h2>一、要解决的问题</h2>
  <p>大学生每天两到三次面对「食堂吃什么」。信息其实都在同学嘴里，但没有沉淀下来，于是：</p>
  <ul><li><b>决策成本高</b>：站在食堂门口转两圈，最后还是吃老三样。</li><li><b>踩雷靠运气</b>：哪个窗口手抖、哪个窗口菜是凉的，只能自己踩过才知道。</li><li><b>新菜没人知道</b>：窗口上了新品，没有渠道触达，也没人敢第一个吃。</li><li><b>排队不可见</b>：走到了才发现要排 15 分钟，下午还有课。</li></ul>
  <h2>二、核心设计判断</h2>
  <table><tr><th>判断</th><th>对应设计</th></tr>
  <tr><td>学生要的是「答案」而不是「列表」</td><td>首页第一个模块就是带理由的 3 个推荐，筛选压缩成一行下拉；再加「帮我选一个」兜底。</td></tr>
  <tr><td>避雷和推荐同等重要</td><td>「今日避雷」紧跟推荐，带菜品照片、差评原因、同学原话和趋势；推荐里自动排除黑榜窗口。</td></tr>
  <tr><td>最小决策单位是「窗口」而不是「食堂」</td><td>数据结构为 食堂 → 窗口 → 菜品，避雷以窗口为粒度。</td></tr>
  <tr><td>学生熟悉外卖和点评的交互</td><td>「找菜」沿用外卖点餐的 顶部维度 + 左侧栏 + 右侧列表；首页下半部分是点评式双列信息流。</td></tr>
  <tr><td>去哪个食堂取决于距离和拥挤度</td><td>「食堂」是一张校园地图，标记直接显示拥挤度，底部抽屉上拉看窗口口碑。</td></tr>
  <tr><td>评价要 10 秒内写完</td><td>星级 + 一键标签为主，文字可选；发布后评分、榜单和信息流立即变化。</td></tr></table>
  <h2>三、功能结构</h2>
  <ul><li><b>首页</b>：快捷入口、推荐、今日避雷、本周新品、信息流。</li><li><b>找菜</b>：按餐段 / 食堂 / 口味 / 预算 / 场景浏览，＋ 加入想吃清单。</li><li><b>食堂</b>：地图 + 抽屉，看拥挤度、步行时间、窗口口碑。</li><li><b>榜单</b>：红榜必吃菜、黑榜避雷窗口。</li><li><b>我的</b>：想吃清单、我的评价。</li></ul>
  <h2>四、推荐逻辑（当前版本）</h2>
  <p>得分 = 菜品评分 × 权重 − 排队时间惩罚（勾选「不排队」后加重）＋ 新品加成 ＋ 少量随机扰动（用于「换一批」）。命中黑榜窗口的菜直接过滤。每条推荐都把依据写成一句人话，让推荐可解释。</p>
  <h2>五、后续规划</h2>
  <ul><li>接入校园卡消费流水，用真实客流替代估算的排队时间。</li><li>评价带图、「今日实拍」，解决菜品图与实物不符。</li><li>AI 一句话点餐（「15 块以内、想吃辣、不排队」）与评价自动摘要。</li><li>食堂经营方后台：差评原因看板，形成反馈闭环。</li><li>防刷机制：校园身份认证 + 消费后才可评价。</li></ul>
  <h2>六、关于这个演示</h2>
  <p>当前为产品雏形，菜品、评价和地图都是模拟数据；你写的评价保存在本机浏览器，网页版与小程序版共享。全程使用 AI Coding 工具（Claude Code）完成设计、开发与部署。菜品照片来自 Wikimedia Commons 的自由许可图片，仅作示意，<a href="credits.html" class="or">查看图片来源</a>。</p>
</section>`;

/* ================= 路由与渲染 ================= */
const IC={'':'<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',menu:'<path d="M4 6h16M4 12h16M4 18h10"/>',map:'<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',rank:'<path d="M5 20V10M12 20V4M19 20v-7"/>',me:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'};
const TABS=[['','首页'],['menu','找菜'],['map','食堂'],['rank','榜单'],['me','我的']];
const TITLES={'':'',menu:'找菜',map:'食堂地图',rank:'红黑榜',me:'我的',about:'设计思路',canteen:'食堂地图',win:'窗口详情',dish:'菜品详情',search:'搜索'};
const FULL=['menu','map','canteen'];
function route(){const p=location.hash.replace(/^#\/?/,'').split('/');return{name:p[0]||'',id:+p[1]||0}}
let lastRoute='';
function render(keep){
  const r=route(),key=r.name+'/'+r.id;
  if(r.name==='new'){S.dim='special';S.dimv.special='new';location.replace('#/menu');return}
  if(r.name==='canteens'){location.replace('#/map');return}
  if(key!==lastRoute)S.draft={rate:0,tags:[]};
  const fn=V[r.name||'home']||V.home,app=document.getElementById('app');
  const y=window.scrollY,ml=app.querySelector('.mlist')?.scrollTop||0,db=app.querySelector('.dbody')?.scrollTop||0;
  app.className=FULL.includes(r.name)?'full':'';
  app.innerHTML=fn(r.id);
  const tabOf={canteen:'map',win:'map',dish:'',about:'me',search:''}[r.name]??r.name;
  document.getElementById('wnav').innerHTML=TABS.map(t=>`<a href="#/${t[0]}" class="${tabOf===t[0]&&r.name!=='about'?'on':''}">${t[1]}</a>`).join('')+`<a href="#/about" class="${r.name==='about'?'on':''}">设计思路</a>`;
  document.getElementById('tabbar').innerHTML=TABS.map(t=>`<a href="#/${t[0]}" class="${tabOf===t[0]?'on':''}"><svg viewBox="0 0 24 24">${IC[t[0]]}</svg>${t[1]}</a>`).join('');
  const home=r.name==='';
  document.getElementById('mptitle').innerHTML=home?'<span class="locn">📍 东区校园 <i>▾</i></span>':TITLES[r.name]||'食堂吃什么';
  document.getElementById('mpnav').classList.toggle('home',home);
  document.getElementById('mpback').style.display=TABS.some(t=>t[0]===r.name)?'none':'';
  const same=keep&&key===lastRoute;
  window.scrollTo(0,same?y:0);
  if(same){const a=app.querySelector('.mlist');if(a)a.scrollTop=ml;const b=app.querySelector('.dbody');if(b)b.scrollTop=db}
  lastRoute=key;
  initDrawer();
  if(r.name==='search'){const q=document.getElementById('q');q.focus();q.setSelectionRange(q.value.length,q.value.length);q.oninput=()=>{S.q=q.value;document.getElementById('sres').innerHTML=searchResults()}}
}
function toast(t){const e=document.getElementById('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}

function lucky(){
  const list=candidates();if(!list.length){toast('当前条件下没有可选的菜');return}
  document.querySelectorAll('.modal').forEach(m=>m.remove());
  const m=document.createElement('div');m.className='modal';m.innerHTML='<div class="box"><div class="em" id="lem"></div><h3 id="lname">正在帮你选…</h3><div class="l3" id="lmeta">&nbsp;</div><div id="lbtn" style="margin-top:16px"></div></div>';
  document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m||e.target.closest('[data-x]'))m.remove()});
  let i=0;const pickD=list[Math.floor(Math.random()*list.length)];
  const tm=setInterval(()=>{const d=i<14?list[Math.floor(Math.random()*list.length)]:pickD;m.querySelector('#lem').innerHTML=pic(d);m.querySelector('#lname').textContent=d.name;
    if(++i>14){clearInterval(tm);const w=WIN[d.w];m.querySelector('#lmeta').textContent=`${CANTEENS[w.c].name} · ${w.name} · ¥${d.price} · ★${dishStat(d).avg.toFixed(1)}`;
      m.querySelector('#lbtn').innerHTML=`<a class="btn block" data-x href="#/dish/${d.id}">就吃这个</a><button class="btn ghost block" style="margin-top:8px" data-x data-act="lucky">再选一次</button>`}},90);
}
function sheet(k){
  const m=document.createElement('div');m.className='modal sheet';
  m.innerHTML=`<div class="box"><h3>选择${FNAME[k]}</h3><div class="opts">${FOPT[k].map(o=>`<button class="${S[k]===o[0]?'on':''}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div><button class="cancel">取消</button></div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{const b=e.target.closest('.opts button');if(b){S[k]=k==='budget'?+b.dataset.v:b.dataset.v;m.remove();render(true);return}if(e.target===m||e.target.closest('.cancel'))m.remove()});
}

/* ---------- iPhone 真机演示 ---------- */
function fitPhone(){const s=Math.min(1,(innerHeight-24)/868,(innerWidth-16)/414);document.getElementById('phoneWrap').style.transform=`scale(${s})`}
function openPhone(){document.getElementById('phoneSlot').innerHTML='<iframe title="小程序版演示" src="'+location.pathname+'?mp=1&v='+BUILD+'#/"></iframe>';fitPhone();document.getElementById('phoneMask').classList.add('show');document.body.style.overflow='hidden'}
function closePhone(){const k=document.getElementById('phoneMask');if(!k.classList.contains('show'))return;k.classList.remove('show');document.getElementById('phoneSlot').innerHTML='';document.body.style.overflow='';render(true)}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,v=el.dataset.v;
  if(a==='set'){S[el.dataset.k]=v;if(el.tagName!=='A')render(true)}
  else if(a==='toggleQ'){S.noQueue=!S.noQueue;render(true)}
  else if(a==='sheet'){sheet(el.dataset.k)}
  else if(a==='shuffle'){S.seed++;render(true);toast('已换一批')}
  else if(a==='lucky'){lucky()}
  else if(a==='king'){const t=el.dataset.a;
    if(t==='lucky')lucky();
    else if(t==='menu'){S.dim=el.dataset.k;S.dimv[S.dim]=S.dim==='budget'?+v:v;location.hash='#/menu'}
    else{if(el.dataset.k)S.rank=el.dataset.k;location.hash=t}}
  else if(a==='dim'){S.dim=v;render()}
  else if(a==='dimv'){S.dimv[S.dim]=(S.dim==='budget'||S.dim==='canteen')?+v:v;render();}
  else if(a==='pin'){S.map.sel=+el.dataset.id;if(S.map.snap==='peek')S.map.snap='half';if(route().name==='canteen')history.replaceState(null,'','#/map');render()}
  else if(a==='unpin'){S.map.sel=0;S.map.snap='peek';if(route().name==='canteen')history.replaceState(null,'','#/map');render()}
  else if(a==='back'){history.length>1?history.back():location.hash='#/'}
  else if(a==='phone'){openPhone()}
  else if(a==='phoneClose'){closePhone()}
  else if(a==='like'){e.preventDefault();const l=myLikes(),k=el.dataset.k,i=l.indexOf(k);i<0?l.push(k):l.splice(i,1);LS.set('cr_likes',l);render(true)}
  else if(a==='star'){S.draft.rate=+v;document.querySelectorAll('#pick span').forEach(s=>s.classList.toggle('on',+s.dataset.v<=S.draft.rate))}
  else if(a==='rtag'){const i=S.draft.tags.indexOf(v);i<0?S.draft.tags.push(v):S.draft.tags.splice(i,1);el.classList.toggle('on')}
  else if(a==='want'){e.preventDefault();const id=+el.dataset.id,w=myWants(),i=w.indexOf(id);i<0?w.push(id):w.splice(i,1);LS.set('cr_wants',w);render(true);toast(i<0?'已加入想吃清单':'已移出想吃清单')}
  else if(a==='submit'){
    if(!S.draft.rate){toast('先点星星打个分吧');return}
    const text=document.getElementById('rtext').value.trim()||(S.draft.rate>=4?'好吃，推荐':S.draft.rate<=2?'踩雷了，不推荐':'一般般');
    const rv=myReviews();rv.unshift({dish:+el.dataset.id,rate:S.draft.rate,tags:S.draft.tags.slice(),text,time:'刚刚',mine:true,user:'我'});LS.set('cr_reviews',rv);
    S.draft={rate:0,tags:[]};render(true);toast('评价已发布，评分和榜单已更新')}
  else if(a==='clear'){LS.set('cr_reviews',[]);LS.set('cr_wants',[]);render();toast('已清空')}
});
window.addEventListener('hashchange',()=>render());
window.addEventListener('resize',()=>{fitPhone();initDrawer()});
window.addEventListener('storage',()=>render(true));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePhone()});
function tick(){const d=new Date();document.getElementById('clock').textContent=d.getHours()+':'+String(d.getMinutes()).padStart(2,'0')}
tick();setInterval(tick,20000);
render();
