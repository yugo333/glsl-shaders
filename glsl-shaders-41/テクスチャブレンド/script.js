const vshader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {	
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;
const fshader = `
#define PI 3.141592653589
#define PI2 6.28318530718

uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_time;
// texture
uniform sampler2D u_tex_1;
uniform sampler2D u_tex_2;
uniform float u_duration;

varying vec2 vUv;
varying vec3 vPosition;



void main (void)
{
  // 中心がゼロのvec2から距離をfloatで出す（vUvの場合は0〜1なのでー1〜1に変換する）
  vec2 p = vPosition.xy;
  float len = length(p);

  // 波動の調整
  // p/len * 0.03で波の放射状に広がる値を制御（波の勢いを数値を変えると変更できる）
  // len * 12.で波の数を設定してる（小さくするとシンプルにトランポリンみたいになり、大きくすると波動になる）
  vec2 ripple = vUv + (p/len)*cos(len*12.0-u_time*4.0)*0.03;


  // 波動を動かす周期の設定
  // delta=0ならシンプルにずっと動き続ける
  float delta = 0.;
  // modはx-y*floor(x/y)を返す
  // float delta = u_time/ u_duration;

  // 画像に対して波動アニメーションを割り当てる
  // 矢印押されたら動く(ボタン押した時だけアニメーション)
  vec2 uv = mix(ripple, vUv, delta);
  vec3 col1 = texture2D( u_tex_1, uv).rgb;
  vec3 col2 = texture2D( u_tex_2, uv).rgb;

  // デルタの値と中心から外のlenでsmoothさせ
  // 画像を切り替える
  // 矢印押されたら動く(ボタン押した時だけアニメーション)
  float fade = smoothstep(delta*1.5, delta*2.5, len);
  vec3 color = mix(col1, col2, fade);

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
  u_tex_1: { value: null },
  u_tex_2: { value: null },
  u_duration: { value: 2.0 },
  u_time: { value: 0.0 },
  u_mouse: { value: { x: 0.0, y: 0.0 } },
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

function move(evt) {
  uniforms.u_mouse.value.x = evt.touches ? evt.touches[0].clientX : evt.clientX;
  uniforms.u_mouse.value.y = evt.touches ? evt.touches[0].clientY : evt.clientY;
}

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
  const delta = clock.getDelta();
  if (uniforms.u_time.value < uniforms.u_duration.value) {
    uniforms.u_time.value += delta;
  } else {
    uniforms.u_time.value = uniforms.u_duration.value;
  }
  renderer.render(scene, camera);
}

let index = 0;
const images = [];
const loader = new THREE.TextureLoader();
loader.setPath("https://s3-us-west-2.amazonaws.com/s.cdpn.io/2666677/");
loadNextImage(loader);

function loadNextImage(loader) {
  index++;
  if (index > 5) {
    index = 0;
    uniforms.u_tex_1.value = images[0];
    uniforms.u_tex_2.value = images[1];
    uniforms.u_time.value = 0;

    const prev = document.getElementById("prev");

    prev.onclick = function () {
      uniforms.u_time.value = 0;

      if (index == 4) {
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[4];
      } else if (index < 0) {
        index = 4;
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[4];
      } else {
        uniforms.u_tex_1.value = images[index + 1];
        uniforms.u_tex_2.value = images[index];
      }
      const msg = document.getElementById("msg");
      msg.style.display = "none";
      index--;
    };

    const next = document.getElementById("next");

    next.onclick = function () {
      uniforms.u_time.value = 0;

      index++;
      if (index >= 5) {
        index = 0;
        uniforms.u_tex_1.value = images[0];
        uniforms.u_tex_2.value = images[1];
      } else if (index == 4) {
        uniforms.u_tex_1.value = images[4];
        uniforms.u_tex_2.value = images[0];
      } else {
        uniforms.u_tex_1.value = images[index];
        uniforms.u_tex_2.value = images[index + 1];
      }
      const msg = document.getElementById("msg");
      msg.style.display = "none";
    };

    animate();
  } else {
    loader.load(`sa${index}.jpg`, function (tex) {
      images.push(tex);
      loadNextImage(loader);
    });
  }
}
