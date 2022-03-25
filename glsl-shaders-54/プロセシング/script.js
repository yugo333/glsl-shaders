const vshader = `
varying vec3 vNormal;
varying vec2 vUv;
varying mat4 vModelMatrix;

void main() {
  vUv = uv;
  vNormal = normal;
  vModelMatrix = modelMatrix;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );  
}
`;

const fshader = `
varying vec2 vUv;
varying vec3 vNormal;
varying mat4 vModelMatrix;

uniform vec3 u_light;
uniform vec2 u_resolution;
uniform vec3 u_color;


void main(){
  // 擬似ライトのベクトル計算
	vec3 lightVector = normalize(u_light);

	vec3 normalVector = normalize((vModelMatrix * ( vec4(vNormal, 1.0))).xyz);

  // dotでライトと法線の角度計算して1.0から計算結果までの値を返す(マイナス値になる可能性もあるので考慮する)
	float lightIntensity = clamp(0.0, 1.0, dot(lightVector, normalVector)) + 0.2;


	vec3 color = lightIntensity * u_color ;
	gl_FragColor = vec4(color, 1.0);
}
`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const uniforms = {};
uniforms.u_light = { value: new THREE.Vector3(0.5, 0.8, 0.5) };
uniforms.u_resolution = { value: new THREE.Vector2(1.0, 1.0) };
uniforms.u_color = { value: new THREE.Color(0xaa6611) };

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 2;

const controls = new THREE.OrbitControls(camera, renderer.domElement);

const renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
  depthBuffer: false,
  stencilBuffer: false,
  magFilter: THREE.NearestFilter,
  minFilter: THREE.NearestFilter,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping,
});

composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
renderPass.renderToScreen = true;
var copyPass = new THREE.ShaderPass(THREE.CopyShader);
copyPass.renderToScreen = true;
composer.addPass(renderPass);
composer.addPass(copyPass);

onWindowResize();
if (!("ontouchstart" in window))
  window.addEventListener("resize", onWindowResize, false);

animate();

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}
