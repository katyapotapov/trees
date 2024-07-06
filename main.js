import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x19c2ff);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  8000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Now we initialize the L-system with the axiom
// const axiom = "X";
// const rules = { F: "FF", X: "F-[[X]++X]+F[+FX]-X" };
const axiom = "F";
// const rules = { F: "F[-F][+F][#F][$F][*F][&F]" };
const rules = {
  F: "F$[-F+X]&[#X+F]*[-X$F]#[+X+F]", // Rule to elongate and create branches
  X: "F[$F][*X][&X]X", // Extending complexity for further iterations
};
// const axiom = "F";
// const rules = {
//   F: "F&[+#F+F][-$F-F][*&F+F][/#F-F]", // Rule to create complex branching
//   X: "F[-X&F][+X*F][#X$F]", // Adding variation in branch angles and positions
// };
// const angle = (22.5 * Math.PI) / 180;
const angle = (29 * Math.PI) / 180;
const n = 4;
const thickness = 1;
const thicknessMultiple = 6;
const height = 100;
const trunkMultiple = 3;
const trunkThicknessMultiple = 2;

var seed = 1213123212414;
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
  const material = new THREE.MeshBasicMaterial({ color: 0x382921 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.rotateX(rotX);
  cylinder.rotateZ(rotZ);
  cylinder.position.set(posX, posY, posZ);

  return cylinder;
}

const tree = new THREE.Group();

function parseLSystem(lSystem, angle, height) {
  let posStack = [[0, 0, 0]];
  let angleStack = [[0, 0, 0]];
  let radStack = [(n + thickness) * thicknessMultiple];
  for (let i = 0; i < lSystem.length; i++) {
    if (lSystem[i] == "F") {
      let curPos = posStack[posStack.length - 1];
      const curAngle = angleStack[angleStack.length - 1];
      let curH = height;
      if (i == 0) {
        curH = height * trunkMultiple;
      }
      curH *= 2 * random();
      curH *= n + 2 - posStack.length;

      if (radStack.length <= posStack.length) {
        radStack.push(radStack[radStack.length - 1] * 0.7);
        console.log(radStack);
      }

      // const radTop = (n + thickness - depth - 1) * thicknessMultiple;
      let radTop = radStack[posStack.length];
      let radBottom = radStack[posStack.length - 1];

      if (i == 0) {
        // radTop *= trunkThicknessMultiple;
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
      tree.add(cylinder);
      // curPos[0] -= Math.sin(curAngle[1]) * cylinderHeight;
      // curPos[1] += Math.cos(curAngle[1]) * cylinderHeight;
      // curPos[2] += Math.sin(curAngle[0]) * cylinderHeight;
      let localTop = new THREE.Vector3(0, curH, 0);
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

parseLSystem(lSystem, angle, height);

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
