#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;
uniform vec2 uTexelSize;
uniform float uLengthPx;
uniform float uAmount;
uniform float uAngle;
uniform float uReflect;
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

vec3 brightest(vec3 a, vec3 b) {
  return luma(a) >= luma(b) ? a : b;
}

void addTail(vec2 dir, float strength, float lengthPx, float destL, inout vec3 acc, inout float wSum) {
  const int TAPS = 48;
  vec2 perp = vec2(-dir.y, dir.x);
  for (int i = 1; i <= TAPS; i++) {
    float t0 = float(i - 1) / float(TAPS);
    float t1 = float(i) / float(TAPS);
    float t = 0.5 * (t0 + t1);
    vec2 uv0 = vUv - dir * (lengthPx * t0) * uTexelSize;
    vec2 uv1 = vUv - dir * (lengthPx * t1) * uTexelSize;
    vec2 uvm = 0.5 * (uv0 + uv1);
    vec3 src = brightest(sampleLin(uv0).rgb, sampleLin(uvm).rgb);
    src = brightest(src, sampleLin(uv1).rgb);
    float fat = mix(0.5, 1.6, t);
    src = mix(src, sampleLin(uvm + perp * uTexelSize * fat).rgb, 0.18);

    float srcL = luma(src);
    float hot = pow(clamp(srcL, 0.0, 1.0), 2.2);
    float hotter = smoothstep(0.06, 0.32, srcL - destL);
    float decay = pow(max(1.0 - t, 0.0), 1.05);
    float w = hot * hotter * decay * strength;
    acc += src * w;
    wSum += w;
  }
}

void main() {
  vec4 center = sampleLin(vUv);
  if (uLengthPx < 0.35 || uAmount < 0.01) {
    fragColor = vec4(toSRGB(center.rgb), 1.0);
    return;
  }

  float destL = luma(center.rgb);
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  vec3 acc = center.rgb;
  float wSum = 1.0;
  addTail(dir, 1.0, uLengthPx, destL, acc, wSum);
  if (uReflect > 0.5) {
    addTail(-dir, 0.5, uLengthPx * 0.55, destL, acc, wSum);
  }

  vec3 streaked = acc / max(wSum, 1e-5);
  float incoming = smoothstep(destL, destL + 0.22, luma(streaked.rgb));
  float mixAmt = uAmount * mix(0.22, 1.0, incoming);
  vec3 color = mix(center.rgb, streaked, clamp(mixAmt, 0.0, 1.0));
  fragColor = vec4(toSRGB(color), 1.0);
}
