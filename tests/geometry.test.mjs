import {test} from 'node:test';
import assert from 'node:assert/strict';
import {construct,classify,distance,vertexName} from '../dist/geometry.js';
test('all supported constructible polygons are regular, ordered, closed, and on the given circle',()=>{for(let n=3;n<=256;n++){if(!classify(n).ok)continue;const b=construct(n),v=b.vertices,edge=2*Math.sin(Math.PI/n);assert.equal(v.length,n);for(let i=0;i<n;i++){assert.ok(Math.abs(distance(b.O,v[i])-1)<1e-7,`n=${n} radius ${i}`);assert.ok(Math.abs(distance(v[i],v[(i+1)%n])-edge)<1e-7,`n=${n} edge ${i}`);const angle=Math.atan2(v[(i+1)%n].y,v[(i+1)%n].x)-Math.atan2(v[i].y,v[i].x);assert.ok(Math.abs((angle+2*Math.PI)%(2*Math.PI)-2*Math.PI/n)<1e-7,`n=${n} order ${i}`);}assert.equal(new Set(v.map(p=>p.label)).size,n);assert.ok(v.every(p=>p.label!=='O'));assert.ok(b.steps.length>n);for(const p of b.points)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}});
test('impossible counts are rejected rather than approximated',()=>{for(const n of [7,9,11,13,14,18,19,21,25,27,49,121]){assert.equal(classify(n).kind,'impossible');assert.throws(()=>construct(n));}});
test('range and invalid input are distinguished from mathematical impossibility',()=>{assert.equal(classify(257).kind,'range');assert.equal(classify(65537).kind,'range');for(const n of [0,1,2,-3,3.5,NaN,Infinity])assert.equal(classify(n).kind,'invalid');assert.equal(vertexName(0),'A');assert.equal(vertexName(14),'P');assert.equal(vertexName(25),'A₁');});
test('instructions can be followed in order and every intersection belongs to its named sources',()=>{
 for(let n=3;n<=256;n++){
  if(!classify(n).ok)continue;
  const b=construct(n),points=new Set(),shapes=new Set(),segments=new Set();
  const pair=(a,c)=>[a,c].sort((x,y)=>x-y).join(',');
  for(const step of b.steps){
   for(const id of step.shapes){
    const s=b.shapes[id],inputs=s.type==='circle'?[s.c.id,...s.radiusPoints]:[s.a.id,s.b.id];
    assert.ok(inputs.every(p=>points.has(p)),`n=${n}: referenced point is not yet constructed`);
    if(s.type==='line')assert.ok(segments.has(pair(s.a.id,s.b.id)),`n=${n}: extend only an existing segment`);
    if(s.type==='segment')segments.add(pair(s.a.id,s.b.id));
    shapes.add(id);
   }
   if(step.intersection){
    assert.equal(step.intersection.sources.length,2);
    for(const id of step.intersection.sources){
     assert.ok(shapes.has(id),`n=${n}: intersection source is not yet drawn`);
     const s=b.shapes[id];
     for(const pointId of step.points){const p=b.points[pointId];
      if(s.type==='circle')assert.ok(Math.abs(distance(p,s.c)-s.r)<1e-7,`n=${n}: named point is off its source circle`);
      else assert.ok(Math.abs((s.b.x-s.a.x)*(p.y-s.a.y)-(s.b.y-s.a.y)*(p.x-s.a.x))/distance(s.a,s.b)<1e-7,`n=${n}: named point is off its source line`);
     }
    }
   }else assert.ok(step.tool==='given'||step.tool==='done'||step.shapes.length,`n=${n}: point operation must name its source shapes`);
   for(const id of step.points)points.add(id);
  }
 }
});
