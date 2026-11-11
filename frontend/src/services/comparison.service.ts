import { API_BASE_URL, ApiError, TOKEN_KEY } from './http';

export interface ResultadoComparacion {
  imagen: Blob;
  cambios: number;
}

export type AlgoritmoComparador = 'precision' | 'ratio' | 'hibrido';

export async function compararArchivos(
  archivoA: File,
  archivoB: File,
  algoritmo: AlgoritmoComparador = 'precision',
  signal?: AbortSignal,
): Promise<ResultadoComparacion> {
  const formulario = new FormData();
  formulario.append('imagenA', archivoA, archivoA.name);
  formulario.append('imagenB', archivoB, archivoB.name);
  formulario.append('algoritmo', algoritmo);

  const token = localStorage.getItem(TOKEN_KEY);

  const respuesta = await fetch(`${API_BASE_URL}/api/comparador/procesar`, {
    method: 'POST',
    body: formulario,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return leerRespuestaComparacion(respuesta);
}

export async function compararFotografias(
  idFotoA: number,
  idFotoB: number,
  algoritmo: AlgoritmoComparador = 'precision',
  signal?: AbortSignal,
): Promise<ResultadoComparacion> {
  const token = localStorage.getItem(TOKEN_KEY);

  const respuesta = await fetch(
    `${API_BASE_URL}/api/comparador/procesar-fotos`,
    {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ idFotoA, idFotoB, algoritmo }),
    },
  );

  return leerRespuestaComparacion(respuesta);
}

async function leerRespuestaComparacion(
  respuesta: Response,
): Promise<ResultadoComparacion> {
  if (!respuesta.ok) {
    let mensaje = 'No fue posible procesar las imágenes.';
    try {
      const problema = (await respuesta.json()) as {
        detail?: string;
        title?: string;
      };
      mensaje = problema.detail ?? problema.title ?? mensaje;
    } catch {
      mensaje = 'No fue posible procesar las imágenes.';
    }
    throw new ApiError(mensaje, respuesta.status);
  }

  const encabezado = respuesta.headers.get('X-Cambios-Detectados');
  const cambios = Number(encabezado ?? 0);

  return {
    imagen: await respuesta.blob(),
    cambios: Number.isFinite(cambios) ? cambios : 0,
  };
}
