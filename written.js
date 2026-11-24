// A typed answer may be correct even when it uses phrasing outside the alias list.
const normal = s => s.normalize('NFC').toLocaleLowerCase('hu').replace(/[.,!?;:()„”"]/g,' ').replace(/[‐‑–—-]/g,' ').trim().replace(/\s+/g,' ');
export function writingPractice({holder, c, chapters, cards, save, persist, esc, hu, link, shuffle, paper}) {
  const final=!c, n=final?12:6, key=(paper?'paper-':'typed-')+(c?.slug||'final');
  const pool=cards.filter(q=>(!c||q.chapter===c.id)&&(paper||Array.isArray(q.writtenAliases)));
  const byId=new Map(pool.map(q=>[q.id,q]));
  const back=final?link('#/','← Все темы','breadcrumb'):'';
  const title=paper?'Письмо от руки':final?'Итоговая письменная работа':'Письменный тест по теме';
  let state=save.sessions[key];
  const valid=s=>s && Array.isArray(s.ids) && s.ids.length===n && new Set(s.ids).size===n && s.ids.every(id=>byId.has(id)) && Array.isArray(s.entries) && s.entries.length===n && s.entries.every(x=>typeof x==='string') && Number.isInteger(s.at) && s.at>=0 && s.at<=n && s.overrides && typeof s.overrides==='object';
  const remember=()=>{save.sessions[key]=state;persist();};
  const btn=(id,label,primary=false)=>'<button type="button" id="'+id+'" class="'+(primary?'primary':'')+'">'+label+'</button>';
  const el=id=>holder.querySelector('#'+id);
  const accents='<details class="accent-help"><summary>Ввести венгерскую букву</summary><div class="actions">'+[...'áéíóöőúüű'].map(ch=>'<button type="button" data-letter="'+ch+'">'+hu(ch)+'</button>').join('')+'</div></details>';
  const bind=(id,fn)=>{const target=el(id);if(target)target.onclick=fn;};
  function begin(){
    const qs=final?shuffle(chapters.flatMap(ch=>shuffle(pool.filter(q=>q.chapter===ch.id)).slice(0,2))):shuffle(pool).slice(0,n);
    state={ids:qs.map(q=>q.id),entries:qs.map(()=>''),at:0,locked:false,overrides:{},showKey:false};
    remember();draw();
  }
  function question(i){return byId.get(state.ids[i]);}
  function auto(i){const q=question(i);return [q.answer,...q.writtenAliases].some(x=>normal(x)===normal(state.entries[i]));}
  function reviewItem(i){
    const q=question(i),recognized=auto(i);
    return '<div class="passage"><h3>'+hu(q.hu)+'</h3><p>'+esc(q.ru)+'</p><p>Ваш ответ: '+hu(state.entries[i])+'</p><p>Образец: <strong>'+hu(q.answer)+'</strong><br>'+esc(q.translation)+'</p><p>'+(recognized?'✓ Ответ совпал с образцом.':state.overrides[i]?'✓ Вы засчитали свой вариант.':'Проверьте смысл: формулировка отличается от образца.')+'</p>'+(!recognized?btn('override-'+i,state.overrides[i]?'Отменить самозачёт':'Мой ответ верен по смыслу'):'')+'</div>';
  }
  function wireOverride(i){bind('override-'+i,()=>{state.overrides[i]=!state.overrides[i];remember();draw();});}
  function results(){
    const matched=state.ids.filter((_,i)=>auto(i)).length;
    const checked=state.ids.filter((_,i)=>!auto(i)&&state.overrides[i]).length;
    holder.innerHTML=back+'<section class="pane quizbox"><p class="eyebrow">'+title+'</p><h2>Результат: '+(matched+checked)+' из '+n+'</h2><p>Автоматически засчитано: '+matched+'. По вашей самопроверке: '+checked+'.</p>'+state.ids.map((_,i)=>reviewItem(i)).join('')+'<div class="actions">'+btn('again-written','Новый вариант',true)+link('#/','К темам','button')+'</div></section>';
    state.ids.forEach((_,i)=>wireOverride(i));bind('again-written',begin);
  }
  function sheet(){
    holder.innerHTML=back+'<section class="pane"><p class="eyebrow">'+title+'</p><h2>Бланк для письма от руки</h2><p>Распечатайте бланк или запишите ответы в тетради по номерам. Заполняйте по-венгерски. После работы откройте ключ и сравните ответы.</p><div class="actions">'+btn('print-sheet','Распечатать бланк',true)+btn('sheet-key',state.showKey?'Скрыть ключ':'Показать ключ для проверки')+btn('new-sheet','Новый бланк')+'</div><div class="paper-sheet"><h2 lang="hu">Magyar kulturális ismeretek</h2><p lang="hu">'+(c?esc(c.hu):'Összesítő írásbeli gyakorlás')+' · Név: ____________________</p>'+state.ids.map((_,i)=>'<section class="paper-q"><h3>'+hu((i+1)+'. '+question(i).hu)+'</h3><div class="ruled" aria-hidden="true"></div></section>').join('')+'</div>'+(state.showKey?'<div class="paper-key"><h2>Ключ к этому бланку</h2>'+state.ids.map((_,i)=>'<div class="passage"><strong>'+(i+1)+'. '+hu(question(i).answer)+'</strong><p>'+esc(question(i).translation)+'</p></div>').join('')+'</div>':'')+'</section>';
    bind('print-sheet',()=>window.print());bind('sheet-key',()=>{state.showKey=!state.showKey;remember();draw();if(state.showKey)holder.querySelector('.paper-key').scrollIntoView();});bind('new-sheet',begin);
  }
  function draw(){
    if(paper){sheet();return;} if(state.at===n){results();return;}
    const i=state.at,q=question(i);
    holder.innerHTML=back+'<section class="pane quizbox"><p class="eyebrow">'+title+' · '+(i+1)+' / '+n+'</p><progress max="'+n+'" value="'+i+'" aria-label="Отвечено"></progress><h2>'+hu(q.hu)+'</h2>'+(!final?'<details><summary>Перевод вопроса</summary><p>'+esc(q.ru)+'</p></details>':'')+(state.locked?'<div aria-live="polite">'+reviewItem(i)+'</div>'+btn('typed-next',i+1===n?'Показать результат':'Следующий вопрос →',true):'<form id="typed-form"><p><label for="typed-input">Напишите ответ по-венгерски.</label></p><textarea required maxlength="1000" lang="hu" autocapitalize="sentences" autocomplete="off" spellcheck="false" rows="2" id="typed-input">'+esc(state.entries[i])+'</textarea>'+accents+'<div class="actions"><button class="primary" type="submit" id="typed-send">'+(final?(i+1===n?'Сдать работу':'Сохранить ответ и продолжить'):'Проверить ответ')+'</button></div></form>')+'</section>';
    function advance(){state.at++;state.locked=false;remember();draw();const focus=el('typed-input')||holder.querySelector('h2');if(focus){focus.tabIndex=focus.tagName==='TEXTAREA'?0:-1;focus.focus();}}
    if(state.locked){wireOverride(i);bind('typed-next',advance);return;}
    const input=el('typed-input'),send=el('typed-send');
    send.disabled=!input.value.trim();input.oninput=()=>{state.entries[i]=input.value;send.disabled=!input.value.trim();remember();};
    holder.querySelectorAll('[data-letter]').forEach(key=>key.onclick=()=>{
      if(input.value.length-input.selectionEnd+input.selectionStart>=input.maxLength)return;
      input.setRangeText(key.dataset.letter,input.selectionStart,input.selectionEnd,'end');
      input.focus();input.oninput();
    });
    el('typed-form').onsubmit=e=>{e.preventDefault();if(!input.value.trim())return;state.entries[i]=input.value.trim();if(final)advance();else{state.locked=true;remember();draw();el('typed-next').focus();}};
  }
  if(valid(state))draw();else begin();
}
