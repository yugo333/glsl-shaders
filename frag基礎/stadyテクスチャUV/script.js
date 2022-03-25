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

vec2 SineWave( vec2 p )
    {
      float tx=0.3477;
      float ty=0.7812;

    // convert Vertex position <-1,+1> to texture coordinate <0,1> and some shrinking so the effect dont overlap screen
    // ここ外すとwaveが反転する
    // p.x=( 0.55*p.x)+0.5;
    // p.y=(-0.55*p.y)+0.5;
    
    // wave distortion
    // * sin(u_time)*0.02ここの値でwave具合を決めれる
    float x = sin( 25.0*p.y + 30.0*p.x + 6.28*tx) * sin(u_time)*0.02;
    float y = sin( 25.0*p.y + 30.0*p.x + 6.28*ty) * sin(u_time)*0.02;
    return vec2(p.x+x, p.y+y);
    }


void main (void)
{
  // 結果を確認するとわかるが、vUvの値いを大きくすると、texture小さくなる
  // これは、uv=(0.,0.),(1.,1.)のピクセル範囲が*2.をすることで広がり,uv=(0.,0.),(2.,2.)になるため
  // u_texture=(0.,0.),(1.,1.)のままのため小さくなる。逆に小さくすると大きくなる。
  vec2 uv = vUv.st;


  // texture2Dのuvに下記の変数を足し込んであげると足し込んだuvがずれるので指定の色の部分だけ場所が変わる
  // vec2(0.02,0.02)引数値が同じ場合float 0.02;でも問題ない
  vec2 displace_r = vec2(0.02,0.02);
  vec2 displace_g = SineWave(uv);
  float displace_b = sin(u_time)*.02;

  // textureの色に対してuv値を決める
  vec3 color;
  color.r = texture2D(u_texture,uv + displace_r).r;
  color.g = texture2D(u_texture,displace_g).g;
  color.b = texture2D(u_texture,uv+displace_b).b;

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
