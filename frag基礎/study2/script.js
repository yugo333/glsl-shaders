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

float sphere(vec3 pos){
  return length(pos) - 2.;
}

// 法線ベクトル（偏微分）
vec3 sphereNormal(vec3 pos){
  float delta =0.001;
  return normalize(vec3(
    sphere(pos+ vec3(delta,0.,0.)) - sphere(pos - vec3(delta,0.,0.)),
    sphere(pos+ vec3(0.,delta,0.)) - sphere(pos - vec3(0.,delta,0.)),
    sphere(pos+ vec3(0.,0.,delta)) - sphere(pos - vec3(0.,0.,delta))
    ));
}

struct Ray {
  vec3 pos;
  vec3 dir;
};

void main (void)
{
  // バックの色
  vec3 color = vec3(0.0);
  color.r = clamp(vPos.x, 0.0, 1.0);
  color.g = clamp(vPos.y, 0.0, 1.0);
  color.b = clamp(vPos.z, 0.0, 1.0);

  // カメラの上、前方向、横（上と方向から算出外積）のベクトル
  vec3 cp = vec3(0,0,-4.);
  vec3 camera_up =vec3(0.,1.,0.);
  vec3 camera_dir =vec3(0.,0.,1.);
  // 外積（横）
  vec3 camera_side =cross(camera_up,camera_dir);

  Ray ray;
  ray.pos = cp;
  ray.dir = vPos.x * camera_side + vPos.y * camera_up + camera_dir;
  float t = 0. , d ;
  for (int i = 0; i< 64; i++){
    d = sphere(ray.pos);
    if(d <0.001){
      break;
    }

    t += d ;
    ray.pos =cp +t *ray.dir;
  }

  // マウス (position)
  vec2 mouse = (uMouse-0.5)*2.;
  mouse.y *= u_resolution.y/u_resolution.x;

  // light
  // // ライトのポジションとか法線のイメージ
  // vec3 lightDirectional = vec3(0.,0.,1.) ;
  // ライトのポジションをマウスに対応させてみる
  vec3 lightDirectional = vec3(-mouse,1.) ;

  // 物体の法線取得
  vec3 normal = sphereNormal(ray.pos);
  // dotはlightDirectionalのベクトルと球体の法線ベクトルのない積計算
  // powを使うとさらにぽくなる
  // 角度が小さければ小さいほど白くなる
  float l = pow(dot(normal,-lightDirectional),2.);

  if(d < 0.001){
    gl_FragColor = vec4(vec3(l),1.0);
  }


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
