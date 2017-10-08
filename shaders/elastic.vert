// with this shader the world will fill the whole viewport
attribute vec2 modelVertex;

uniform vec2 position;
uniform float spaceSize;
uniform vec2 modelSize;

void main(void) {
  /* 
  ** the fourth component is spaceSize because the GPU pipeline 
  ** will divide gl_Position.xyz by gl_Position.w
  */
  gl_Position = vec4((modelVertex * modelSize / 2.0) + position, 0.0, spaceSize / 2.0); 
}
  