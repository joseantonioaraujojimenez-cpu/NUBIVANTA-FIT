
'use strict';
// Generador sin servicios externos. Valores nutricionales aproximados.
const FIT_RECIPES=[
['Desayuno','Yogur natural con avena, plátano y nueces',480,25,61,16,'yogur natural, avena, plátano, nueces'],
['Desayuno','Tostadas con huevos, tomate y fruta',490,26,51,20,'pan integral, huevos, tomate, fruta'],
['Desayuno','Avena con leche y frutos rojos',440,20,70,11,'avena, leche, frutos rojos'],
['Desayuno','Pan integral con queso fresco y kiwi',430,24,52,13,'pan integral, queso fresco, kiwi'],
['Comida','Arroz con pollo y verduras',700,48,85,18,'arroz, pollo, verduras, aceite de oliva'],
['Comida','Lentejas con verduras y huevo',640,35,80,18,'lentejas, verduras, huevos, aceite de oliva'],
['Comida','Pasta integral con atún y tomate',680,43,86,16,'pasta integral, atún, tomate, aceite de oliva'],
['Comida','Patatas al horno con pavo',660,49,73,17,'patatas, pavo, verduras, aceite de oliva'],
['Comida','Garbanzos con quinoa y verduras',675,29,96,18,'garbanzos, quinoa, verduras, aceite de oliva'],
['Merienda','Yogur con fruta y almendras',320,17,34,14,'yogur natural, fruta, almendras'],
['Merienda','Bocadillo integral de pavo',340,25,40,9,'pan integral, pavo, tomate'],
['Merienda','Queso fresco con nueces y fruta',350,19,33,17,'queso fresco, nueces, fruta'],
['Cena','Tortilla con patatas y ensalada',610,32,56,26,'huevos, patatas, ensalada, aceite de oliva'],
['Cena','Merluza con arroz y verduras',600,40,74,15,'merluza, arroz, verduras, aceite de oliva'],
['Cena','Pollo al horno con boniato',630,46,66,18,'pollo, boniato, verduras, aceite de oliva'],
['Cena','Revuelto de champiñones y pan',580,32,57,23,'huevos, champiñones, pan integral, aceite de oliva'],
['Cena','Salmón con patatas y brócoli',660,41,58,29,'salmón, patatas, brócoli']
];
function fitMealDays(){var w=startWeek(selectedDate),out=[];for(var i=0;i<7;i++)out.push(isoAdd(w,i));return out}
function fitMealsOn(d){return (state.foodPlans||[]).filter(function(x){return x.pid===p().id&&x.date===d})}
function fitRestricted(){return p().special==='embarazo'||/embarazo/i.test(p().restrictions||'')}
function fitGenerateMeals(){
 if(fitRestricted()){modal('Menú y embarazo','<div class="notice">No generaremos una dieta con calorías automáticas durante el embarazo. Se necesita un plan individual revisado por un profesional sanitario y considerar la seguridad alimentaria.</div>');return}
 if(!Array.isArray(state.foodPlans))state.foodPlans=[];
 var dates=fitMealDays(),old=state.foodPlans.filter(function(x){return x.pid===p().id&&dates.includes(x.date)});
 if(old.length&&!confirm('¿Sustituir el menú de esta semana? No se borrarán las comidas realmente registradas.'))return;
 state.foodPlans=state.foodPlans.filter(function(x){return !(x.pid===p().id&&dates.includes(x.date))});
 var portions=[.23,.34,.15,.28],types=['Desayuno','Comida','Merienda','Cena'];
 var target=Math.min(3800,Math.max(1400,num(p().kcal)||2200));
 var avoid=String(p().foodLimits||'').toLowerCase().split(/[,;\n]/).map(function(x){return x.trim()}).filter(function(x){return x.length>2});
 dates.forEach(function(d,day){
  types.forEach(function(meal,i){
   var choices=FIT_RECIPES.filter(function(r){return r[0]===meal&&!avoid.some(function(a){return (r[1]+' '+r[6]).toLowerCase().includes(a)})});
   if(!choices.length)choices=FIT_RECIPES.filter(function(r){return r[0]===meal});
   var r=choices[(day*3+i*7+Math.floor(new Date(d+'T12:00:00').getTime()/604800000))%choices.length];
   var factor=Math.min(1.6,Math.max(.65,target*portions[i]/r[2]));
   state.foodPlans.push({id:uid(),pid:p().id,date:d,meal:meal,name:r[1],kcal:Math.round(r[2]*factor),protein:Math.round(r[3]*factor),carbs:Math.round(r[4]*factor),fats:Math.round(r[5]*factor),ingredients:r[6],portion:Math.round(factor*100)});
  });
 });
 if(save()){render();toast('Menú de 7 días creado')}
}
function fitChangeMeal(id){
 var m=(state.foodPlans||[]).find(function(x){return x.id===id});if(!m)return;
 var choices=FIT_RECIPES.filter(function(r){return r[0]===m.meal&&r[1]!==m.name});
 var opts=choices.map(function(r,i){return '<option value="'+i+'">'+esc(r[1])+'</option>'}).join('');
 modal('Cambiar plato','<label>Alternativa</label><select id="fitChoice">'+opts+'</select><button class="btn" style="margin-top:12px" onclick="fitSaveMealChoice(\''+id+'\')">Cambiar</button>');
}
function fitSaveMealChoice(id){
 var m=(state.foodPlans||[]).find(function(x){return x.id===id});if(!m)return;
 var choices=FIT_RECIPES.filter(function(r){return r[0]===m.meal&&r[1]!==m.name}),r=choices[Number(document.getElementById('fitChoice').value)];if(!r)return;
 var factor=m.kcal/r[2];m.name=r[1];m.protein=Math.round(r[3]*factor);m.carbs=Math.round(r[4]*factor);m.fats=Math.round(r[5]*factor);m.ingredients=r[6];m.portion=Math.round(factor*100);
 save();closeModal();render();
}
function fitShopping(){
 var dates=fitMealDays(),items=(state.foodPlans||[]).filter(function(x){return x.pid===p().id&&dates.includes(x.date)}).flatMap(function(x){return x.ingredients.split(',').map(function(v){return v.trim()})});
 Array.from(new Set(items)).forEach(function(name){if(!own(state.shopping).some(function(x){return x.name.toLowerCase()===name.toLowerCase()}))state.shopping.push({id:uid(),pid:p().id,name:name,done:false})});
 save();go('compra');toast('Lista creada: confirma cantidades antes de comprar');
}
function mealPlanSection(){
 var dates=fitMealDays(),current=fitMealsOn(selectedDate);
 var buttons=dates.map(function(d){return '<button class="pill '+(d===selectedDate?'on':'')+'" onclick="selectedDate=\''+d+'\';render()">'+formatDay(d).slice(0,3)+'<br>'+d.slice(-2)+'</button>'}).join('');
 var meals=current.map(function(m){return '<div class="meal"><b>'+esc(m.meal)+' · '+esc(m.name)+'</b><div class="muted small">≈ '+m.kcal+' kcal · P '+m.protein+' g · C '+m.carbs+' g · G '+m.fats+' g</div><div class="info">Ingredientes: '+esc(m.ingredients)+' · tamaño orientativo '+m.portion+'% de la receta base</div><div class="actions"><button class="btn tiny" onclick="fitEatPlanned(\''+m.id+'\')">He comido esto</button><button class="btn ghost tiny" onclick="fitChangeMeal(\''+m.id+'\')">Cambiar plato</button></div></div>'}).join('');
 return '<div class="card"><div class="between"><b>Menú de la semana</b><button class="btn tiny secondary" onclick="fitGenerateMeals()">Generar menú</button></div><div class="weekbar">'+buttons+'</div>'+(current.length?meals+'<div class="actions"><button class="btn secondary" onclick="fitShopping()">Lista de compra</button><button class="btn ghost" onclick="fitAdjustToday()">Ajustar hoy</button></div>':'<div class="empty">Sin menú generado todavía. Pulsa Generar menú.</div>')+'<div class="info">Menús de ejemplo con estimaciones nutricionales. No son prescripciones ni tienen en cuenta todas las alergias y restricciones. Revisa los ingredientes y las porciones.</div></div>';
}
function regenerateWeek(){
 var dates=fitMealDays(),pending=own(state.plans).filter(function(x){return dates.includes(x.date)&&!workDay(x.date).length});
 if(pending.length&&!confirm('¿Regenerar las sesiones aún no realizadas? Las ya registradas se conservarán.'))return;
 state.plans=state.plans.filter(function(x){return !pending.some(function(y){return y.id===x.id})});
 p().planVersion=(p().planVersion||0)+1;
 generateWeek();
}


function injuryCheck(){
 var x=p(),activity=(x.injuryActivities||[]);
 var choice=function(name,title){return '<label>'+title+'</label><select name="'+name+'" required><option value="">Selecciona</option>'+[['no','No'],['yes','Sí'],['unsure','No estoy seguro/a']].map(function(pair){return '<option value="'+pair[0]+'" '+(x[name]===pair[0]?'selected':'')+'>'+pair[1]+'</option>'}).join('')+'</select>'};
 var activities=['fuerza','bici','correr','padel'].map(function(v,i){return '<div class="checkrow"><input type="checkbox" name="injuryActivities" value="'+v+'" '+(activity.includes(v)?'checked':'')+'><span>'+['Fuerza de piernas','Bicicleta','Correr','Pádel y giros'][i]+'</span></div>'}).join('');
 var html='<p class="muted">Has indicado una lesión u operación. ¿Cómo estás actualmente? Tus respuestas se guardarán en este perfil.</p><form onsubmit="saveInjuryCheck(event)">'+choice('injuryPain','¿Tienes dolor haciendo fuerza o bicicleta?')+choice('injuryInstability','¿Tienes inestabilidad, bloqueo o hinchazón después de entrenar?')+'<label>¿Qué actividades puedes realizar cómodamente ahora?</label>'+activities+choice('injuryClearance','¿Tienes autorización o pautas profesionales para los ejercicios que quieres hacer?')+'<div class="notice">Si hay dolor, bloqueo o inestabilidad, consulta antes de aumentar la intensidad. Estas preguntas no sustituyen una valoración médica.</div><button type="submit" class="btn">Guardar y generar semana</button></form>';
 modal('Adaptemos tu entrenamiento',html);
}
function saveInjuryCheck(e){
 e.preventDefault();
 var f=new FormData(e.target),x=p();
 ['injuryPain','injuryInstability','injuryClearance'].forEach(function(k){x[k]=f.get(k)});
 x.injuryActivities=f.getAll('injuryActivities');x.injuryCheckComplete=true;
 if(!save())return;
 closeModal();generateWeek();
}


/* Nubivanta Fit 1.6: panel semanal y acciones de un toque. */
function fitOpenWeek(){
 const dates=fitMealDays(),n=dates.filter(d=>fitMealsOn(d).length).length;
 let card=dates.map(d=>{
  const w=plDay(d),meals=fitMealsOn(d),active=workDay(d).length>0,cal=meals.reduce((a,b)=>a+b.kcal,0);
  return '<div class="dayrow"><div class="daybadge">'+formatDay(d).slice(0,3)+'<br><span class="muted small">'+d.slice(-2)+'</span></div><div><b>'+esc(w?w.title:'Descanso / libre')+'</b><div class="muted small">'+(w?Math.round(w.minutes)+' min · ':'')+(active?'✓ Entrenado':'')+'</div><div class="muted small">'+(meals.length?meals.length+' comidas · ≈'+cal+' kcal':'Menú por generar')+'</div><button class="btn tiny secondary" onclick="selectedDate=\''+d+'\';closeModal();go(\'nutricion\')">Ver comidas</button></div></div>';
 }).join('');
 modal('Tu semana completa','<div class="actions"><button class="btn" onclick="closeModal();fitCreateFullWeek()">Preparar mi semana</button></div><div class="card">'+card+'</div>');
}
function fitCreateFullWeek(){
 const first=startWeek(selectedDate),x=p(),dates=fitMealDays();
 const incomplete=/operad|cirug|menisc|ligamento|lesi[oó]n|rodilla/i.test(x.restrictions||'')&&!x.injuryCheckComplete;
 if(incomplete){injuryCheck();return}
 if(!Array.isArray(state.foodPlans))state.foodPlans=[];
 if(!dates.some(d=>fitMealsOn(d).length)&&!fitRestricted())fitGenerateMeals();
 generateWeek();
}
function fitEatPlanned(id){
 const m=(state.foodPlans||[]).find(x=>x.id===id);if(!m)return;
 if(foodDay(m.date).some(x=>x.plannedId===m.id)){toast('Ya estaba registrada');return}
 state.meals.push({id:uid(),pid:p().id,plannedId:m.id,date:m.date,meal:m.meal,name:m.name,kcal:m.kcal,protein:m.protein,carbs:m.carbs,fats:m.fats,photo:''});
 if(!save()){state.meals.pop();return}
 render();toast('Comida registrada');
}
function fitAdjustToday(){
 const planned=fitMealsOn(selectedDate),logged=foodDay(selectedDate),available=planned.filter(m=>!logged.some(z=>z.plannedId===m.id));
 if(!available.length){toast('Genera un menú o registra una comida');return}
 const goal=targets(selectedDate),remaining=Math.max(0,goal-money(logged));
 const plannedKcal=available.reduce((s,m)=>s+m.kcal,0);
 const factor=plannedKcal?remaining/plannedKcal:1;
 modal('Ajustar comidas pendientes','<p class="muted">Objetivo diario orientativo: '+Math.round(goal)+' kcal. Ya has registrado '+Math.round(money(logged))+' kcal. Puedes redistribuir lo que queda, pero no necesitas compensar excesos dejando de comer.</p><div class="notice">Las estimaciones no sustituyen una evaluación nutricional. Si la ingesta restante resulta muy baja, prioriza una alimentación suficiente.</div>'+available.map(m=>'<div class="meal"><b>'+esc(m.meal)+' · '+esc(m.name)+'</b><div class="muted small">Previsto: '+m.kcal+' kcal · Distribución orientativa: '+Math.round(m.kcal*Math.min(1.35,Math.max(.75,factor)))+' kcal</div></div>').join('')+'<div class="actions"><button class="btn secondary" onclick="closeModal()">Entendido</button></div>');
}
function fitWeekSummary(){
 const dates=fitMealDays(),workouts=own(state.workouts).filter(w=>dates.includes(w.date)),meals=own(state.meals).filter(m=>dates.includes(m.date)),plans=own(state.plans).filter(p=>dates.includes(p.date));
 const done=dates.filter(d=>workouts.some(w=>w.date===d)).length,avg=meals.length?Math.round(meals.reduce((a,m)=>a+m.kcal,0)/Math.max(1,new Set(meals.map(m=>m.date)).size)):0;
 modal('Resumen semanal','<div class="grid2"><div class="stat"><strong>'+done+'</strong><span class="small">Días con actividad</span></div><div class="stat"><strong>'+plans.length+'</strong><span class="small">Sesiones programadas</span></div><div class="stat"><strong>'+meals.length+'</strong><span class="small">Comidas registradas</span></div><div class="stat"><strong>'+avg+'</strong><span class="small">kcal/día con registros</span></div></div><p class="muted small">El promedio es solo de los días con comidas anotadas y no incluye alimentos sin registrar.</p><button class="btn secondary" onclick="closeModal();printReport()">Imprimir informe PDF</button>');
}

function fitExerciseOptions(name){
 const n=name.toLowerCase(),eq=(p().equipment||'').toLowerCase(),loc=p().location||'casa';
 const gym=loc==='gimnasio'||/gimnasio|prensa|máquina|maquina|smith|polea/.test(eq);
 const bar=/barra|discos|rack/.test(eq)||gym;
 const dumb=/mancuern|pesa|kettlebell/.test(eq)||gym;
 const band=/goma|banda|elástic/.test(eq)||gym;
 const choices=[];
 const add=(value,need)=>{if(!need||need==='gym'&&gym||need==='bar'&&bar||need==='dumb'&&dumb||need==='band'&&band)choices.push(value)};
 if(/sentadilla|zancada|prensa|escalón/.test(n)){add('Sentadilla a banco');add('Sentadilla goblet','dumb');add('Sentadilla libre con barra','bar');add('Prensa de piernas','gym');add('Zancada estática');}
 else if(/remo|dominada|espalda/.test(n)){add('Remo con banda','band');add('Remo con mancuerna','dumb');add('Remo invertido');add('Remo en polea','gym');}
 else if(/peso muerto|bisagra|puente de glúteos/.test(n)){add('Puente de glúteos');add('Bisagra de cadera sin carga');add('Peso muerto rumano con mancuernas','dumb');add('Peso muerto rumano con barra','bar');}
 else if(/flexion|flexión|press|empuje/.test(n)){add('Flexiones inclinadas');add('Flexiones en pared');add('Press con mancuernas','dumb');add('Press en máquina','gym');}
 else if(/carrera|correr|bicicleta|bici/.test(n)){add('Caminata rápida');add('Bicicleta estática');add('Remo ergómetro','gym');}
 else{add('Variante sin material');add('Variante con banda','band');add('Variante con mancuernas','dumb')}
 return [...new Set(choices)].filter(v=>v.toLowerCase()!==n);
}
function alternative(wid,eid){
 let w=state.plans.find(z=>z.id===wid),e=w&&w.exercises.find(z=>z.id===eid);if(!e)return;
 const opts=fitExerciseOptions(e.name);
 modal('Cambiar ejercicio',`<p class="muted">Original: ${esc(e.name)}</p><p class="small muted">Opciones basadas en el material de tu perfil. No realices ejercicios que contradigan tus restricciones.</p>
 <label>Alternativa</label><select id="fitExerciseChoice">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}<option value="custom">Otra alternativa</option></select>
 <label>Otro ejercicio (opcional)</label><input id="fitCustomExercise" placeholder="Escribe un ejercicio">
 <label class="checkrow"><input id="fitPreferExercise" type="checkbox" style="width:19px;min-height:19px"><span>Preferir este cambio en próximos planes</span></label>
 <button class="btn" onclick="fitApplyExercise('${wid}','${eid}')">Guardar</button>`);
}
function fitApplyExercise(wid,eid){
 let w=state.plans.find(z=>z.id===wid),e=w&&w.exercises.find(z=>z.id===eid);if(!e)return;
 const custom=document.getElementById('fitCustomExercise').value.trim(),chosen=document.getElementById('fitExerciseChoice').value,newName=custom||chosen;
 if(!newName||newName==='custom'){toast('Escribe una alternativa');return}
 const x=p(),original=e.originalName||e.name,key=original.toLowerCase();
 x.exerciseSwapCounts=x.exerciseSwapCounts||{};x.exercisePreferences=x.exercisePreferences||{};
 let previous=x.exerciseSwapCounts[key]||{name:newName,count:0};
 previous.count=previous.name===newName?previous.count+1:1;previous.name=newName;x.exerciseSwapCounts[key]=previous;
 if(document.getElementById('fitPreferExercise').checked||previous.count>=2)x.exercisePreferences[key]=newName;
 e.originalName=original;e.name=newName;
 if(save()){openWorkout(wid);toast('Alternativa guardada')}
}
