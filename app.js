import {writingPractice} from './written.js?v=20261124-2';
const app = document.querySelector('#app');
const PDF = 'https://kormanyhivatalok.hu/sites/default/files/2026-09/kiv_segedanyag_bfkh_honlapra_aug.pdf';
const INFO = 'https://kormanyhivatalok.hu/sites/default/files/2025-01/magyar-kulturalis-ismereti-vizsga-tajekoztato.pdf';
const storageKey = 'magyar-kulturalis-ismeretek.v1';
const tabs = {read:'Урок', words:'Словарь', cards:'Карточки', test:'Тест по теме', written:'Письменный тест', paper:'Письмо от руки'};
let course, cards, save = {}, storageOK = true;
try { save = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { save = {}; }
if (typeof save !== 'object' || Array.isArray(save)) save = {};
for (const key of ['best', 'sessions']) {
  if (!save[key] || typeof save[key] !== 'object' || Array.isArray(save[key])) save[key] = {};
}
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify(save)); }
  catch { storageOK = false; }
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hu = text => '<span lang="hu">' + escape(text) + '</span>';
const link = (url, label, cls='') => '<a class="'+cls+'" href="'+escape(url)+'">'+label+'</a>';
const button = (id,label,cls='') => '<button type="button" id="'+id+'" class="'+cls+'">'+label+'</button>';
const get = id => document.getElementById(id);
const base = c => '#/tema/'+c.slug+'/';
const back = () => link('#/','← Все темы','breadcrumb');
const best = id => typeof save.best?.[id] === 'number' ? save.best[id]+'%' : '—';
function layout(html) {
  app.innerHTML = html;
  if (!storageOK) app.insertAdjacentHTML('afterbegin','<p role="status">Сохранение на устройстве недоступно. Курс работает до закрытия страницы.</p>');
}
function home() {
  layout(get('home').innerHTML);
  const c = course.chapters.find(x=>x.slug===save.last) || course.chapters[0];
  const start = get('start');
  start.href = base(c)+'read';
  start.textContent = save.last ? 'Продолжить тему →' : 'Начать первую тему →';
  const total = course.chapters.filter(c=>{
    const typed=save.sessions['typed-'+c.slug];
    return Number.isFinite(save.best[c.slug]) || (typed?.at===6 && typed.ids?.length===6);
  }).length;
  app.insertAdjacentHTML('beforeend','<div class="section-head"><h2>Темы курса</h2><span class="muted">Темы с завершённым тестом: '+total+' из 6</span></div><div class="grid">'+course.chapters.map(c=>link(base(c)+'read','<span class="num">0'+c.id+'</span><span><strong>'+hu(c.hu)+'</strong><small>'+escape(c.ru)+'</small></span><span class="next" aria-hidden="true">›</span>','topic')).join('')+'</div><section class="pane final-panel"><h2>Итоговый тест</h2><p>12 вопросов на венгерском: по два из каждой темы.</p>'+link('#/final','Тест с выбором ответа →','button')+formats(null)+'</section>');
}
function topic(c,tab) {
  save.last=c.slug; persist();
  layout(back()+'<p class="eyebrow">Тема '+c.id+' из 6</p><h1 class="page-title">'+hu(c.hu)+'</h1><p>'+escape(c.ru)+'</p><nav class="tabs" aria-label="Разделы темы">'+Object.entries(tabs).map(([k,title])=>'<a '+(k===tab?'aria-current="page" ':'')+'href="'+base(c)+k+'">'+title+'</a>').join('')+'</nav><div id="panel"></div>');
  const panel=get('panel');
  if(tab==='read') {
    panel.innerHTML='<div class="switches"><label><input id="ru" type="checkbox" '+(save.ru!==false?'checked':'')+'> Перевод на русский</label><label><input id="a2" type="checkbox" '+(save.a2!==false?'checked':'')+'> Подробности A2</label></div>'+c.units.map(u=>'<article class="pane"><h3>'+hu(u.hu)+'</h3><p class="ru translate">'+escape(u.ru)+'</p>'+u.lines.map(l=>'<div class="passage" data-level="'+l.level+'"><span class="level">'+l.level+'</span><p class="hu">'+hu(l.hu)+'</p><p class="ru translate">'+escape(l.ru)+'</p></div>').join('')+link(PDF+'#page='+u.page,'Пособие, с. '+u.page,'minor')+'</article>').join('')+'<div class="actions">'+link(base(c)+'words','Повторить слова','button')+link(base(c)+'test','Проверить себя →','button primary')+'</div>';
    const apply=()=>{panel.querySelectorAll('.translate').forEach(x=>x.hidden=!get('ru').checked);panel.querySelectorAll('[data-level="A2"]').forEach(x=>x.hidden=!get('a2').checked);};
    for(const key of ['ru','a2']) get(key).onchange=()=>{save[key]=get(key).checked;persist();apply();};
    apply();
  } else if(tab==='words'){
    panel.innerHTML='<div class="pane"><h2>Словарь темы</h2><table class="lex"><thead><tr><th lang="hu">Magyar</th><th>Русский</th></tr></thead><tbody>'+c.words.map(([h,r])=>'<tr><td>'+hu(h)+'</td><td>'+escape(r)+'</td></tr>').join('')+'</tbody></table></div>'+link(base(c)+'cards','К карточкам →','button primary');
  } else if(tab==='cards') flash(c);
  else if(tab==='written'||tab==='paper') written(c,tab==='paper');
  else quiz(c);
}
function flash(c) {
  const list=cards.filter(x=>x.chapter===c.id);
  const key='card-'+c.slug;
  let i=Number.isInteger(save[key])&&save[key]>=0&&save[key]<list.length?save[key]:0;
  function draw(){
    const q=list[i];
    get('panel').innerHTML='<div class="pane quizbox"><p class="eyebrow">Письменная практика · '+(i+1)+' / '+list.length+'</p><h2>'+hu(q.hu)+'</h2><details><summary>Перевод вопроса</summary><p>'+escape(q.ru)+'</p></details><p><label for="writing">Попробуйте ответить по-венгерски. Затем сравните с образцом.</label></p><textarea lang="hu" id="writing" rows="2"></textarea><div class="actions">'+button('show','Показать образец','primary')+'</div><div id="model" hidden class="feedback"><strong>Возможный ответ</strong><p>'+hu(q.answer)+'</p><p>'+escape(q.translation)+'</p><small>Допустимы другие верные формулировки.</small></div><div class="actions">'+button('prev','← Назад')+button('nextcard',i===list.length-1?'С начала ↺':'Дальше →')+'</div></div>'+link(base(c)+'test','К тесту по теме →','button');
    get('prev').disabled=i===0;
    get('show').onclick=()=>{get('model').hidden=false;get('show').hidden=true;};
    const go=j=>{i=j;save[key]=i;persist();draw();get('writing').focus();};
    get('prev').onclick=()=>go(i-1);get('nextcard').onclick=()=>go((i+1)%list.length);
  }
  draw();
}
function shuffled(values){
  const out=values.slice(); for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out;
}
function written(c,paper=false){
  writingPractice({holder:c?get('panel'):app,c,chapters:course.chapters,cards,save,persist,esc:escape,hu,link,shuffle:shuffled,paper});
}
function formats(c){
  const path=c?base(c):'#/final/';
  return '<div class="actions">'+link(path+'written','Написать ответы по-венгерски','button primary')+link(path+'paper','Бланк для письма от руки','button')+'</div>';
}
function quiz(c){
  const final=!c, id=c?.slug||'final', holder=c?get('panel'):app;
  const pool=cards.filter(q=>q.wrong && (final||q.chapter===c.id));
  const valid=new Map(pool.map(q=>[q.id,q]));
  const n=final?12:Math.min(8,pool.length);
  let state=save.sessions[id];
  function validSession(s) {
    return s && Array.isArray(s.ids) && s.ids.length===n && new Set(s.ids).size===n && s.ids.every(k=>valid.has(k)) &&
      Array.isArray(s.picks) && s.picks.length<=n && s.picks.every((v,i)=>Number.isInteger(v)&&v>=0&&v<3) &&
      Array.isArray(s.orders) && s.orders.length===n && s.orders.every(o=>Array.isArray(o)&&[...o].sort().join(',')==='0,1,2') &&
      Number.isInteger(s.at) && s.at>=0 && s.at<=n && (s.at===s.picks.length || (!final&&s.at+1===s.picks.length));
  }
  if(!validSession(state))state=null;
  const question=k=>valid.get(k);
  const choices=q=>[q.answer,...q.wrong];
  function begin(){
    const set=final?shuffled(course.chapters.flatMap(ch=>shuffled(pool.filter(q=>q.chapter===ch.id)).slice(0,2))):shuffled(pool).slice(0,n);
    state={ids:set.map(x=>x.id),orders:set.map(()=>shuffled([0,1,2])),picks:[],at:0};save.sessions[id]=state;persist();draw();
  }
  function intro(){
    holder.innerHTML=(final?back():'')+'<section class="pane quizbox"><h2>'+(final?'Итоговый тест':'Тест по теме')+'</h2><p>'+(final?'12 вопросов на венгерском, по два из каждой темы. Выберите один ответ. Разбор появится в конце.':'Восемь вопросов. После каждого ответа вы увидите правильный вариант и его перевод.')+'</p><p class="muted">Тренировочная оценка: один балл за ответ. Лучший результат: '+best(id)+'.</p>'+button('begin','Начать тест с выбором ответа →','primary')+formats(c)+'</section>';
    get('begin').onclick=begin;
  }
  function review(){
    const correct=state.picks.filter(p=>p===0).length;
    const percent=Math.round(correct*100/n);save.best[id]=Math.max(save.best[id]||0,percent);persist();
    holder.innerHTML=(final?back():'')+'<section class="pane quizbox"><p class="eyebrow">Тест завершён</p><h2>'+correct+' из '+n+' · '+percent+'%</h2><p>Лучший результат на этом устройстве: '+best(id)+'.</p><div class="actions">'+button('again','Новый вариант','primary')+link(c&&c.id<6?base(course.chapters[c.id])+'read':final?'#/':'#/final',c&&c.id<6?'Следующая тема →':final?'К темам':'К итоговому тесту →','button')+'</div><h3>Разбор ответов</h3>'+state.ids.map((k,i)=>{const q=question(k),p=state.picks[i],ch=course.chapters[q.chapter-1];return '<div class="passage"><strong>'+(p===0?'✓ Верно':'✗ Ошибка')+'</strong><p>'+hu(q.hu)+'</p><small>'+escape(q.ru)+'</small>'+(p===0?'':'<p>Ваш ответ: '+hu(choices(q)[p])+'</p>')+'<p>Правильный ответ: <strong>'+hu(q.answer)+'</strong><br>'+escape(q.translation)+'</p>'+link(base(ch)+'read','Повторить тему '+ch.id,'minor')+'</div>';}).join('')+'</section>';
    get('again').onclick=begin;
  }
  function draw(){
    if(!state){intro();return;} if(state.at===n){review();return;}
    const i=state.at,q=question(state.ids[i]),answered=state.picks.length>i;
    holder.innerHTML=(final?back():'')+'<section class="pane quizbox"><p class="eyebrow">'+(final?'Итоговый тест':'Тест по теме')+' · '+(i+1)+' / '+n+'</p><progress max="'+n+'" value="'+i+'" aria-label="Завершённые вопросы"></progress><h2>'+hu(q.hu)+'</h2>'+(!final?'<details><summary>Перевод вопроса</summary><p>'+escape(q.ru)+'</p></details>':'')+'<div class="choices">'+state.orders[i].map(k=>'<button type="button" data-choice="'+k+'" '+(answered?'disabled':'')+' class="'+(answered?(k===0?'correct':k===state.picks[i]?'wrong':''):'')+'">'+hu(choices(q)[k])+'</button>').join('')+'</div><div id="message" aria-live="polite"></div></section>';
    function next(){state.at++;persist();draw();holder.querySelector('h2')?.scrollIntoView({block:'center'});}
    if(answered){get('message').innerHTML='<div class="feedback '+(state.picks[i]===0?'':'error')+'"><strong>'+(state.picks[i]===0?'Верно.':'Правильный ответ:')+'</strong> '+hu(q.answer)+'<br>'+escape(q.translation)+'</div>'+button('next',i+1===n?'Показать результат':'Следующий вопрос →','primary');get('next').onclick=next;}
    else holder.querySelectorAll('[data-choice]').forEach(el=>el.onclick=()=>{if(state.picks.length!==i)return;state.picks.push(Number(el.dataset.choice));if(final){next();}else{persist();draw();get('next').focus();}});
  }
  draw();
}
function sources(){
  layout(back()+'<h1 class="page-title">Материалы курса</h1><section class="pane"><h2>Как готовиться</h2><p>Сначала прочитайте короткие фразы A1. Затем включите A2, разберите подробности и закройте русский перевод. В карточках напишите ответ по-венгерски. В конце каждой темы пройдите тест. В письменном тесте ответ нужно ввести самостоятельно. Для письма от руки распечатайте чистый бланк или отвечайте в тетради. Ключ открывается отдельно.</p><p>По официальной памятке письменный экзамен проходит на венгерском языке: 12 вопросов за 60 минут, по два из каждой темы. Максимум — 30 баллов, проходной результат — 16. Здесь три тренировочных формата: выбор ответа, ввод ответа и бланк для письма от руки. В каждом итоговом варианте 12 вопросов без таймера. Электронные работы дают по одному тренировочному баллу за ответ.</p></section><section class="pane"><h2>Первоисточники</h2><p>Сверено 24 ноября 2026 г. Использованы учебные материалы Лайко Габора, его венгерско-русские банки вопросов и экзаменационные материалы Yana (184 учебных вопроса) и официальный учебный материал осени 2026 года. Вопросы курса служат для практики. Точные задания конкретного экзамена заранее неизвестны.</p><ul>'+[[PDF,'Официальное пособие, PDF'],[INFO,'Официальная памятка об экзамене'],['https://kormanyhivatalok.hu/kormanyhivatalok/budapest/megye/szervezet/jogi-es-koordinacios-foosztaly','Актуальные материалы организатора'],['https://njt.hu/jogszabaly/2011-4301-02-00','Основной закон Венгрии'],['https://kormany.hu/kormanyzat','Правительство и министерства'],['https://www.sandorpalota.hu/hu/baka-andras-magyarorszag-uj-koztarsasagi-elnoke','Сведения о главе государства']].map(([u,l])=>'<li>'+link(u,l)+'</li>').join('')+'</ul><p class="minor">Фото: '+link('https://commons.wikimedia.org/wiki/File:Hungarian_State_Opera_House(PDXdj).jpg','Hungarian State Opera House, PDXdj')+', '+link('https://creativecommons.org/licenses/by-sa/3.0/','CC BY-SA 3.0')+'. Версия из официального пособия, с. 47.</p></section>');
}
function render(){
  const [,route,slug,tab]=location.hash.replace(/^#/,'').split('/');
  const c=course.chapters.find(x=>x.slug===slug);
  if(route==='tema'&&c)topic(c,Object.hasOwn(tabs,tab)?tab:'read');
  else if(route==='final'){layout('');if(slug==='written'||slug==='paper')written(null,slug==='paper');else quiz(null);}
  else if(route==='sources')sources();
  else home();
  window.scrollTo(0,0);app.focus({preventScroll:true});
}
try {
  [course,cards]=await Promise.all(['course.json','cards.json'].map(async name=>{
    const url=new URL(name,import.meta.url);
    url.search=new URL(import.meta.url).search;
    const res=await fetch(url); if(!res.ok)throw Error(name); return res.json();
  }));
  window.addEventListener('hashchange',render);render();
} catch {
  layout('<p>Не удалось загрузить курс. Проверьте подключение и обновите страницу.</p>');
}
