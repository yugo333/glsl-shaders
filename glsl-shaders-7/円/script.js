const vshader = `
varying vec3 v_Position;

void main() {
  v_Position = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;

varying vec3 v_Position;

void main (void)
{

  // length
  // 始点を(0.0, 0.0)と仮定した時に、引数までどれくらい距離があるか返す
  // float a = length(vec2(1.0, 1.0)); // => 1.414...

  // step
  // 引数でしきい値、値 をとる
  // しきい値より少なかったら0
  // しきい値より多かったら1

  // length(v_Position.xy)
  // これで円形のグラデーションになるcolor*length(v_Position.xy)
  // 決まり文句でいい

  // step(0.5,length(v_Position.xy))
  // 0.5より大きいか小さいかでstep関数を使い0.0もしくは1.0を返すことにより、くっきりとした丸になる
  // 0.5を変更すると丸の大きさが変わる

  // 1.0 - step(0.5,length(v_Position.xy));
  // 1.0を引く形にすることで外側が黒えんが黄色になる

  // vec3(1.0,1.0,0.0) * inCircle;
  // inCircle= 0.0 or 1.0のため黒か黄色になる

  float inCircle = 1.0 - step(0.5,length(v_Position.xy));
  vec3 color = vec3(1.0,1.0,0.0) * inCircle;
  
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
  u_color_a: { value: new THREE.Color(0xff0000) },
  u_color_b: { value: new THREE.Color(0x00ffff) },
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
