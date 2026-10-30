import * as THREE from 'three'

export function random(seed=1){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296}}
export function texture(kind){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512
  const ctx=canvas.getContext('2d'),rng=random(kind.length*931+kind.charCodeAt(0)),size=512
  const palettes={bread:['#ae692e','#d2944e','#e1ae68'],crumb:['#d3b588','#ead5ab','#f4e6c8'],pastry:['#a46d35','#c89553','#dfb87c'],meat:['#6a4935','#98704f','#bd9470'],tortilla:['#d6bc86','#e5cea2','#f0dfb7'],cream:['#e9d9aa','#f6e7be','#fff1d1'],avocado:['#69833b','#b2be6c','#d9d896']}
  const colors=palettes[kind]||palettes.pastry
  ctx.fillStyle=colors[1];ctx.fillRect(0,0,size,size)
  for(let i=0;i<11000;i++){const x=rng()*size,y=rng()*size,r=rng()*(kind==='meat'?5:3)+.2;ctx.globalAlpha=.12+rng()*.25;ctx.fillStyle=colors[Math.floor(rng()*colors.length)];ctx.beginPath();ctx.ellipse(x,y,r,r*(.4+rng()),rng()*Math.PI,0,Math.PI*2);ctx.fill()}
  ctx.globalAlpha=1
  if(kind==='bread'){
    for(let i=0;i<2200;i++){const x=rng()*size,y=rng()*size;ctx.fillStyle=`rgba(255,244,218,${.08+rng()*.35})`;ctx.fillRect(x,y,.4+rng()*1.8,.4+rng()*1.5)}
    ctx.strokeStyle='#b37a3d';ctx.lineWidth=.65;ctx.globalAlpha=.32
    for(let i=0;i<130;i++){const x=rng()*size,y=rng()*size;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+4,y-4,x-3,y-7,x+1,y-11);ctx.stroke()}
  }
  if(kind==='crumb')for(let i=0;i<900;i++){const r=.3+rng()*3;ctx.fillStyle=`rgba(119,83,42,${.06+rng()*.15})`;ctx.beginPath();ctx.ellipse(rng()*size,rng()*size,r,r*.7,rng()*Math.PI,0,Math.PI*2);ctx.fill()}
  if(kind==='tortilla')for(let i=0;i<90;i++){const x=rng()*size,y=rng()*size,r=2+rng()*11;const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,'rgba(117,70,28,.5)');gradient.addColorStop(.6,'rgba(146,93,41,.2)');gradient.addColorStop(1,'rgba(146,93,41,0)');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2)}
  if(kind==='meat'){
    for(let i=0;i<24;i++){const y=i*25+rng()*8;ctx.strokeStyle='rgba(30,18,12,.5)';ctx.lineWidth=2+rng()*4;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(150,y+10,350,y-15,512,y+8);ctx.stroke()}
    for(let i=0;i<170;i++){ctx.strokeStyle='rgba(213,163,111,.17)';ctx.lineWidth=.7;const x=rng()*size;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+25,160,x-15,350,x+6,512);ctx.stroke()}
  }
  ctx.globalAlpha=1
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;map.wrapS=map.wrapT=THREE.RepeatWrapping
  return map
}
export function tomatoTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#b83021';g.fillRect(0,0,256,256)
  const flesh=g.createRadialGradient(128,128,10,128,128,123);flesh.addColorStop(0,'#e9a16c');flesh.addColorStop(.16,'#d96745');flesh.addColorStop(.83,'#d64c2d');flesh.addColorStop(.95,'#dc6b45');flesh.addColorStop(1,'#b62e1c');g.fillStyle=flesh;g.beginPath();g.arc(128,128,123,0,Math.PI*2);g.fill()
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7;g.save();g.translate(128+Math.cos(a)*65,128+Math.sin(a)*65);g.rotate(a);g.fillStyle='#a83c24';g.beginPath();g.ellipse(0,0,30,21,0,0,Math.PI*2);g.fill();g.fillStyle='#d98444';g.beginPath();g.ellipse(0,0,25,17,0,0,Math.PI*2);g.fill();for(let j=0;j<6;j++){const b=j*1.05;g.fillStyle='#edc17b';g.beginPath();g.ellipse(Math.cos(b)*16,Math.sin(b)*11,3.7,1.8,b,0,Math.PI*2);g.fill()}g.restore()}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;return map
}
export function breadGeometry(top=true){
  const geo=new THREE.SphereGeometry(1,64,36),p=geo.attributes.position
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=Math.sin(x*17+z*13)*Math.cos(z*19+y*8)*.012+Math.sin(x*9+z*7)*.015
    p.setXYZ(i,x*(.73+n),top?(y>=0?.06+y*.56:.06+y*.055):(.10+y*.14),z*(1.0+n))
  }
  if(!top){
    const crust=[],crumb=[],indices=geo.index.array
    for(let i=0;i<indices.length;i+=3){const triangle=[indices[i],indices[i+1],indices[i+2]],y=triangle.reduce((sum,index)=>sum+p.getY(index),0)/3;(y>.14?crumb:crust).push(...triangle)}
    geo.setIndex([...crust,...crumb]);geo.clearGroups();geo.addGroup(0,crust.length,0);geo.addGroup(crust.length,crumb.length,1)
  }
  geo.computeVertexNormals();return geo
}
export function ribbonGeometry(seed=1,chicken=false){
  const geo=new THREE.BoxGeometry(chicken?.95:1.1,chicken?.105:.065,chicken?.2:.36,18,2,6),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),edge=1+.07*Math.sin(x*24+seed)+.035*Math.cos(z*30+seed);p.setXYZ(i,x*edge,y+.035+Math.sin(x*7+seed)*.045+Math.cos(z*13+seed)*.025,z*edge)}
  geo.computeVertexNormals();return geo
}
export function leafGeometry(seed=1){
  const geo=new THREE.CircleGeometry(.5,48),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getY(i),a=Math.atan2(z,x),r=Math.hypot(x,z),edge=1+.12*Math.sin(a*9+seed)+.06*Math.cos(a*15);p.setXYZ(i,x*edge,.045*Math.sin(x*10+seed)+.045*Math.cos(z*13)+r*.08,z*edge)}
  geo.computeVertexNormals();return geo
}
export function avocadoGeometry(){
  const s=new THREE.Shape();s.moveTo(-.12,-.6);s.bezierCurveTo(-.67,-.38,-.65,.42,-.12,.65);s.bezierCurveTo(.2,.72,.27,.4,.13,.3);s.bezierCurveTo(-.16,.08,-.17,-.1,.07,-.32);s.bezierCurveTo(.23,-.48,.16,-.7,-.12,-.6)
  const geo=new THREE.ExtrudeGeometry(s,{depth:.085,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.022,bevelThickness:.018,curveSegments:24});geo.rotateX(-Math.PI/2);return geo
}
export function wedgeGeometry(height){
  const s=new THREE.Shape();s.moveTo(0,-1.25);s.lineTo(1.08,.65);s.quadraticCurveTo(0,1.15,-1.08,.65);s.closePath()
  const geo=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.012,curveSegments:40});geo.rotateX(-Math.PI/2);return geo
}
export function meringueGeometry(seed=0){
  const radial=48,rows=26,vertices=[],colors=[],uv=[],indices=[],white=new THREE.Color('#fff7e5'),toast=new THREE.Color('#b77d42')
  for(let j=0;j<=rows;j++){const t=j/rows,r=.31*Math.pow(1-t,.7);for(let i=0;i<=radial;i++){const a=i/radial*Math.PI*2,ridge=1+.12*Math.cos(a*7-t*9),curl=Math.pow(t,3)*.14;vertices.push(Math.cos(a)*r*ridge+curl,t*.39,Math.sin(a)*r*ridge);const toasted=Math.max(0,(t-.4)*1.6)*(.5+.5*Math.cos(a*2+seed));const color=white.clone().lerp(toast,toasted*.8);colors.push(color.r,color.g,color.b);uv.push(i/radial,t)}}
  for(let j=0;j<rows;j++)for(let i=0;i<radial;i++){const a=j*(radial+1)+i,b=a+radial+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo
}
export function shellGeometry(){
  const geo=new THREE.LatheGeometry([[0,0],[1.22,0],[1.4,.07],[1.5,.32],[1.48,.46],[1.38,.45],[1.28,.15],[0,.15]].map(([r,y])=>new THREE.Vector2(r,y)),128),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),a=Math.atan2(z,x),scallop=1+.018*Math.cos(a*36)*Math.min(1,y/.25);p.setXYZ(i,x*scallop,y+.006*Math.sin(a*47),z*scallop)}geo.computeVertexNormals();return geo
}
export function strawberryGeometry(){
  const profile=[[0,0],[.07,.04],[.15,.14],[.22,.27],[.255,.38],[.24,.47],[.17,.52],[.06,.53],[0,.51]],geo=new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),48),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.018*Math.sin(x*35+z*26+y*15);p.setXYZ(i,x*n,y,z*n*.93)}geo.computeVertexNormals();return geo
}
export function tortillaGeometry(){
  const geo=new THREE.PlaneGeometry(1,1,80,48);return geo
}
export function foodLayers(product){
  const type=product.model||product.kind
  if(type==='sandwich')return ['Pan de marraqueta · base',...product.ingredients.slice(1),'Pan de marraqueta · corteza']
  if(type==='wrap')return ['Tortilla de trigo',...product.ingredients.slice(1)]
  return product.ingredients||[]
}
