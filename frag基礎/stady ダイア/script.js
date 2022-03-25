const vshader = `
varying vec4 vPos;
varying vec2 vUv;

// varying vec3 v_center;
// varying vec3 v_point;

void main() {	
  // こっちだと2Dぽくなる
  vPos = modelViewMatrix * vec4( position, 1.0 );
  vUv = uv;

  // vec4 v_point  = projectionMatrix * viewMatrix * modelViewMatrix * vec4(position, 1.0);
  // vec4 v_center = projectionMatrix * viewMatrix * modelViewMatrix * vec4(0.,0.,0., 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}

`;
const fshader = `

precision highp float;

//uniform vec3 diamondVertexes[ diamondFaceCount * 3 ];
uniform int diamondFaceCount;
uniform sampler2D diamondVertexTexture;

uniform vec3 cameraPos;
uniform vec3 cameraDir;

uniform bool gammaCorrection;
uniform float refractiveIndex;
float invRefractiveIndex;
uniform vec2 resolution;

const float EPS = 0.001;

uniform vec3 diamondDiffuseColor;
uniform vec3 diamondSpecularColor;

// 上方向からの光源
const vec3 lightDir1 = vec3( 0.48666426339228763, 0.3244428422615251, 0.8111071056538127 );

// 下方向からの光源
const vec3 lightDir2 = vec3( -0.48666426339228763, -0.3244428422615251, -0.8111071056538127 );


float det( vec3 a, vec3 b, vec3 c ) {
  return (a.x * b.y * c.z)
      + (a.y * b.z * c.x)
      + (a.z * b.x * c.y)
      - (a.x * b.z * c.y)
      - (a.y * b.x * c.z)
      - (a.z * b.y * c.x);
}

struct Intersect {
  bool isHit;
  bool isFront;
  vec3 position;
  float distance;
  vec3 normal;

  int material;
  vec3 color;
};

struct Plane {
  vec3 position;
  vec3 normal;
  //vec3 color;
};

const int DIAMOND_MATERIAL = 0;
const int FLOOR_MATERIAL = 1;

float frag;
float texShift;

void rayIntersectsTriangle( vec3 origin, vec3 ray, vec3 v0, vec3 v1, vec3 v2, inout Intersect nearest ) {

  vec3 invRay = -ray;
  vec3 edge1 = v1 - v0;
  vec3 edge2 = v2 - v0;

  float denominator =  det( edge1, edge2, invRay );
  if ( denominator == 0.0 ) return;

  float invDenominator = 1.0 / denominator;
  vec3 d = origin - v0;

  float u = det( d, edge2, invRay ) * invDenominator;
  if ( u < 0.0 || u > 1.0 ) return;

  float v = det( edge1, d, invRay ) * invDenominator;
  if ( v < 0.0 || u + v > 1.0 ) return;

  float t = det( edge1, edge2, d ) * invDenominator;
  if ( t < 0.0 || t > nearest.distance ) return;

  nearest.isHit    = true;
  nearest.position = origin + ray * t;
  nearest.distance = t;
  nearest.normal   = normalize( cross( edge1, edge2 ) ) * sign( invDenominator );
  nearest.material = DIAMOND_MATERIAL;
  //nearest.color  = diamondDiffuseColor;
  nearest.isFront  = invDenominator > 0.0;
  
}

void rayIntersectPlane( vec3 origin, vec3 ray, Plane plane, inout Intersect nearest ) {

  float d = -dot( plane.position, plane.normal );
  float v = dot( ray, plane.normal );
  float t = -( dot( origin, plane.normal ) + d ) / v;
  if( t > 0.0 && t < nearest.distance ) {

    nearest.isHit    = true;
    nearest.position = origin + ray * t;
    nearest.normal   = plane.normal;
    nearest.distance = t;
    //nearest.color  = plane.color;
    nearest.material = FLOOR_MATERIAL;

  }

}

void getRayColor( vec3 origin, vec3 ray, inout Intersect nearest ) {

  nearest.isHit = false;
  nearest.distance = 1.0e+30;

  // Plane
  Plane plane;
  plane.position = vec3( 0.0, 0.0, 0.0 );
  plane.normal   = vec3( 0.0, 1.0, 0.0 );
  //plane.color = vec3(1.0);
  rayIntersectPlane( origin, ray, plane, nearest );

  float pu = texShift;
  float pv = 0.5;

  // diamond
  for( int i = 0; i < VERTEX_TEXTURE_WIDTH; i++ ) {

    if ( i >= diamondFaceCount ) break;

    vec3 v0 = texture2D( diamondVertexTexture, vec2( pu, pv ) ).xyz;
    pu += frag;

    vec3 v1 = texture2D( diamondVertexTexture, vec2( pu, pv ) ).xyz;
    pu += frag;

    vec3 v2 = texture2D( diamondVertexTexture, vec2( pu, pv ) ).xyz;
    pu += frag;

    rayIntersectsTriangle( origin, ray, v0, v1, v2, nearest );

  }

  if ( nearest.isHit ) {

    if ( nearest.material == DIAMOND_MATERIAL ) {

      float diffuse1 = clamp( dot( lightDir1, nearest.normal ), 0.1, 1.0 );
      float diffuse2 = clamp( dot( lightDir2, nearest.normal ), 0.1, 1.0 );
      nearest.color = diamondDiffuseColor * clamp( diffuse1 + diffuse2, 0.0, 1.0 );

      float specular1 = pow( clamp( dot( reflect( lightDir1, nearest.normal ), ray ), 0.0, 1.0 ), 100.0 );
      float specular2 = pow( clamp( dot( reflect( lightDir2, nearest.normal ), ray ), 0.0, 1.0 ), 100.0 );
      nearest.color += diamondSpecularColor * clamp( specular1 + specular2, 0.0, 1.0 );

    }

    if ( nearest.material == FLOOR_MATERIAL ) {

      float diffuse1 = clamp( dot( nearest.normal, lightDir1 ), 0.1, 1.0 );
      float diffuse2 = clamp( dot( nearest.normal, lightDir2 ), 0.1, 1.0 );
      float d = diffuse1 + diffuse2;
      float m = mod( nearest.position.x, 2.0 );
      float n = mod( nearest.position.z, 2.0 );
      if ( ( m > 1.0 && n > 1.0 ) || ( m < 1.0 && n < 1.0 ) ) d *= 0.1;
      nearest.color = vec3( d );

    }

    nearest.color -= clamp( 0.05 * nearest.distance, 0.0, 0.6 );

  } else {

    nearest.color = vec3( 0.0 );

  }

}

void main(void) {

  // calc consts
  invRefractiveIndex = 1.0 / refractiveIndex;
  frag = 1.0 / float( VERTEX_TEXTURE_WIDTH );
  texShift = 0.5 * frag;

  // fragment position
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / min( resolution.x, resolution.y );

  // camera and ray
  vec3 cPos  = cameraPos;
  vec3 cDir  = cameraDir;
  vec3 cSide = normalize( cross( cDir, vec3( 0.0, 1.0 ,0.0 ) ) );
  vec3 cUp   = normalize( cross( cSide, cDir ) );
  float targetDepth = 1.3;
  vec3 ray = normalize( cSide * p.x + cUp * p.y + cDir * targetDepth );

  vec3 color = vec3( 0.0 );
  Intersect nearest;
  float alpha = 1.0;

  for ( int i = 0; i < 5; i++ ) {

    getRayColor( cPos, ray, nearest );
    color += clamp( nearest.color, 0.0, 1.0 ) * alpha;

    alpha *= 0.99;

    if ( nearest.material == DIAMOND_MATERIAL ) {

      ray = refract( ray, nearest.normal, nearest.isFront ? invRefractiveIndex : refractiveIndex );
      cPos = nearest.position - nearest.normal * EPS;

      if ( ray == vec3( 0.0 ) ) {

        ray = reflect( ray, nearest.normal );
        cPos = nearest.position + nearest.normal * EPS;

      }

    }

    if ( nearest.material == FLOOR_MATERIAL ) {

      ray = reflect( ray, nearest.normal );
      cPos = nearest.position + nearest.normal * EPS;

    }

    ray = normalize( ray );

    if ( !nearest.isHit ) break;

  }

  color = clamp( color, 0.0, 1.0 );

  if ( gammaCorrection ) {

    gl_FragColor = vec4( pow( color, vec3( 1.0 / 2.2 ) ), 1.0 );

  } else {

    gl_FragColor = vec4( color, 1.0 );

  }

}

`;

var camera, dummyCamera, scene, controls, renderer;
var geometry, material, mesh;
var mouse = new THREE.Vector2(0.5, 0.5);
var canvas;
var stats;

var config = {
  saveImage: function () {
    renderer.render(scene, dummyCamera);
    window.open(canvas.toDataURL());
  },

  camera: "Auto Rotate",
  gammaCorrection: false,
  refractiveIndex: 1.42,

  diamond: "round_brilliant",
  diamondDiffuseColor: "#590606",
  diamondSpecularColor: "#ff6666",

  resolution: [window.innerWidth, window.innerHeight],
};
var diamondDiffuseColorVector = new THREE.Vector3();
var diamondSpecularColorVector = new THREE.Vector3();

var diamond = {
  faceCount: 0,
  vertexTexture: new THREE.DataTexture(
    new Float32Array(1),
    1,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  ),
};

var VERTEX_TEXTURE_WIDTH = 512;

init();

function init() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(35, 800 / 600); //new THREE.Camera();
  camera.position.set(
    0.5952697396278381,
    2.9264581203460693,
    0.45332589745521545
  );
  camera.lookAt(
    new THREE.Vector3(
      0.34052577821311814,
      1.9785592579218645,
      0.26203224399464353
    )
  );

  dummyCamera = new THREE.Camera();

  updateVertexTexture("models/" + config.diamond + ".obj", diamond);

  setColorVectorFromHex(config.diamondDiffuseColor, diamondDiffuseColorVector);
  setColorVectorFromHex(
    config.diamondSpecularColor,
    diamondSpecularColorVector
  );

  geometry = new THREE.IcosahedronGeometry(10, 0);
  material = new THREE.ShaderMaterial({
    uniforms: {
      cameraPos: { type: "v3", value: camera.getWorldPosition() },
      cameraDir: { type: "v3", value: camera.getWorldDirection() },

      gammaCorrection: { type: "i", value: config.gammaCorrection },
      resolution: {
        type: "v2",
        value: new THREE.Vector2(config.resolution[0], config.resolution[1]),
      },

      diamondFaceCount: { type: "i", value: diamond.faceCount },
      diamondVertexTexture: { type: "t", value: diamond.vertexTexture },

      refractiveIndex: { type: "f", value: config.refractiveIndex },
      diamondDiffuseColor: { type: "v3", value: diamondDiffuseColorVector },
      diamondSpecularColor: { type: "v3", value: diamondSpecularColorVector },
    },
    vertexShader: vshader,
    fragmentShader: fshader.replace(
      /VERTEX_TEXTURE_WIDTH/g,
      VERTEX_TEXTURE_WIDTH
    ),
  });
  mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(0.1, 0.1, 0.1);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(config.resolution[0], config.resolution[1]);

  canvas = renderer.domElement;
  canvas.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onWindowResize);
  document.body.appendChild(canvas);

  // var gl =
  //   canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  // var ext = gl.getExtension("OES_texture_float");
  // if (ext == null) {
  //   alert("float texture not supported");
  //   return;
  // }

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  controls.enableDamping = true;
  controls.dampingFactor = 0.15;
  controls.enableZoom = true;
  controls.rotateSpeed = 0.2;

  controls.autoRotate = config.camera === "Auto Rotate";
  controls.autoRotateSpeed = 0.8;

  controls.target = new THREE.Vector3(0, 0.7, 0);

  render();
}

function updateVertexTexture(obj_url, target) {
  var manager = new THREE.LoadingManager();
  manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };

  // var onProgress = function (xhr) {
  //   if (xhr.lengthComputable) {
  //     var percentComplete = (xhr.loaded / xhr.total) * 100;
  //     console.log(Math.round(percentComplete, 2) + "% downloaded");
  //   }
  // };

  var diamondGeometry = new THREE.IcosahedronGeometry(10, 0);
  // var diamondGeometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
  var faces = diamondGeometry.faces;
  var vertices = diamondGeometry.vertices;

  var faceCount = faces.length;
  console.log("faceCount: " + faceCount);

  var width = VERTEX_TEXTURE_WIDTH;
  var height = 1;
  var diamondVertexes = new Float32Array(width * height * 4);

  for (var i = 0; i < faceCount; i++) {
    var face = faces[i];
    var a = vertices[face.a];
    var b = vertices[face.b];
    var c = vertices[face.c];

    diamondVertexes[i * 12] = a.x;
    diamondVertexes[i * 12 + 1] = a.y;
    diamondVertexes[i * 12 + 2] = a.z;
    diamondVertexes[i * 12 + 3] = 1.0;

    diamondVertexes[i * 12 + 4] = b.x;
    diamondVertexes[i * 12 + 5] = b.y;
    diamondVertexes[i * 12 + 6] = b.z;
    diamondVertexes[i * 12 + 7] = 1.0;

    diamondVertexes[i * 12 + 8] = c.x;
    diamondVertexes[i * 12 + 9] = c.y;
    diamondVertexes[i * 12 + 10] = c.z;
    diamondVertexes[i * 12 + 11] = 1.0;
  }

  var vertexTexture = new THREE.DataTexture(
    diamondVertexes,
    width,
    height,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  vertexTexture.needsUpdate = true;

  target.faceCount = faceCount;
  target.vertexTexture = vertexTexture;
}

function render(timestamp) {
  // stats.begin();

  if (config.camera === "Auto") {
    var rad = 0.0004 * timestamp;
    var h = Math.cos(rad * 1.5);
    camera.position.set(
      (1.3 - h) * Math.cos(rad),
      2.0 + h,
      (2.0 - h) * Math.sin(rad)
    );
    camera.lookAt(new THREE.Vector3(0, 1, 0));
  } else {
    controls.update();
  }

  material.uniforms.cameraPos.value = camera.getWorldPosition(
    new THREE.Vector3()
  );
  material.uniforms.cameraDir.value = camera.getWorldDirection(
    new THREE.Vector3()
  );

  // material.uniforms.gammaCorrection.value = config.gammaCorrection;
  // material.uniforms.resolution.value = new THREE.Vector2(
  //   canvas.width,
  //   canvas.height
  // );

  // material.uniforms.diamondFaceCount.value = diamond.faceCount;
  // material.uniforms.diamondVertexTexture.value = diamond.vertexTexture;

  // material.uniforms.diamondDiffuseColor.value = diamondDiffuseColorVector;
  // material.uniforms.diamondSpecularColor.value = diamondSpecularColorVector;
  // material.uniforms.refractiveIndex.value = config.refractiveIndex;

  // renderer.render(scene, dummyCamera);
  renderer.render(scene, camera);

  // stats.end();
  requestAnimationFrame(render);
}
function onMouseMove(e) {
  mouse.x = e.offsetX / canvas.width;
  mouse.y = e.offsetY / canvas.height;
}

function onWindowResize(e) {
  // if (config.resolution === "full") {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // }

  renderer.setSize(canvas.width, canvas.height);
}

function setColorVectorFromHex(hex, vector) {
  var color = new THREE.Color(hex);
  vector.set(color.r, color.g, color.b);
}
