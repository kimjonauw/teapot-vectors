import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TeapotGeometry } from 'three/addons/geometries/TeapotGeometry.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';

const _v0 = /*@__PURE__*/ new THREE.Vector3();
const _v1 = /*@__PURE__*/ new THREE.Vector3();
const _normal = /*@__PURE__*/ new THREE.Vector3();
const _triangle = /*@__PURE__*/ new THREE.Triangle();



let ratio = 0.7;
let a, b;
let W, H;
window.innerHeight <= window.innerWidth
  ? ((a = Math.max(window.innerHeight, 1) * ratio),
    (b = Math.max(window.innerHeight, 1)))
  : ((a = Math.max(window.innerWidth, 1)),
    (b = Math.max(window.innerWidth, 1) / ratio));
W = Math.floor(a);
H = Math.floor(b);

const scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(255, 255, 255)");
//scene.fog = new THREE.FogExp2(0xffffff, 0.0003);
const camera = new THREE.PerspectiveCamera(90, ratio, 0.1, 5000);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(W, H);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 256);
controls.update();

const light = new THREE.AmbientLight(0x404040, 5); // soft white light
scene.add(light);

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}


const geometry = new TeapotGeometry(32);

  const vertexShader = /*glsl*/ `
  #include <fog_pars_vertex>
  out vec3 worldPosition;
  out vec3 localPosition;
  out vec3 view_dir;
  out vec2 vUv;
  out vec3 localNormal;
  out vec3 precomputeNormal;
  uniform sampler2D uTexture;
  vec3 getNormal(vec2 uv) {
    vec2 texelSize = vec2(1.0 / 512.0, 1.0 / 256.0);
    float point_value = texture2D(uTexture,uv).r;

    vec2 position_offset_x = uv + vec2(texelSize.x,0.0);
    float point_value_x = texture2D(uTexture,position_offset_x).r;

    vec3 tangent_x = normalize(vec3(uv,point_value) - vec3(position_offset_x,point_value_x));

    vec2 position_offset_y = uv + vec2(0.0,texelSize.y);
    float point_value_y = texture2D(uTexture,position_offset_y).r;
    vec3 tangent_y = normalize(vec3(uv,point_value) - vec3(position_offset_y,point_value_y));

    return normalize(cross(tangent_x,tangent_y));
    
    // return normalize(vec3(
    //   (texture2D(uTexture, uv + vec2(-texelSize.x, 0.0)).r - texture2D(uTexture, uv + vec2(texelSize.x, 0.0)).r) / (2.0*texelSize.x),
    //   (texture2D(uTexture, uv + vec2(0.0, -texelSize.y)).r - texture2D(uTexture, uv + vec2(0.0, texelSize.y)).r) / (2.0*texelSize.y),
    //   1.0));
  }

  void main(){
    #include <begin_vertex>
    #include <project_vertex>
    #include <fog_vertex>
    vec4 view_pos = modelViewMatrix * vec4(position, 1.0);
    view_dir = normalize(-view_pos.xyz); // vec3(0.0) - view_pos;
    vec3 view_nv  = normalize(normalMatrix * normal.xyz);


    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    localPosition = position;
    
    
    vUv = uv;


    localNormal = getNormal(vUv);
    precomputeNormal = normal ;
    gl_Position = projectionMatrix * view_pos;
  }
  `;

  const fragmentShader = /*glsl*/ `
  #include <fog_pars_fragment>
  in vec3 worldPosition;
  in vec3 localPosition;
  in vec3 view_dir;
  in vec2 vUv;
  in vec3 localNormal;
  in vec3 precomputeNormal;
  uniform sampler2D uTexture;
  uniform sampler2D normalTexture;
  float map(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
  }
  
  void main() {
    vec4 normalMap = texture2D(normalTexture, vUv);
    vec3 normal = normalize(vec3((normalMap.x * 2.0) - 1.0, (normalMap.g * 2.0) - 1.0, (normalMap.b * 2.0) - 1.0 ));

    vec3 dx = dFdx(worldPosition.xyz);
    vec3 dy = dFdy(worldPosition.xyz);
    vec3 N = normalize(cross(dx, dy));
    float adjustedNormal = dot(view_dir, N) * 0.5 + 0.5;
    float curvatureValue = length(fwidth(precomputeNormal.xyz)) / (length((fwidth(localPosition.xyz))));

    if (curvatureValue < 0.16) {
      float theColor = 1.0 - (curvatureValue * 0.37);
      gl_FragColor = vec4(theColor,theColor,theColor,1);
      gl_FragColor =  vec4(0,0,0,1);

    } else {
      vec4 color = texture2D(uTexture,vUv);

      gl_FragColor =  vec4(color.xyz,1);
      gl_FragColor =  vec4(1,1,1,1);

    }

    #include <fog_fragment>
    gl_FragColor = vec4(curvatureValue,curvatureValue,curvatureValue ,1);
  }

`;
const material = new THREE.ShaderMaterial({
  fragmentShader: fragmentShader,
  vertexShader: vertexShader,
  transparent: true,
  fog: true,
});
let teapot = new THREE.Mesh( geometry, material );

scene.add( teapot );
const helper = new VertexNormalsHelper( teapot, 10, 0xff0000 );
 scene.add( helper );
animate();
