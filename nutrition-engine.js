
const FIT_FOODS=[
['Arroz cocido',130,2.7,28.2,.3],['Pasta cocida',158,5.8,30.9,.9],['Patata cocida',87,1.9,20.1,.1],
['Avena',389,16.9,66.3,6.9],['Pan integral',247,13,41,4.2],['Pechuga de pollo cocinada',165,31,0,3.6],
['Pavo cocinado',135,29,0,1.6],['Ternera magra',210,27,0,10],['Huevo',143,12.6,.7,9.5],
['Salmón',208,20,0,13],['Merluza',82,17.8,0,.7],['Atún al natural',116,26,0,1],
['Yogur natural',63,3.5,4.7,3.3],['Yogur griego 0%',59,10,3.6,.4],['Leche semidesnatada',47,3.4,4.8,1.6],
['Queso fresco',98,11.1,3.4,4.3],['Garbanzos cocidos',164,8.9,27.4,2.6],['Lentejas cocidas',116,9,20.1,.4],
['Quinoa cocida',120,4.4,21.3,1.9],['Brócoli',34,2.8,6.6,.4],['Tomate',18,.9,3.9,.2],
['Verdura variada',35,2,6,.4],['Plátano',89,1.1,22.8,.3],['Manzana',52,.3,13.8,.2],
['Almendras',579,21.2,21.6,49.9],['Nueces',654,15.2,13.7,65.2],['Aceite de oliva',884,0,0,100]
];
function fitNutritionTargets(x=p()){
 const kg=Number(x.weight),cm=Number(x.height),age=Number(x.age),sex=x.sex;
 if(x.special==='embarazo'||/embarazo|lactancia|posparto/i.test(x.restrictions||''))return {error:'En embarazo, lactancia y posparto se necesita una valoración individual.'};
 if(!(kg>=25&&kg<=350&&cm>=100&&cm<=250&&age>=16&&age<=110))return {error:'Completa peso, altura y edad en el perfil.'};
 if(!['hombre','mujer'].includes(sex))return {error:'Indica el sexo para la fórmula energética en tu perfil.'};
 const basal=10*kg+6.25*cm-5*age+(sex==='hombre'?5:-161);
 const factor=({sedentaria:1.2,baja:1.35,ligera:1.375,moderada:1.55,alta:1.725,muy_alta:1.85})[x.activity]||1.45;
 const maintenance=Math.round(basal*factor/25)*25;
 const ratio=({perder:.85,recomposicion:.95,ganar:1.08})[x.goal]||1;
 const kcal=Math.round(maintenance*ratio/25)*25;
 const protein=Math.round(kg*(x.goal==='bienestar'?1.4:1.8));
 const fats=Math.round(Math.max(.8*kg,kcal*.24/9));
 const carbs=Math.max(0,Math.round((kcal-protein*4-fats*9)/4));
 return {kcal,protein,carbs,fats,basal:Math.round(basal),maintenance};
}
function fitShowNutritionGoals(){
 const x=p(),t=fitNutritionTargets();
 const choices=['sedentaria','baja','ligera','moderada','alta','muy_alta'].map((v,i)=>'<option value="'+v+'" '+(x.activity===v?'selected':'')+'>'+['Sedentaria','Baja','Ligera (1–3 días)','Moderada (3–5 días)','Alta (6–7 días)','Muy alta'][i]+'</option>').join('');
 let html='<p class="muted">Estimación inicial con Mifflin–St Jeor. No mide tu gasto real. Se reajusta según evolución y rendimiento.</p><label>Actividad diaria</label><select id="fitActivity" onchange="p().activity=this.value;save();fitShowNutritionGoals()">'+choices+'</select>';
 if(t.error)html+='<div class="notice">'+esc(t.error)+'</div><button class="btn" onclick="closeModal();openProfile()">Completar perfil</button>';
 else html+='<div class="grid2"><div class="stat"><strong>'+t.kcal+'</strong><span class="small">kcal/día</span></div><div class="stat"><strong>'+t.protein+' g</strong><span class="small">Proteína</span></div><div class="stat"><strong>'+t.carbs+' g</strong><span class="small">Hidratos</span></div><div class="stat"><strong>'+t.fats+' g</strong><span class="small">Grasas</span></div></div><div class="info">Mantenimiento estimado: '+t.maintenance+' kcal. Basal: '+t.basal+' kcal. Los alimentos, entrenamiento y cambios de peso permiten revisar estas cifras.</div><button class="btn" onclick="fitSaveNutritionGoals()">Aplicar a mi perfil</button>';
 modal('Mis calorías y macros',html);
}
function fitSaveNutritionGoals(){
 const v=fitNutritionTargets();if(v.error){toast(v.error);return}
 Object.assign(p(),{kcal:v.kcal,protein:v.protein,carbs:v.carbs,fats:v.fats,nutritionCalculatedAt:new Date().toISOString()});
 if(save()){closeModal();render();toast('Objetivos calculados y guardados')}
}
function fitManualFoodForm(){
 const options=FIT_FOODS.map((f,i)=>'<option value="'+i+'">'+esc(f[0])+'</option>').join('');
 modal('Añadir comida y calcular macros','<form onsubmit="fitSaveManualFood(event)"><label>Fecha</label><input type="date" name="date" value="'+selectedDate+'" required><label>Momento</label><select name="meal"><option>Desayuno</option><option>Comida</option><option>Merienda</option><option>Cena</option><option>Snack</option></select><label>Nombre del plato</label><input name="name" placeholder="Ej.: Pollo con arroz" required><div id="fitIngredients"></div><button type="button" class="btn secondary" onclick="fitAddIngredient()">+ Añadir ingrediente</button><div id="fitFoodTotals" class="info">Selecciona ingredientes y cantidades para estimar las calorías.</div><label>Foto opcional (sin reconocimiento por IA)</label><input type="file" name="photo" accept="image/*"><div class="notice">Las cifras se estiman con valores genéricos por 100 g. Indica gramos de alimento cocinado o crudo según el nombre. Revisa etiquetas y aceites utilizados.</div><button type="submit" class="btn">Guardar comida</button></form>');
 fitAddIngredient();
}
function fitAddIngredient(){
 const target=document.getElementById('fitIngredients');if(!target)return;
 const row=document.createElement('div');row.className='formgrid';row.style.margin='9px 0';row.innerHTML='<div><label>Alimento</label><select class="fitFoodItem" onchange="fitFoodTotals()">'+FIT_FOODS.map((f,i)=>'<option value="'+i+'">'+esc(f[0])+'</option>').join('')+'</select></div><div><label>Gramos</label><input class="fitFoodGrams" type="number" min="0" max="5000" value="100" step="1" oninput="fitFoodTotals()"></div>';target.append(row);fitFoodTotals();
}
function fitFoodTotals(){
 const rows=[...document.querySelectorAll('#fitIngredients .formgrid')],tot={kcal:0,protein:0,carbs:0,fats:0};
 for(const row of rows){const f=FIT_FOODS[Number(row.querySelector('.fitFoodItem').value)];const g=Number(row.querySelector('.fitFoodGrams').value)||0;for(let j=1;j<=4;j++)tot[['kcal','protein','carbs','fats'][j-1]]+=f[j]*g/100}
 const el=document.getElementById('fitFoodTotals');if(el)el.textContent='Estimación: '+Math.round(tot.kcal)+' kcal · P '+tot.protein.toFixed(1)+' g · C '+tot.carbs.toFixed(1)+' g · G '+tot.fats.toFixed(1)+' g';
 return tot;
}
async function fitSaveManualFood(event){
 event.preventDefault();const form=event.target,f=new FormData(form),stats=fitFoodTotals(),photo=f.get('photo');let image='';
 if(photo&&photo.size){try{image=await compress(photo)}catch{toast('No se pudo procesar la foto');return}}
 const components=[...form.querySelectorAll('#fitIngredients .formgrid')].map(row=>({name:FIT_FOODS[Number(row.querySelector('.fitFoodItem').value)][0],grams:Number(row.querySelector('.fitFoodGrams').value)||0}));
 const m={id:uid(),pid:p().id,date:f.get('date'),meal:f.get('meal'),name:f.get('name'),kcal:Math.round(stats.kcal),protein:+stats.protein.toFixed(1),carbs:+stats.carbs.toFixed(1),fats:+stats.fats.toFixed(1),ingredients:components,photo:image,source:'estimacion_local'};
 state.meals.push(m);if(!save()){state.meals.pop();return}
 closeModal();render();toast('Comida estimada y guardada');
}
function fitExerciseInfo(name){
 const n=name.toLowerCase();
 if(/sentadilla|prensa|zancada/.test(n))return 'Mantén el tronco estable, desciende con control y usa un rango que no provoque dolor. Evita que las rodillas colapsen hacia dentro.';
 if(/peso muerto|bisagra/.test(n))return 'Lleva la cadera atrás manteniendo columna neutra y la carga cerca del cuerpo. No fuerces el rango ni redondees la espalda.';
 if(/remo|dominada/.test(n))return 'Activa la espalda, mantén el tronco estable y lleva los codos atrás con control, sin balanceos.';
 if(/press|flexion|flexión/.test(n))return 'Mantén el abdomen activo y controla el descenso; ajusta la inclinación o carga para moverte sin dolor.';
 if(/plancha/.test(n))return 'Alinea hombros, cadera y tobillos, respira con normalidad y evita hundir la zona lumbar.';
 if(/bici|carrera|caminar|pádel|padel/.test(n))return 'Empieza suave y aumenta gradualmente. Para si aparecen dolor, inestabilidad, mareo o molestias fuera de lo habitual.';
 return 'Prioriza técnica controlada, respiración regular y un rango cómodo. Adapta la carga al nivel y las restricciones personales.';
}
function fitGuide(wid,eid){
 const w=state.plans.find(x=>x.id===wid),ex=w&&w.exercises.find(x=>x.id===eid);if(!ex)return;
 const title=ex.name,link='https://www.youtube.com/results?search_query='+encodeURIComponent('ejercicio '+title+' técnica correcta fisioterapia demostración');
 modal('Cómo hacer · '+esc(title),'<p>'+esc(fitExerciseInfo(title))+'</p><div class="info">'+ex.sets+' series × '+ex.reps+' repeticiones o minutos · descanso '+ex.rest+' segundos.</div><p class="muted small">Busca una demostración en vídeo de un profesional. No es un vídeo verificado o integrado dentro de la app.</p><a class="btn secondary" style="display:inline-block;text-decoration:none" href="'+link+'" target="_blank" rel="noopener noreferrer">Ver demostraciones en vídeo</a><button class="btn ghost" onclick="openWorkout(\''+wid+'\')">Volver al entrenamiento</button>');
}
