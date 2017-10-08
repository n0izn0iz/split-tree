// @flow
"use strict";

//Imports
import Vector from "./Vector";
import spaces from "./spaces";
import SplitTree, { logAverageCollisions } from "./SplitTree";
import Entity from "./Entity";
import AABB from "./AABB";
import createBuffer from "./createBuffer";
import {
  genRandomPosition,
  genRandomVector,
  half,
  genRandomColor
} from "./random.js";
import shaderPrograms from "./shaderPrograms";
import RectanglesRenderer from "./RectanglesRenderer";

const constant = object => Object.freeze(object);

//Constants
const numEntities = 20;
const entityWidth = 1.5;
const canvasSize = 1024;
const secondCanvasHeight = 256;
const worldSize = 64;
const speed = 0.05;
const white = constant([1, 1, 1, 1]);
const blue = constant([0, 0, 1, 1]);
const quadBordersColor = constant([1, 1, 1, 0.1]);
const red = constant([1, 0, 0, 1]);

//Variables
//  logic
const space = spaces["1P1Dimensions"];
space.size = worldSize;
const splitTree = new SplitTree(space);
console.log("Created SplitTree " + splitTree);
const entities = [];

//  events
let mousePos = new Vector(...space.originVector);

//  graphics
var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;
var squareQuadCoordBuffer;
var secondTriangleVertexPositionBuffer;
var secondSquareVertexPositionBuffer;
var secondSquareQuadCoordBuffer;

//Classes
class TimePlayer {
  position: number;
  step: number;
  rewindListeners: Array<(position: number) => mixed>;
  constructor() {
    this.position = -1;
    this.step = 20 / 1000;
    this.rewindListeners = [];
  }
  tick() {
    this.position += this.step;
    if (this.position >= 1) {
      this.position -= 2;
      entities.forEach(entity => (entity.ghosted = false));
    }
  }
}

const timePlayer = new TimePlayer();

class GamePlayer {
  __position: number;
  speed: number;
  constructor() {
    this.position = genRandomPosition(space.size - entityWidth)[0];
    this.speed = 0.1;
  }
  get aABB() {
    const playerTimeSize = 1;
    return new AABB(
      new Vector(this.position, timePlayer.position * half(space.size)),
      new Vector(entityWidth, playerTimeSize)
    );
  }
  get position() {
    return this.__position;
  }
  set position(newPosition) {
    let oldPosition = this.position;
    this.__position = newPosition;
    if (
      this.position !== oldPosition &&
      entities.some(entity => {
        const entityPosition = entity.position.x;
        const playerPosition = gamePlayer.position;
        if (!entity.ghosted && entity.aABB.collideAABB(gamePlayer.aABB)) {
          /*const sign = entityPosition < playerPosition ? 1 : -1;
          oldPosition = entityPosition + (entitySize + 0.001) * sign;*/
          return true;
        }
      })
    ) {
      this.__position = oldPosition;
    }
    const extents = half(space.size);
    if (this.__position < -extents) this.__position += space.size;
    if (this.__position > extents) this.__position -= space.size;
  }
}

const gamePlayer = new GamePlayer();

//Main
createEntities();

const moveVars = entities.map(entity => {
  return {
    entity,
    moveVector: genRandomVector()
      .normalize()
      .scale(speed)
  };
});

webGLStart();

//Functions
function createEntities() {
  const genRandomPos = () => {
    const pos = genRandomPosition(space.size - entityWidth, space.size / 2);
    pos.y = pos.y + space.size / 4;
    return pos;
  };
  const genExtents = offsetY => {
    const height = -(offsetY - space.size / 2) * 2;
    return new Vector(entityWidth, height);
  };

  for (let j = 0; j < numEntities; j++) {
    const randomPosition = genRandomPos();
    const entity = new Entity({
      position: randomPosition,
      extents: genExtents(randomPosition.y),
      color: genRandomColor()
    });
    //console.log("created entity", entity);
    const timeout = 100;
    let i = 1;
    while (splitTree.collide(entity) && i < timeout) {
      entity.position = genRandomPos();
      entity.extents = genExtents(entity.position.y);
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
}

function moveEntities() {
  moveVars.forEach(moveVar => {
    const { entity } = moveVar;
    const aABB = new AABB(
      entity.position.plus(moveVar.moveVector),
      entity.extents
    );
    let i = 0;
    let success;
    const timeout = 10;
    while (success !== true && i < timeout) {
      if (!splitTree.collideAABB(aABB, entity) && entity.move(aABB.position)) {
        success = true;
      } else {
        moveVar.moveVector = genRandomVector()
          .normalize()
          .scale(speed);
        aABB.position = entity.position.plus(moveVar.moveVector);
      }
      i++;
    }
    //if (!success) throw new Error("failed to move entity");
  });
}

function getMousePos(canvas, evt) {
  if (!canvas) throw new Error("Canvas is null");
  var rect = canvas.getBoundingClientRect();

  return new Vector(
    ((evt.clientX - rect.left) / canvasSize * 2 - 1) * half(space.size),
    -((evt.clientY - rect.top) / canvasSize * 2 - 1) * half(space.size)
  );
}

function checkGL(gl, canvas) {
  if (!gl) {
    const msg = "Failed to get gl context on " + canvas.toString();
    alert(msg);
    throw new Error(msg);
  }
}

function webGLStart() {
  const keyToggles = createKeyToggles();
  var canvas = document.getElementById("canvas");
  var secondCanvas = document.getElementById("second");

  if (!(canvas && canvas instanceof HTMLCanvasElement))
    throw new Error("Could not find canvas");
  if (!(secondCanvas && secondCanvas instanceof HTMLCanvasElement))
    throw new Error("Could not find second canvas");

  canvas.addEventListener(
    "mousemove",
    (evt: MouseEvent) => {
      mousePos = getMousePos(canvas, evt);
    },
    false
  );

  const gl = canvas.getContext("webgl");
  const gl2 = secondCanvas.getContext("webgl");

  if (!(gl && gl2)) throw new Error("lost gl");

  checkGL(gl, canvas);
  checkGL(gl2, secondCanvas);

  initBuffers(gl);
  initSecondBuffers(gl2);

  const rectanglesRenderer = new RectanglesRenderer(
    gl,
    squareVertexPositionBuffer,
    squareQuadCoordBuffer
  );
  const secondRectanglesRenderer = new RectanglesRenderer(
    gl2,
    secondSquareVertexPositionBuffer,
    secondSquareQuadCoordBuffer
  );

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl2.clearColor(0.0, 0.0, 0.0, 1.0);
  gl2.enable(gl2.DEPTH_TEST);

  drawScene(gl, rectanglesRenderer, gl2, secondRectanglesRenderer);

  const loop = () => {
    if (keyToggles.pause.state === false) {
      timePlayer.tick();
      if (keyToggles.moveLeft.state === true)
        gamePlayer.position -= gamePlayer.speed;
      if (keyToggles.moveRight.state === true)
        gamePlayer.position += gamePlayer.speed;
      //moveEntities();
      ghostEntities();
    }
    if (!gl || !gl2) throw new Error("lost gl");
    drawScene(gl, rectanglesRenderer, gl2, secondRectanglesRenderer);
    window.setTimeout(loop, 20);
  };
  loop();
}

function ghostEntities() {
  entities.forEach(entity => {
    if (entity.aABB.collideAABB(gamePlayer.aABB)) entity.ghosted = true;
  });
}

function drawGame(rectanglesRenderer) {
  const timePosition = timePlayer.position * half(space.size);
  const barHeight = space.size;
  entities.forEach(entity => {
    if (entity.ghosted) return;
    const entityAABB = entity.aABB;
    if (
      entityAABB.max.time >= timePosition &&
      entityAABB.min.time <= timePosition
    ) {
      rectanglesRenderer.draw(
        new Vector(entity.position.x, 0),
        new Vector(entity.extents.x, barHeight),
        entity.color,
        space
      );
    }
  });
  rectanglesRenderer.draw(
    new Vector(gamePlayer.aABB.position.x, 0),
    new Vector(gamePlayer.aABB.extents.x, barHeight),
    white,
    space
  );
}

function drawScene(gl, rectanglesRenderer, gl2, secondRectanglesRenderer) {
  gl.viewport(0, 0, canvasSize, canvasSize);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl2.viewport(0, 0, canvasSize, secondCanvasHeight);
  gl2.clear(gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT);
  drawTree(rectanglesRenderer);
  drawEntities(rectanglesRenderer);
  drawTimePlayer(rectanglesRenderer);
  rectanglesRenderer.draw(
    gamePlayer.aABB.position,
    gamePlayer.aABB.extents,
    white,
    space
  );
  drawGame(secondRectanglesRenderer);
}

function initBuffers(gl) {
  if (!gl) throw new Error("lost gl");
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

function initSecondBuffers(gl) {
  if (!gl) throw new Error("lost gl");
  secondTriangleVertexPositionBuffer = createBuffer(
    gl,
    [0.0, 1.0, -1.0, -1.0, 1.0, -1.0],
    2
  );
  secondSquareVertexPositionBuffer = createBuffer(
    gl,
    [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0],
    2
  );
  secondSquareQuadCoordBuffer = createBuffer(
    gl,
    [1.0, 1.0, 0, 1.0, 1.0, 0, 0, 0],
    2
  );
}

function drawTree(rectanglesRenderer) {
  splitTree.forEach(node => {
    rectanglesRenderer.draw(
      node.position,
      node.extents,
      quadBordersColor,
      space,
      true
    );
  });
}

function drawTimePlayer(rectanglesRenderer) {
  rectanglesRenderer.draw(
    new Vector(0, timePlayer.position * half(space.size)),
    new Vector(space.size, 0.3),
    blue,
    space
  );
}

function drawEntities(rectanglesRenderer) {
  entities.forEach(entity => {
    const color = entity.aABB.containsPoint(mousePos) ? red : white;
    rectanglesRenderer.draw(
      entity.position,
      entity.extents,
      entity.ghosted
        ? new Vector(...entity.color.slice(0, 3), 0.2)
        : entity.color,
      space
    );
  });
}

function createKeyToggles() {
  const keyToggles = {
    pause: { key: " ", state: false },
    moveLeft: { key: "g", state: true },
    moveRight: { key: "h", state: false }
  };
  document.addEventListener("keydown", (evt: KeyboardEvent) => {
    Object.keys(keyToggles).map(key => {
      const toggle = keyToggles[key];
      if (evt.key === toggle.key) toggle.state = !toggle.state;
    });
  });
  document.addEventListener("keydown", (evt: KeyboardEvent) => {
    if (evt.key === "a") logAverageCollisions();
  });
  return keyToggles;
}
