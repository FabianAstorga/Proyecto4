import { http } from './http';

export interface SectorOption {
  idSector: number;
  codigo: string;
}

export interface FotografiaDetalle {
  idFoto: number;
  nombreArchivo: string;
  url: string | null;
  mimeType: string | null;
  tamanoBytes: number | null;
  anchoPx: number | null;
  altoPx: number | null;
  fechaCaptura: string;
}

export interface FotografiaGaleria extends FotografiaDetalle {
  url: string;
  idVuelo: number;
  codigoVuelo: string;
  sectorCodigo: string;
}

export interface VueloResumen {
  idVuelo: number;
  codigoVuelo: string;
  fechaInicio: string;
  estadoCarga: string;
  totalArchivos: number;
  idSector: number;
  sectorCodigo: string;
}

export interface VueloDetalle extends VueloResumen {
  fotografias: FotografiaDetalle[];
}

export const ingestaService = {
  listarSectores: () => http.get<SectorOption[]>('/api/sectores'),

  listarVuelos: () => http.get<VueloResumen[]>('/api/vuelos'),

  listarFotografias: (idVuelo?: number) =>
    http.get<FotografiaGaleria[]>(
      idVuelo
        ? `/api/fotografias?idVuelo=${encodeURIComponent(idVuelo)}`
        : '/api/fotografias',
    ),

  obtenerVuelo: (idVuelo: number) =>
    http.get<VueloDetalle>(`/api/vuelos/${idVuelo}`),

  crearVuelo: (idSector: number, files: File[]) => {
    const form = new FormData();
    form.append('idSector', String(idSector));
    files.forEach((file) => form.append('archivos', file, file.name));
    return http.post<VueloDetalle>('/api/vuelos', form);
  },
};
