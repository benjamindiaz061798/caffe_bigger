const sourceFiles = {
  cafe: 'WhatsApp Image 2026-10-26 at 7.01.24 PM (3).jpeg',
  iced: 'WhatsApp Image 2026-10-26 at 7.01.24 PM (1).jpeg',
  sandwich: 'WhatsApp Image 2026-10-26 at 7.01.23 PM.jpeg',
  fajita: 'WhatsApp Image 2026-10-26 at 7.01.24 PM (2).jpeg',
  salad: 'WhatsApp Image 2026-10-26 at 7.01.24 PM.jpeg',
}
export const menuSources = Object.entries(sourceFiles).map(([id, file]) => ({ id, title: { cafe: 'Cafés y pastelería', iced: 'Cafés fríos', sandwich: 'Sándwiches', fajita: 'Fajitas', salad: 'Ensaladas' }[id], url: `/logos y menú/${file}` }))
const colors = { coffee: ['#583521','#c59a69','#f0e3cb'], pie: ['#bd8d58','#e6d17a','#fff9ed'], sandwich: ['#ce9a5e','#714b33','#c95f42','#94a063'], wrap: ['#e7cfa0','#8a9d59','#c68f61','#c45b3e'], salad: ['#8a9d59','#c45b3e','#e5c86e'] }
const size = [{ id: 'size', label: 'Tamaño', choices: [{ id: 'medium', label: 'Mediano', extra: 0 }, { id: 'large', label: 'Grande', extra: 500 }] }]
const bread = [{ id: 'bread', label: 'Tipo de pan', choices: [{ id: 'marraqueta', label: 'Marraqueta', extra: 0 }, { id: 'amasado', label: 'Amasado', extra: 0 }, { id: 'integral', label: 'Integral', extra: 200 }, { id: 'churrasca', label: 'Churrasca', extra: 400 }] }]
const flavors = (names, label = 'Variedad') => [{ id: 'flavor', label, choices: names.map((name, i) => ({ id: String(i), label: name, extra: 0 })) }]
const make = (id, name, category, price, ingredients, extra = {}) => ({ id, name, category, price, ingredients, description: ingredients.length ? ingredients.join(' · ') : 'Consulta las variedades y la preparación con la cafetería.', kind: 'coffee', time: 5, source: 'cafe', allergens: 'Consulta ingredientes y contaminación cruzada con el local.', ...extra, colors: colors[extra.kind || 'coffee'] || colors.pie })
const coffee = (id, name, ingredients, price = 2200, extra = {}) => make(id, name, 'Cafés e infusiones', price, ingredients, { options: size, ...extra })
const pastry = (id, name, price, kind, extra = {}) => make(id, name, 'Pastelería', price, [], { kind, time: 3, ...extra })
const sandwich = (id, name, group, price, ingredients) => make(id, name, 'Sándwiches', price, ['Pan', ...ingredients], { kind: 'sandwich', time: 12, source: 'sandwich', group, options: bread, model: 'sandwich', decomposable: ingredients.length > 1 })
const iced = (id, name, ingredients) => make(id, name, 'Cafés fríos', null, ingredients, { kind: 'iced', source: 'iced', time: 6 })
const fajita = (id, name, group, ingredients) => make(id, name, 'Fajitas', null, ['Tortilla', 'Lechuga', ...ingredients], { kind: 'wrap', source: 'fajita', group, time: 12, model: 'wrap', decomposable: true })
export const saladProteins = [{ id: 'pollo', label: 'Pollo', extra: 0 }, { id: 'palta-reina', label: 'Palta reina', extra: 0 }, { id: 'huevo', label: 'Huevo', extra: 0 }, { id: 'atun', label: 'Atún', extra: 400 }, { id: 'churrasco', label: 'Churrasco', extra: 400 }, { id: 'lengua', label: 'Lengua', extra: 400 }]
export const saladVegetables = ['Aceituna','Acelga','Apio','Arvejas','Betarraga','Brócoli','Cebolla','Coliflor','Choclo','Espárragos','Pepino','Pimentón','Porotos negros','Porotos verdes','Tomate','Zanahoria']
export const sauces = ['Mayonesa','Ketchup','Mostaza','Ají','BBQ','Salsa verde','Ajo','Queso']
export const products = [
  coffee('latte','Latte',['Café de grano','Leche descremada']),
  pastry('pie-limon','Pie de limón',1200,'pie',{ ingredients: ['Masa','Crema de limón','Merengue'], description: 'Una pausa dulce y cítrica. Composición ilustrativa por validar.', model: 'pie', decomposable: true }),
  sandwich('italiano','Churrasco italiano','Churrascos',4900,['Churrasco','Tomate','Palta']),
  coffee('te','Té e infusiones',[],1600,{ kind: 'tea', options: [] }),
  coffee('espresso','Espresso simple',['Café de grano'],1900,{ options: [] }),
  coffee('espresso-doble','Espresso doble',['Doble porción de café de grano'],2300,{ options: [] }),
  coffee('americano','Americano',['Agua purificada','Café de grano']),
  coffee('cappuccino','Cappuccino',['Chocolate premium','Leche descremada','Café de grano']),
  coffee('cortado','Cortado',['Café de grano','Leche descremada']),
  coffee('vainilla','Cappuccino vainilla',['Leche descremada','Vainilla','Café de grano']),
  coffee('mokaccino','Mokaccino',['Café de grano','Chocolate premium','Leche descremada']),
  coffee('grano-canela','Grano canela',['Leche descremada','Canela','Café de grano']),
  coffee('chai','Chai latte',['Leche descremada','Té chai']),
  coffee('chocolate-leche','Chocolate con leche',['Chocolate premium','Leche descremada']),
  coffee('chocolate-fuerte','Chocolate fuerte',['Leche descremada','Chocolate premium']),
  pastry('media-luna','Media luna',990,'croissant',{ description: 'Rellena de crema pastelera o manjar.', options: flavors(['Crema pastelera','Manjar'],'Relleno') }),
  pastry('kuchen-manzana','Kuchen de manzana',1200,'cake'),
  pastry('kuchen-nuez','Kuchen de nuez',1200,'cake'),
  pastry('kuchen-platano','Kuchen plátano pastelera',1700,'cake'),
  pastry('roll-canela','Roll de canela',1200,'roll'),
  pastry('cookies','Crumble cookies rellenas',1400,'cookie',{ options: flavors(['Nutella','Crema de maní','Frosting de queso'],'Relleno') }),
  pastry('cheesecake','Cheesecake berries',3200,'pie',{ ingredients: ['Base de galleta','Relleno de queso','Berries'], model: 'cheesecake', decomposable: true, description: 'Composición ilustrativa por validar con el local.' }),
  pastry('cheesecake-maracuya','Cheesecake maracuyá',3200,'pie',{ ingredients: ['Base de galleta','Relleno de queso','Maracuyá'], model: 'cheesecake', decomposable: true, description: 'Composición ilustrativa por validar con el local.' }),
  pastry('queque','Trozo de queque',900,'cake'),
  pastry('brownie','Brownie',2200,'brownie'),
  pastry('muffin','Muffins chips',1200,'muffin',{ options: flavors(['Chocolate','Nuez','Solo']) }),
  pastry('cuchuflis','Cuchuflís bañados artesanales',1500,'cookie'),
  pastry('galletas','Galletas bañadas artesanales',1500,'cookie'),
  pastry('donas','Mix donas Palo Alto',2800,'donut',{ description: 'Consultar variedades disponibles en tienda.' }),
  iced('afogato','Afogato',['Helado de vainilla','Café de grano']),
  iced('americano-frio','Americano frío',['Café de grano','Hielo','Agua purificada']),
  iced('caramel-latte','Caramel latte',['Café de grano','Syrup caramelo','Leche','Hielo']),
  iced('caramel-macchiato','Caramel macchiato',['Café de grano','Syrup vainilla y caramelo','Leche','Hielo']),
  iced('caramel-mocha','Caramel mocha',['Café de grano','Chocolate','Syrup caramelo','Leche','Hielo']),
  iced('cafe-helado','Café helado',['Helado de vainilla','Leche','Café de grano','Crema chantilly','Hielo']),
  iced('choco-berry','Choco-berry latte',['Café de grano','Chocolate','Syrup frutilla','Leche','Hielo']),
  iced('dirty-matcha','Dirty matcha',['Té matcha','Café de grano','Leche','Syrup vainilla','Hielo']),
  iced('espresso-cola','Expresso Coca Cola',['Café espresso','Coca Cola (variedad)','Hielo']),
  iced('espanol','Español',['Café de grano','Leche condensada','Espuma de leche','Canela en polvo','Hielo']),
  iced('irish-latte','Irish latte',['Café de grano','Syrup irlandés','Leche','Hielo']),
  iced('irish-mocha','Irish mocha',['Café de grano','Chocolate','Syrup irlandés','Crema chantilly','Leche','Hielo']),
  iced('matcha-latte','Matcha latte',['Té matcha','Leche','Hielo']),
  iced('orange-americano','Orange americano',['Jugo de naranja','Café de grano','Hielo']),
  iced('strawberry-latte','Strawberry latte',['Café de grano','Syrup frutilla','Leche','Hielo']),
  iced('strawberry-matcha','Strawberry matcha',['Té matcha','Syrup frutilla','Leche','Hielo']),
  iced('frappe-oreo','Frappé Oreo',['Café de grano','Galleta Oreo','Leche','Leche condensada','Hielo triturado','Crema chantilly']),
  ...[['huevo','Huevo',2990],['mantequilla','Mantequilla',1400],['palta','Palta',2400],['queso-jamon','Queso jamón',1900],['quesillo','Quesillo',2200]].map(([id,name,price]) => sandwich(id,name,'Simples',price,name.split(' '))),
  ...[['huevo-jamon','Huevo jamón',3390],['huevo-queso','Huevo queso',3390],['palta-huevo','Palta huevo',3990],['palta-jamon','Palta jamón',2800],['palta-queso','Palta queso',2800],['palta-quesillo','Palta quesillo',2990]].map(([id,name,price]) => sandwich(id,name,'Dobles',price,name.split(' '))),
  sandwich('ave-mayo','Ave mayo','Ave',2300,['Ave','Mayonesa']),
  sandwich('ave-pimenton','Ave mayo pimentón','Ave',2500,['Ave','Mayonesa','Pimentón']),
  sandwich('ave-palta','Ave mayo palta','Ave',3300,['Ave','Mayonesa','Palta']),
  sandwich('pollo-solo','Pollo solo','Ave',3000,['Pollo']),
  sandwich('pollo-italiano','Pollo italiano','Ave',4000,['Pollo','Tomate','Palta']),
  sandwich('pollo-palta','Pollo palta','Ave',3800,['Pollo','Palta']),
  sandwich('pollo-luco','Pollo luco','Ave',3500,['Pollo','Queso']),
  sandwich('pollo-tomate','Pollo tomate','Ave',3500,['Pollo','Tomate']),
  sandwich('pollo-tomate-queso','Pollo tomate queso','Ave',3990,['Pollo','Tomate','Queso']),
  sandwich('pollo-tomate-lechuga','Pollo tomate lechuga','Ave',3990,['Pollo','Tomate','Lechuga']),
  sandwich('churrasco-solo','Churrasco solo','Churrascos',3400,['Churrasco']),
  sandwich('chacarero','Chacarero','Churrascos',4590,['Churrasco','Tomate','Porotos verdes','Ají verde']),
  sandwich('luco','Luco','Churrascos',3990,['Churrasco','Queso']),
  sandwich('chemilico','Chemilico','Churrascos',5190,['Churrasco','Huevo','Cebolla']),
  sandwich('napolitano','Napolitano','Especiales',3800,['Jamón','Queso','Tomate']),
  sandwich('lechuga-jamon-tomate','Lechuga jamón tomate','Especiales',3500,['Lechuga','Jamón','Tomate']),
  sandwich('lechuga-tomate-quesillo','Lechuga tomate quesillo','Especiales',3500,['Lechuga','Tomate','Quesillo']),
  sandwich('lechuga-completo','Lechuga tomate jamón quesillo','Especiales',4200,['Lechuga','Tomate','Jamón','Quesillo']),
  fajita('fajita-vacuno-italiana','Fajita italiana','Vacuno',['Carne','Tomate','Palta']),
  fajita('fajita-granjera','Fajita granjera','Vacuno',['Churrasco','Tomate']),
  fajita('fajita-chacarera','Fajita chacarera','Vacuno',['Churrasco','Porotos verdes','Tomate','Ají verde']),
  fajita('fajita-chilena','Fajita chilena','Vacuno',['Carne','Tomate','Cebolla morada','Palta']),
  fajita('fajita-americana','Fajita americana','Vacuno',['Carne','Pepinillo','Queso cheddar']),
  fajita('fajita','Fajita italiana de pollo','Pollo',['Pollo','Palta','Tomate','Mayonesa']),
  fajita('fajita-pollo-1','Fajita pollo 1','Pollo',['Pollo','Tomate','Choclo']),
  fajita('fajita-pollo-2','Fajita pollo 2','Pollo',['Pollo','Queso','Choclo']),
  fajita('fajita-napolitana','Fajita napolitana','Especiales',['Jamón','Queso','Tomate','Orégano','Aceituna','Salsa']),
  fajita('vegetariana','Fajita vegetariana','Especiales',['Palta','Tomate','Choclo','Salsa']),
  fajita('fajita-marina','Fajita marina','Especiales',['Camarón','Cebolla morada','Pimentón','Cilantro','Salsa']),
  fajita('fajita-atun','Fajita de atún','Especiales',['Atún','Palta','Cebolla morada','Salsa']),
  make('ensalada-grande','Ensalada grande','Ensaladas',4800,['Base de lechuga','1 proteína','4 vegetales'],{ kind:'salad',source:'salad',time:8,saladCount:4,options:[{id:'protein',label:'Proteína',choices:saladProteins}] }),
  make('ensalada-pequena','Ensalada pequeña','Ensaladas',2300,['3 vegetales'],{kind:'salad',source:'salad',time:6,saladCount:3}),
  make('ensalada-cesar','Ensalada César','Ensaladas',3800,[],{kind:'salad',source:'salad',time:8,description:'La carta indica el precio. Consulta su composición con el local.'}),
]
export const categories = ['Destacados','Cafés e infusiones','Cafés fríos','Pastelería','Sándwiches','Fajitas','Ensaladas']
export function resolveLine(input) {
  if (!input || typeof input !== 'object') throw new Error('Producto inválido.')
  const product = products.find(p => p.id === input.id)
  if (!product || !Number.isInteger(product.price) || product.price <= 0) throw new Error('Este producto no tiene un precio confirmado.')
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) throw new Error('La cantidad debe estar entre 1 y 20.')
  const selected = input.options ?? {}
  if (!selected || typeof selected !== 'object' || Array.isArray(selected)) throw new Error('Opciones inválidas.')
  const allowed = [...(product.options || []).map(o => o.id), ...(product.saladCount ? ['vegetables'] : [])]
  if (Object.keys(selected).some(key => !allowed.includes(key))) throw new Error('Una opción no corresponde al producto.')
  const options = {}, labels = []
  let unitPrice = product.price
  for (const option of product.options || []) {
    const choice = option.choices.find(c => c.id === (selected[option.id] ?? option.choices[0].id))
    if (!choice) throw new Error(`Selecciona una opción válida de ${option.label.toLowerCase()}.`)
    options[option.id] = choice.id; labels.push(choice.label); unitPrice += choice.extra
  }
  if (product.saladCount) {
    const vegetables = selected.vegetables
    if (!Array.isArray(vegetables) || vegetables.length !== product.saladCount || new Set(vegetables).size !== vegetables.length || vegetables.some(v => !saladVegetables.includes(v))) throw new Error(`Elige exactamente ${product.saladCount} vegetales distintos.`)
    options.vegetables = [...vegetables].sort(); labels.push(...options.vegetables)
  }
  const key = `${product.id}:${JSON.stringify(options)}`
  return { id:product.id, key, name:product.name, quantity:input.quantity, options, labels, unitPrice, amount:unitPrice * input.quantity, time:product.time }
}
export function quoteCart(cart) {
  if (!Array.isArray(cart) || cart.length < 1 || cart.length > 50) throw new Error('El carrito debe contener entre 1 y 50 productos.')
  const lines = cart.map(resolveLine)
  const counts = new Map()
  for (const line of lines) { const count = (counts.get(line.key) || 0) + line.quantity; if (count > 20) throw new Error('Máximo 20 unidades por preparación.'); counts.set(line.key,count) }
  const amount = lines.reduce((sum,line) => sum + line.amount,0)
  if (amount > 1000000) throw new Error('El pedido supera el máximo permitido.')
  return { lines, amount }
}
