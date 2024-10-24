import { T as TextureSource, a as Texture, n as nextPow2 } from "./index-D5yNLquu.js";
const blendModeIds = {
  normal: 0,
  add: 1,
  multiply: 2,
  screen: 3,
  overlay: 4,
  erase: 5,
  "normal-npm": 6,
  "add-npm": 7,
  "screen-npm": 8,
  min: 9,
  max: 10
};
const BLEND = 0;
const OFFSET = 1;
const CULLING = 2;
const DEPTH_TEST = 3;
const WINDING = 4;
const DEPTH_MASK = 5;
const _State = class _State2 {
  constructor() {
    this.data = 0;
    this.blendMode = "normal";
    this.polygonOffset = 0;
    this.blend = true;
    this.depthMask = true;
  }
  /**
   * Activates blending of the computed fragment color values.
   * @default true
   */
  get blend() {
    return !!(this.data & 1 << BLEND);
  }
  set blend(value) {
    if (!!(this.data & 1 << BLEND) !== value) {
      this.data ^= 1 << BLEND;
    }
  }
  /**
   * Activates adding an offset to depth values of polygon's fragments
   * @default false
   */
  get offsets() {
    return !!(this.data & 1 << OFFSET);
  }
  set offsets(value) {
    if (!!(this.data & 1 << OFFSET) !== value) {
      this.data ^= 1 << OFFSET;
    }
  }
  /** The culling settings for this state none - No culling back - Back face culling front - Front face culling */
  set cullMode(value) {
    if (value === "none") {
      this.culling = false;
      return;
    }
    this.culling = true;
    this.clockwiseFrontFace = value === "front";
  }
  get cullMode() {
    if (!this.culling) {
      return "none";
    }
    return this.clockwiseFrontFace ? "front" : "back";
  }
  /**
   * Activates culling of polygons.
   * @default false
   */
  get culling() {
    return !!(this.data & 1 << CULLING);
  }
  set culling(value) {
    if (!!(this.data & 1 << CULLING) !== value) {
      this.data ^= 1 << CULLING;
    }
  }
  /**
   * Activates depth comparisons and updates to the depth buffer.
   * @default false
   */
  get depthTest() {
    return !!(this.data & 1 << DEPTH_TEST);
  }
  set depthTest(value) {
    if (!!(this.data & 1 << DEPTH_TEST) !== value) {
      this.data ^= 1 << DEPTH_TEST;
    }
  }
  /**
   * Enables or disables writing to the depth buffer.
   * @default true
   */
  get depthMask() {
    return !!(this.data & 1 << DEPTH_MASK);
  }
  set depthMask(value) {
    if (!!(this.data & 1 << DEPTH_MASK) !== value) {
      this.data ^= 1 << DEPTH_MASK;
    }
  }
  /**
   * Specifies whether or not front or back-facing polygons can be culled.
   * @default false
   */
  get clockwiseFrontFace() {
    return !!(this.data & 1 << WINDING);
  }
  set clockwiseFrontFace(value) {
    if (!!(this.data & 1 << WINDING) !== value) {
      this.data ^= 1 << WINDING;
    }
  }
  /**
   * The blend mode to be applied when this state is set. Apply a value of `normal` to reset the blend mode.
   * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
   * @default 'normal'
   */
  get blendMode() {
    return this._blendMode;
  }
  set blendMode(value) {
    this.blend = value !== "none";
    this._blendMode = value;
    this._blendModeId = blendModeIds[value] || 0;
  }
  /**
   * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
   * @default 0
   */
  get polygonOffset() {
    return this._polygonOffset;
  }
  set polygonOffset(value) {
    this.offsets = !!value;
    this._polygonOffset = value;
  }
  toString() {
    return `[pixi.js/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
  }
  /**
   * A quickly getting an instance of a State that is configured for 2d rendering.
   * @returns a new State with values set for 2d rendering
   */
  static for2d() {
    const state = new _State2();
    state.depthTest = false;
    state.blend = true;
    return state;
  }
};
_State.default2d = _State.for2d();
let State = _State;
let count = 0;
class TexturePoolClass {
  /**
   * @param textureOptions - options that will be passed to BaseRenderTexture constructor
   * @param {SCALE_MODE} [textureOptions.scaleMode] - See {@link SCALE_MODE} for possible values.
   */
  constructor(textureOptions) {
    this._poolKeyHash = /* @__PURE__ */ Object.create(null);
    this._texturePool = {};
    this.textureOptions = textureOptions || {};
    this.enableFullScreen = false;
  }
  /**
   * Creates texture with params that were specified in pool constructor.
   * @param pixelWidth - Width of texture in pixels.
   * @param pixelHeight - Height of texture in pixels.
   * @param antialias
   */
  createTexture(pixelWidth, pixelHeight, antialias) {
    const textureSource = new TextureSource({
      ...this.textureOptions,
      width: pixelWidth,
      height: pixelHeight,
      resolution: 1,
      antialias,
      autoGarbageCollect: true
    });
    return new Texture({
      source: textureSource,
      label: `texturePool_${count++}`
    });
  }
  /**
   * Gets a Power-of-Two render texture or fullScreen texture
   * @param frameWidth - The minimum width of the render texture.
   * @param frameHeight - The minimum height of the render texture.
   * @param resolution - The resolution of the render texture.
   * @param antialias
   * @returns The new render texture.
   */
  getOptimalTexture(frameWidth, frameHeight, resolution = 1, antialias) {
    let po2Width = Math.ceil(frameWidth * resolution - 1e-6);
    let po2Height = Math.ceil(frameHeight * resolution - 1e-6);
    po2Width = nextPow2(po2Width);
    po2Height = nextPow2(po2Height);
    const key = (po2Width << 17) + (po2Height << 1) + (antialias ? 1 : 0);
    if (!this._texturePool[key]) {
      this._texturePool[key] = [];
    }
    let texture = this._texturePool[key].pop();
    if (!texture) {
      texture = this.createTexture(po2Width, po2Height, antialias);
    }
    texture.source._resolution = resolution;
    texture.source.width = po2Width / resolution;
    texture.source.height = po2Height / resolution;
    texture.source.pixelWidth = po2Width;
    texture.source.pixelHeight = po2Height;
    texture.frame.x = 0;
    texture.frame.y = 0;
    texture.frame.width = frameWidth;
    texture.frame.height = frameHeight;
    texture.updateUvs();
    this._poolKeyHash[texture.uid] = key;
    return texture;
  }
  /**
   * Gets extra texture of the same size as input renderTexture
   * @param texture - The texture to check what size it is.
   * @param antialias - Whether to use antialias.
   * @returns A texture that is a power of two
   */
  getSameSizeTexture(texture, antialias = false) {
    const source = texture.source;
    return this.getOptimalTexture(texture.width, texture.height, source._resolution, antialias);
  }
  /**
   * Place a render texture back into the pool.
   * @param renderTexture - The renderTexture to free
   */
  returnTexture(renderTexture) {
    const key = this._poolKeyHash[renderTexture.uid];
    this._texturePool[key].push(renderTexture);
  }
  /**
   * Clears the pool.
   * @param destroyTextures - Destroy all stored textures.
   */
  clear(destroyTextures) {
    destroyTextures = destroyTextures !== false;
    if (destroyTextures) {
      for (const i in this._texturePool) {
        const textures = this._texturePool[i];
        if (textures) {
          for (let j = 0; j < textures.length; j++) {
            textures[j].destroy(true);
          }
        }
      }
    }
    this._texturePool = {};
  }
}
const TexturePool = new TexturePoolClass();
const localUniformBit = {
  name: "local-uniform-bit",
  vertex: {
    header: (
      /* wgsl */
      `

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `
    ),
    main: (
      /* wgsl */
      `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `
    ),
    end: (
      /* wgsl */
      `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    )
  }
};
const localUniformBitGroup2 = {
  ...localUniformBit,
  vertex: {
    ...localUniformBit.vertex,
    // replace the group!
    header: localUniformBit.vertex.header.replace("group(1)", "group(2)")
  }
};
const localUniformBitGl = {
  name: "local-uniform-bit",
  vertex: {
    header: (
      /* glsl */
      `

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `
    ),
    main: (
      /* glsl */
      `
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `
    ),
    end: (
      /* glsl */
      `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    )
  }
};
class BatchableSprite {
  constructor() {
    this.batcherName = "default";
    this.attributeSize = 4;
    this.indexSize = 6;
    this.packAsQuad = true;
    this.roundPixels = 0;
    this._attributeStart = 0;
    this._batcher = null;
    this._batch = null;
  }
  get blendMode() {
    return this.renderable.groupBlendMode;
  }
  get color() {
    return this.renderable.groupColorAlpha;
  }
  reset() {
    this.renderable = null;
    this.texture = null;
    this._batcher = null;
    this._batch = null;
    this.bounds = null;
  }
}
function color32BitToUniform(abgr, out, offset) {
  const alpha = (abgr >> 24 & 255) / 255;
  out[offset++] = (abgr & 255) / 255 * alpha;
  out[offset++] = (abgr >> 8 & 255) / 255 * alpha;
  out[offset++] = (abgr >> 16 & 255) / 255 * alpha;
  out[offset++] = alpha;
}
export {
  BatchableSprite as B,
  State as S,
  TexturePool as T,
  localUniformBit as a,
  localUniformBitGl as b,
  color32BitToUniform as c,
  localUniformBitGroup2 as l
};
