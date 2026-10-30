import * as THREE from 'three'

// A laminated crescent has tapered ends and a swollen rolled centre, rather than
// the constant circular section of a torus.
export function crescentGeometry(){
  const rows=144,sides=40,positions=[],uv=[],colors=[],indices=[]
  const baked=new THREE.Color('#bd7b39'),light=new THREE.Color('#fff0ce')
  for(let j=0;j<=rows;j++){
    const t=j/rows,a=.08*Math.PI+t*.84*Math.PI,swelling=Math.pow(Math.sin(Math.PI*t),.7)
    const radius=(.035+.4*swelling)*(1+.055*Math.cos(t*Math.PI*18))
    const cx=1.05*Math.cos(a),cz=.77*Math.sin(a)-.4,cy=.24+.12*swelling
    for(let i=0;i<=sides;i++){
      const b=i/sides*Math.PI*2,ridge=1+.018*Math.sin(b*9+j*.4)
      positions.push(cx+Math.cos(a)*Math.cos(b)*radius*ridge,cy+Math.sin(b)*radius*.69,cz+Math.sin(a)*Math.cos(b)*radius*ridge)
      uv.push(t*2,i/sides)
      const color=light.clone().lerp(baked,.2+.5*Math.max(0,Math.sin(b))+.12*(.5+.5*Math.cos(t*18*Math.PI)))
      colors.push(color.r,color.g,color.b)
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();return geo
}
export function spiralPoints(offset=0,height=.35){
  return Array.from({length:241},(_,i)=>{const t=i/240,a=t*Math.PI*7.2,r=.04+t*.93+offset;return new THREE.Vector3(Math.cos(a)*r,height+.02*Math.sin(a*2),Math.sin(a)*r)})
}
export function cinnamonGeometry(){
  const path=spiralPoints(),curve=new THREE.CatmullRomCurve3(path),geo=new THREE.TubeGeometry(curve,320,.145,24,false),p=geo.attributes.position
  // Give the coil the tall oval section of baked dough, rather than a flat ring.
  for(let i=0;i<p.count;i++){const y=p.getY(i);p.setY(i,.35+(y-.35)*1.7)}
  geo.computeVertexNormals();return geo
}
export function appleSliceGeometry(){
  const shape=new THREE.Shape();shape.absarc(0,0,.42,.06*Math.PI,.94*Math.PI,false)
  shape.absarc(0,.04,.27,.94*Math.PI,.06*Math.PI,true);shape.closePath()
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:28});geo.rotateX(-Math.PI/2);return geo
}
export function loafSliceGeometry(){
  const shape=new THREE.Shape();shape.moveTo(-.72,.02);shape.lineTo(.72,.02);shape.lineTo(.72,.7);shape.bezierCurveTo(.7,1.02,.4,1.13,0,1.13);shape.bezierCurveTo(-.4,1.13,-.7,1.02,-.72,.7);shape.closePath()
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.48,bevelEnabled:true,bevelSize:.025,bevelThickness:.015,bevelSegments:3,curveSegments:32});geo.translate(0,0,-.24);return geo
}
export function roughBlockGeometry(width,height,depth,seed=1){
  const geo=new THREE.BoxGeometry(width,height,depth,16,8,12),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=Math.sin(x*34+z*21+seed)*Math.cos(y*29+z*18)*.008;p.setXYZ(i,x+n,y+n*.7,z+n)}geo.computeVertexNormals();return geo
}
export function cookieGeometry(){
  const geo=new THREE.SphereGeometry(1,64,32),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),w=1+.035*Math.sin(a*11)+.018*Math.cos(a*17);p.setXYZ(i,x*.9*w,.16+y*.16+.012*Math.sin(x*23+z*19),z*.9*w)}geo.computeVertexNormals();return geo
}
export function muffinPaperGeometry(){
  const geo=new THREE.CylinderGeometry(.61,.45,.61,96,5,true),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(z,x),w=1+.025*Math.cos(a*36);p.setXYZ(i,x*w,p.getY(i),z*w)}geo.computeVertexNormals();return geo
}
export function muffinCapGeometry(){
  const geo=new THREE.SphereGeometry(1,64,32,0,Math.PI*2,0,Math.PI*.61),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.035*Math.sin(x*17+z*13)*Math.cos(y*14+z*8);p.setXYZ(i,x*.73*n,y*.43*n,z*.73*n)}geo.computeVertexNormals();return geo
}
export function walnutGeometry(){
  const geo=new THREE.SphereGeometry(1,32,24),p=geo.attributes.position
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),ridge=1+.14*Math.cos(z*24+x*6)+.07*Math.sin(x*22+y*13);p.setXYZ(i,x*.11*ridge,y*.07*ridge,z*.22*ridge)}geo.computeVertexNormals();return geo
}
export function glazeRingGeometry(){
  const rings=80,sides=16,positions=[],uv=[],indices=[]
  for(let j=0;j<=rings;j++){const a=j/rings*Math.PI*2;for(let i=0;i<=sides;i++){const b=.04+i/sides*(Math.PI-.08),r=.55+.246*Math.cos(b),drip=(Math.sin(a*7)+Math.sin(a*11))*.003;positions.push(Math.cos(a)*r,.246*Math.sin(b)+drip,Math.sin(a)*r);uv.push(j/rings,i/sides)}}
  for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo
}
export function saladLeafGeometry(seed=0){
  const rows=22,cols=16,positions=[],colors=[],uv=[],indices=[]
  const dark=new THREE.Color('#426f23'),light=new THREE.Color('#a7c858')
  for(let j=0;j<=rows;j++){const v=j/rows;for(let i=0;i<=cols;i++){
    const u=i/cols*2-1,w=.48*Math.pow(Math.sin(Math.PI*v),.55)*(1+.10*Math.sin(v*39+seed))
    const x=u*w,z=(v-.5)*.92,y=.15*Math.sin(v*Math.PI)+Math.abs(u)*(.055*Math.sin(v*40+u*6+seed)+.025*Math.cos(v*65))+.012*Math.cos(u*16)*Math.sin(v*Math.PI)
    positions.push(x,y,z);uv.push(i/cols,v)
    const c=dark.clone().lerp(light,.28+.44*Math.abs(u)+.18*Math.sin(v*9+seed)**2);colors.push(c.r,c.g,c.b)
  }}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1)}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo
}
export function wrapPoint(u,v,progress){
  const t=THREE.MathUtils.smoothstep(progress,0,.6),angle=u*3.4
  const rear=THREE.MathUtils.smoothstep(-v,.62,1),radius=.64*(.88+.12*(v+1)/2)*(1-.94*rear),height=.32*(1-.85*rear)
  // Flatten the cross-section and fold the rear to a closed envelope. The mouth
  // is a diagonal cut, not a large open cylindrical cavity.
  const x=radius*Math.sign(Math.sin(angle))*Math.pow(Math.abs(Math.sin(angle)),.66)
  const y=.36-height*Math.sign(Math.cos(angle))*Math.pow(Math.abs(Math.cos(angle)),.8)
  const z=v*1.15+(v>0?x*.9:0)
  const flatX=u*1.45*Math.sqrt(1-v*v*.5),flatZ=v*1.45*Math.sqrt(1-u*u*.5)
  return [THREE.MathUtils.lerp(x,flatX,t),THREE.MathUtils.lerp(y,.04+Math.sin(u*6+v*4)*.018,t),THREE.MathUtils.lerp(z,flatZ,t)]
}
