const vshader = `
// npm でも良いが今回はチャンク作ってくれてる(My Shader Chunks.js)
#include <noise>

varying vec2 vUv;
varying float vNoise;

uniform float u_time;

void main() {	
  // fragに渡す値、turbulence(乱流、乱数)はchunkからnormalの乱数を生み出す
  // 10. * は、荒さを表現。-.1 * は、noise値大きいため。turbulence(.5 * normal)は、乱数
  // + u_time*0.1乱数をアニメーションさせる0.1は速度調整
  vNoise = 10. * -.1 * turbulence(.5 * normal + u_time*0.1);
  
  // 三次元の値をノイズ関数に入れfloatで返す
  // pnoiseの第一引数で.05はpnoiseの返り値を滑らかなnoiseにし, 5. *で凹凸形状部分際立たせてる
  // vec3(100.)なんでもいい
  float b = 5. * pnoise(.05 * position, vec3(100.));

  // vNoise 乱数と b のpositionからのnoiseを掛けて基準の丸い形から凹凸形状部分のfloatを算出
  float displacement = b - 10. * vNoise;

  // normal * displacementが通常表面から凹凸させた分の距離
  vec3 pos = position + normal * displacement;


  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}
`;
const fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color;
uniform sampler2D u_tex;

varying vec2 vUv;
varying float vNoise;

//https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/

float random3D( vec3 pt, float seed ){
  vec3 scale = vec3( 12.9898, 78.233, 151.7182 );
  return fract( sin( dot( pt + seed, scale ) ) * 43758.5453 + seed ) ;
}

void main (void)
{
  // 3dのランダム関数通す
  float r =  random3D(gl_FragColor.xyz,0.);

  // vNoiseをvUvにただ掛けただけでは発色が微妙なので 2. * してる(数値上げると黒い部分が少なくなる)
  // 1. - は、凸部分が色が出る,記載しないと凸部分が黒くなる
  // vec3 color = vec3(vUv * (1. - 2. * vNoise),0.);
  
  // vec2(x,y)のx部分は使わない高さに対して色を変更するため
  // 1.3 * vNoise 乱数の色具合
  // +r はvNoiseの乱数とは別にランダムな色を表現する事でさらに不規則化させる(なくてもを狩らんけど)
  vec2 uv = vec2(0,1.3 * vNoise +r);
  vec3 color = texture2D(u_tex,uv).rgb;

  gl_FragColor = vec4(color, 1.0);
}
`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
camera.position.z = 100;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const geometry = new THREE.IcosahedronGeometry(20, 4);
const uniforms = {
  u_time: { value: 0.0 },
  u_mouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0, y: 0 } },
  u_color: { value: new THREE.Color(0xb7ff00) },
  u_tex: {
    value: new THREE.TextureLoader().load(
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/explosion.png"
    ),
  },
};

const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
  // wireframe: true,
});

const ball = new THREE.Mesh(geometry, material);
scene.add(ball);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

onWindowResize();
window.addEventListener("resize", onWindowResize, false);

animate();

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
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
