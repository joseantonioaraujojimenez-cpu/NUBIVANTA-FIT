
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
 var meals=current.map(function(m){return '<div class="meal"><b>'+esc(m.meal)+' · '+esc(m.name)+'</b><div class="muted small">≈ '+m.kcal+' kcal · P '+m.protein+' g · C '+m.carbs+' g · G '+m.fats+' g</div><div class="info">Ingredientes: '+esc(m.ingredients)+' · tamaño orientativo '+m.portion+'% de la receta base</div><button class="btn ghost tiny" onclick="fitChangeMeal(\''+m.id+'\')">Cambiar plato</button></div>'}).join('');
 return '<div class="card"><div class="between"><b>Menú de la semana</b><button class="btn tiny secondary" onclick="fitGenerateMeals()">Generar menú</button></div><div class="weekbar">'+buttons+'</div>'+(current.length?meals+'<button class="btn secondary" onclick="fitShopping()">Crear lista de la compra</button>':'<div class="empty">Sin menú generado todavía. Pulsa Generar menú.</div>')+'<div class="info">Menús de ejemplo con estimaciones nutricionales. No son prescripciones ni tienen en cuenta todas las alergias y restricciones. Revisa los ingredientes y las porciones.</div></div>';
}
function regenerateWeek(){
 var dates=fitMealDays(),pending=own(state.plans).filter(function(x){return dates.includes(x.date)&&!workDay(x.date).length});
 if(pending.length&&!confirm('¿Regenerar las sesiones aún no realizadas? Las ya registradas se conservarán.'))return;
 state.plans=state.plans.filter(function(x){return !pending.some(function(y){return y.id===x.id})});
 p().planVersion=(p().planVersion||0)+1;
 generateWeek();
}
