import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x19c2ff);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

function addCylinder(posX, posY, rot) {
  const geometry = new THREE.CylinderGeometry(1, 1, 20, 32);

  geometry.translate(0, 10, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0x382921 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotateZ(THREE.MathUtils.degToRad(rot));
  cylinder.position.set(posX, posY, 0);

  return cylinder;
}

camera.position.z = 50;
camera.position.y = 20;

const tree = new THREE.Group();

tree.add(addCylinder(0, 0, 0));
tree.add(addCylinder(0, 10, 20));
scene.add(tree);

const geometry = new THREE.PlaneGeometry(10000, 10000);
geometry.rotateX(THREE.MathUtils.degToRad(90));
const material = new THREE.MeshBasicMaterial({
  color: 0x6beb34,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(geometry, material);
scene.add(ground);

function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
