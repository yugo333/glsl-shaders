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

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;

varying vec2 vUv;
varying vec3 vPosition;

// 普通の丸
float circle(vec2 pt, vec2 center, float radius){
  vec2 p = pt - center;
  return 1.0 - step(radius, length(p));
}

// ボケた丸
float smoothCircle(vec2 pt, vec2 center, float radius, bool smooth){
  vec2 p = pt - center;
  float edg = smooth ? radius * radius * 0.7 : 0.;
  return 1.0 - smoothstep(radius - edg, radius + edg, length(p));
}

// 丸の線
float lineCircle(vec2 pt, vec2 center, float radius, float lineWidth){
  vec2 p = pt - center;
  float halfLineWidth = lineWidth / 2. ;
  return step(radius - halfLineWidth, length(p)) - step(radius + halfLineWidth, length(p));
}


void main (void)
{
  // 普通の丸
  // vec3 color = u_color * circle(vPosition.xy, vec2(0.3), 0.1);
  // ボケたまる
  // vec3 color = u_color * smoothCircle(vPosition.xy, vec2(0.3), 0.3, true);
  // 丸の線
  vec3 color = u_color * lineCircle(vPosition.xy, vec2(0.3), 0.3, 0.01);

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
  u_color: { value: new THREE.Color(0xffff00) },
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
