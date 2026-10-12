/**
 * Draws baked intro layers clipped to a diagonal band. Two implementations:
 *   - WebGL2 (preferred): every bitmap becomes a texture once; each layer is one quad, the band test and the
 *     flat teal / ink tint happen in the fragment shader. Same cost in every browser.
 *   - Canvas 2D (fallback): path clip + drawImage; fine in Chromium, slow in Firefox.
 * Coordinates are CSS px relative to the canvas; a band is the strip hide < (x + y) < reveal in the box's
 * local space.
 */

export type Tint = "teal" | "ink" | null;
export type Box = { x: number; y: number; w: number; h: number };
export type ColorMatrix = { mat: Float32Array; offset: Float32Array };

export interface IntroRenderer {
  readonly kind: "webgl2" | "2d";
  /** One-time GPU/CPU preparation of bitmap `i` (texture upload / silhouettes). Call spread over frames. */
  prepare(i: number): void;
  /** Replaces bitmap `i` (e.g. artwork that changed since the surface was prepared) and re-prepares it. */
  update(i: number, bitmap: ImageBitmap): void;
  /** Start a frame: clear to the paper colour. */
  begin(): void;
  /** `zoom` > 1 magnifies the bitmap inside its own box (the box itself stays put). */
  /** `matrix` recolours the bitmap like an SVG feColorMatrix (WebGL only; ignored by the 2D fallback). */
  /** `clip`: a zoomed bitmap stays inside its own unzoomed silhouette (an image in its frame, overflow hidden). */
  draw(i: number, box: Box, hide: number, reveal: number, tint: Tint, zoom?: number, matrix?: ColorMatrix | null, clip?: boolean): void;
  /** Full-canvas image multiplied over everything at the end of each frame (paper grain). */
  setOverlay(image: ImageBitmap): void;
  /** Finish a frame (applies the overlay, unless `grain` is false). */
  end(grain?: boolean): void;
  dispose(): void;
}

type Colors = { paper: string; teal: string; ink: string };

/** Context attributes of every intro canvas (a pre-made context must match them to be reused). */
export const GL_ATTRIBUTES: WebGLContextAttributes = { alpha: true, premultipliedAlpha: true, antialias: false };

/** Any CSS colour → [r, g, b, a] in 0..1 (via a 1×1 canvas, so named / rgb() / hex all work). */
function rgba(color: string): [number, number, number, number] {
  const c = new OffscreenCanvas(1, 1).getContext("2d")!;
  c.fillStyle = color;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255, a / 255];
}

const VERT = `#version 300 es
in vec2 a_corner;
uniform vec4 u_rect;   // x, y, w, h (css px)
uniform vec2 u_view;   // canvas size (css px)
out vec2 v_uv;
out vec2 v_local;
void main() {
  vec2 local = a_corner * u_rect.zw;
  vec2 pos = u_rect.xy + local;
  v_uv = a_corner;
  v_local = local;
  gl_Position = vec4(pos.x / u_view.x * 2.0 - 1.0, 1.0 - pos.y / u_view.y * 2.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 v_uv;
in vec2 v_local;
uniform sampler2D u_tex;
uniform vec2 u_band;   // hide, reveal along x + y (css px)
uniform vec4 u_tint;   // rgb, a > 0.5 = paint as flat silhouette
uniform float u_zoom;  // magnification inside the box
uniform float u_useMat;
uniform float u_clip;  // > 0.5: keep the zoomed image inside the unzoomed one's silhouette
uniform mat4 u_mat;    // feColorMatrix (unpremultiplied RGBA)
uniform vec4 u_off;
out vec4 outColor;
void main() {
  float d = v_local.x + v_local.y;
  float aa = max(fwidth(d), 1e-3);
  float inside = clamp((d - u_band.x) / aa, 0.0, 1.0) * clamp((u_band.y - d) / aa, 0.0, 1.0);
  if (inside <= 0.0) discard;
  vec4 c = texture(u_tex, 0.5 + (v_uv - 0.5) / u_zoom);  // premultiplied
  if (u_clip > 0.5) c *= texture(u_tex, v_uv).a;         // its frame: where the image is at zoom 1
  if (u_useMat > 0.5 && c.a > 0.0) {
    vec4 m = u_mat * vec4(c.rgb / c.a, c.a) + u_off;
    c = vec4(clamp(m.rgb, 0.0, 1.0) * c.a, c.a);
  }
  if (u_tint.a > 0.5) c = vec4(u_tint.rgb * c.a, c.a);
  outColor = c * inside;
}`;

export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  bitmaps: ImageBitmap[],
  colors: Colors,
  view: { w: number; h: number },
): IntroRenderer | null {
  const gl = canvas.getContext("webgl2", GL_ATTRIBUTES);
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "a_corner");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = {
    rect: gl.getUniformLocation(program, "u_rect"),
    view: gl.getUniformLocation(program, "u_view"),
    band: gl.getUniformLocation(program, "u_band"),
    tint: gl.getUniformLocation(program, "u_tint"),
    zoom: gl.getUniformLocation(program, "u_zoom"),
    useMat: gl.getUniformLocation(program, "u_useMat"),
    clip: gl.getUniformLocation(program, "u_clip"),
    mat: gl.getUniformLocation(program, "u_mat"),
    off: gl.getUniformLocation(program, "u_off"),
  };
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(u.view, view.w, view.h);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const paper = rgba(colors.paper);
  const tints = { teal: rgba(colors.teal), ink: rgba(colors.ink) };
  const textures: Array<WebGLTexture | null> = bitmaps.map(() => null);
  let overlay: WebGLTexture | null = null;

  const prepare = (i: number) => {
    if (textures[i]) return;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmaps[i]);
    gl.generateMipmap(gl.TEXTURE_2D); // clean downscaling of the 2× bake
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures[i] = tex;
  };

  return {
    kind: "webgl2",
    prepare,
    update(i, bitmap) {
      if (textures[i]) gl.deleteTexture(textures[i]);
      textures[i] = null;
      bitmaps[i] = bitmap;
      prepare(i);
    },
    begin() {
      gl.clearColor(paper[0], paper[1], paper[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    draw(i, box, hide, reveal, tint, zoom = 1, matrix = null, clip = false) {
      if (hide >= reveal) return;
      prepare(i);
      gl.bindTexture(gl.TEXTURE_2D, textures[i]);
      gl.uniform1f(u.zoom, zoom);
      gl.uniform1f(u.useMat, matrix ? 1 : 0);
      gl.uniform1f(u.clip, clip && zoom !== 1 ? 1 : 0);
      if (matrix) {
        gl.uniformMatrix4fv(u.mat, false, matrix.mat);
        gl.uniform4fv(u.off, matrix.offset);
      }
      gl.uniform4f(u.rect, box.x, box.y, box.w, box.h);
      gl.uniform2f(u.band, hide, reveal);
      const t = tint ? tints[tint] : null;
      gl.uniform4f(u.tint, t ? t[0] : 0, t ? t[1] : 0, t ? t[2] : 0, t ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    setOverlay(image) {
      overlay = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, overlay);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    },
    end(grain = true) {
      if (!overlay || !grain) return;
      gl.blendFunc(gl.DST_COLOR, gl.ZERO); // multiply
      gl.bindTexture(gl.TEXTURE_2D, overlay);
      gl.uniform4f(u.rect, 0, 0, view.w, view.h);
      gl.uniform2f(u.band, -1e9, 1e9);
      gl.uniform4f(u.tint, 0, 0, 0, 0);
      gl.uniform1f(u.zoom, 1);
      gl.uniform1f(u.useMat, 0);
      gl.uniform1f(u.clip, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    },
    dispose() {
      textures.forEach((t) => t && gl.deleteTexture(t));
      if (overlay) gl.deleteTexture(overlay);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

/** Flat silhouette of `image` in `color`, at half resolution (it only shows as a fast-moving band). */
function silhouette(image: ImageBitmap, color: string) {
  const w = Math.max(1, Math.ceil(image.width / 2));
  const h = Math.max(1, Math.ceil(image.height / 2));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  return canvas.transferToImageBitmap();
}

export function create2DRenderer(
  canvas: HTMLCanvasElement,
  bitmaps: ImageBitmap[],
  colors: Colors,
  view: { w: number; h: number },
  dpr: number,
): IntroRenderer {
  const ctx = canvas.getContext("2d")!;
  const scratch = document.createElement("canvas");
  ctx.scale(dpr, dpr);
  const tinted: Array<{ teal: ImageBitmap; ink: ImageBitmap } | null> = bitmaps.map(() => null);
  let overlay: ImageBitmap | null = null;

  const prepare = (i: number) => {
    if (tinted[i]) return;
    tinted[i] = { teal: silhouette(bitmaps[i], colors.teal), ink: silhouette(bitmaps[i], colors.ink) };
    // first draw uploads the bitmaps; do it now rather than mid-sweep
    ctx.drawImage(bitmaps[i], 0, 0, 1, 1);
    ctx.drawImage(tinted[i]!.teal, 0, 0, 1, 1);
    ctx.drawImage(tinted[i]!.ink, 0, 0, 1, 1);
  };

  return {
    kind: "2d",
    prepare,
    update(i, bitmap) {
      tinted[i] = null;
      bitmaps[i] = bitmap;
      prepare(i);
    },
    begin() {
      ctx.fillStyle = colors.paper;
      ctx.fillRect(0, 0, view.w, view.h);
    },
    draw(i, box, hide, reveal, tint, zoom = 1, _matrix = null, clip = false) {
      if (hide >= reveal) return;
      prepare(i);
      const image = tint ? tinted[i]![tint] : bitmaps[i];
      const { x, y, w, h } = box;
      if (zoom !== 1 && clip) {
        // zoomed, then cut back to the image's own silhouette at zoom 1 (on a scratch canvas)
        const sw = Math.max(1, Math.round(w));
        const sh = Math.max(1, Math.round(h));
        if (scratch.width !== sw || scratch.height !== sh) [scratch.width, scratch.height] = [sw, sh];
        const sc = scratch.getContext("2d")!;
        sc.globalCompositeOperation = "copy";
        sc.drawImage(image, (-sw * (zoom - 1)) / 2, (-sh * (zoom - 1)) / 2, sw * zoom, sh * zoom);
        sc.globalCompositeOperation = "destination-in";
        sc.drawImage(image, 0, 0, sw, sh);
        ctx.drawImage(scratch, x, y, w, h);
        return;
      }
      if (zoom !== 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        ctx.drawImage(image, x - (w * (zoom - 1)) / 2, y - (h * (zoom - 1)) / 2, w * zoom, h * zoom);
        ctx.restore();
        return;
      }
      if (hide <= 0 && reveal >= w + h) {
        ctx.drawImage(image, x, y, w, h);
        return;
      }
      const far = w + h + 100;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + hide + far, y - far);
      ctx.lineTo(x + reveal + far, y - far);
      ctx.lineTo(x - far, y + reveal + far);
      ctx.lineTo(x - far, y + hide + far);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, x, y, w, h);
      ctx.restore();
    },
    setOverlay(image) {
      overlay = image;
    },
    end(grain = true) {
      if (!overlay || !grain) return;
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(overlay, 0, 0, view.w, view.h);
      ctx.globalCompositeOperation = "source-over";
    },
    dispose() {
      tinted.forEach((t) => {
        t?.teal.close();
        t?.ink.close();
      });
    },
  };
}

/** Parses `url("…")` entries of a computed background-image (data URIs may contain parentheses). */
const backgroundUrls = (value: string) =>
  [...value.matchAll(/url\("((?:[^"\\]|\\.)*)"\)/g)].map((m) => m[1].replace(/\\(.)/g, "$1"));

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/**
 * Rasterizes a `mix-blend-mode: multiply` overlay element (tiled background layers + opacity) into one opaque
 * multiply-factor image: white where it does nothing, darker where it tints. Drawn with a multiply blend it
 * reproduces the overlay, without the browser re-blending a full-screen layer on every frame.
 */
export async function rasterizeMultiplyOverlay(el: HTMLElement, view: { w: number; h: number }, dpr: number) {
  const cs = getComputedStyle(el);
  const urls = backgroundUrls(cs.backgroundImage);
  if (!urls.length) return null;
  const sizes = cs.backgroundSize.split(",").map((s) => s.trim().split(/\s+/).map((v) => Number.parseFloat(v)));
  const w = Math.round(view.w * dpr);
  const h = Math.round(view.h * dpr);

  const layer = new OffscreenCanvas(w, h);
  const lc = layer.getContext("2d")!;
  // CSS paints the first listed background on top, so draw from the last one up
  for (let i = urls.length - 1; i >= 0; i--) {
    const img = await loadImage(urls[i]);
    const [sw = img.naturalWidth, sh = sw] = sizes[i] ?? [];
    const pattern = lc.createPattern(img, "repeat");
    if (!pattern) continue;
    pattern.setTransform(new DOMMatrix().scale((sw * dpr) / img.naturalWidth, (sh * dpr) / img.naturalHeight));
    lc.fillStyle = pattern;
    lc.fillRect(0, 0, w, h);
  }

  // factor = white·(1 − α·opacity) + layer·α·opacity: what multiply-with-opacity does to an opaque backdrop
  const out = new OffscreenCanvas(w, h);
  const oc = out.getContext("2d")!;
  oc.fillStyle = "#fff";
  oc.fillRect(0, 0, w, h);
  oc.globalAlpha = Number.parseFloat(cs.opacity) || 1;
  oc.drawImage(layer, 0, 0);
  return out.transferToImageBitmap();
}
