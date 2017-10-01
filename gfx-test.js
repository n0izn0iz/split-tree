"use strict";

console.log("Hello, world!");

import Vector from "./Vector";
import spaces from "./spaces";
import SplitTree from "./SplitTree";
import Entity from "./Entity";
import AABB from "./AABB";
import createBuffer from "./createBuffer";
import createShaderProgram from "./createShaderProgram";

const space = spaces["2Dimensions"];
const splitTree = new SplitTree(space);
console.log("Created SplitTree " + splitTree);
const worldSize = 64;

const canvasSize = 1024;

const entities = [];
const numEntities = 32;
const triangleSize = 4;
const one = 1;
const half = number => number / 2;
const coinFlip = (a = true, b = false) => (Math.random() >= half(one) ? a : b);

const genRandomVector = () => {
  const x = Math.random();
  const y = Math.random();
  return new Vector(coinFlip(x, -x), coinFlip(y, -y));
};

const genRandomPosition = () =>
  genRandomVector().scale(half(worldSize - triangleSize));

for (let i = 0; i < numEntities; i++) {
  const entity = new Entity({
    position: genRandomPosition(),
    size: triangleSize
  });
  console.log("created entity", entity);
  let i = 0;
  while (splitTree.collide(entity) && i < 100 - 1) {
    entity.position = genRandomPosition();
    i += 1;
  }
  if (!splitTree.collide(entity)) {
    splitTree.insert(entity);
    entities.push(entity);
  }
}

if (entities.length !== numEntities)
  throw new Error(
    "Failed to generate the required number of entities (" +
      entities.length +
      "/" +
      numEntities +
      ")"
  );

const calcMoveLength = () => Math.random() * 1000;

const moveVars = entities.map(entity => {
  return {
    entity,
    moveVector: genRandomVector().normalize()
  };
});

const moveEntities = () => {
  moveVars.forEach(moveVar => {
    const { entity } = moveVar;
    const aABB = new AABB({
      position: entity.position.plus(moveVar.moveVector),
      size: entity.size
    });
    let i = 0;
    let success;
    const timeout = 10;
    while (success !== true && i < timeout) {
      if (!splitTree.collideAABB(aABB, entity) && entity.move(aABB.position)) {
        success = true;
      } else {
        moveVar.moveVector = genRandomVector()
          .normalize()
          .scale(0.1);
        aABB.position = entity.position.plus(moveVar.moveVector);
      }
      i++;
    }
  });
};

let mousePos = new Vector(space);

const getMousePos = (canvas, evt) => {
  var rect = canvas.getBoundingClientRect();
  return new Vector(
    ((evt.clientX - rect.left) / canvasSize * 2 - 1) * half(worldSize),
    -((evt.clientY - rect.top) / canvasSize * 2 - 1) * half(worldSize)
  );
};

function webGLStart() {
  var canvas = document.getElementById("canvas");

  canvas.addEventListener(
    "mousemove",
    evt => {
      mousePos = getMousePos(canvas, evt);
    },
    false
  );
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();

  const loop = () => {
    moveEntities();
    drawScene();
    window.setTimeout(loop, 20);
  };
  loop();
}

var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var squareQuadCoordBuffer;

function initBuffers() {
  triangleVertexPositionBuffer = createBuffer(
    gl,
    [0.0, 1.0, -1.0, -1.0, 1.0, -1.0],
    2
  );
  squareVertexPositionBuffer = createBuffer(
    gl,
    [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    2
  );
  squareQuadCoordBuffer = createBuffer(gl, [1.0, 1.0, 0, 1.0, 1.0, 0, 0, 0], 2);
}

var shaderProgram, shaderProgramQtree;

function initShaders() {
  shaderProgram = createShaderProgram(gl, {
    name: "default",
    shadersIds: ["shader-vs-basic", "shader-fs-rgba"],
    attributesNames: ["modelVertex"],
    uniformsNames: ["position", "worldSize", "modelSize", "color"]
  });

  shaderProgramQtree = createShaderProgram(gl, {
    name: "qtree-grid",
    shadersIds: ["shader-vs-quadcoord", "shader-fs-borders"],
    attributesNames: ["modelVertex", "quadCoordIn"],
    uniformsNames: ["position", "worldSize", "modelSize"]
  });
}

const drawTriangleArray = position => {
  gl.uniform2fv(shaderProgram.uniforms.position, position);
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
};

const setTriangleColor = color => {
  gl.uniform4fv(shaderProgram.uniforms.color, color);
};

const drawTriangle = (position, size, color) => {
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    triangleVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgram.attributes.modelVertex);

  gl.uniform1f(shaderProgram.uniforms.modelSize, size);
  gl.uniform1f(shaderProgram.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  setTriangleColor(color);
  drawTriangleArray(position);
};

const drawSquareArray = (position, size) => {
  gl.uniform2fv(shaderProgramQtree.uniforms.position, position);
  gl.uniform1f(shaderProgramQtree.uniforms.modelSize, size);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
};

const drawSquare = (position, size) => {
  gl.useProgram(shaderProgramQtree);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.modelVertex,
    squareVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.modelVertex);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareQuadCoordBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.quadCoordIn,
    squareQuadCoordBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.quadCoordIn);
  gl.uniform1f(shaderProgramQtree.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawSquareArray(position, size);
};

const drawTree = () => {
  gl.useProgram(shaderProgramQtree);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.modelVertex,
    squareVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.modelVertex);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareQuadCoordBuffer);
  gl.vertexAttribPointer(
    shaderProgramQtree.attributes.quadCoordIn,
    squareQuadCoordBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgramQtree.attributes.quadCoordIn);
  gl.uniform1f(shaderProgramQtree.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  splitTree.forEach(node => {
    drawSquareArray(node.position, node.size);
  });
};

const drawEntities = () => {
  gl.useProgram(shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(
    shaderProgram.vertexPositionAttribute,
    triangleVertexPositionBuffer.itemSize,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(shaderProgram.attributes.modelVertex);

  gl.uniform1f(shaderProgram.uniforms.modelSize, triangleSize);
  gl.uniform1f(shaderProgram.uniforms.worldSize, worldSize);
  gl.enable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  setTriangleColor(white);
  entities.forEach(entity => {
    let beRed = false;
    if (entity.aABB.containsPoint(mousePos)) {
      beRed = true;
      setTriangleColor(red);
    }
    drawTriangleArray(entity.position);
    if (beRed) setTriangleColor(white);
  });
};
const white = [1, 1, 1, 1];
const red = [1, 0, 0, 1];

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  drawTree();
  drawEntities();
}

var gl;
function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {}
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-( ");
  } else {
  }
}

webGLStart();
