const vshader = `
varying vec3 vPosition;
varying vec2 vUv;

void main() {	
  vPosition = position;
  vUv = uv;
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

// 普通のライン
float line(float a, float b, float line_width){
  float half_line_width = line_width / 2.0;
  // smoothstep(a,b,c)はcがaより小さかったら0.0を返す。cがbより大きかったら1.0を返す。a,bの間なら滑らかに変化する数値を返す
  return step(a - half_line_width, b) - step(a + half_line_width, b);
}

// グラデーション系ライン
float linGradation(float a, float b, float line_width, float lineEdge){
  float half_line_width = line_width / 2.0;
  // smoothstep(a,b,c)はcがaより小さかったら0.0を返す。cがbより大きかったら1.0を返す。a,bの間なら滑らかに変化する数値を返す
  return smoothstep(a - lineEdge, a - half_line_width, b) -
            smoothstep(a + half_line_width, a + lineEdge, b);
}

void main (void)
{
  // 普通のライン
  // vec3 color = u_color * line(vPosition.x,vPosition.y,0.01);
  // グラデーション系ライン
  // vec3 color = u_color * linGradation(vPosition.x,vPosition.y,0.5, 0.9);
  // wave LINE
  // vec3 color = u_color * line(sin(vPosition.x * (PI2*0.5)),vPosition.y,0.01);
  vec3 color = u_color * line(mix(-0.0,0.8,sin(vPosition.x * (PI2/2.)+1.)/2.),vPosition.y,0.01);
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
