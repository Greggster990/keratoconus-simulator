export function downlevelToWebGL1(source: string, kind: 'vert' | 'frag'): string {
  let s = source.replace(/^#version 300 es\n/, '')
  s = s.replace(/layout\s*\(\s*location\s*=\s*\d+\s*\)\s*/g, '')
  if (kind === 'vert') {
    s = s.replace(/\bin\b/g, 'attribute')
    s = s.replace(/\bout\b/g, 'varying')
  } else {
    s = s.replace(/out\s+vec4\s+\w+\s*;\s*/g, '')
    s = s.replace(/\bin\b/g, 'varying')
    s = s.replace(/\btexture\s*\(/g, 'texture2D(')
    s = s.replace(/\bfragColor\b/g, 'gl_FragColor')
  }
  return s
}
