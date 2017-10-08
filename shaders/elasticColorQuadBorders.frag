precision mediump float;

uniform vec4 color;

varying vec2 quadCoord;
varying vec2 modelSz;

void main(void) {
  vec2 margin = 0.2 / modelSz;
  if (quadCoord.x > 1.0 - margin.x
    || quadCoord.x < 0.0 + margin.x
    || quadCoord.y > 1.0 - margin.y
    || quadCoord.y < 0.0 + margin.y
  ) {
    gl_FragColor = color;
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
