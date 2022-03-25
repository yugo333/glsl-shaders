const vshader = `
varying vec2 vUv;
void main() {	
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `

#include <noise>

#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 uMouse;
uniform vec2 u_resolution;
uniform float u_time;
// texture
uniform sampler2D u_texture;

varying vec2 vUv;

void main (void)
{
  vec2 uv = vUv.st;

  // モザイク
  // 分割変数
  float division = sin(u_time*.3)*600.;

  // floorは小数点以下削除(切り上げは、ceilを使う)
  // uv.x = floor(uv.x*division)/division;
  // uv.y = floor(uv.y*division)/division;
  // 切り上げと切り捨ての間で設定をする
  uv.x = (floor(uv.x*division)/division + ceil(uv.x*division)/division)/2.;
  uv.y = (floor(uv.y*division)/division + ceil(uv.y*division)/division)/2.;

  vec3 color = texture2D(u_texture,uv).rgb;
  // vec3 color = vec3(uv,0.);

  gl_FragColor = vec4(color, 1.0); 
}
`;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const geometry = new THREE.PlaneGeometry(2, 1.5);
const uniforms = {
  // uniform に画像追加
  u_texture: {
    value: new THREE.TextureLoader().load("../../images/sa1.jpg"),
  },
  u_time: { value: 0.0 },
  uMouse: { value: { x: 0.0, y: 0.0 } },
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

function move(e) {
  uniforms.uMouse.value.x = e.clientX / window.innerWidth;
  uniforms.uMouse.value.y = 1.0 - e.clientY / window.innerHeight;
}

animate();

function onWindowResize(event) {
  const aspectRatio = window.innerWidth / window.innerHeight;
  let width, height;
  if (aspectRatio >= 2 / 1.5) {
    console.log("resize: Use width");
    width = 1;
    height = (window.innerHeight / window.innerWidth) * width;
  } else {
    console.log("resize: Use height");
    height = 1.5 / 2;
    width = (window.innerWidth / window.innerHeight) * height;
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
