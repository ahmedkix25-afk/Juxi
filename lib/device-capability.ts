export interface DeviceRenderProfile {
  prefersReducedMotion: boolean;
  isLowEndDevice: boolean;
  supportsWebGL2: boolean;
  isSoftwareWebGL: boolean;
  shouldUseLightweightMode: boolean;
}

export function detectSoftwareWebGL(): {
  supportsWebGL2: boolean;
  isSoftwareWebGL: boolean;
} {
  if (typeof document === 'undefined') {
    return { supportsWebGL2: false, isSoftwareWebGL: true };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) {
      return { supportsWebGL2: false, isSoftwareWebGL: true };
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareWebGL =
      /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supportsWebGL2: true, isSoftwareWebGL };
  } catch {
    return { supportsWebGL2: false, isSoftwareWebGL: true };
  }
}

export function detectDeviceRenderProfile(): DeviceRenderProfile {
  if (typeof window === 'undefined') {
    return {
      prefersReducedMotion: false,
      isLowEndDevice: false,
      supportsWebGL2: true,
      isSoftwareWebGL: false,
      shouldUseLightweightMode: false,
    };
  }

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const cores = navigator.hardwareConcurrency || 4;
  const deviceMemory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isLowEndDevice = cores <= 2 || deviceMemory <= 2;

  const { supportsWebGL2, isSoftwareWebGL } = detectSoftwareWebGL();
  const shouldUseLightweightMode =
    prefersReducedMotion || isLowEndDevice || !supportsWebGL2;

  return {
    prefersReducedMotion,
    isLowEndDevice,
    supportsWebGL2,
    isSoftwareWebGL,
    shouldUseLightweightMode,
  };
}
