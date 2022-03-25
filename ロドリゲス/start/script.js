// https://w3e.kanazawa-it.ac.jp/math/physics/category/physical_math/linear_algebra/henkan-tex.cgi?target=/math/physics/category/physical_math/linear_algebra/rodrigues_rotation_matrix.html

const vshader = `
#define PI 3.1415926

uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform float uSpheres;
uniform float uOrder;
uniform float uRingRadius;
uniform float uStoneRotateAngle;
uniform float uShankRadius;

attribute vec3 position;

  vec3 rodriguez(float ringCentralAngle,float theta,float uShankRadius,float uRingRadius){
    // 回転軸方向の単位ベクトルを計算。以下の2つのベクトルに垂直なベクトルが回転軸方向の単位ベクトルとなる。
    // normal vector1
    vec3 vector1 = vec3(
        cos(ringCentralAngle),
        sin(ringCentralAngle),
        0.0
    );
    // normal vector2
    vec3 vector2 = vec3(
        cos(ringCentralAngle),
        sin(ringCentralAngle),
        1.0
    );

    // 回転軸方向の単位ベクトル
    vec3 n = normalize(cross(vector1, vector2));

    // ロドリゲスの回転公式を定義
    mat3 rotationFormula = mat3(
        // 1列目
        n.x * n.x * (1.0 - cos(theta)) + cos(theta), 
        n.x * n.y * (1.0 - cos(theta)) + n.z * sin(theta),
        n.x * n.z * (1.0 - cos(theta)) - n.y * sin(theta),
        // 2列目
        n.x * n.y * (1.0 - cos(theta)) - n.z * sin(theta), 
        n.y * n.y * (1.0 - cos(theta)) + cos(theta),
        n.y * n.z * (1.0 - cos(theta)) + n.x * sin(theta),
        // 3列目
        n.x * n.z * (1.0 - cos(theta)) + n.y * sin(theta),
        n.y * n.z * (1.0 - cos(theta)) - n.x * sin(theta),
        n.z * n.z * (1.0 - cos(theta)) + cos(theta)
    );

    // 回転前のsphere
    vec3 sphere1 = vec3(
        position.x + cos(ringCentralAngle) * uShankRadius,
        position.y + sin(ringCentralAngle) * uShankRadius,
        position.z
    );

    // 回転後のsphere
    // 上記の回転公式を用いてsphereを回転させる
    vec3 sphere2 = rotationFormula * sphere1;
    // 最終的な位置にsphereを配置する
    return vec3(sphere2.x + uRingRadius * cos(ringCentralAngle),sphere2.y + uRingRadius * sin(ringCentralAngle),sphere2.z );
  }



void main()
{
    // リングの中心角。x座標・sphere・リング中心が成す角を表す。
    float ringCentralAngle = uOrder / uSpheres * PI * 2.0;

    // 回転させる角度を定義（1つのsphereごとに何度回転させるか）
    float theta = uStoneRotateAngle * uOrder;
    // ロドリゲス(中心角、回転角,Torus太さ、Torus Radius)
    vec3 pos = rodriguez(ringCentralAngle,theta,uShankRadius,uRingRadius);

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos ,1.);
}
`;

const fshader = `
void main(){
	gl_FragColor = vec4(1.,1.,0., 1.0);
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

camera.position.z = -50;

const controls = new THREE.OrbitControls(camera, renderer.domElement);

const radiusSize = 4;
const tubeSize = 1;

// ベースリングモデル
const torusGeometry = new THREE.TorusBufferGeometry(
  radiusSize,
  tubeSize,
  20,
  100,
  Math.PI * 2
);
torusGeometry.computeBoundingSphere();
const torusMaterial = new THREE.MeshNormalMaterial({});
torusMaterial.wireframe = true;
const torus = new THREE.Mesh(torusGeometry, torusMaterial);
const torusCenter = torus.geometry.boundingSphere.center;

scene.add(torus);

const spheres = 40;
const spheresGroup = new THREE.Group();
for (let i = 0; i < spheres + 1; i++) {
  const sphereGeometry = new THREE.TetrahedronGeometry(0.5, 0);
  const sphereMaterial = new THREE.RawShaderMaterial({
    vertexShader: vshader,
    fragmentShader: fshader,
    uniforms: {
      uSpheres: { value: spheres },
      uRingOriginPos: { value: torusCenter },
      uOrder: { value: i },
      uRingRadius: { value: radiusSize },
      uShankRadius: { value: tubeSize },
      uStoneRotateAngle: { value: 1 },
    },
  });
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  spheresGroup.add(sphere);
}
scene.add(spheresGroup);

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
