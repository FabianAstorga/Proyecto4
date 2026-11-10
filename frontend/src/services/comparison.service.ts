import { API_BASE_URL, ApiError, TOKEN_KEY } from './http';

export interface ComparisonResult {
  image: Blob;
  changes: number;
}

/**
 * Envía las imágenes A/B al backend ASP.NET Core y devuelve la imagen A
 * marcada con los cambios detectados por OpenCV.
 */
export async function processComparison(
  fileA: File,
  fileB: File,
  signal?: AbortSignal,
): Promise<ComparisonResult> {
  const form = new FormData();
  form.append('imagenA', fileA, fileA.name);
  form.append('imagenB', fileB, fileB.name);

  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(`${API_BASE_URL}/api/comparador/procesar`, {
    method: 'POST',
    body: form,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    let message = 'No fue posible procesar las imágenes.';
    try {
      const problem = (await response.json()) as {
        detail?: string;
        title?: string;
      };
      message = problem.detail ?? problem.title ?? message;
    } catch {
      // La API podría devolver texto plano o un cuerpo vacío.
    }
    throw new ApiError(message, response.status);
  }

  const header = response.headers.get('X-Cambios-Detectados');
  const changes = Number(header ?? 0);

  return {
    image: await response.blob(),
    changes: Number.isFinite(changes) ? changes : 0,
  };
}
