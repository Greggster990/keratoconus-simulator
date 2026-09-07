import type { BorderColors } from './imageLoader'
import { STAGE_BORDER } from './imageLoader'
import type { GhostParams } from './presets'
import { downlevelToWebGL1 } from './shaderSource'
import quadVertSrc from './shaders/quad.vert.glsl?raw'
import ghostsFragSrc from './shaders/ghosts.frag.glsl?raw'
import blurFragSrc from './shaders/blur.frag.glsl?raw'
import streakFragSrc from './shaders/streak.frag.glsl?raw'
import presentFragSrc from './shaders/present.frag.glsl?raw'

type GL = WebGLRenderingContext | WebGL2RenderingContext

type Target = {
  framebuffer: WebGLFramebuffer
  texture: WebGLTexture
  width: number
  height: number
}

type ProgramSet = {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
}

const CLEAR = [0.071, 0.067, 0.059, 1] as const

export class Renderer {
  readonly ok: boolean
  readonly error: string | null

  private readonly canvas: HTMLCanvasElement
  private gl: GL | null
  private readonly isWebGL2: boolean
  private quad: WebGLBuffer | null = null
  private ghosts: ProgramSet | null = null
  private blur: ProgramSet | null = null
  private streak: ProgramSet | null = null
  private present: ProgramSet | null = null
  private sourceTexture: WebGLTexture | null = null
  private ghostTarget: Target | null = null
  private blurTarget: Target | null = null
  private streakTarget: Target | null = null
  private imageWidth = 0
  private imageHeight = 0
  private border: BorderColors = STAGE_BORDER
  private params: GhostParams | null = null
  private bypass = false
  private drawQueued = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const setup = createContext(canvas)
    this.gl = setup.gl
    this.isWebGL2 = setup.isWebGL2

    if (!this.gl) {
      this.ok = false
      this.error = setup.error
      return
    }

    try {
      this.quad = createQuad(this.gl)
      this.ghosts = createProgram(
        this.gl,
        this.isWebGL2,
        quadVertSrc,
        ghostsFragSrc,
        [
          'uImage',
          'uTexelSize',
          'uMix',
          'uGhostCount',
          'uSeparationPx',
          'uAngle',
          'uFade',
          'uSoftness',
          'uContrast',
          'uCurve',
          'uScatter',
          'uShapeMode',
          'uBorderL',
          'uBorderR',
          'uBorderT',
          'uBorderB',
        ],
      )
      this.blur = createProgram(this.gl, this.isWebGL2, quadVertSrc, blurFragSrc, [
        'uImage',
        'uTexelSize',
        'uOverall',
        'uEdge',
        'uBorderL',
        'uBorderR',
        'uBorderT',
        'uBorderB',
      ])
      this.streak = createProgram(this.gl, this.isWebGL2, quadVertSrc, streakFragSrc, [
        'uImage',
        'uTexelSize',
        'uLengthPx',
        'uAmount',
        'uAngle',
        'uReflect',
        'uBorderL',
        'uBorderR',
        'uBorderT',
        'uBorderB',
      ])
      this.present = createProgram(this.gl, this.isWebGL2, quadVertSrc, presentFragSrc, ['uImage'])
      this.ok = true
      this.error = null
    } catch (err) {
      this.ok = false
      this.error = err instanceof Error ? err.message : 'Shader setup failed.'
      this.gl = null
    }
  }

  hasImage(): boolean {
    return this.sourceTexture !== null && this.imageWidth > 0
  }

  setImage(source: TexImageSource, width: number, height: number, border?: BorderColors): void {
    const gl = this.gl
    if (!gl || !this.ok) {
      return
    }

    if (this.sourceTexture) {
      gl.deleteTexture(this.sourceTexture)
    }
    this.sourceTexture = uploadTexture(gl, source)
    this.imageWidth = width
    this.imageHeight = height
    this.border = border ?? STAGE_BORDER
    this.rebuildTarget()
    this.requestDraw()
  }

  setParams(params: GhostParams): void {
    this.params = params
    this.requestDraw()
  }

  setBypass(bypass: boolean): void {
    if (this.bypass === bypass) {
      return
    }
    this.bypass = bypass
    this.requestDraw()
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = Math.max(1, Math.round(this.canvas.clientWidth * dpr))
    const height = Math.max(1, Math.round(this.canvas.clientHeight * dpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
    }
    this.requestDraw()
  }

  requestDraw(): void {
    if (this.drawQueued) {
      return
    }
    this.drawQueued = true
    requestAnimationFrame(() => {
      this.drawQueued = false
      this.draw()
    })
  }

  async exportPngBlob(): Promise<Blob> {
    const gl = this.gl
    if (!gl || !this.hasImage()) {
      throw new Error('Load a photo first.')
    }

    this.draw()

    const src = this.outputTexture()
    if (!src) {
      throw new Error('Nothing to export.')
    }

    const w = this.imageWidth
    const h = this.imageHeight
    const scratch = createTarget(gl, w, h)
    try {
      gl.bindFramebuffer(gl.FRAMEBUFFER, scratch.framebuffer)
      gl.viewport(0, 0, w, h)
      this.drawTextured(src)
      const pixels = new Uint8Array(w * h * 4)
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      const flipped = flipY(pixels, w, h)
      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const ctx = out.getContext('2d')
      if (!ctx) {
        throw new Error('Could not export the image.')
      }
      const imageData = new ImageData(w, h)
      imageData.data.set(flipped)
      ctx.putImageData(imageData, 0, 0)
      return await canvasToBlob(out)
    } finally {
      destroyTarget(gl, scratch)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
  }

  dispose(): void {
    const gl = this.gl
    if (!gl) {
      return
    }
    if (this.sourceTexture) {
      gl.deleteTexture(this.sourceTexture)
    }
    if (this.ghostTarget) {
      destroyTarget(gl, this.ghostTarget)
    }
    if (this.blurTarget) {
      destroyTarget(gl, this.blurTarget)
    }
    if (this.streakTarget) {
      destroyTarget(gl, this.streakTarget)
    }
    if (this.quad) {
      gl.deleteBuffer(this.quad)
    }
    if (this.ghosts) {
      gl.deleteProgram(this.ghosts.program)
    }
    if (this.blur) {
      gl.deleteProgram(this.blur.program)
    }
    if (this.streak) {
      gl.deleteProgram(this.streak.program)
    }
    if (this.present) {
      gl.deleteProgram(this.present.program)
    }
  }

  private rebuildTarget(): void {
    const gl = this.gl
    if (!gl) {
      return
    }
    if (this.ghostTarget) {
      destroyTarget(gl, this.ghostTarget)
      this.ghostTarget = null
    }
    if (this.blurTarget) {
      destroyTarget(gl, this.blurTarget)
      this.blurTarget = null
    }
    if (this.streakTarget) {
      destroyTarget(gl, this.streakTarget)
      this.streakTarget = null
    }
    if (this.imageWidth > 0 && this.imageHeight > 0) {
      this.ghostTarget = createTarget(gl, this.imageWidth, this.imageHeight)
      this.blurTarget = createTarget(gl, this.imageWidth, this.imageHeight)
      this.streakTarget = createTarget(gl, this.imageWidth, this.imageHeight)
    }
  }

  private draw(): void {
    const gl = this.gl
    if (!gl || !this.ok || !this.ghosts || !this.blur || !this.streak || !this.present || !this.quad) {
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    if (
      !this.sourceTexture ||
      !this.ghostTarget ||
      !this.blurTarget ||
      !this.streakTarget ||
      !this.params
    ) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      gl.clearColor(CLEAR[0], CLEAR[1], CLEAR[2], CLEAR[3])
      gl.clear(gl.COLOR_BUFFER_BIT)
      return
    }

    if (!this.bypass) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.ghostTarget.framebuffer)
      gl.viewport(0, 0, this.ghostTarget.width, this.ghostTarget.height)
      this.drawGhosts()

      let current = this.ghostTarget.texture
      if (this.blurActive()) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurTarget.framebuffer)
        gl.viewport(0, 0, this.blurTarget.width, this.blurTarget.height)
        this.drawBlur(current)
        current = this.blurTarget.texture
      }
      if (this.streakActive()) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.streakTarget.framebuffer)
        gl.viewport(0, 0, this.streakTarget.width, this.streakTarget.height)
        this.drawStreak(current)
      }
    }

    const out = this.outputTexture()
    if (!out) {
      return
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(CLEAR[0], CLEAR[1], CLEAR[2], CLEAR[3])
    gl.clear(gl.COLOR_BUFFER_BIT)

    const fit = containFit(this.canvas.width, this.canvas.height, this.imageWidth, this.imageHeight)
    gl.viewport(fit.x, fit.y, fit.w, fit.h)
    this.drawTextured(out)
  }

  private drawGhosts(): void {
    const gl = this.gl
    const ghosts = this.ghosts
    const params = this.params
    if (!gl || !ghosts || !params || !this.sourceTexture) {
      return
    }

    gl.useProgram(ghosts.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture)
    gl.uniform1i(ghosts.uniforms.uImage, 0)
    gl.uniform2f(ghosts.uniforms.uTexelSize, 1 / this.imageWidth, 1 / this.imageHeight)
    gl.uniform1f(ghosts.uniforms.uMix, params.mix)
    gl.uniform1i(ghosts.uniforms.uGhostCount, params.ghostCount)
    const minSide = Math.min(this.imageWidth, this.imageHeight)
    gl.uniform1f(ghosts.uniforms.uSeparationPx, (params.separation / 100) * minSide)
    gl.uniform1f(ghosts.uniforms.uAngle, (params.angle * Math.PI) / 180)
    gl.uniform1f(ghosts.uniforms.uFade, params.fade)
    gl.uniform1f(ghosts.uniforms.uSoftness, params.softness)
    gl.uniform1f(ghosts.uniforms.uContrast, params.contrast)
    gl.uniform1f(ghosts.uniforms.uCurve, params.curve)
    gl.uniform1f(ghosts.uniforms.uScatter, params.scatter)
    gl.uniform1f(ghosts.uniforms.uShapeMode, params.shapeMode === 'ring' ? 2 : params.shapeMode === 'scattershot' ? 1 : 0)
    this.setBorderUniforms(ghosts)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private drawBlur(input: WebGLTexture): void {
    const gl = this.gl
    const blur = this.blur
    const params = this.params
    if (!gl || !blur || !params) {
      return
    }
    gl.useProgram(blur.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, input)
    gl.uniform1i(blur.uniforms.uImage, 0)
    gl.uniform2f(blur.uniforms.uTexelSize, 1 / this.imageWidth, 1 / this.imageHeight)
    gl.uniform1f(blur.uniforms.uOverall, params.overallBlur)
    gl.uniform1f(blur.uniforms.uEdge, params.edgeBlur)
    this.setBorderUniforms(blur)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private drawStreak(input: WebGLTexture): void {
    const gl = this.gl
    const streak = this.streak
    const params = this.params
    if (!gl || !streak || !params) {
      return
    }
    gl.useProgram(streak.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, input)
    gl.uniform1i(streak.uniforms.uImage, 0)
    gl.uniform2f(streak.uniforms.uTexelSize, 1 / this.imageWidth, 1 / this.imageHeight)
    const minSide = Math.min(this.imageWidth, this.imageHeight)
    gl.uniform1f(streak.uniforms.uLengthPx, (params.streakLength / 100) * minSide)
    gl.uniform1f(streak.uniforms.uAmount, params.streakAmount)
    gl.uniform1f(streak.uniforms.uAngle, (params.angle * Math.PI) / 180)
    gl.uniform1f(streak.uniforms.uReflect, params.streakReflect ? 1 : 0)
    this.setBorderUniforms(streak)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private setBorderUniforms(program: ProgramSet): void {
    const gl = this.gl
    if (!gl) {
      return
    }
    const b = this.border
    gl.uniform3f(program.uniforms.uBorderL, b.left[0], b.left[1], b.left[2])
    gl.uniform3f(program.uniforms.uBorderR, b.right[0], b.right[1], b.right[2])
    gl.uniform3f(program.uniforms.uBorderT, b.top[0], b.top[1], b.top[2])
    gl.uniform3f(program.uniforms.uBorderB, b.bottom[0], b.bottom[1], b.bottom[2])
  }

  private blurActive(): boolean {
    if (!this.params) {
      return false
    }
    return this.params.overallBlur > 0.04 || this.params.edgeBlur > 0.04
  }

  private streakActive(): boolean {
    if (!this.params) {
      return false
    }
    return this.params.streakLength > 0.04 && this.params.streakAmount > 0.01
  }

  private outputTexture(): WebGLTexture | null {
    if (this.bypass || !this.params) {
      return this.sourceTexture
    }
    if (this.streakActive()) {
      return this.streakTarget?.texture ?? this.blurTarget?.texture ?? this.ghostTarget?.texture ?? this.sourceTexture
    }
    if (this.blurActive()) {
      return this.blurTarget?.texture ?? this.ghostTarget?.texture ?? this.sourceTexture
    }
    return this.ghostTarget?.texture ?? this.sourceTexture
  }

  private drawTextured(texture: WebGLTexture): void {
    const gl = this.gl
    const present = this.present
    if (!gl || !present) {
      return
    }
    gl.useProgram(present.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    const filter = this.upscaling() ? gl.NEAREST : gl.LINEAR
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.uniform1i(present.uniforms.uImage, 0)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private upscaling(): boolean {
    if (this.imageWidth <= 0 || this.imageHeight <= 0) {
      return false
    }
    const fit = containFit(this.canvas.width, this.canvas.height, this.imageWidth, this.imageHeight)
    return fit.w > this.imageWidth + 1 || fit.h > this.imageHeight + 1
  }
}

function createContext(canvas: HTMLCanvasElement): {
  gl: GL | null
  isWebGL2: boolean
  error: string | null
} {
  const attrs: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  }
  const gl2 = canvas.getContext('webgl2', attrs)
  if (gl2) {
    return { gl: gl2, isWebGL2: true, error: null }
  }
  const gl1 = canvas.getContext('webgl', attrs)
  if (gl1) {
    return { gl: gl1, isWebGL2: false, error: null }
  }
  return {
    gl: null,
    isWebGL2: false,
    error: 'WebGL is not available in this browser.',
  }
}

function createQuad(gl: GL): WebGLBuffer {
  const buffer = gl.createBuffer()
  if (!buffer) {
    throw new Error('Could not create geometry.')
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  return buffer
}

function createProgram(
  gl: GL,
  isWebGL2: boolean,
  vertSrc: string,
  fragSrc: string,
  uniformNames: string[],
): ProgramSet {
  const vert = isWebGL2 ? vertSrc : downlevelToWebGL1(vertSrc, 'vert')
  const frag = isWebGL2 ? fragSrc : downlevelToWebGL1(fragSrc, 'frag')
  const program = linkProgram(gl, vert, frag)
  const uniforms: Record<string, WebGLUniformLocation | null> = {}
  for (const name of uniformNames) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }
  return { program, uniforms }
}

function linkProgram(gl: GL, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const program = gl.createProgram()
  if (!program) {
    throw new Error('Could not create shader program.')
  }
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.bindAttribLocation(program, 0, 'aPos')
  gl.linkProgram(program)
  gl.deleteShader(vert)
  gl.deleteShader(frag)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(log || 'Shader link failed.')
  }
  return program
}

function compileShader(gl: GL, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Could not create shader.')
  }
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(log || 'Shader compile failed.')
  }
  return shader
}

function uploadTexture(gl: GL, source: TexImageSource): WebGLTexture {
  const texture = gl.createTexture()
  if (!texture) {
    throw new Error('Could not create texture.')
  }
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
  return texture
}

function createTarget(gl: GL, width: number, height: number): Target {
  const texture = gl.createTexture()
  const framebuffer = gl.createFramebuffer()
  if (!texture || !framebuffer) {
    throw new Error('Could not create render target.')
  }
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteTexture(texture)
    gl.deleteFramebuffer(framebuffer)
    throw new Error('Could not create render target.')
  }
  return { framebuffer, texture, width, height }
}

function destroyTarget(gl: GL, target: Target): void {
  gl.deleteFramebuffer(target.framebuffer)
  gl.deleteTexture(target.texture)
}

function containFit(
  canvasW: number,
  canvasH: number,
  imageW: number,
  imageH: number,
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(canvasW / imageW, canvasH / imageH)
  const w = Math.max(1, Math.round(imageW * scale))
  const h = Math.max(1, Math.round(imageH * scale))
  const x = Math.round((canvasW - w) / 2)
  const y = Math.round((canvasH - h) / 2)
  return { x, y, w, h }
}

function flipY(pixels: Uint8Array, width: number, height: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length)
  const stride = width * 4
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * stride
    out.set(pixels.subarray(src, src + stride), y * stride)
  }
  return out
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Could not encode the PNG.'))
      }
    }, 'image/png')
  })
}
