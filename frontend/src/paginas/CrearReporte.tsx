import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Columns2,
  Download,
  Eye,
  FilePlus2,
  FileText,
  History,
  Images,
  Info,
  Layers3,
  ListChecks,
  Save,
  Search,
  SearchX,
  Trash2,
  UserRound,
  X,
  Construction,
  FileDown,
  Lightbulb,
  Loader2,
  Map,
  RotateCcw,
  Table2,
  Truck,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { reportsService } from '@/services/reports.service';
import {
  CAPTURES,
  INCIDENTS,
  SECTORS,
  getCapture,
  getSector,
} from '@/mocks/data';
import type {
  Capture,
  ComparisonSelection,
  GeneratedReport,
  Incident,
  IncidentCategory,
  IncidentStatus,
  ReportDraft,
  ReportMeta,
  ReportStage,
  ReportType,
  SectorId,
  SessionUser,
  Severity,
} from '@/types';
import { cn, formatDateShort, formatDateTime, formatNumber } from '@/utils/format';
import {
  addReportToHistory,
  buildDefaultReportMeta,
  clearReportDraft,
  getReportHistory,
  loadComparisonSelection,
  loadReportDraft,
  saveReportDraft,
} from '@/utils/reportStorage';
import { ui } from '@/utils/SwalService';

const FALLBACK_USER: SessionUser = {
  id: 0,
  nombre: 'Usuario EPA',
  email: 'usuario@puertoarica.cl',
  rol: 'Operador',
  unidad: 'EPA',
};

const REPORT_TYPES: ReportType[] = [
  'Inspección periódica',
  'Consolidado mensual',
  'Reporte de incidencia crítica',
];

const CATEGORIES: IncidentCategory[] = [
  'Congestión',
  'Daño de pavimento',
  'Residuos',
  'Luminaria',
  'Otro',
];

const CATEGORY_COLOR: Record<IncidentCategory, string> = {
  Congestión: '#2563eb',
  'Daño de pavimento': '#d97706',
  Residuos: '#059669',
  Luminaria: '#ca8a04',
  Otro: '#e11d48',
};

const INPUT =
  'w-full border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:font-medium placeholder:text-slate-400 focus:border-[#002855] focus:bg-white focus:ring-2 focus:ring-blue-100';
const LABEL =
  'mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400';

const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const Field = ({
  label,
  icon: Icon,
  children,
  className,
  hint,
}: {
  label: string;
  icon?: typeof FileText;
  children: ReactNode;
  className?: string;
  hint?: string;
}) => (
  <div className={className}>
    <span className={LABEL}>
      {Icon && <Icon className="h-3 w-3 text-slate-300" />}
      {label}
    </span>
    {children}
    {hint && (
      <p className="mt-1.5 text-[8px] font-medium leading-relaxed text-slate-400">
        {hint}
      </p>
    )}
  </div>
);

const StepHeader = ({
  number,
  eyebrow,
  title,
  description,
  right,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  right?: ReactNode;
}) => (
  <header className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
    <div className="flex items-center gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center bg-[#002855] text-sm font-black text-white">
        {number}
      </span>
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-xl font-black uppercase leading-none tracking-tighter text-[#002855] md:text-2xl">
          {title}
        </h2>
        <p className="mt-1 text-[10px] font-medium leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
    {right}
  </header>
);

const SummaryRow = ({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-2.5 last:border-b-0">
    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
      {label}
    </span>
    <span
      className={cn(
        'max-w-[62%] text-right text-[10px] font-bold leading-snug',
        strong ? 'font-black uppercase text-[#002855]' : 'text-slate-600',
      )}
    >
      {value}
    </span>
  </div>
);

export const CrearReporte = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = user ?? FALLBACK_USER;

  const [initialDraft] = useState(loadReportDraft);
  const [initialComparison] = useState(
    () => initialDraft?.comparison ?? loadComparisonSelection(),
  );
  const [importedFromComparator] = useState(() =>
    Boolean((location.state as { fromComparator?: boolean } | null)?.fromComparator),
  );

  const [meta, setMeta] = useState<ReportMeta>(() => {
    if (initialDraft) return initialDraft.meta;
    const base = buildDefaultReportMeta(currentUser);
    if (initialComparison) {
      return {
        ...base,
        sectorId: initialComparison.sectorId,
        titulo: `Informe de inspección — ${
          getSector(initialComparison.sectorId)?.nombre ?? 'Sector EPA'
        }`,
      };
    }
    return base;
  });

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialDraft) return initialDraft.incidentIds;
    const sectorId = initialComparison?.sectorId ?? 'patio-norte';
    return INCIDENTS.filter(
      (incident) => incident.sectorId === sectorId && incident.estado !== 'Resuelto',
    )
      .slice(0, 4)
      .map((incident) => incident.id);
  });

  const [comparison, setComparison] = useState(initialComparison);
  const [includeComparison, setIncludeComparison] = useState(
    initialDraft?.includeComparison ?? Boolean(initialComparison),
  );
  const [step, setStep] = useState<ReportStep>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    initialDraft?.savedAt ?? null,
  );
  const [showImportedBanner, setShowImportedBanner] = useState(
    importedFromComparator && Boolean(initialComparison),
  );

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Todas' | IncidentCategory>(
    'Todas',
  );
  const [statusFilter, setStatusFilter] = useState<'Todos' | IncidentStatus>('Todos');
  const [sectorFilter, setSectorFilter] = useState<'Todos' | SectorId>(meta.sectorId);

  const [history, setHistory] = useState<GeneratedReport[]>(getReportHistory);
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generationStage, setGenerationStage] = useState<ReportStage>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);

  const sector = getSector(meta.sectorId);
  const comparisonSector = comparison?.sectorId ?? meta.sectorId;
  const comparisonSectorCaptures = CAPTURES.filter(
    (capture) => capture.sectorId === comparisonSector,
  );

  const comparisonBaseA = comparison
    ? getCapture(comparison.captureAId) ?? comparisonSectorCaptures[0]
    : comparisonSectorCaptures[0];
  const comparisonBaseB = comparison
    ? getCapture(comparison.captureBId) ??
      comparisonSectorCaptures[1] ??
      comparisonSectorCaptures[0]
    : comparisonSectorCaptures[1] ?? comparisonSectorCaptures[0];

  const comparisonCaptureA = comparisonBaseA
    ? {
        ...comparisonBaseA,
        fecha: comparison?.captureADate ?? comparisonBaseA.fecha,
      }
    : undefined;
  const comparisonCaptureB = comparisonBaseB
    ? {
        ...comparisonBaseB,
        fecha: comparison?.captureBDate ?? comparisonBaseB.fecha,
      }
    : undefined;

  const selectedIncidents = useMemo(
    () => INCIDENTS.filter((incident) => selectedIds.includes(incident.id)),
    [selectedIds],
  );

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return INCIDENTS.filter((incident) => {
      const matchesSearch =
        !query ||
        [incident.codigo, incident.descripcion, incident.categoria].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesCategory =
        categoryFilter === 'Todas' || incident.categoria === categoryFilter;
      const matchesStatus =
        statusFilter === 'Todos' || incident.estado === statusFilter;
      const matchesSector =
        sectorFilter === 'Todos' || incident.sectorId === sectorFilter;
      return matchesSearch && matchesCategory && matchesStatus && matchesSector;
    });
  }, [search, categoryFilter, statusFilter, sectorFilter]);

  const categoryBreakdown = CATEGORIES.map((category) => ({
    category,
    count: selectedIncidents.filter((incident) => incident.categoria === category)
      .length,
  })).filter((item) => item.count > 0);

  const statusCounts = {
    Pendiente: selectedIncidents.filter((i) => i.estado === 'Pendiente').length,
    'En Gestión': selectedIncidents.filter((i) => i.estado === 'En Gestión').length,
    Resuelto: selectedIncidents.filter((i) => i.estado === 'Resuelto').length,
  };

  const highSeverity = selectedIncidents.filter(
    (incident) => incident.severidad === 'Alta',
  ).length;

  // Borrador automático: misma estrategia que SISAC (localStorage por formulario).
  // Se escribe con un pequeño debounce para no guardar en cada pulsación.
  useEffect(() => {
    const savedAt = new Date().toISOString();
    const draft: ReportDraft = {
      meta,
      incidentIds: selectedIds,
      includeComparison,
      comparison,
      savedAt,
    };
    const timer = window.setTimeout(() => {
      saveReportDraft(draft);
      setLastSavedAt(savedAt);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [meta, selectedIds, includeComparison, comparison]);

  const validateMeta = (): string | null => {
    if (!meta.titulo.trim()) return 'Ingresa un título para el informe.';
    if (!meta.sectorId) return 'Selecciona el sector del informe.';
    if (!meta.fechaDesde || !meta.fechaHasta)
      return 'Define el período de análisis (desde y hasta).';
    if (meta.fechaDesde > meta.fechaHasta)
      return 'La fecha de inicio no puede ser posterior a la fecha de término.';
    if (!meta.destinatario.trim()) return 'Indica el destinatario del informe.';
    if (!meta.elaboradoPor.trim()) return 'Indica quién elabora el informe.';
    return null;
  };

  const goNext = () => {
    if (step === 1) {
      const error = validateMeta();
      if (error) {
        setFormError(error);
        return;
      }
    }
    if (step === 2 && selectedIncidents.length === 0) {
      setFormError('Selecciona al menos un hallazgo para incluir en el informe.');
      return;
    }
    setFormError(null);
    setStep((current) => Math.min(3, current + 1) as ReportStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setFormError(null);
    setStep((current) => Math.max(1, current - 1) as ReportStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jumpTo = (target: ReportStep) => {
    setFormError(null);
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectSector = (nextSectorId: SectorId) => {
    setMeta((previous) => ({
      ...previous,
      sectorId: nextSectorId,
      titulo: previous.titulo.startsWith('Informe de inspección')
        ? `Informe de inspección — ${getSector(nextSectorId)?.nombre ?? 'Sector EPA'}`
        : previous.titulo,
    }));
    setSectorFilter(nextSectorId);
    setSelectedIds(
      INCIDENTS.filter(
        (incident) =>
          incident.sectorId === nextSectorId && incident.estado !== 'Resuelto',
      )
        .slice(0, 4)
        .map((incident) => incident.id),
    );
    if (comparison && comparison.sectorId !== nextSectorId) {
      setComparison(null);
      setIncludeComparison(false);
    }
  };

  const toggleIncident = (id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
    setFormError(null);
  };

  const selectVisible = () => {
    const visibleIds = filteredIncidents.map((incident) => incident.id);
    setSelectedIds((previous) => Array.from(new Set([...previous, ...visibleIds])));
    setFormError(null);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setFormError(null);
  };

  const goToComparator = () => {
    const savedAt = new Date().toISOString();
    saveReportDraft({
      meta,
      incidentIds: selectedIds,
      includeComparison,
      comparison,
      savedAt,
    });
    navigate('/comparador');
  };

  const handleSaveDraft = () => {
    const savedAt = new Date().toISOString();
    saveReportDraft({
      meta,
      incidentIds: selectedIds,
      includeComparison,
      comparison,
      savedAt,
    });
    setLastSavedAt(savedAt);
    ui.exito('Borrador guardado', 'Puedes continuar más tarde desde este navegador.');
  };

  const handleDiscardDraft = () => {
    clearReportDraft();
    const base = buildDefaultReportMeta(currentUser);
    setMeta(base);
    setComparison(null);
    setIncludeComparison(false);
    setSelectedIds(
      INCIDENTS.filter(
        (incident) =>
          incident.sectorId === base.sectorId && incident.estado !== 'Resuelto',
      )
        .slice(0, 4)
        .map((incident) => incident.id),
    );
    setSectorFilter(base.sectorId);
    setStep(1);
    setFormError(null);
    setShowImportedBanner(false);
    ui.info(
      'Borrador descartado',
      'El formulario volvió a sus valores iniciales. Los reportes ya generados no se eliminan.',
    );
  };

  const startGeneration = async () => {
    const error = validateMeta();
    if (error) {
      setStep(1);
      setFormError(error);
      return;
    }
    if (selectedIncidents.length === 0) {
      setStep(2);
      setFormError('Selecciona al menos un hallazgo para incluir en el informe.');
      return;
    }

    setFormError(null);
    setGeneratedReport(null);
    setGenerationStage('compiling-map');
    setGenerationProgress(8);
    setGenerationOpen(true);

    await wait(650);
    setGenerationProgress(30);
    setGenerationStage('attaching-evidence');

    await wait(750);
    setGenerationProgress(55);
    setGenerationStage('rendering-tables');

    await wait(700);
    setGenerationProgress(78);
    setGenerationStage('generating-pdf');
    setGenerationProgress(92);

    try {
      const report = await reportsService.createReport({
        meta,
        incidents: selectedIncidents,
        comparison,
        includeComparison,
        user: currentUser,
      });
      setGeneratedReport(report);
      addReportToHistory(report);
      setHistory(getReportHistory());
      setGenerationProgress(100);
      setGenerationStage('done');
      clearReportDraft();
    } catch (requestError) {
      setGenerationOpen(false);
      setGenerationStage('idle');
      setGenerationProgress(0);
      ui.error(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible generar el reporte.',
      );
    }
  };

  const handleDownload = () => {
    setGenerationOpen(false);
    window.setTimeout(() => window.print(), 320);
  };

  const handleNewReport = () => {
    setGenerationOpen(false);
    setGenerationStage('idle');
    setGenerationProgress(0);
    setGeneratedReport(null);
    const base = buildDefaultReportMeta(currentUser);
    setMeta(base);
    setComparison(null);
    setIncludeComparison(false);
    setSelectedIds(
      INCIDENTS.filter(
        (incident) =>
          incident.sectorId === base.sectorId && incident.estado !== 'Resuelto',
      )
        .slice(0, 4)
        .map((incident) => incident.id),
    );
    setSectorFilter(base.sectorId);
    setStep(1);
    setFormError(null);
    setShowImportedBanner(false);
    clearReportDraft();
    ui.exito('Nuevo reporte', 'El formulario quedó listo para un nuevo informe.');
  };

  const reportNumber = generatedReport?.numero ?? 'INF-EPA-2026-BORRADOR';
  const savedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Reportería y decisiones · Informe ejecutivo"
        code="RF-09 / CU-08"
        title="Nuevo"
        accent="reporte"
        description="Compila la cartografía, la comparación temporal y el catastro de hallazgos en un documento A4 listo para jefatura y gerencia."
        image="/mock/aerial-muelle-1-b.svg"
        actions={
          <>
            <span className="flex items-center gap-2 border border-white/15 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/60">
              <Save className="h-3.5 w-3.5 text-emerald-400" />
              {savedTime ? `Autoguardado ${savedTime}` : 'Borrador sin guardar'}
            </span>
            <button
              type="button"
              onClick={goToComparator}
              className="group flex items-center gap-2 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#002855] shadow-xl transition-all hover:bg-blue-50 active:scale-[0.98]"
            >
              <Columns2 className="h-4 w-4" />
              Ir al comparador
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">
          <span className="flex items-center gap-1.5">
            <ListChecks className="h-3 w-3 text-blue-400" />
            {selectedIncidents.length} hallazgos seleccionados
          </span>
          <span className="flex items-center gap-1.5">
            <Layers3 className="h-3 w-3 text-blue-400" />
            {sector?.nombre} · {sector?.superficie}
          </span>
          <span className="flex items-center gap-1.5">
            <Images className="h-3 w-3 text-blue-400" />
            {includeComparison ? 'Comparación A/B incluida' : 'Sin comparación'}
          </span>
        </div>
      </PageHeader>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-8 md:py-8">
        <AnimatePresence>
          {showImportedBanner && comparison && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 flex items-start justify-between gap-4 border-l-4 border-blue-600 bg-blue-50 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <Columns2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-800">
                    Comparación importada desde el comparador
                  </p>
                  <p className="mt-1 text-[10px] font-medium leading-relaxed text-blue-700/75">
                    {getSector(comparison.sectorId)?.nombre} ·{' '}
                    {comparisonCaptureA && formatDateShort(comparisonCaptureA.fecha)} →{' '}
                    {comparisonCaptureB && formatDateShort(comparisonCaptureB.fecha)}. El
                    par A/B se incluirá en la sección de comparación temporal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportedBanner(false)}
                className="p-1 text-blue-400 transition-colors hover:text-blue-700"
                aria-label="Ocultar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <ReportStepper current={step} onStepClick={jumpTo} />

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            {formError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-start gap-2 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-[10px] font-bold uppercase leading-relaxed tracking-wide text-red-700"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {formError}
              </motion.div>
            )}

            {step === 1 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 bg-white shadow-xl"
              >
                <StepHeader
                  number="01"
                  eyebrow="Metadatos del documento"
                  title="Datos del informe"
                  description="Define el alcance, el período y los responsables del documento."
                  right={
                    <span className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-[8px] font-black uppercase tracking-widest text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Guardado automático
                    </span>
                  }
                />

                <div className="space-y-5 p-4 md:p-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field
                      label="Título del informe"
                      icon={FileText}
                      className="md:col-span-2"
                    >
                      <input
                        type="text"
                        value={meta.titulo}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            titulo: event.target.value,
                          }))
                        }
                        placeholder="Informe de inspección — Patio Norte"
                        className={INPUT}
                      />
                    </Field>

                    <Field label="Tipo de informe" icon={ListChecks}>
                      <select
                        value={meta.tipo}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            tipo: event.target.value as ReportType,
                          }))
                        }
                        className={INPUT}
                      >
                        {REPORT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Sector inspeccionado" icon={Layers3}>
                      <select
                        value={meta.sectorId}
                        onChange={(event) =>
                          selectSector(event.target.value as SectorId)
                        }
                        className={INPUT}
                      >
                        {SECTORS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nombre} · {item.superficie}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Período desde" icon={CalendarDays}>
                      <input
                        type="date"
                        value={meta.fechaDesde}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            fechaDesde: event.target.value,
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>

                    <Field label="Período hasta" icon={CalendarDays}>
                      <input
                        type="date"
                        value={meta.fechaHasta}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            fechaHasta: event.target.value,
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>

                    <div className="md:col-span-2 -mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Períodos sugeridos
                      </span>
                      {[
                        { label: 'Septiembre 2026', from: '2026-09-01', to: '2026-09-30' },
                        { label: 'Junio → Septiembre', from: '2026-06-14', to: '2026-09-14' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setMeta((previous) => ({
                              ...previous,
                              fechaDesde: preset.from,
                              fechaHasta: preset.to,
                            }))
                          }
                          className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider text-slate-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <Field label="Elaborado por" icon={UserRound}>
                      <input
                        type="text"
                        value={meta.elaboradoPor}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            elaboradoPor: event.target.value,
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>

                    <Field label="Destinatario" icon={UserRound}>
                      <input
                        type="text"
                        value={meta.destinatario}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            destinatario: event.target.value,
                          }))
                        }
                        className={INPUT}
                      />
                    </Field>

                    <Field
                      label="Observaciones generales"
                      icon={FileText}
                      className="md:col-span-2"
                      hint="Este texto aparecerá en la sección de observaciones y recomendaciones del PDF."
                    >
                      <textarea
                        rows={4}
                        value={meta.observaciones}
                        onChange={(event) =>
                          setMeta((previous) => ({
                            ...previous,
                            observaciones: event.target.value,
                          }))
                        }
                        placeholder="Observaciones, acuerdos o recomendaciones para jefatura..."
                        className={cn(INPUT, 'resize-y leading-relaxed')}
                      />
                    </Field>
                  </div>

                  <div className="border border-slate-200">
                    <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Columns2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#002855]">
                            Comparación temporal vinculada
                          </p>
                          <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                            {comparisonCaptureA && comparisonCaptureB
                              ? `${formatDateShort(comparisonCaptureA.fecha)} → ${formatDateShort(comparisonCaptureB.fecha)}`
                              : 'Sin capturas disponibles para el sector'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={includeComparison}
                        onClick={() => setIncludeComparison((value) => !value)}
                        className={cn(
                          'flex items-center gap-2 border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest transition-colors',
                          includeComparison
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-400',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-4 w-4 place-items-center border',
                            includeComparison
                              ? 'border-white/30 bg-white/15'
                              : 'border-slate-200 bg-slate-50',
                          )}
                        >
                          {includeComparison && <Check className="h-2.5 w-2.5" />}
                        </span>
                        {includeComparison ? 'Incluida' : 'Incluir'}
                      </button>
                    </div>

                    <div className="grid gap-3 p-4 sm:grid-cols-2">
                      {comparisonCaptureA && comparisonCaptureB ? (
                        <>
                          {[comparisonCaptureA, comparisonCaptureB].map(
                            (capture, index) => (
                              <div
                                key={capture.id}
                                className="flex items-center gap-3 border border-slate-200 bg-white p-2"
                              >
                                <img
                                  src={capture.src}
                                  alt=""
                                  className="h-12 w-20 shrink-0 object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                                    Captura {index === 0 ? 'A' : 'B'}
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-black uppercase tracking-tight text-[#002855]">
                                    {formatDateShort(capture.fecha)}
                                  </p>
                                  <p className="font-mono text-[8px] text-slate-400">
                                    {capture.altitud.toFixed(1)} m · {capture.hora}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                            <button
                              type="button"
                              onClick={goToComparator}
                              className="flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-[8px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:border-blue-200 hover:text-blue-700"
                            >
                              <Columns2 className="h-3 w-3" />
                              Cambiar par en el comparador
                            </button>
                            <span className="text-[8px] font-medium text-slate-400">
                              Si se omite, el informe no incluirá la sección de
                              comparación temporal.
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="sm:col-span-2 flex flex-col items-start gap-2 border border-dashed border-slate-200 bg-slate-50 p-4">
                          <p className="text-[10px] font-medium leading-relaxed text-slate-500">
                            No hay una comparación vinculada. Puedes seleccionar un par
                            A/B en el comparador y volver a este formulario.
                          </p>
                          <button
                            type="button"
                            onClick={goToComparator}
                            className="flex items-center gap-2 bg-[#002855] px-3 py-2 text-[8px] font-black uppercase tracking-widest text-white"
                          >
                            Ir al comparador
                            <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Guardar borrador
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="flex items-center justify-center gap-2 px-3 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="group flex items-center justify-center gap-2 bg-[#003385] px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#002a66]"
                    >
                      Continuar a hallazgos
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </footer>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 bg-white shadow-xl"
              >
                <StepHeader
                  number="02"
                  eyebrow="Catastro de incidencias"
                  title="Selección de hallazgos"
                  description="Elige los registros que respaldarán el informe ejecutivo."
                  right={
                    <span className="flex items-center gap-2 border border-[#002855] bg-[#002855] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">
                      <ListChecks className="h-3.5 w-3.5 text-blue-300" />
                      {selectedIncidents.length} seleccionados
                    </span>
                  }
                />

                <div className="space-y-4 p-4 md:p-6">
                  <div className="flex flex-col gap-3 border border-slate-200 bg-slate-50 p-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por código, categoría o descripción..."
                        className="w-full border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-[#002855]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={sectorFilter}
                        onChange={(event) =>
                          setSectorFilter(event.target.value as 'Todos' | SectorId)
                        }
                        className="border border-slate-200 bg-white px-2.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500 outline-none focus:border-[#002855]"
                        aria-label="Filtrar por sector"
                      >
                        <option value="Todos">Todos los sectores</option>
                        {SECTORS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nombre}
                          </option>
                        ))}
                      </select>

                      <select
                        value={statusFilter}
                        onChange={(event) =>
                          setStatusFilter(
                            event.target.value as 'Todos' | IncidentStatus,
                          )
                        }
                        className="border border-slate-200 bg-white px-2.5 py-2.5 text-[9px] font-black uppercase tracking-wider text-slate-500 outline-none focus:border-[#002855]"
                        aria-label="Filtrar por estado"
                      >
                        <option value="Todos">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Gestión">En Gestión</option>
                        <option value="Resuelto">Resuelto</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                      Categoría
                    </span>
                    {(['Todas', ...CATEGORIES] as const).map((category) => {
                      const active = categoryFilter === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            setCategoryFilter(
                              category as 'Todas' | IncidentCategory,
                            )
                          }
                          className={cn(
                            'flex items-center gap-1.5 border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-wider transition-colors',
                            active
                              ? 'border-[#002855] bg-[#002855] text-white'
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-[#002855]',
                          )}
                        >
                          {category !== 'Todas' && (
                            <CategoryIcon
                              category={category as IncidentCategory}
                              className="h-3 w-3"
                            />
                          )}
                          {category}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-100 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                      {formatNumber(filteredIncidents.length)} hallazgos visibles
                      {sectorFilter !== 'Todos' && ` · ${getSector(sectorFilter)?.nombre}`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectVisible}
                        className="text-[8px] font-black uppercase tracking-widest text-blue-600 transition-colors hover:text-blue-800"
                      >
                        Seleccionar visibles
                      </button>
                      <span className="text-slate-200">|</span>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-[8px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-red-600"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden border border-slate-200">
                    <div className="hidden grid-cols-[32px_88px_118px_minmax(0,1fr)_86px_112px] items-center gap-3 border-b border-slate-200 bg-[#002855] px-3 py-2 text-[7px] font-black uppercase tracking-[0.16em] text-white/50 md:grid">
                      <span />
                      <span>Evidencia</span>
                      <span>Registro</span>
                      <span>Hallazgo</span>
                      <span>Severidad</span>
                      <span>Estado</span>
                    </div>

                    {filteredIncidents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                        <SearchX className="h-8 w-8 text-slate-200" />
                        <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-400">
                          Sin resultados
                        </p>
                        <p className="mt-1 text-[10px] font-medium text-slate-400">
                          Ajusta los filtros o la búsqueda para ver otros hallazgos.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredIncidents.map((incident) => (
                          <IncidentRow
                            key={incident.id}
                            incident={incident}
                            selected={selectedIds.includes(incident.id)}
                            onToggle={() => toggleIncident(incident.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="flex items-start gap-2 border border-blue-100 bg-blue-50 px-3 py-2.5 text-[9px] font-medium leading-relaxed text-blue-800/75">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                    El informe toma el estado actual de cada incidencia. La
                    cartografía usa el sector principal del formulario; el catastro
                    puede incluir hallazgos de otros sectores si se cambia el filtro.
                  </p>
                </div>

                <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver a datos
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="group flex items-center justify-center gap-2 bg-[#003385] px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#002a66]"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver vista previa
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </footer>
              </motion.section>
            )}

            {step === 3 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-slate-200 bg-white shadow-xl"
              >
                <StepHeader
                  number="03"
                  eyebrow="Documento final"
                  title="Vista previa A4"
                  description="Revisa el informe antes de generar el PDF ejecutivo."
                  right={
                    <div className="flex items-center gap-2">
                      <span className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-widest text-slate-500">
                        210 × 297 mm
                      </span>
                      <span className="border border-yellow-300 bg-yellow-50 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest text-yellow-800">
                        Borrador
                      </span>
                    </div>
                  }
                />

                <div className="bg-slate-200/70 p-3 md:p-6">
                  <div className="overflow-x-auto pb-3">
                    <div className="mx-auto w-fit">
                      <ReportPreview
                        meta={meta}
                        incidents={selectedIncidents}
                        comparison={comparison}
                        includeComparison={includeComparison}
                        reportNumber={reportNumber}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400 md:hidden">
                    Desliza horizontalmente para ver el documento completo
                  </p>
                </div>

                <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Volver a hallazgos
                    </button>
                    <button
                      type="button"
                      onClick={goToComparator}
                      className="hidden items-center justify-center gap-2 px-3 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 transition-colors hover:text-blue-700 sm:flex"
                    >
                      <Columns2 className="h-3.5 w-3.5" />
                      Comparador
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        ui.info(
                          'Vista previa',
                          'El PDF se genera en el navegador con la impresión del documento A4. En producción lo compilará el backend ASP.NET Core.',
                        )
                      }
                      className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-3 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Ayuda
                    </button>
                    <button
                      type="button"
                      onClick={startGeneration}
                      className="group flex items-center justify-center gap-2 bg-[#003385] px-5 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-900/20 transition-colors hover:bg-[#002a66]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Generar reporte PDF
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </footer>
              </motion.section>
            )}
          </div>

          {/* Resumen lateral */}
          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            <div className="border border-slate-200 bg-white shadow-sm">
              <header className="border-b border-slate-200 bg-[#002855] px-4 py-3">
                <p className="text-[8px] font-black uppercase tracking-[0.22em] text-blue-300">
                  Resumen del informe
                </p>
                <p className="mt-1 font-mono text-[10px] font-bold text-white">
                  {generatedReport?.numero ?? 'Se asigna al generar'}
                </p>
              </header>

              <div>
                <SummaryRow label="Sector" value={sector?.nombre ?? '—'} strong />
                <SummaryRow
                  label="Período"
                  value={`${formatDateShort(meta.fechaDesde)} — ${formatDateShort(meta.fechaHasta)}`}
                />
                <SummaryRow
                  label="Hallazgos"
                  value={`${selectedIncidents.length} seleccionados`}
                  strong
                />
                <SummaryRow
                  label="Severidad alta"
                  value={String(highSeverity).padStart(2, '0')}
                />
                <SummaryRow
                  label="Comparación A/B"
                  value={
                    includeComparison
                      ? comparisonCaptureA && comparisonCaptureB
                        ? `${formatDateShort(comparisonCaptureA.fecha)} → ${formatDateShort(comparisonCaptureB.fecha)}`
                        : 'Par del sector'
                      : 'Omitida'
                  }
                />
                <SummaryRow
                  label="Destinatario"
                  value={meta.destinatario}
                />
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Composición
                  </p>
                  <p className="font-mono text-[8px] text-slate-400">
                    {selectedIncidents.length} reg.
                  </p>
                </div>

                {categoryBreakdown.length === 0 ? (
                  <p className="text-[9px] font-medium text-slate-400">
                    Sin hallazgos seleccionados.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {categoryBreakdown.map((item) => {
                      const width = Math.max(
                        8,
                        (item.count / Math.max(1, selectedIncidents.length)) * 100,
                      );
                      return (
                        <div key={item.category}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                              <CategoryIcon
                                category={item.category}
                                className="h-3 w-3"
                              />
                              {item.category}
                            </span>
                            <span className="font-mono text-[8px] font-bold text-slate-500">
                              {item.count}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 bg-slate-100">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${width}%`,
                                backgroundColor: CATEGORY_COLOR[item.category],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-px border border-slate-200 bg-slate-200">
                  {(
                    [
                      ['Pendiente', statusCounts.Pendiente, 'text-red-600'],
                      ['En Gestión', statusCounts['En Gestión'], 'text-amber-600'],
                      ['Resuelto', statusCounts.Resuelto, 'text-emerald-600'],
                    ] as const
                  ).map(([label, value, color]) => (
                    <div key={label} className="bg-white px-2 py-2 text-center">
                      <p className={cn('text-lg font-black leading-none', color)}>
                        {value}
                      </p>
                      <p className="mt-1 text-[6px] font-black uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 p-4">
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="group flex w-full items-center justify-center gap-2 bg-[#003385] px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#002a66]"
                  >
                    {step === 1 ? 'Continuar' : 'Vista previa'}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startGeneration}
                    className="group flex w-full items-center justify-center gap-2 bg-[#003385] px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#002a66]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Generar PDF
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2.5 text-[8px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
                >
                  <Save className="h-3 w-3" />
                  Guardar borrador
                </button>
              </div>
            </div>

            <div className="border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-slate-300" />
                  <p className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Historial reciente
                  </p>
                </div>
                <span className="grid h-5 min-w-5 place-items-center bg-slate-100 px-1 font-mono text-[8px] font-bold text-slate-500">
                  {history.length}
                </span>
              </header>

              {history.length === 0 ? (
                <p className="px-4 py-4 text-[9px] font-medium leading-relaxed text-slate-400">
                  Aún no hay reportes generados en este navegador. Al generar el
                  primero aparecerá aquí.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {history.slice(0, 4).map((report) => (
                    <li key={report.id} className="flex items-start gap-3 px-4 py-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center bg-red-50 text-red-600">
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[8px] font-bold uppercase text-[#002855]">
                          {report.numero}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-medium text-slate-500">
                          {report.sector} · {report.totalIncidencias} hallazgos
                        </p>
                        <p className="mt-0.5 font-mono text-[7px] uppercase tracking-wider text-slate-400">
                          {formatDateTime(report.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-l-4 border-[#ffd700] bg-[#001a35] p-4 text-white">
              <p className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.18em] text-yellow-300">
                <FilePlus2 className="h-3.5 w-3.5" />
                Prototipo Parte 2
              </p>
              <p className="mt-2 text-[9px] font-medium leading-relaxed text-blue-100/55">
                El documento se compone en el cliente a partir de los mocks. La
                estructura de datos ya está alineada con la API ASP.NET Core y
                PostgreSQL/PostGIS.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <GenerationModal
        open={generationOpen}
        stage={generationStage}
        progress={generationProgress}
        report={generatedReport}
        onClose={() => setGenerationOpen(false)}
        onDownload={handleDownload}
        onNewReport={handleNewReport}
      />
    </>
  );
};

const IncidentRow = ({
  incident,
  selected,
  onToggle,
}: {
  incident: Incident;
  selected: boolean;
  onToggle: () => void;
}) => {
  const sector = getSector(incident.sectorId);

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        'relative cursor-pointer px-3 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-300',
        selected ? 'bg-blue-50/70' : 'bg-white hover:bg-slate-50',
      )}
    >
      {selected && (
        <span className="absolute inset-y-0 left-0 w-1 bg-blue-600" />
      )}

      <div className="grid gap-3 md:grid-cols-[32px_88px_118px_minmax(0,1fr)_86px_112px] md:items-center">
        <span
          className={cn(
            'hidden h-5 w-5 place-items-center border md:grid',
            selected
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-slate-300 bg-white text-transparent',
          )}
        >
          <Check className="h-3 w-3" />
        </span>

        <div className="relative hidden aspect-[16/10] w-[88px] overflow-hidden border border-slate-200 bg-slate-100 md:block">
          <img
            src={incident.evidencia}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-[#001a35]/75 px-1 py-0.5 text-center font-mono text-[6px] uppercase tracking-wider text-white/80">
            Evidencia
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#002855]">
            {incident.codigo}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
            {formatDateShort(incident.fecha)}
          </p>
          <p className="mt-0.5 text-[8px] font-medium text-slate-400">
            {sector?.nombre}
          </p>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={incident.categoria} />
            <span className="md:hidden">
              <SeverityBadge severity={incident.severidad} />
            </span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-[10px] font-medium leading-relaxed text-slate-500">
            {incident.descripcion}
          </p>
        </div>

        <div className="hidden md:block">
          <SeverityBadge severity={incident.severidad} />
        </div>

        <div className="flex items-center justify-between gap-2 md:block">
          <StatusBadge status={incident.estado} />
          <span
            className={cn(
              'grid h-5 w-5 place-items-center border md:hidden',
              selected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-transparent',
            )}
          >
            <Check className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
};



const MarcaReporte = () => (
  <div className="flex items-center gap-2">
    <div className="grid h-8 w-8 place-items-center bg-[#002855] text-[8px] font-black text-white">EPA</div>
    <div className="leading-none">
      <p className="text-[10px] font-black uppercase tracking-tight text-white">EPA <span className="text-blue-300">WebGIS</span></p>
      <p className="mt-0.5 text-[5px] font-bold uppercase tracking-[0.2em] text-white/45">Empresa Portuaria Arica</p>
    </div>
  </div>
);

const StatusBadge = ({
  status,
  className,
}: {
  status: IncidentStatus;
  className?: string;
}) => {
  const map: Record<IncidentStatus, string> = {
    Pendiente: 'bg-red-50 text-red-700 border-red-200',
    'En Gestión': 'bg-amber-50 text-amber-800 border-amber-200',
    Resuelto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  const dot: Record<IncidentStatus, string> = {
    Pendiente: 'bg-red-500',
    'En Gestión': 'bg-amber-500',
    Resuelto: 'bg-emerald-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-black uppercase tracking-widest',
        map[status],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot[status])} />
      {status}
    </span>
  );
};

const SeverityBadge = ({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) => {
  const map: Record<Severity, string> = {
    Alta: 'bg-[#002855] text-white border-[#002855]',
    Media: 'bg-slate-100 text-slate-700 border-slate-200',
    Baja: 'bg-white text-slate-500 border-slate-200',
  };
  return (
    <span
      className={cn(
        'inline-flex border px-2 py-1 text-[9px] font-black uppercase tracking-widest',
        map[severity],
        className,
      )}
    >
      {severity}
    </span>
  );
};

const CategoryIcon = ({
  category,
  className,
}: {
  category: IncidentCategory;
  className?: string;
}) => {
  const icons = {
    Congestión: Truck,
    'Daño de pavimento': Construction,
    Residuos: Trash2,
    Luminaria: Lightbulb,
    Otro: AlertTriangle,
  } as const;
  const Icon = icons[category];
  return <Icon className={cn('h-3.5 w-3.5', className)} />;
};

const CategoryBadge = ({
  category,
  className,
}: {
  category: IncidentCategory;
  className?: string;
}) => {
  const map: Record<IncidentCategory, string> = {
    Congestión: 'bg-blue-50 text-blue-700 border-blue-200',
    'Daño de pavimento': 'bg-amber-50 text-amber-800 border-amber-200',
    Residuos: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Luminaria: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    Otro: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-black uppercase tracking-wider',
        map[category],
        className,
      )}
    >
      <CategoryIcon category={category} />
      {category}
    </span>
  );
};


interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  hideClose?: boolean;
}

const Modal = ({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  className,
  hideClose = false,
}: ModalProps) => {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
          <motion.button
            type="button"
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-[#001a35]/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className={cn(
              'relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-white/10 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.45)]',
              className,
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#002855] via-blue-600 to-[#002855]" />

            {(title || !hideClose) && (
              <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 md:px-8">
                <div>
                  {eyebrow && (
                    <p className="mb-1 text-[9px] font-black uppercase tracking-[0.24em] text-blue-600">
                      {eyebrow}
                    </p>
                  )}
                  {title && (
                    <h2 className="text-xl font-black uppercase leading-tight tracking-tighter text-[#002855] md:text-2xl">
                      {title}
                    </h2>
                  )}
                </div>
                {!hideClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500"
                    aria-label="Cerrar ventana"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </header>
            )}

            <div className="custom-scroll flex-1 overflow-y-auto">{children}</div>

            {footer && (
              <footer className="border-t border-slate-100 bg-slate-50 px-6 py-4 md:px-8">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

type ReportStep = 1 | 2 | 3;

const STEPS = [
  {
    id: 1 as ReportStep,
    label: 'Datos del informe',
    hint: 'Metadatos y período',
    icon: FileText,
  },
  {
    id: 2 as ReportStep,
    label: 'Selección de hallazgos',
    hint: 'Incidencias y evidencias',
    icon: ListChecks,
  },
  {
    id: 3 as ReportStep,
    label: 'Vista previa',
    hint: 'Documento A4 y PDF',
    icon: Eye,
  },
];

const ReportStepper = ({
  current,
  onStepClick,
}: {
  current: ReportStep;
  onStepClick: (step: ReportStep) => void;
}) => (
  <div className="border border-slate-200 bg-white shadow-sm">
    <div className="grid grid-cols-1 sm:grid-cols-3">
      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const active = step.id === current;
        const completed = step.id < current;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick(step.id)}
            className={cn(
              'relative flex items-center gap-3 border-b border-slate-100 px-4 py-4 text-left transition-colors sm:border-b-0 sm:border-r sm:last:border-r-0',
              active
                ? 'bg-[#002855] text-white'
                : completed
                  ? 'bg-emerald-50/50 text-slate-700 hover:bg-emerald-50'
                  : 'bg-white text-slate-400 hover:bg-slate-50',
            )}
            aria-current={active ? 'step' : undefined}
          >
            {active && (
              <motion.span
                layoutId="report-step-bar"
                className="absolute inset-x-0 top-0 h-1 bg-[#ffd700]"
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              />
            )}

            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center border text-[10px] font-black',
                active
                  ? 'border-white/20 bg-white/10 text-white'
                  : completed
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400',
              )}
            >
              {completed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>

            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-mono text-[8px] font-bold uppercase tracking-widest',
                    active ? 'text-blue-300' : 'text-slate-300',
                  )}
                >
                  0{index + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-black uppercase tracking-wider',
                    active ? 'text-white' : completed ? 'text-[#002855]' : '',
                  )}
                >
                  {step.label}
                </span>
              </span>
              <span
                className={cn(
                  'mt-0.5 block text-[8px] font-bold uppercase tracking-wide',
                  active ? 'text-blue-200/60' : 'text-slate-400',
                )}
              >
                {step.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

const STAGES: Array<{
  id: ReportStage;
  label: string;
  detail: string;
  icon: typeof FileText;
}> = [
  {
    id: 'compiling-map',
    label: 'Compilando cartografía',
    detail: 'Sector, capas base y marcas de hallazgos',
    icon: Map,
  },
  {
    id: 'attaching-evidence',
    label: 'Adjuntando evidencias',
    detail: 'Capturas A/B y miniaturas de respaldo',
    icon: Images,
  },
  {
    id: 'rendering-tables',
    label: 'Componiendo catastro',
    detail: 'Tabla de incidencias, severidades y estados',
    icon: Table2,
  },
  {
    id: 'generating-pdf',
    label: 'Renderizando PDF',
    detail: 'Membrete, firmas y numeración del informe',
    icon: FileText,
  },
];

interface GenerationModalProps {
  open: boolean;
  stage: ReportStage;
  progress: number;
  report: GeneratedReport | null;
  onClose: () => void;
  onDownload: () => void;
  onNewReport: () => void;
}

const GenerationModal = ({
  open,
  stage,
  progress,
  report,
  onClose,
  onDownload,
  onNewReport,
}: GenerationModalProps) => {
  const done = stage === 'done';
  const activeIndex = STAGES.findIndex((item) => item.id === stage);

  return (
    <Modal
      open={open}
      onClose={done ? onClose : () => undefined}
      hideClose={!done}
      className="max-w-xl"
      eyebrow={done ? 'Proceso completado' : 'Generación en curso'}
      title={done ? 'Reporte generado' : 'Compilando informe ejecutivo'}
    >
      {!done ? (
        <div className="p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Progreso de compilación
              </p>
              <p className="mt-1 text-5xl font-black leading-none tracking-tighter text-[#002855]">
                {Math.round(progress)}
                <span className="text-xl text-blue-500">%</span>
              </p>
            </div>
            <span className="grid h-12 w-12 place-items-center border border-slate-200 bg-slate-50">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </span>
          </div>

          <div className="mt-5 h-2 overflow-hidden bg-slate-100">
            <motion.div
              className="h-full bg-gradient-to-r from-[#002855] via-blue-600 to-[#ffd700]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <div className="mt-7 space-y-2">
            {STAGES.map((item, index) => {
              const Icon = item.icon;
              const completed = activeIndex > index || done;
              const active = activeIndex === index;
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 border px-3 py-3 transition-colors',
                    active
                      ? 'border-blue-200 bg-blue-50'
                      : completed
                        ? 'border-emerald-100 bg-emerald-50/60'
                        : 'border-slate-100 bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center border',
                      completed
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                        : active
                          ? 'border-blue-200 bg-blue-600 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-400',
                    )}
                  >
                    {completed ? (
                      <Check className="h-4 w-4" />
                    ) : active ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-wider',
                        completed
                          ? 'text-emerald-800'
                          : active
                            ? 'text-[#002855]'
                            : 'text-slate-400',
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                  {completed && (
                    <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-600">
                      OK
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-5 border-l-2 border-blue-300 bg-slate-50 px-3 py-2 text-[9px] font-medium leading-relaxed text-slate-500">
            El procesamiento se ejecuta en el navegador para esta demostración. En
            producción, el backend ASP.NET Core compilará el PDF con QuestPDF y
            devolverá el archivo desde <span className="font-mono">/api/v1/reportes/</span>.
          </p>
        </div>
      ) : (
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center text-center">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 16, stiffness: 200 }}
              className="grid h-20 w-20 place-items-center rounded-full border-4 border-emerald-100 bg-emerald-50 text-emerald-600"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.span>
            <h3 className="mt-4 text-2xl font-black uppercase leading-none tracking-tighter text-[#002855]">
              Informe listo
            </h3>
            <p className="mt-2 max-w-sm text-xs font-medium leading-relaxed text-slate-500">
              El documento fue compilado y guardado en el historial local del
              prototipo. Puedes descargarlo en formato PDF.
            </p>
          </div>

          <div className="mt-6 border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center bg-red-50 text-red-600">
                  <FileDown className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#002855]">
                    {report?.fileName}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-slate-400">
                    {report?.numero} · PDF · {report?.sizeKb ?? 0} KB
                  </p>
                </div>
              </div>
              <span className="shrink-0 bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-700">
                Listo
              </span>
            </div>

            <div className="grid grid-cols-3 gap-px bg-slate-200">
              {[
                { label: 'Sector', value: report?.sector ?? '—' },
                { label: 'Hallazgos', value: String(report?.totalIncidencias ?? 0) },
                {
                  label: 'Emitido',
                  value: report ? formatDateTime(report.createdAt) : '—',
                },
              ].map((item) => (
                <div key={item.label} className="bg-white px-3 py-2.5">
                  <p className="text-[7px] font-black uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[9px] font-bold leading-snug text-[#002855]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center justify-center gap-2 bg-[#003385] px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#002a66]"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </button>
            <button
              type="button"
              onClick={onNewReport}
              className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-3.5 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500 transition-colors hover:border-slate-300 hover:text-[#002855]"
            >
              <RotateCcw className="h-4 w-4" />
              Nuevo reporte
            </button>
          </div>

          <p className="mt-4 text-center text-[8px] font-medium leading-relaxed text-slate-400">
            La descarga usa la impresión del navegador (Guardar como PDF). El informe
            se imprimirá en tamaño A4, sin encabezados ni pies del navegador.
          </p>
        </div>
      )}
    </Modal>
  );
};

const STATUS_COLOR: Record<Incident['estado'], string> = {
  Pendiente: '#dc2626',
  'En Gestión': '#d97706',
  Resuelto: '#059669',
};

const PIN_POSITIONS = [
  { x: 26, y: 58 },
  { x: 48, y: 34 },
  { x: 63, y: 63 },
  { x: 76, y: 40 },
  { x: 40, y: 74 },
  { x: 70, y: 22 },
];

const SectionTitle = ({ number, title }: { number: string; title: string }) => (
  <div className="mb-[3mm] flex items-center gap-2 border-b border-slate-200 pb-[1.5mm]">
    <span className="grid h-[6mm] w-[6mm] place-items-center bg-[#002855] text-[8px] font-black text-white">
      {number}
    </span>
    <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-[#002855]">
      {title}
    </h2>
  </div>
);

interface ReportPreviewProps {
  meta: ReportMeta;
  incidents: Incident[];
  comparison: ComparisonSelection | null;
  includeComparison: boolean;
  reportNumber: string;
}

const ReportPreview = ({
  meta,
  incidents,
  comparison,
  includeComparison,
  reportNumber,
}: ReportPreviewProps) => {
  const sector = getSector(meta.sectorId);
  const comparisonSector = comparison?.sectorId ?? meta.sectorId;
  const comparisonCaptures = CAPTURES.filter(
    (capture) => capture.sectorId === comparisonSector,
  );

  const baseA = comparison
    ? CAPTURES.find((capture) => capture.id === comparison.captureAId) ??
      comparisonCaptures[0]
    : comparisonCaptures[0];
  const baseB = comparison
    ? CAPTURES.find((capture) => capture.id === comparison.captureBId) ??
      comparisonCaptures[1] ??
      comparisonCaptures[0]
    : comparisonCaptures[1] ?? comparisonCaptures[0];

  const captureA = baseA
    ? { ...baseA, fecha: comparison?.captureADate ?? baseA.fecha }
    : undefined;
  const captureB = baseB
    ? { ...baseB, fecha: comparison?.captureBDate ?? baseB.fecha }
    : undefined;

  const showComparison = includeComparison && Boolean(captureA && captureB);
  const evidence = (captureB ?? captureA) as Capture;

  const counts = {
    total: incidents.length,
    pendientes: incidents.filter((i) => i.estado === 'Pendiente').length,
    gestion: incidents.filter((i) => i.estado === 'En Gestión').length,
    resueltos: incidents.filter((i) => i.estado === 'Resuelto').length,
    alta: incidents.filter((i) => i.severidad === 'Alta').length,
  };

  const section = (base: number) =>
    String(showComparison ? base : base - 1).padStart(2, '0');

  return (
    <article
      id="report-print-area"
      className="print-exact mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-white text-slate-800 shadow-2xl"
    >
      {/* Membrete */}
      <header className="bg-[#001a35] px-[11mm] py-[7mm] text-white">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <MarcaReporte />
            <div className="h-10 w-px bg-white/20" />
            <div>
              <p className="text-[6.5px] font-black uppercase tracking-[0.28em] text-blue-300">
                Empresa Portuaria Arica
              </p>
              <p className="mt-0.5 text-[9px] font-black uppercase tracking-tight text-white">
                Gerencia de TI y Ciberseguridad
              </p>
              <p className="mt-0.5 text-[6px] font-medium uppercase tracking-[0.18em] text-white/45">
                Monitoreo e inspección geoespacial · WebGIS
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[6px] font-black uppercase tracking-[0.24em] text-blue-300">
              Informe ejecutivo
            </p>
            <p className="mt-1 font-mono text-[10px] font-bold text-white">
              {reportNumber}
            </p>
            <p className="mt-1 text-[6px] text-white/45">
              Emitido: {formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </div>
      </header>

      <div className="px-[11mm] py-[8mm]">
        {/* Título */}
        <div className="border-b-4 border-[#002855] pb-[4mm]">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="bg-blue-600 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-widest text-white">
              {meta.tipo}
            </span>
            <span className="border border-slate-200 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-widest text-slate-500">
              {sector?.nombre}
            </span>
            <span className="border border-slate-200 px-1.5 py-0.5 text-[6px] font-black uppercase tracking-widest text-slate-500">
              {formatDateShort(meta.fechaDesde)} — {formatDateShort(meta.fechaHasta)}
            </span>
          </div>
          <h1 className="text-balance text-[20px] font-black uppercase leading-[1.02] tracking-tighter text-[#002855]">
            {meta.titulo}
          </h1>
          <p className="mt-2 max-w-[150mm] text-[7.5px] font-medium leading-relaxed text-slate-500">
            Documento consolidado de hallazgos georreferenciados y evidencia
            fotográfica para la supervisión de la infraestructura portuaria.
          </p>
        </div>

        {/* Ficha */}
        <div className="mt-[4mm] grid grid-cols-4 gap-px border border-slate-200 bg-slate-200">
          {[
            { label: 'Sector inspeccionado', value: sector?.nombre ?? '—' },
            { label: 'Superficie', value: sector?.superficie ?? '—' },
            { label: 'Elaborado por', value: meta.elaboradoPor },
            { label: 'Destinatario', value: meta.destinatario },
          ].map((item) => (
            <div key={item.label} className="bg-white px-2 py-2">
              <p className="text-[5.5px] font-black uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-[6.5px] font-bold leading-snug text-[#002855]">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* 1. Resumen */}
        <section className="mt-[6mm] break-inside-avoid">
          <SectionTitle number="01" title="Resumen ejecutivo" />
          <p className="text-[7.5px] font-medium leading-[1.75] text-slate-600">
            El presente informe consolida <strong>{counts.total} hallazgos</strong>{' '}
            detectados en <strong>{sector?.nombre}</strong> durante el período
            comprendido entre el {formatDateShort(meta.fechaDesde)} y el{' '}
            {formatDateShort(meta.fechaHasta)}. Del total, {counts.pendientes} se
            encuentran en estado Pendiente, {counts.gestion} en Gestión y{' '}
            {counts.resueltos} resueltos. Se identificaron{' '}
            <strong>{counts.alta} incidencias de severidad alta</strong> que requieren
            coordinación con las áreas operativas y el concesionario.
          </p>

          {counts.alta > 0 && (
            <div className="mt-[3mm] border-l-[3px] border-red-500 bg-red-50 px-3 py-2">
              <p className="text-[6.5px] font-black uppercase tracking-[0.14em] text-red-700">
                Atención prioritaria
              </p>
              <p className="mt-1 text-[7px] font-medium leading-relaxed text-red-700/80">
                Existen {counts.alta} hallazgos de severidad alta. Se recomienda
                verificar su estado en terreno antes del cierre del período y dejar
                registro fotográfico de la intervención.
              </p>
            </div>
          )}
        </section>

        {/* 2. Indicadores */}
        <section className="mt-[6mm] break-inside-avoid">
          <SectionTitle number="02" title="Indicadores del período" />
          <div className="grid grid-cols-5 gap-px border border-slate-200 bg-slate-200">
            {[
              { label: 'Total', value: counts.total, color: '#002855' },
              { label: 'Pendientes', value: counts.pendientes, color: '#dc2626' },
              { label: 'En Gestión', value: counts.gestion, color: '#d97706' },
              { label: 'Resueltos', value: counts.resueltos, color: '#059669' },
              { label: 'Severidad alta', value: counts.alta, color: '#7c3aed' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white px-2 py-2 text-center">
                <p
                  className="text-[16px] font-black leading-none tracking-tighter"
                  style={{ color: kpi.color }}
                >
                  {String(kpi.value).padStart(2, '0')}
                </p>
                <p className="mt-1 text-[5.5px] font-black uppercase tracking-[0.12em] text-slate-400">
                  {kpi.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Comparación temporal */}
        {showComparison && (
          <section className="mt-[6mm] break-inside-avoid">
            <SectionTitle number="03" title="Comparación temporal de capturas" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { capture: captureA!, label: 'A', tone: 'bg-blue-600' },
                { capture: captureB!, label: 'B', tone: 'bg-[#d4a824]' },
              ].map(({ capture, label, tone }) => (
                <figure key={label} className="border border-slate-200 bg-slate-50">
                  <div className="relative h-[46mm] overflow-hidden">
                    <img
                      src={capture.src}
                      alt={`Captura ${label}`}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className={`absolute left-1.5 top-1.5 grid h-4 w-4 place-items-center text-[6px] font-black text-white ${tone}`}
                    >
                      {label}
                    </span>
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
                    <span className="text-[6px] font-black uppercase tracking-widest text-slate-500">
                      {formatDateShort(capture.fecha)} · {capture.hora}
                    </span>
                    <span className="font-mono text-[5.5px] text-slate-400">
                      {capture.altitud.toFixed(1)} m
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-2 text-[6.5px] font-medium leading-relaxed text-slate-500">
              El contraste visual evidencia cambios en la ocupación de bermas,
              condición del pavimento y presencia de residuos. La evaluación se
              realizó sobre capturas del mismo sector y encuadre.
            </p>
          </section>
        )}

        {/* Cartografía */}
        <section className="mt-[6mm] break-inside-avoid">
          <SectionTitle
            number={section(4)}
            title="Cartografía de hallazgos"
          />
          <div className="relative h-[56mm] overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src={evidence.src}
              alt={`Cartografía de ${sector?.nombre}`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[#001a35]/10" />

            {incidents.slice(0, 6).map((incident, index) => {
              const position = PIN_POSITIONS[index % PIN_POSITIONS.length];
              return (
                <div
                  key={incident.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <span
                    className="grid h-4 w-4 place-items-center rounded-full border-2 border-white text-[5px] font-black text-white shadow-lg"
                    style={{ backgroundColor: STATUS_COLOR[incident.estado] }}
                  >
                    {index + 1}
                  </span>
                </div>
              );
            })}

            <div className="absolute bottom-1.5 left-1.5 border border-white/20 bg-[#001a35]/85 px-2 py-1.5">
              <p className="text-[5.5px] font-black uppercase tracking-[0.16em] text-white/60">
                Referencias
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {(
                  [
                    ['Pendiente', STATUS_COLOR.Pendiente],
                    ['En Gestión', STATUS_COLOR['En Gestión']],
                    ['Resuelto', STATUS_COLOR.Resuelto],
                  ] as const
                ).map(([label, color]) => (
                  <span
                    key={label}
                    className="flex items-center gap-1 text-[5px] font-bold uppercase tracking-wider text-white/80"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute right-1.5 top-1.5 border border-white/20 bg-[#001a35]/85 px-2 py-1 font-mono text-[5px] uppercase tracking-widest text-white/70">
              {sector?.nombre} · {sector?.superficie}
            </div>
          </div>
        </section>

        {/* Catastro */}
        <section className="mt-[6mm] break-inside-avoid">
          <SectionTitle
            number={section(5)}
            title="Catastro de incidencias"
          />
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#002855] text-white">
                {['N°', 'Código', 'Categoría', 'Fecha', 'Severidad', 'Estado'].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-1.5 py-1.5 text-[5.5px] font-black uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {incidents.slice(0, 12).map((incident, index) => (
                <tr
                  key={incident.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                >
                  <td className="border-b border-slate-100 px-1.5 py-1.5 text-[6px] font-black text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="border-b border-slate-100 px-1.5 py-1.5 font-mono text-[5.5px] font-bold text-[#002855]">
                    {incident.codigo}
                  </td>
                  <td className="border-b border-slate-100 px-1.5 py-1.5 text-[6px] font-bold uppercase text-slate-600">
                    {incident.categoria}
                  </td>
                  <td className="border-b border-slate-100 px-1.5 py-1.5 text-[6px] text-slate-500">
                    {formatDateShort(incident.fecha)}
                  </td>
                  <td className="border-b border-slate-100 px-1.5 py-1.5 text-[6px] font-black uppercase text-slate-600">
                    {incident.severidad}
                  </td>
                  <td className="border-b border-slate-100 px-1.5 py-1.5">
                    <span
                      className="inline-flex items-center gap-1 text-[5.5px] font-black uppercase tracking-wider"
                      style={{ color: STATUS_COLOR[incident.estado] }}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[incident.estado] }}
                      />
                      {incident.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {incidents.length > 12 && (
            <p className="mt-1 text-right text-[5.5px] font-bold uppercase tracking-widest text-slate-400">
              + {incidents.length - 12} incidencias anexas en el sistema
            </p>
          )}
        </section>

        {/* Observaciones */}
        <section className="mt-[6mm] break-inside-avoid">
          <SectionTitle
            number={section(6)}
            title="Observaciones y recomendaciones"
          />
          <p className="text-[7px] font-medium leading-[1.7] text-slate-600">
            {meta.observaciones ||
              'Sin observaciones adicionales para el período informado.'}
          </p>
          <ul className="mt-2 space-y-1">
            {[
              'Programar una inspección en terreno de los puntos clasificados con severidad alta.',
              'Coordinar con las áreas operativas y el concesionario el despeje de bermas y la limpieza de residuos.',
              'Verificar la evolución de los hallazgos en el próximo vuelo programado y actualizar su estado.',
            ].map((recommendation) => (
              <li
                key={recommendation}
                className="flex gap-1.5 text-[6.5px] font-medium leading-relaxed text-slate-500"
              >
                <span className="mt-[1.5px] h-1 w-1 shrink-0 bg-blue-600" />
                {recommendation}
              </li>
            ))}
          </ul>
        </section>

        {/* Firmas */}
        <section className="mt-[7mm] grid grid-cols-3 gap-6 break-inside-avoid">
          {[
            { role: 'Elaborado por', name: meta.elaboradoPor },
            { role: 'Revisado por', name: 'Jorge Bernal Navarrete' },
            { role: 'Aprobado por', name: 'Gerencia EPA' },
          ].map((signature) => (
            <div key={signature.role} className="text-center">
              <div className="mx-auto h-[10mm] border-b border-slate-300" />
              <p className="mt-1.5 text-[5.5px] font-black uppercase tracking-[0.16em] text-slate-400">
                {signature.role}
              </p>
              <p className="mt-0.5 text-[6px] font-bold text-[#002855]">
                {signature.name}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* Pie */}
      <footer className="mt-auto border-t border-slate-200 px-[11mm] py-[4mm]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[5.5px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Documento generado desde EPA WebGIS · Datos del prototipo
          </p>
          <p className="font-mono text-[5.5px] uppercase tracking-widest text-slate-400">
            {reportNumber} · Página 1 de 1
          </p>
        </div>
        <div className="mt-2 h-1 w-full bg-gradient-to-r from-[#002855] via-blue-500 to-[#ffd700]" />
      </footer>
    </article>
  );
};
