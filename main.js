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

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  800000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let axiom = "F";
let rules = { F: "F[-F][+F][#F$F][$F][*F][&F&F-$F]" };
// const rules = { F: "F[-G]", G: "F[+G]" };
// const rules = { F: "F[-F]" };
let angle = (29 * Math.PI) / 180;
let n = 3;
const thickness = 1;
const thicknessMultiple = 6;
let height = 100;
const trunkMultiple = 3;
const trunkThicknessMultiple = 3;

document.getElementById("angle").value = ((angle * 180) / Math.PI).toFixed(1);
document.getElementById("n").value = n;
document.getElementById("height").value = height.toFixed(1);
//document.getElementById("axiom").value = axiom;
//document.getElementById("rules").value = rules;

window.updateLSystem = function () {
  const newAngle =
    (parseFloat(document.getElementById("angle").value) * Math.PI) / 180;
  const newN = parseInt(document.getElementById("n").value);
  const newHeight = parseFloat(document.getElementById("height").value);
  const newAxiom = document.getElementById("axiom").value;
  const newRulesInput = document.getElementById("rules").value;

  // Convert rules from string to an object
  const newRules = {};
  newRulesInput.split(";").forEach((rule) => {
    const [key, value] = rule.split(":");
    if (key && value) {
      newRules[key.trim()] = value.trim();
    }
  });

  // Update global variables
  angle = newAngle;
  n = newN;
  height = newHeight;
  axiom = newAxiom || axiom; // Keep the old axiom if the new one is empty
  rules = Object.keys(newRules).length ? newRules : rules; // Keep the old rules if the new one is empty

  // Clear previous tree and redraw
  while (tree.children.length > 0) {
    tree.remove(tree.children[0]);
  }
  scene.remove(tree);

  lSystem = lSystemForN(axiom, rules, n);
  parseLSystem(lSystem, angle, height);
  scene.add(tree);
  tree.rotation.y = 0;

  updateCameraFocus();
};

// Set default values for the input fields
document.getElementById("axiom").value = axiom;
document.getElementById("rules").value = Object.entries(rules)
  .map(([k, v]) => `${k}: ${v}`)
  .join("; ");

// var seed = Math.random() * 1000;
var seed = 1;
function random() {
  var x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function lSystemForN(axiom, rules, n) {
  let curState = axiom;
  let nextState = "";
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < curState.length; j++) {
      let dirReplaced = false;
      for (const [k, v] of Object.entries(rules)) {
        if (curState[j] == k) {
          nextState += v;
          dirReplaced = true;
          break;
        }
      }
      if (!dirReplaced) nextState += curState[j];
    }
    curState = nextState;
    nextState = "";
  }
  return curState;
}

let lSystem = lSystemForN(axiom, rules, n);

// lSystem = "F#$$$$$+F#+F#+F#+F#+F";
console.log(lSystem);

function addCylinder(posX, posY, posZ, rotX, rotY, rotZ, radT, radB, h) {
  const geometry = new THREE.CylinderGeometry(radT, radB, h, 32);

  geometry.translate(0, h / 2, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0x82553c });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotateX(rotX);
  cylinder.rotateZ(rotZ);
  cylinder.position.set(posX, posY, posZ);

  return cylinder;
}

const tree = new THREE.Group();
const validCharsRegex = /^[a-zA-Z]+$/;

function parseLSystem(lSystem, angle, height) {
  const treeRotation = new THREE.Quaternion();
  treeRotation.copy(tree.quaternion);
  let posStack = [[0, 0, 0]];
  let angleStack = [[0, 0, 0]];
  let radStack = [(n + thickness) * thicknessMultiple];
  let parentStack = [tree];
  for (let i = 0; i < lSystem.length; i++) {
    if (validCharsRegex.test(lSystem[i])) {
      let curPos = posStack[posStack.length - 1];
      const curAngle = angleStack[angleStack.length - 1];
      let curH = height;
      if (i == 0) {
        curH = height * trunkMultiple;
      }
      curH *= 2; // * random();
      curH *= n + 2 - posStack.length;

      if (radStack.length <= posStack.length) {
        radStack.push(radStack[radStack.length - 1] * 0.7);
        console.log(radStack);
      }

      let radTop = radStack[posStack.length];
      let radBottom = radStack[posStack.length - 1];

      if (i == 0) {
        radBottom *= trunkThicknessMultiple;
      }
      const cylinder = addCylinder(
        curPos[0],
        curPos[1],
        curPos[2],
        curAngle[0],
        curAngle[1],
        curAngle[2],
        radTop,
        radBottom,
        curH
      );
      parentStack[parentStack.length - 1].add(cylinder);
      parentStack[parentStack.length - 1] = cylinder;
      let localTop = new THREE.Vector3(0, curH, 0);
      //localTop.applyEuler(cylinder.rotation);
      posStack[posStack.length - 1] = [localTop.x, localTop.y, localTop.z];
    } else if (lSystem[i] == "-") {
      angleStack[angleStack.length - 1][2] -= angle;
    } else if (lSystem[i] == "+") {
      angleStack[angleStack.length - 1][2] += angle;
    } else if (lSystem[i] == "#") {
      angleStack[angleStack.length - 1][0] -= angle;
    } else if (lSystem[i] == "*") {
      angleStack[angleStack.length - 1][0] += angle;
    } else if (lSystem[i] == "$") {
      angleStack[angleStack.length - 1][1] -= angle;
    } else if (lSystem[i] == "&") {
      angleStack[angleStack.length - 1][1] += angle;
    } else if (lSystem[i] == "[") {
      posStack.push(posStack[posStack.length - 1].slice());
      angleStack.push(angleStack[angleStack.length - 1].slice());
      parentStack.push(parentStack[parentStack.length - 1]);
    } else if (lSystem[i] == "]") {
      posStack.pop();
      angleStack.pop();
      parentStack.pop();
    }
  }
  tree.applyQuaternion(treeRotation);
}

parseLSystem(lSystem, angle, height);
scene.add(tree);

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
  const x = (i / numHills) * 200000 - 100000; // * 200000 - 100000;
  const z = Math.random() * 8000 - 50000; // Random position in z
  const height = Math.random() * 3000 + 5000; // Random height between 300 and 500
  const baseRadius = 20000 + 800; // Base radius between 800 and 1000
  const topRadius = Math.random() * 1000 + 700; // Top radius between 700 and 800

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
