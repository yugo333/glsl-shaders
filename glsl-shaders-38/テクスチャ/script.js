const vshader = `
varying vec2 vUv;
void main() {	
  vUv = uv;
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

varying vec2 vUv;

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
  // 左右反転
  // vec2 uv = vec2(1. - vUv.x, vUv.y);
  // 上下反転
  // vec2 uv = vec2( vUv.x,1. - vUv.y);
  // 回転処理
  vec2 center = vec2(.5);
  // vec2 uv = rotation(vUv-center, PI/2., 2./1.5)+ center;
  vec2 uv = rotation(vUv-center, u_time, 2./1.5)+ center;


  // 大きさはあくまでPlaneGeometryに依存してる(アスペクト比)
  vec3 color = texture2D(u_texture,uv).rgb;

  // uv結果がゼロ未満のuv値である場合、エッジが引き伸ばされるので補正関数呼び出す
  vec3 bg =vec3(0.);
  float t = inRect(uv, vec2(0.), vec2(1.));
  color = mix(bg, color, t);

  // rgbのgbだけを0.0にすると赤になる
  // color.yz = vec2(0.);

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
