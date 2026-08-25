/** Max side length (px) after resize for brasão / logos stored as data-URL. */
const MAX_SIDE = 768
/** JPEG quality for raster images (PNG with transparency stays PNG). */
const JPEG_QUALITY = 0.88
/** Hard cap on output data-URL size (~1.5MB base64 ≈ safer JSON bodies). */
const MAX_DATA_URL_CHARS = 1_800_000

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem'))
    }
    img.src = url
  })
}

/**
 * Converts an image file to a compact data-URL suitable for DB storage.
 * Resizes large images and prefers JPEG for photos; keeps PNG when alpha is needed.
 */
export async function fileToStoredImageDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione um arquivo de imagem')
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Imagem muito grande (máx. 8MB)')
  }

  const img = await loadImageFromFile(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível neste navegador')

  const keepPng =
    file.type === 'image/png' ||
    file.type === 'image/webp' ||
    file.type === 'image/gif'

  if (!keepPng) {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }
  ctx.drawImage(img, 0, 0, width, height)

  let dataUrl = keepPng
    ? canvas.toDataURL('image/png')
    : canvas.toDataURL('image/jpeg', JPEG_QUALITY)

  if (dataUrl.length > MAX_DATA_URL_CHARS && keepPng) {
    dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error('Imagem ainda muito grande após otimização. Use um arquivo menor.')
  }
  if (!dataUrl.startsWith('data:image/')) {
    throw new Error('Falha ao gerar a imagem para armazenamento')
  }
  return dataUrl
}

/** Ensures a stored value can be used as <img src>. */
export function normalizeImageSrc(value?: string | null): string {
  if (!value?.trim()) return ''
  const v = value.trim()
  if (v.startsWith('data:') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/')) {
    return v
  }
  return `data:image/png;base64,${v}`
}
