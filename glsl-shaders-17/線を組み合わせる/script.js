const vshader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {	
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
#define PI2 6.28318530718
#define PI 3.14159265359

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

varying vec2 vUv;
varying vec3 vPosition;

float line(float x, float y, float line_width, float edge_width){
  return smoothstep(x-line_width/2.0-edge_width, x-line_width/2.0, y) - smoothstep(x+line_width/2.0, x+line_width/2.0+edge_width, y);
}

float circle(vec2 pt, vec2 center, float radius, float line_width, float edge_thickness){
  pt -= center;
  float len = length(pt);
  //Change true to false to soften the edge
  float result = smoothstep(radius-line_width/2.0-edge_thickness, radius-line_width/2.0, len) - smoothstep(radius + line_width/2.0, radius + line_width/2.0 + edge_thickness, len);

  return result;
}

// 線を描き回転
float sweep(vec2 pt, vec2 center, float radius, float line_width, float edge_thickness){
  // 回転する線
  vec2 d =pt - center;
  float theta =u_time * 2.;
  // 回転するポイントを設定し
  vec2 p = vec2(cos(theta),sin(theta)) * radius;
  // 内積計算させsmoothstepで線を描く
  float h =clamp(dot(d,p)/dot(p,p), 0., 1.);
  float l = length(d - h*p);

  // グラデーション生成
  float gradient = 0.;
  const float gradientAngle = PI *0.5;
  if(length(d)<radius){
    float angle = mod(theta - atan(d.y,d.x),PI2);
    gradient =clamp(gradientAngle - angle, 0., gradientAngle)/gradientAngle * .5;
  }

  
  return gradient + 1. - smoothstep(line_width, line_width + edge_thickness, l);

}

void main (void)
{
  vec3 axisColor = vec3(0.8);
  // 縦横直線生成
  vec3 color =  line(vUv.y, 0.5, 0.001, 0.001) * axisColor;
  color += line(vUv.x, 0.5, 0.001, 0.001) * axisColor;
  // 円の生成
  color += circle(vUv, vec2(0.5), 0.3, 0.002, 0.001) * axisColor;
  color += circle(vUv, vec2(0.5), 0.2, 0.002, 0.001) * axisColor;
  color += circle(vUv, vec2(0.5), 0.1, 0.002, 0.001) * axisColor;
  // グラデーション生成
  color += sweep(vUv, vec2(0.5), 0.3, 0.002, 0.001) * vec3(0.1,0.3,1.);
  gl_FragColor = vec4(color, 1.0); 
}
`;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const geometry = new THREE.PlaneGeometry(2, 2);
const uniforms = {
  u_color: { value: new THREE.Color(0xff0000) },
  u_time: { value: 0.0 },
  u_mouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0, y: 0 } },
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

camera.position.z = 1;

onWindowResize();
if ("ontouchstart" in window) {
  document.addEventListener("touchmove", move);
} else {
  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", move);
}

function move(evt) {
  uniforms.u_mouse.value.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  uniforms.u_mouse.value.y = evt.touches ? evt.touches[0].clientY : evt.clientY;
}

animate();

function onWindowResize(event) {
  const aspectRatio = window.innerWidth / window.innerHeight;
  let width, height;
  if (aspectRatio >= 1) {
    width = 1;
    height = (window.innerHeight / window.innerWidth) * width;
  } else {
    width = aspectRatio;
    height = 1;
  }
  camera.left = -width;
  camera.right = width;
  camera.top = height;
  camera.bottom = -height;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = window.innerWidth;
  uniforms.u_resolution.value.y = window.innerHeight;
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += clock.getDelta();
  renderer.render(scene, camera);
}
