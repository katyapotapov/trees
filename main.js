import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x19c2ff);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Now we initialize the L-system with the axiom
// const axiom = "X";
// const rules = { F: "FF", X: "F-[[X]++X]+F[+FX]-X" };
const axiom = "F";
// const rules = { F: "F[-F][+F][#F][$F][*F][&F]" };
// const rules = {
//   F: "F-[+F#F]+[-F-F]#[-F$F]$[+F+F]*[*F+F]&[-F+F]", // Rule to elongate and create branches
//   X: "F[+X][-X][#X][$X][*X][&X]FX", // Extending complexity for further iterations
// };
const rules = {
  F: "F&[-F$F][#X+F]&[*F+F]X", // Rule to elongate and create branches
  X: "F[+X][#X][*F][&X]FX", // Extending complexity for further iterations
};
// const angle = (22.5 * Math.PI) / 180;
const angle = (20 * Math.PI) / 180;
const n = 4;
const thickness = 3;

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

const cylinderHeight = 50;

function addCylinder(posX, posY, posZ, rotX, rotY, rotZ, radT, radB) {
  const geometry = new THREE.CylinderGeometry(radT, radB, cylinderHeight, 32);

  geometry.translate(0, cylinderHeight / 2, 0);
  const material = new THREE.MeshBasicMaterial({ color: 0x382921 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotateX(rotX);
  cylinder.rotateZ(rotZ);
  cylinder.position.set(posX, posY, posZ);

  return cylinder;
}

const tree = new THREE.Group();

function parseLSystem(lSystem, angle, n, thickness) {
  let posStack = [[0, 0, 0]];
  let angleStack = [[0, 0, 0]];
  for (let i = 0; i < lSystem.length; i++) {
    if (lSystem[i] == "F") {
      let curPos = posStack[posStack.length - 1];
      const curAngle = angleStack[angleStack.length - 1];
      const cylinder = addCylinder(
        curPos[0],
        curPos[1],
        curPos[2],
        curAngle[0],
        curAngle[1],
        curAngle[2],
        n + thickness - posStack.length - 1,
        n + thickness - posStack.length
      );
      tree.add(cylinder);
      // curPos[0] -= Math.sin(curAngle[1]) * cylinderHeight;
      // curPos[1] += Math.cos(curAngle[1]) * cylinderHeight;
      // curPos[2] += Math.sin(curAngle[0]) * cylinderHeight;
      let localTop = new THREE.Vector3(0, cylinderHeight, 0);
      let worldTop = cylinder.localToWorld(localTop.clone());
      posStack[posStack.length - 1] = [worldTop.x, worldTop.y, worldTop.z];
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
    } else if (lSystem[i] == "]") {
      posStack.pop();
      angleStack.pop();
    }
  }
}

parseLSystem(lSystem, angle, n, thickness);

// tree.add(addCylinder(0, 0, 0));
// tree.add(addCylinder(0, 10, 20));
scene.add(tree);

const geometry = new THREE.PlaneGeometry(10000, 10000);
geometry.rotateX(THREE.MathUtils.degToRad(90));
const material = new THREE.MeshBasicMaterial({
  color: 0x6beb34,
  side: THREE.DoubleSide,
});
const ground = new THREE.Mesh(geometry, material);
scene.add(ground);

// camera.position.z = 700;
// camera.position.y = 400;
camera.position.z = 800;
camera.position.y = 500;
function updateCameraFocus() {
  const box = new THREE.Box3().setFromObject(tree);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  console.log(fov);
  console.log(maxDim);
  console.log(size.x, size.y, size.z);
  let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)); // Get the trigonometric distance to fit the whole tree in the FOV
  cameraZ *= 1.8; // Move the camera further back to fit the tree comfortably

  camera.position.z = center.z + cameraZ;
  camera.position.x = center.x;
  camera.position.y = center.y;
  camera.lookAt(center); // Ensure the camera is always looking at the center of the tree
}
updateCameraFocus(); // Just need to update the camera once at the start

function animate() {
  tree.rotateY(0.005);
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
