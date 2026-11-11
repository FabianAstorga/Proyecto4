import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { ModuloButton } from '@/components/ModuloButton';
import { ModuloHeader } from '@/components/ModuloHeader';
import { ingestaService, type SectorOption } from '@/services/ingesta.service';
import { cn } from '@/utils/format';

interface ImagenCargada {
  id: string;
  file: File;
  url: string;
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const Ingesta = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<ImagenCargada[]>([]);
  const [gridRef] = useAutoAnimate<HTMLDivElement>();
  const [items, setItems] = useState<ImagenCargada[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sectores, setSectores] = useState<SectorOption[]>([]);
  const [idSector, setIdSector] = useState('');
  const [cargandoSectores, setCargandoSectores] = useState(true);
  const [ingresando, setIngresando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    ingestaService
      .listarSectores()
      .then((lista) => {
        if (!active) return;
        setSectores(lista);
        const preferido =
          lista.find((sector) => sector.codigo === 'ZEAP-C') ?? lista[0];
        setIdSector((actual) =>
          actual || String(preferido?.idSector ?? ''),
        );
      })
      .catch((exception: unknown) => {
        if (!active) return;
        setError(
          exception instanceof Error
            ? exception.message
            : 'No fue posible cargar los sectores.',
        );
      })
      .finally(() => {
        if (active) setCargandoSectores(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    },
    [],
  );

  const addFiles = (files: FileList | File[]) => {
    const next = Array.from(files).map((file) => ({
      id: newId(),
      file,
      url: URL.createObjectURL(file),
    }));

    if (next.length === 0) return;
    setItems((prev) => [...prev, ...next]);
  };

  const duplicateItem = (id: string) => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;

      const source = prev[index];
      const copy: ImagenCargada = {
        ...source,
        id: newId(),
        url: URL.createObjectURL(source.file),
      };

      return [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.id !== id);
    });
  };

  const goToDetail = async () => {
    if (items.length === 0 || !idSector || ingresando) return;

    setIngresando(true);
    setError(null);

    try {
      const vuelo = await ingestaService.crearVuelo(
        Number(idSector),
        items.map((item) => item.file),
      );
      navigate(`/ingesta/detalle/${vuelo.idVuelo}`);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : 'No fue posible ingresar el lote.',
      );
    } finally {
      setIngresando(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="min-h-full bg-white/95">
      <ModuloHeader
        icon={ImagePlus}
        title="Ingesta de imágenes"
        subtitle="Selecciona o arrastra las imágenes del vuelo para preparar el lote que luego podrás comparar y usar en un informe."
      />

      <div className="p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-2 border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label
            htmlFor="sector-ingesta"
            className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500"
          >
            Sector del lote
          </label>
          <select
            id="sector-ingesta"
            value={idSector}
            onChange={(event) => setIdSector(event.target.value)}
            disabled={cargandoSectores || ingresando}
            className="min-w-[220px] border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-[#003B5C] outline-none transition-colors focus:border-[#0F766E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cargandoSectores && <option value="">Cargando sectores…</option>}
            {!cargandoSectores && sectores.length === 0 && (
              <option value="">Sin sectores disponibles</option>
            )}
            {sectores.map((sector) => (
              <option key={sector.idSector} value={sector.idSector}>
                {sector.codigo}
              </option>
            ))}
          </select>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'relative h-[360px] cursor-pointer overflow-hidden border-2 border-dashed bg-slate-50 outline-none transition-colors md:h-[420px]',
            dragging
              ? 'border-[#0F766E] bg-emerald-50'
              : 'border-slate-300 hover:border-[#0F766E]/60 hover:bg-emerald-50/20',
          )}
          aria-label="Agregar imágenes desde el computador"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files) addFiles(event.target.files);
              event.target.value = '';
            }}
          />

          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full border border-slate-200 bg-white text-[#0F766E] shadow-sm">
                <ImagePlus className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#003B5C]">
                  Haz clic o arrastra imágenes aquí
                </p>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Puedes seleccionar varias imágenes a la vez.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-3 pr-2">
              <div
                ref={gridRef}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden border border-slate-200 bg-white shadow-sm"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#002B45]/60 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          duplicateItem(item.id);
                        }}
                        aria-label={`Duplicar ${item.file.name}`}
                        title="Duplicar imagen"
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#003B5C] shadow-lg transition-transform hover:scale-110"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeItem(item.id);
                        }}
                        aria-label={`Eliminar ${item.file.name}`}
                        title="Eliminar imagen"
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-600 shadow-lg transition-transform hover:scale-110"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[8px] font-bold text-white">
                      {item.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <ModuloButton
            onClick={() => void goToDetail()}
            disabled={items.length === 0 || !idSector || ingresando}
          >
            {ingresando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {ingresando ? 'Ingresando…' : 'Ingresar'}
          </ModuloButton>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-3 text-center text-[10px] font-bold text-red-600"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
