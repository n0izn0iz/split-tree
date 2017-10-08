// with this shader the world will fill the whole viewport
attribute vec2 modelVertex;
attribute vec2 quadCoordIn;

uniform vec2 position;
uniform float spaceSize;
uniform vec2 modelSize;

varying vec2 quadCoord;
varying vec2 modelSz;

void main(void) {
  // pass the quadCoord to the fragment shader
  quadCoord = quadCoordIn;
  modelSz = modelSize;
  /*
  ** the fourth component is spaceSize because the GPU pipeline
  ** will divide gl_Position.xyz by gl_Position.w
  */
  gl_Position = vec4((modelVertex * modelSize / 2.0) + position, 0.0, spaceSize / 2.0); 
}