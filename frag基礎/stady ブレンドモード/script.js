const vshader = `
varying vec3 vPos;
varying vec2 vUv;
void main() {	
  vPos = position;
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
uniform float uAspect;
// texture
uniform sampler2D u_texture;

varying vec3 vPos;
varying vec2 vUv;

vec3 blendScreen(vec3 base, vec3 blend){
  vec3 color =base * (1. - blend) * blend;
  return color;
}

void main (void)
{

  //パターン1 
  // ストライプ(加算合成.)説明してくれてるけどあんまりわからない https://www.youtube.com/watch?v=2_IqqR2csLE
  // // 縦しま
  // vec3 color1 = vec3(sin(vPos.x * 10.));
  // // 横しま
  // vec3 color2 = vec3(sin(vPos.y * 10.));

  // テクスチャーも組み合わせれる
  // vec3 color1 = vec3(sin(vPos.x * 10.+u_time));
  // vec3 color2 = texture2D(u_texture,vUv).rgb;

  // パターン2
  // vec3 color1 = vec3(sin(vPos.x * 90.));
  // vec3 color2 = vec3(sin(vPos.y * 10.+u_time));

  // パターン3
  // vec3 color1 = vec3(sin(vPos.x * vPos.y * 90.));
  // vec3 color2 = vec3(sin(vPos.y * 10.+u_time));

  // パターン4
  // vec3 color1 = vec3(sin(vPos.x * vPos.y * 90.));
  // vec3 color2 = vec3(sin(vPos.x * 10.+u_time));

  // パターン5
  // vec3 color1 = vec3(sin(vPos.x * cos(vPos.y) * 20.));
  // vec3 color2 = vec3(sin(vPos.y * 2.+u_time));

  // パターン6
  // vec3 color1 = vec3(fract(vPos.x  * 20.));
  // vec3 color2 = vec3(sin(vPos.x * 2.+u_time));
  
  // パターン7
  // vec3 color1 = vec3(fract(vPos.y *2.+ u_time));
  // vec3 color2 = vec3(sin(vPos.x * 2.+u_time));
  
  // パターン7
  // vec3 color1 = vec3(length(vPos)* 1.0 + sin(u_time));
  // color1 += texture2D(u_texture,vUv).rgb;
  // vec3 color2 = vec3(sin(vPos.x * 2.+u_time));
  
  // // パターン8
  // vec3 color1 = vec3(sin(length(vPos)* 1.0 + abs(sin(u_time))));
  // // color1 /= texture2D(u_texture,vUv).rgb;
  // vec3 color2 = vec3(sin(length(vPos)* 1.0 + (sin(u_time))));
  // color2 /= snoise(vec3(vPos.x*10., vPos.y*10., u_time * 0.1));
  // color2 += texture2D(u_texture,vUv).rgb;

  // // パターン9
  // vec3 color1 = vec3(sin(length(vPos)* 10.0 + (sin(u_time)*3.)));
  // // color1 /= texture2D(u_texture,vUv).rgb;
  // vec3 color2 = vec3(sin(length(vPos)* 10.0 + (sin(u_time)*3.)));
  // color2 /= snoise(vec3(vPos.x*10., vPos.y*10., u_time * 0.1));
  // color2 += texture2D(u_texture,vUv).rgb;

  // // パターン10
  vec3 color1 = vec3(sin(length(vPos)* 10.0 + (sin(u_time)*3.)));
  // color1 /= texture2D(u_texture,vUv).rgb;
  vec3 color2 = vec3(sin(length(vPos)* 10.0 + (sin(u_time)*3.)));
  color2 /= snoise(vec3(vPos.x*10., vPos.y*10., u_time * 0.1));
  color2 += texture2D(u_texture,vUv).rgb;
  vec3 color3 = vec3(1.,.5,0.);
  color2 += color3;

  // 規則的にダイヤ型が並ぶ
  // vec3 color =vec3(color1 + color2);
  // 規則的に四角が並ぶ(幅広め)
  vec3 color =vec3(color1 * color2);
  // 規則的にダイヤ型の鱗やレンガのような並びになる
  // vec3 color =vec3(abs(color1 - color2));
  // 二種類の模様が規則的に並ぶ
  // vec3 color = blendScreen(color1 , color2);
  // 均等に並ぶ（幅狭め）
  // vec3 color =vec3(length(color1 * color2));

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
  uAspect: { value: window.innerWidth / window.innerHeight },
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
  uniforms.u_resolution.value.y = window.innerWidth;
  // アスペクト比を設定
  uniforms.uAspect.value = window.innerWidth / window.innerWidth;
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += clock.getDelta();
  renderer.render(scene, camera);
}
