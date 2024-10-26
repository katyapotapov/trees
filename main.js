import * as THREE from "three";

const scene = new THREE.Scene();

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
  "data/Daylight Box_Right.bmp",
  "data/Daylight Box_Left.bmp",
  "data/Daylight Box_Top.bmp",
  "data/Daylight Box_Bottom.bmp",
  "data/Daylight Box_Front.bmp",
  "data/Daylight Box_Back.bmp",
]);

scene.background = texture;

// ----------------- Display -----------------

const fov = 75;

// Aspect ratio - just the ratio of the window size
const aspect = window.innerWidth / window.innerHeight;

// Decrease this if you want to see nearer things
const near = 0.1;

// Increase this if you want to see farther things
const far = 800000;

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

// -------------------------------------------

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ---------- Tree settings ------------------
// Based on: https://courses.cs.duke.edu/fall02/cps124/resources/p119-weber.pdf

// Stem splits (e.g. offshoots)
let nSplitLevels = 3;
let trunkRadius = 10;

// TODO this thickness ratio isn't really doing well here or below, can we do radius as a function of the level instead?
let splitRadius = 3;
let splitRadiusReduction = 0.4; // How much smaller the radius gets each level
let nStemSegments = [1, 1, 1]; // number of segments each stem is split up into; 1 for each stem level
let splitAngle = 30 * (Math.PI / 180); // Z-axis rotation in radians (relative to branch)
let splitHeights = [100, 70, 80];
let splitOffset = 0.2; // how far along the branch's length do we want the next branches to form? Value should be 0-1
let splitOffsetAngle = 100 * (Math.PI / 180); // how much should each successive offset be angled?

// how many stems should be created at each level, relative to its parent
// (e.g. 3rd level will actually have 3rd level * 2nd level * 1st level number of stems)
let nStems = [1, 3, 2];

// Stem children (e.g. when a stem splits evenly in two at its end)
let nChildLevels = 2;
let numChildren = 3;
let childThicknessRatio = 40;
let childSplitAngle = 40 * (Math.PI / 180); // how much should each successive offset be angled?
let childHeights = [100, 70, 80];

// -------------------------------------------

// --------- Update from menu changes --------

document.getElementById("stemAngle").value = (
  (splitAngle * 180) /
  Math.PI
).toFixed(1);
document.getElementById("nStemLevels").value = nSplitLevels;
window.updateLSystem = function () {
  splitAngle =
    (parseFloat(document.getElementById("stemAngle").value) * Math.PI) / 180;
  nSplitLevels = parseInt(document.getElementById("nStemLevels").value);

  // Clear previous tree and redraw
  while (tree.children.length > 0) {
    tree.remove(tree.children[0]);
  }
  scene.remove(tree);

  addTree(angle, height);
  scene.add(tree);
  tree.rotation.y = 0;

  updateCameraFocus();
};

// -------------------------------------------

// var seed = Math.random() * 1000;
var seed = 1;
function random() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function addCylinder(
  posX,
  posY,
  posZ,
  rotX,
  rotY,
  rotZ,
  radiusTop,
  radiusBottom,
  height
) {
  const radialSegments = 32;
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments
  );

  // make it vertical
  geometry.translate(0, height / 2, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0x82553c });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotateX(rotX);
  cylinder.rotateY(rotY);
  cylinder.rotateZ(rotZ);
  cylinder.position.set(posX, posY, posZ);

  return cylinder;
}

function addStem(
  parent,
  nStemSegments,
  stemAngle,
  stemRadius,
  stemHeight,
  stemOffset,
  stemOffsetAngle
) {
  // TODO don't ignore stem segments
  let stemOffsetLength = 0;
  if (stemOffset != 0) {
    stemOffsetLength = parent.geometry.parameters.height * stemOffset;
  }
  let stem = addCylinder(
    0,
    stemOffsetLength,
    0,
    0,
    stemOffsetAngle,
    stemAngle,
    stemRadius * (1 - splitRadiusReduction),
    stemRadius,
    stemHeight
  );

  parent.add(stem);
  return stem;
}

const tree = new THREE.Group();
let trunk = addStem(
  tree,
  nStemSegments[0],
  0,
  trunkRadius,
  splitHeights[0],
  0,
  0
);

function makeRecusiveBranches(stem, stemLevel) {
  let stemsCurLevel = [];
  for (let curBranch = 1; curBranch <= nStems[stemLevel]; curBranch++) {
    stemsCurLevel.push(
      addStem(
        stem,
        nStemSegments[stemLevel],
        splitAngle,
        splitRadius * (1 - splitRadiusReduction),
        splitHeights[stemLevel],
        splitOffset * curBranch,
        (splitOffsetAngle * curBranch) % (2 * Math.PI)
      )
    );
  }
  for (let stem of stemsCurLevel) {
    makeRecusiveBranches(stem, stemLevel + 1);
  }
}

function makeRecursiveChildren(stem, childLevel) {
  // by omitting stem here, we are skipping creating recursive children for the trunk
  let childrenCurLevel = [];
  if (childLevel >= nChildLevels) {
    return childrenCurLevel;
  }
  // TODO the children could be pushed to the edge of the trunk for bigger aesthetics
  // TODO the second level children are too thicc
  for (let i = 0; i < numChildren; i++) {
    childrenCurLevel.push(
      addStem(
        stem,
        1,
        childSplitAngle,
        splitRadius,
        childHeights[childLevel],
        1,
        180 * i
      )
    );
  }
  for (let child of childrenCurLevel) {
    childrenCurLevel.concat(makeRecursiveChildren(child, childLevel + 1));
  }
  return childrenCurLevel;
}

scene.add(tree);
let children = makeRecursiveChildren(trunk, 0);
for (let child of children) {
  makeRecusiveBranches(child, 1);
}

function createHill(x, z, height, baseRadius, topRadius) {
  const hillGeometry = new THREE.CylinderGeometry(
    topRadius,
    baseRadius,
    height,
    64
  );
  const hillMaterial = new THREE.MeshBasicMaterial({ color: 0x72ba32 });
  const hill = new THREE.Mesh(hillGeometry, hillMaterial);

  hill.position.set(x, height / 2, z);
  scene.add(hill);
}
const numHills = 20;
for (let i = 0; i < numHills; i++) {
  // These numbers were determined via trial and error
  const x = (i / numHills) * 200000 - 100000;
  const z = Math.random() * 8000 - 50000;
  const height = Math.random() * 3000 + 5000;
  const baseRadius = 20000 + 800;
  const topRadius = Math.random() * 1000 + 700;

  createHill(x, z, height, baseRadius, topRadius);
}

const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  "data/green-grass-texture.jpg", // Make sure this path is correct
  function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 5);

    const geometry = new THREE.PlaneGeometry(100000, 100000);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
    scene.add(ground);
  },
  undefined,
  function (err) {
    console.error("An error occurred loading the texture:", err);
  }
);

const nearDistance = 10000;
const farDistance = 100000;
scene.fog = new THREE.Fog(0xffffff, nearDistance, farDistance);

// camera.position.z = 700;
// camera.position.y = 400;
camera.position.z = 800;
camera.position.y = 500;
function updateCameraFocus() {
  const box = new THREE.Box3().setFromObject(tree);
  // TODO this needs to be the trunk not the centre of the whole tree, so that we centre lopsided trees correctly
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)); // Get the trigonometric distance to fit the whole tree in the FOV
  cameraZ *= 1.7; // Move the camera further back to fit the tree comfortably

  camera.position.z = center.z + cameraZ;
  camera.position.x = center.x;
  camera.position.y = center.y;
  camera.lookAt(center); // Ensure the camera is always looking at the center of the tree
}
updateCameraFocus(); // Just need to update the camera once at the start

function animate() {
  tree.rotateY(0.025);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
