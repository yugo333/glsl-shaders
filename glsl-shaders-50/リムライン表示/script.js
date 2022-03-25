const vshader = `
// light チャンク
#include <common>
#include <lights_pars_begin>

varying vec3 vPosition;
varying mat4 vModelMatrix;
varying vec3 vWorldNormal;
varying vec3 vLightIntensity;

void main() {
  // ライト変数追加チャンク 
  #include <simple_lambert_vertex>
  // 追加時の決まり文句
  vLightIntensity = vLightFront + ambientLightColor;

  // normalをmodelMatrixでワールド座標にする
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vPosition = position;
  // modelMatrixはオブジェクト座標からワールド座標へ変換する
  vModelMatrix = modelMatrix;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
uniform vec3 u_color;
uniform vec3 u_light_position;
uniform vec3 u_rim_color;
uniform float u_rim_strength;
uniform float u_rim_width;

// Example varyings passed from the vertex shader
varying vec3 vPosition;
varying vec3 vWorldNormal;
varying mat4 vModelMatrix;
varying vec3 vLightIntensity;

void main()
{
  // ワールドポシションを取得(ワールドポジションのobjectに当たる光の強さ取得するため)
  vec3 worldPosition = ( vModelMatrix * vec4( vPosition, 1.0 )).xyz;
  // ライトのポジションとobjectのベクトル計算(ベクトルの場合はnormalize)
  vec3 lightVector = normalize( u_light_position - worldPosition );
  // カメラとworldPositionのベクトル計算(ベクトルの場合はnormalize)
  vec3 viewVector = normalize(cameraPosition - worldPosition);

  // dot(vWorldNormal, viewVector)内積計算 (dot(a,b)=cos(θ)角度でる)
  // clamp(dot(vWorldNormal, viewVector), 0.0, 1.0))は、0または0~1を返す
  //  u_rim_width - clamp(dot(vWorldNormal, viewVector), 0.0, 1.0))でcameraからRay飛ばしてぶつかった
  // worldPositionの角度計算してそれに対してエッジの固定値を引いてあげる
  float rimndotv =  max(0.0, u_rim_width - clamp(dot(vWorldNormal, viewVector), 0.0, 1.0));

  // uniformのrim colorとstrengthを計算したrimndotvに組み合わせえエッジの色や強さを決める
  vec3 rimLight = rimndotv * u_rim_color * u_rim_strength;
  // ライトとカラーを組み合わせエッジ部分を足し込む
  vec3 color = vLightIntensity * u_color + rimLight;

  gl_FragColor = vec4( color, 1.0 );

}
`;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// ライトの設定
const light = new THREE.DirectionalLight(0xffda6f, 0.1);
light.position.set(0, 1.25, 1.25);
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ユニフォームでライト渡す
const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib["common"],
  THREE.UniformsLib["lights"],
]);

uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
uniforms.u_light_position = { value: light.position.clone() };
// 下記の値変更でリムの漢字変えれる
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };

const geometry = new THREE.TorusKnotGeometry(1, 0.5, 100, 16);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: vshader,
  fragmentShader: fshader,
  wireframe: false,
  // ここ忘れないで
  lights: true,
});

const knot = new THREE.Mesh(geometry, material);
scene.add(knot);

camera.position.z = 5;

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
