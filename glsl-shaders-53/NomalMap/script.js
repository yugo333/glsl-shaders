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
uniform sampler2D u_diffuse_map;
uniform sampler2D u_normal_map;

void main(){
  // 擬似ライトのベクトル計算
	vec3 lightVector = normalize(u_light);

  // シンプルなnormalVector
  // vModelMatrixは座標のworldPositionこれにnormalかけてベクトル出す
	// vec3 normalVector = normalize((vModelMatrix * vec4(vNormal, 1.0)).xyz);
  // uvテクスチャ使うnormalVector
  vec4 uvNormal =texture2D(u_normal_map,vUv);
	vec3 normalVector = normalize((vModelMatrix * (uvNormal + vec4(vNormal, 1.0))).xyz);

  // dotでライトと法線の角度計算して1.0から計算結果までの値を返す(マイナス値になる可能性もあるので考慮する)
	float lightIntensity = clamp(0.0, 1.0, dot(lightVector, normalVector)) + 0.2;

  // テクスチャMAP
  vec3 t =texture2D(u_diffuse_map,vUv).rgb;

	vec3 color = lightIntensity * u_color * t;
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
uniforms.u_diffuse_map = {
  value: new THREE.TextureLoader().load(
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/bricks-diffuse3.png"
  ),
};
uniforms.u_normal_map = {
  value: new THREE.TextureLoader().load(
    "https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/bricks-normal3.png"
  ),
};

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

onWindowResize();
if (!("ontouchstart" in window))
  window.addEventListener("resize", onWindowResize, false);

animate();

function onWindowResize(event) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
