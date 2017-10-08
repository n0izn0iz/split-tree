precision mediump float;

varying vec2 quadCoord;
varying float modelSz;

void main(void) {
  float margin = 0.2 / modelSz;
  if (quadCoord.x > 1.0 - margin
    || quadCoord.x < 0.0 + margin
    || quadCoord.y > 1.0 - margin
    || quadCoord.y < 0.0 + margin
  ) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.2);
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  }
}
