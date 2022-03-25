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
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
// texture
uniform sampler2D u_texture;
uniform float u_duration;

varying vec2 vUv;
varying vec3 vPosition;

// 通常の回転関数
// vec2 rotation(vec2 pt, float theta){
//   float c = cos(theta);
//   float s = sin(theta);
//   mat2 mat =mat2(c,s,-s,c);
//   return mat* pt;
// }

// 回転関数にアスペクト日の項目をつける
vec2 rotation(vec2 pt, float theta, float aspect){
  float c = cos(theta);
  float s = sin(theta);
  mat2 mat =mat2(c,s,-s,c);

  pt.y /= aspect;
  pt = mat* pt;
  pt.y *= aspect;
  return pt;
}

// エッジが引き伸ばされるので補正関数
float inRect(vec2 pt, vec2 bottomLeft, vec2 topRight){
  vec2 s = step(bottomLeft, pt) - step(topRight, pt);
  return s.x * s.y;
}

void main (void)
{
  // 中心がゼロのvec2から距離をfloatで出す（vUvの場合は0〜1なのでー1〜1に変換する）
  vec2 p = vPosition.xy;
  float len = length(p);

  // 波動の調整
  // p/len * 0.03で波の放射状に広がる値を制御（波の勢いを数値を変えると変更できる）
  // len * 12.で波の数を設定してる（小さくするとシンプルにトランポリンみたいになり、大きくすると波動になる）
  vec2 ripple = vUv + p/len * 0.03 * cos(len * 12. - u_time * 4.);

  // 波動を動かす周期の設定
  // delta=0ならシンプルにずっと動き続ける
  // float delta = 0.;
  // modはx-y*floor(x/y)を返す
  float delta = (sin(mod(u_time, u_duration)* (2.*PI / u_duration))+ 1.)/2.;

  vec2 uv = mix(ripple, vUv, delta);
  vec3 color = texture2D(u_texture, uv).rgb;

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
  // 波動アニメーション
  u_duration: { value: 8.0 },
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
