#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;
uniform vec2 uTexelSize;
uniform float uMix;
uniform int uGhostCount;
uniform float uSeparationPx;
uniform float uAngle;
uniform float uFade;
uniform float uSoftness;
uniform float uContrast;
uniform float uCurve;
uniform float uScatter;
uniform float uShapeMode;
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

vec4 softSample(vec2 uv, float radiusPx) {
  if (radiusPx < 0.05) {
    return sampleLin(uv);
  }
  vec2 r = uTexelSize * radiusPx;
  vec4 acc = vec4(0.0);
  acc += sampleLin(uv + vec2(-r.x, -r.y));
  acc += sampleLin(uv + vec2(0.0, -r.y)) * 2.0;
  acc += sampleLin(uv + vec2(r.x, -r.y));
  acc += sampleLin(uv + vec2(-r.x, 0.0)) * 2.0;
  acc += sampleLin(uv) * 4.0;
  acc += sampleLin(uv + vec2(r.x, 0.0)) * 2.0;
  acc += sampleLin(uv + vec2(-r.x, r.y));
  acc += sampleLin(uv + vec2(0.0, r.y)) * 2.0;
  acc += sampleLin(uv + vec2(r.x, r.y));
  return acc / 16.0;
}

float localContrast(vec2 uv) {
  vec2 o = uTexelSize * 2.5;
  float c = luma(sampleLin(uv).rgb);
  float a = luma(sampleLin(uv + vec2(o.x, 0.0)).rgb);
  float b = luma(sampleLin(uv - vec2(o.x, 0.0)).rgb);
  float d = luma(sampleLin(uv + vec2(0.0, o.y)).rgb);
  float e = luma(sampleLin(uv - vec2(0.0, o.y)).rgb);
  float mn = min(c, min(min(a, b), min(d, e)));
  float mx = max(c, max(max(a, b), max(d, e)));
  return mx - mn;
}

vec2 hash2(float n) {
  return fract(sin(vec2(n, n + 17.13) * vec2(127.1, 311.7)) * 43758.5453);
}

float ghostVisibility(vec4 ghost, vec4 dest, vec2 srcUv) {
  float delta = abs(luma(ghost.rgb) - luma(dest.rgb));
  float edge = localContrast(srcUv);
  float raw = max(delta, edge * 0.9);
  float lo = mix(0.0, 0.11, uContrast);
  float hi = mix(0.28, 0.32, uContrast);
  float vis = smoothstep(lo, hi, raw);
  return mix(1.0, vis, clamp(uContrast, 0.0, 1.0));
}

vec2 ghostOffsetPx(float t) {
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 h = hash2(t + uAngle * 0.017);
  vec2 g = hash2(t * 7.73 + 3.11);

  float along = uSeparationPx * t;
  along += (h.x - 0.5) * uScatter * uSeparationPx * 0.2;
  float arc = uCurve * uSeparationPx * t * t * 0.4;
  vec2 linear = dir * along + perp * arc + (h - 0.5) * uScatter * uSeparationPx * 0.25;

  float ring = uSeparationPx * (0.55 + 0.55 * t) * mix(0.8, 1.7, clamp(uScatter * 0.5, 0.0, 1.0));
  float wobble = (g.x - 0.5) * uSeparationPx * mix(0.25, 0.9, clamp(uScatter * 0.5, 0.0, 1.0));
  float sprayAng = (g.y + h.y * 0.17) * 6.2831853;
  vec2 spray = vec2(cos(sprayAng), sin(sprayAng)) * (ring + wobble);

  return mix(linear, spray, clamp(uShapeMode, 0.0, 1.0));
}

// Add displaced light without painting dark copies over the main object.
// The source luminance makes highlights contribute more than dim surfaces.
vec3 ringLight(vec2 uv, vec4 original, float softness) {
  vec4 ghost = softSample(uv, softness);
  float highlight = mix(0.15, 1.0, smoothstep(0.02, 0.7, luma(ghost.rgb)));
  float vis = ghostVisibility(ghost, original, uv);
  return max(ghost.rgb - original.rgb, vec3(0.0)) * highlight * vis;
}

vec3 ringGhosts(vec4 original) {
  vec2 dir = vec2(cos(uAngle), sin(uAngle));
  vec2 perp = vec2(-dir.y, dir.x);
  float radius = uSeparationPx * 2.0;
  float steps = float(uGhostCount + 1);
  vec3 light = vec3(0.0);
  float weightSum = 0.0;
  // Count pairs along both semicircles, then sample their shared end once.
  const int MAX_RING_STEPS = 11;
  for (int i = 1; i <= MAX_RING_STEPS; i++) {
    if (i > uGhostCount + 1) break;
    float progress = float(i) / steps;
    float theta = 3.14159265 * progress;
    vec2 along = dir * radius * (1.0 - cos(theta));
    vec2 across = perp * radius * sin(theta);
    float w = pow(uFade, 1.0 + 3.0 * progress)
      * mix(1.0, 0.12, progress * progress);
    float softness = uSoftness * (1.0 + 2.0 * progress);
    if (i == uGhostCount + 1) {
      light += ringLight(vUv - along * uTexelSize, original, softness) * w;
    } else {
      light += ringLight(vUv - (along + across) * uTexelSize, original, softness) * w * 0.5;
      light += ringLight(vUv - (along - across) * uTexelSize, original, softness) * w * 0.5;
    }
    weightSum += w;
  }
  return original.rgb + light * clamp(uMix, 0.0, 1.0) / max(1.0, weightSum);
}

void main() {
  vec4 original = sampleLin(vUv);
  if (uShapeMode > 1.5) {
    fragColor = vec4(toSRGB(ringGhosts(original)), 1.0);
    return;
  }

  float wSum = 1.0;
  vec4 acc = original;

  const int MAX_GHOSTS = 10;
  for (int i = 1; i <= MAX_GHOSTS; i++) {
    if (i > uGhostCount) {
      break;
    }
    float t = float(i);
    vec2 h = hash2(t + 3.7);
    float w = pow(uFade, t) * mix(1.0, 0.72 + 0.5 * h.x, clamp(uScatter, 0.0, 2.0) * 0.3);
    vec2 uvI = vUv - ghostOffsetPx(t) * uTexelSize;
    vec4 g = softSample(uvI, uSoftness * t);
    float vis = ghostVisibility(g, original, uvI);
    acc += mix(original, g, vis) * w;
    wSum += w;
  }

  vec4 ghosted = acc / max(wSum, 1e-5);
  vec4 mixed = mix(original, ghosted, clamp(uMix, 0.0, 1.0));
  fragColor = vec4(toSRGB(mixed.rgb), 1.0);
}
