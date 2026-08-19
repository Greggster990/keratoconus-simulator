#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;
uniform vec2 uTexelSize;
uniform float uOverall;
uniform float uEdge;
uniform vec3 uBorderL;
uniform vec3 uBorderR;
uniform vec3 uBorderT;
uniform vec3 uBorderB;

vec3 toLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

vec3 toSRGB(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2));
}

float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

vec3 sideBorder(vec2 uv) {
  float l = max(-uv.x, 0.0);
  float r = max(uv.x - 1.0, 0.0);
  float b = max(-uv.y, 0.0);
  float t = max(uv.y - 1.0, 0.0);
  float wsum = l + r + b + t;
  if (wsum < 1e-6) {
    return (uBorderL + uBorderR + uBorderT + uBorderB) * 0.25;
  }
  return (uBorderL * l + uBorderR * r + uBorderT * t + uBorderB * b) / wsum;
}

vec4 sampleLin(vec2 uv) {
  vec2 inside = clamp(uv, vec2(0.0), vec2(1.0));
  vec3 photo = texture(uImage, inside).rgb;
  float oob = max(max(-uv.x, uv.x - 1.0), max(-uv.y, uv.y - 1.0));
  vec3 rgb = mix(photo, sideBorder(uv), smoothstep(0.0, 0.004, max(oob, 0.0)));
  return vec4(toLinear(rgb), 1.0);
}

float lumaAt(vec2 uv) {
  return luma(sampleLin(uv).rgb);
}

float edgeMask(vec2 uv) {
  vec2 t = uTexelSize * 1.5;
  float n = lumaAt(uv + vec2(0.0, t.y));
  float s = lumaAt(uv - vec2(0.0, t.y));
  float e = lumaAt(uv + vec2(t.x, 0.0));
  float w = lumaAt(uv - vec2(t.x, 0.0));
  float ne = lumaAt(uv + vec2(t.x, t.y));
  float nw = lumaAt(uv + vec2(-t.x, t.y));
  float se = lumaAt(uv + vec2(t.x, -t.y));
  float sw = lumaAt(uv + vec2(-t.x, -t.y));
  float gx = -nw - 2.0 * w - sw + ne + 2.0 * e + se;
  float gy = -nw - 2.0 * n - ne + sw + 2.0 * s + se;
  return smoothstep(0.04, 0.28, length(vec2(gx, gy)));
}

vec4 gauss(vec2 uv, float radius) {
  if (radius < 0.05) {
    return sampleLin(uv);
  }
  vec2 r1 = uTexelSize * radius * 0.55;
  vec2 r2 = uTexelSize * radius;
  vec2 r3 = uTexelSize * radius * 1.55;
  vec4 acc = sampleLin(uv) * 0.18;
  acc += sampleLin(uv + vec2(r1.x, 0.0)) * 0.09;
  acc += sampleLin(uv - vec2(r1.x, 0.0)) * 0.09;
  acc += sampleLin(uv + vec2(0.0, r1.y)) * 0.09;
  acc += sampleLin(uv - vec2(0.0, r1.y)) * 0.09;
  acc += sampleLin(uv + vec2(r2.x, 0.0)) * 0.06;
  acc += sampleLin(uv - vec2(r2.x, 0.0)) * 0.06;
  acc += sampleLin(uv + vec2(0.0, r2.y)) * 0.06;
  acc += sampleLin(uv - vec2(0.0, r2.y)) * 0.06;
  acc += sampleLin(uv + r2) * 0.04;
  acc += sampleLin(uv + vec2(-r2.x, r2.y)) * 0.04;
  acc += sampleLin(uv + vec2(r2.x, -r2.y)) * 0.04;
  acc += sampleLin(uv - r2) * 0.04;
  acc += sampleLin(uv + vec2(r3.x, 0.0)) * 0.015;
  acc += sampleLin(uv - vec2(r3.x, 0.0)) * 0.015;
  acc += sampleLin(uv + vec2(0.0, r3.y)) * 0.015;
  acc += sampleLin(uv - vec2(0.0, r3.y)) * 0.015;
  return acc;
}

void main() {
  float e = edgeMask(vUv);
  float radius = max(0.0, uOverall) + max(0.0, uEdge) * e;
  vec4 color = gauss(vUv, radius);
  fragColor = vec4(toSRGB(color.rgb), 1.0);
}
