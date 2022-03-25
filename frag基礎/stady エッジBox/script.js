// https://tympanus.net/codrops/2019/12/20/how-to-create-the-apple-fifth-avenue-cube-in-webgl/

const vshader = `
varying vec4 vPos;
varying vec2 vUv;
void main() {	
  // こっちだと2Dぽくなる
  // vPos = modelMatrix * vec4( position, 1.0 );
  vPos = modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;
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
uniform sampler2D u_texture;

varying vec4 vPos;
varying vec2 vUv;


void main (void)
{
  float depth = (vPos.z / vPos.w + 1.0) * 0.5;

  // PR定数を渡すことでデバイス比率を管理しています
  // vec2 res = u_resolution * PR;
  // vec2 st = gl_FragCoord.xy / res.xy -.5;
  // 座標の良い比率を維持
  // st.y *= u_resolution.y / u_resolution.x;
  // これだけでいい
  vec2 st = vPos.xy + 0.5;;

  vec4 bordersColor = radialRainbow(st, u_time);

  //Z値に基づく不透明度 （透過具合は数字で制御するためコメントアウト）
  // float d = clamp(smoothstep(-1.0, 1.0, depth), 0.6, 0.9);
  // bordersColor *= vec4(borders(vUv, 0.011))*d ;

  // エッジのみ表示する
  bordersColor *= vec4(borders(vUv, borderWidth)) ;

  vec3 color =bordersColor.rgb;
  // vec3 color =vec3(0.5);

  gl_FragColor = vec4(color, .5); 
}
`;

const scene = new THREE.Scene();
// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const geometry = new THREE.BoxGeometry(2, 2, 2);
const uniforms = {
  // uniform に画像追加
  u_texture: {
    value: new THREE.TextureLoader().load("../../images/sa1.jpg"),
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
  depthTest: false,
  side: THREE.DoubleSide,
});

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

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
