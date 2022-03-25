const vshader = `
varying vec4 vPos;
varying vec2 vUv;

// varying vec3 v_center;
// varying vec3 v_point;

void main() {	
  // こっちだと2Dぽくなる
  vPos = modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;

  // vec4 v_point  = projectionMatrix * viewMatrix * modelViewMatrix * vec4(position, 1.0);
  // vec4 v_center = projectionMatrix * viewMatrix * modelViewMatrix * vec4(0.,0.,0., 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `

#include <noise>
#include <radialRainbow>
#include <borders>

#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 uMouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform float uAspect;
uniform float borderWidth;
// texture
uniform sampler2D u_texture1;

varying vec4 vPos;
varying vec2 vUv;

// varying vec3 v_center;
// varying vec3 v_point;


void main (void)
{
  float depth = (vPos.z / vPos.w + 1.0) * 0.5;

  vec2 st = vPos.xy +0.5;

  // 七色
  vec4 bordersColor = radialRainbow(st, u_time);

  // エッジのみ表示する
  bordersColor *= vec4(borders(vUv, borderWidth)) ;

  // vec4 texture1 = texture2D(u_texture1, st);
  // 画像のエッジ伸びるためリピートで回避する
  vec4 texture1 = texture2D(u_texture1, vec2(mod(st.x, 1.0), mod(st.y, 1.0)));

  vec3 color =bordersColor.rgb + texture1.rgb ;

  gl_FragColor =vec4(color,.5) ; 
}
`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
  precision: "mediump",
  autoClear: false,
  // combine: THREE.MixOperation,
  // reflectivity: 0.1,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const geometry = new THREE.BoxGeometry(2, 2, 2);
const uniforms = {
  // uniform に画像追加
  u_texture1: {
    value: new THREE.TextureLoader().load("../../images/di.jpg"),
  },

  u_time: { value: 0.0 },
  uMouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0, y: 0 } },
  uAspect: { value: window.innerWidth / window.innerHeight },
  borderWidth: { value: 0.1 },
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
  defines: {
    PR: window.devicePixelRatio.toFixed(1),
  },
  // wireframe: true,
  transparent: true,
  // depthTest: false,
  side: THREE.DoubleSide,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);
// console.log(plane);

const g = new THREE.BoxGeometry(1, 1, 1);
const m = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(g, m);
scene.add(cube);

camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 5;

const controls = new THREE.OrbitControls(camera, renderer.domElement);

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
  uniforms.u_resolution.value.y = window.innerWidth;
  // アスペクト比を設定
  uniforms.uAspect.value = window.innerWidth / window.innerWidth;
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += clock.getDelta();
  renderer.render(scene, camera);
}
