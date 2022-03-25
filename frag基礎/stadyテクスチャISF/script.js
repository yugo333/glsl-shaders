/*ISF から既存のコードをもらってくる(シェーダ内部コードは置き換えてるだけ)
  by VIDVOX のアカウントのものであれば著作権問題ない
  https://editor.isf.video/shaders/5e7a7f797c113618206dde42

*/

/*

/*{
  // uniform系
  "CREDIT": "by VIDVOX",
  "CATEGORIES": [
    "Stylize"
  ],
  "INPUTS": [
    {
      "NAME": "inputImage",
      "TYPE": "image"
    },
    {
      "NAME": "sides",
      "TYPE": "float",
      "MIN": 1,
      "MAX": 32,
      "DEFAULT": 6
    },
    {
      "NAME": "angle",
      "TYPE": "float",
      "MIN": -1,
      "MAX": 1,
      "DEFAULT": 0
    },
    {
      "NAME": "slidex",
      "TYPE": "float",
      "MIN": 0,
      "MAX": 1,
      "DEFAULT": 0
    },
    {
      "NAME": "slidey",
      "TYPE": "float",
      "MIN": 0,
      "MAX": 1,
      "DEFAULT": 0
    },
    {
      "NAME": "center",
      "TYPE": "point2D",
      "DEFAULT": [
        0,
        0
      ]
    }
  ]

  
const float tau = 6.28318530718;

void main() {
  // normalize to the center
	vec2 loc = RENDERSIZE * vec2(isf_FragNormCoord[0],isf_FragNormCoord[1]);
	float r = distance(center, loc);
	float a = atan ((loc.y-center.y),(loc.x-center.x));
	
	// kaleidoscope
	a = mod(a, tau/sides);
	a = abs(a - tau/sides/2.);
	
	loc.x = r * cos(a + tau * angle);
	loc.y = r * sin(a + tau * angle);
	
	loc = (center + loc) / RENDERSIZE;
	
	loc.x = mod(loc.x + slidex, 1.0);
	loc.y = mod(loc.y + slidey, 1.0);

	// sample the image
	if (loc.x < 0.0)	{
		loc.x = mod(abs(loc.x), 1.0);
	}
	if (loc.y < 0.0)	{
		loc.y = mod(abs(loc.y),1.0);
	}
	if (loc.x > 1.0)	{
		loc.x = mod(abs(1.0-loc.x),1.0);
	}
	if(loc.y > 1.0)	{
		loc.y = mod(abs(1.0-loc.y),1.0);	
	}
	gl_FragColor = IMG_NORM_PIXEL(inputImage, loc);;
}

}*/

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

const float tau = 6.28318530718;
uniform float sides;
uniform float slidex;
uniform float slidey;
uniform vec2 center;

void main (void)
{

    // normalize to the center
    vec2 loc = u_resolution * vec2(vUv);
    float r = distance(center, loc);
    float a = atan ((loc.y-center.y),(loc.x-center.x));
    
    // kaleidoscope
    a = mod(a, tau/sides);
    a = abs(a - tau/sides/2.);

    float angle = u_time*.1;
    
    loc.x = r * cos(a + tau * angle);
    loc.y = r * sin(a + tau * angle);
    
    loc = (center + loc) / u_resolution;
    
    loc.x = mod(loc.x + slidex, 1.0);
    loc.y = mod(loc.y + slidey, 1.0);
  
    // sample the image
    if (loc.x < 0.0)	{
      loc.x = mod(abs(loc.x), 1.0);
    }
    if (loc.y < 0.0)	{
      loc.y = mod(abs(loc.y),1.0);
    }
    if (loc.x > 1.0)	{
      loc.x = mod(abs(1.0-loc.x),1.0);
    }
    if(loc.y > 1.0)	{
      loc.y = mod(abs(1.0-loc.y),1.0);	
    }

    vec3 color = texture2D(u_texture,loc).rgb;
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
  sides: { value: 6.0 },
  slidex: { value: 0.0 },
  slidey: { value: 0.0 },
  center: { value: { x: 0, y: 0 } },
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
  uniforms.center.value.x = window.innerWidth / 2;
  uniforms.center.value.y = window.innerHeight / 2;
}

function animate() {
  requestAnimationFrame(animate);
  uniforms.u_time.value += clock.getDelta();
  renderer.render(scene, camera);
}
