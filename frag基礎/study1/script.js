const vshader = `
varying vec3 vPos;
varying vec2 vUv;
void main() {	
  vUv =uv;
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
uniform vec2 u_resolution;
uniform vec2 uMouse;
uniform float uAspect;
uniform float uAspectReverse;
uniform float uTime;

varying vec3 vPos;
varying vec2 vUv;

void main (void)
{
  // バックの色
  // vec3 color = vec3(0.0);
  // color.r = clamp(vPos.x, 0.0, 1.0);
  // color.g = clamp(vPos.y, 0.0, 1.0);
  // color.b = clamp(vPos.z, 0.0, 1.0);

  // マウス (position)
  vec2 mouse = (uMouse-0.5)*2.;
  mouse.y *= u_resolution.y/u_resolution.x;

  // sin とtimeを使って結果を玉にかけてあげると収縮する
  float s = sin(uTime)+2.;

  // 玉
  // 0.01/(0からvPosの距離を)
  // float l =  0.01/length(vPos.xy );
  float l = 0.01 / length( (mouse) - vPos.xy )* s;
  // 塗りつぶし
  // l = smoothstep(0.9,1.,l);

  // sin波
  float waveS =0.01 /length(vec2(vPos.x,sin(vPos.x*10.+uTime)*0.3) - vPos.xy);
  // cos波
  float waveC =0.01 /length(vec2(vPos.y,sin(vPos.y*10.+uTime)*0.3) - vPos.xy);

  // アウトプット
  // gl_FragColor = vec4(l,l,l, 1.0);
  // gl_FragColor = vec4(color.xy,l, 1.0);
  
  gl_FragColor = vec4(waveS,waveC,l, 1.0);

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
  uTime: { value: 0.0 },
  uMouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0, y: 0 } },
  uAspect: {
    value: window.innerWidth / window.innerHeight,
  },
  uAspectReverse: {
    value: window.innerHeight / window.innerWidth,
  },
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
  uniforms.uTime.value += clock.getDelta();
  renderer.render(scene, camera);
}
