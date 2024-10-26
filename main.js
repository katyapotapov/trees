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

let nStemLevels = 3;
let trunkThicknessRatio = 50; // trunk height / trunk radius
let stemThicknessRatio = 20; // stem height / stem radius (excluding trunk)
let nStemSegments = [1, 1, 1]; // number of segments each stem is split up into; 1 for each stem level
let stemAngle = 30 * (Math.PI / 180); // Z-axis rotation in radians (relative to branch)
let stemHeights = [100, 30, 20];
let stemOffset = 0.2; // how far along the branch's length do we want the next branches to form? Value should be 0-1
let stemOffsetAngle = 30 * (Math.PI / 180); // how much should each successive offset be angled?

// how many stems should be created at each level, relative to its parent
// (e.g. 3rd level will actually have 3rd level * 2nd level * 1st level number of stems)
let nStems = [1, 3, 4];

// -------------------------------------------

// --------- Update from menu changes --------

document.getElementById("stemAngle").value = (
  (stemAngle * 180) /
  Math.PI
).toFixed(1);
document.getElementById("nStemLevels").value = nStemLevels;
document.getElementById("trunkThicknessRatio").value =
  trunkThicknessRatio.toFixed(1);

window.updateLSystem = function () {
  stemAngle =
    (parseFloat(document.getElementById("stemAngle").value) * Math.PI) / 180;
  nStemLevels = parseInt(document.getElementById("nStemLevels").value);
  trunkThicknessRatio = parseFloat(
    document.getElementById("trunkThicknessRatio").value
  );

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
  stemThicknessRatio,
  stemHeight,
  stemOffset,
  stemOffsetAngle
) {
  // TODO don't ignore stem segments
  const radius = stemHeight / stemThicknessRatio;
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
    radius,
    radius,
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
  trunkThicknessRatio,
  stemHeights[0],
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
        stemAngle,
        stemThicknessRatio,
        stemHeights[stemLevel],
        stemOffset * curBranch,
        (stemOffsetAngle * curBranch) % (2 * Math.PI)
      )
    );
  }
  for (let stem of stemsCurLevel) {
    makeRecusiveBranches(stem, stemLevel + 1);
  }
}

scene.add(tree);
makeRecusiveBranches(trunk, 1);

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
