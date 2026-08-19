#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;

void main() {
  fragColor = texture(uImage, vUv);
}
