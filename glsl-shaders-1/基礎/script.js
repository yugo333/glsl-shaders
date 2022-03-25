const v_shader = `
  void main(){
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * 0.5 ,1.0);
  }
`;
const f_shader = `
  uniform vec3 u_color;
  //ポジション
  uniform vec3 u_mouse; 
  //画面幅
  uniform vec3 u_resolution;
  uniform float u_time;

  void main() {
    // マウスポジションによって色変更
    // vec3 color = vec3(u_mouse.x/u_resolution.x,0.0,u_mouse.y/u_resolution.y);

    // アニメーションカラー ヒント:uvは0〜1で作られているため0〜1の範囲にしてあげる
    // sin,cosはー1〜1の指定になる
    vec3 color = vec3((sin(u_time)+1.)/2.,0.0,(cos(u_time)+1.)/2.);

    gl_FragColor =vec4(color,1.0);
    // vec4(u_color,1.0).grba; 
    //.grbaをつけるとrgbaの順番を入れ替えれる
  }
`;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const uniforms = {
  u_time: { value: 0.0 },
  u_mouse: { value: { x: 0.0, y: 0.0 } },
  u_resolution: { value: { x: 0.0, y: 0.0 } },
  u_color: { value: new THREE.Color(0xff0000) },
};

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  uniforms: uniforms,
  vertexShader: v_shader,
  fragmentShader: f_shader,
});

const clock = new THREE.Clock();

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

camera.position.z = 1;

onWindowResize();

if ("ontouchstart" in window) {
  document.addEventListener("touchmove", mouseMove);
} else {
  window.addEventListener("resize", onWindowResize, false);
  document.addEventListener("mousemove", mouseMove);
}

animate();

function mouseMove(evt) {
  // マウス座標取得
  uniforms.u_mouse.value.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  uniforms.u_mouse.value.y = evt.touches ? evt.touches[0].clientY : evt.clientY;
}

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
  renderer.render(scene, camera);
  uniforms.u_time.value = clock.getElapsedTime();
}
