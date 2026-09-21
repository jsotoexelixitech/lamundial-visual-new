import React from 'react';

export type PortalPerfilForm = {
  resolverGestorPorEmail: boolean;
  centidad: string;
  citem: string;
  cproductor: string;
  cusuario: string;
  cgestor: string;
  ccanalaltIn: string;
  cscanalaltIn: string;
};

export const defaultOperatorPortalPerfil = (): PortalPerfilForm => ({
  resolverGestorPorEmail: true,
  centidad: 'C',
  citem: '27',
  cproductor: '',
  cusuario: '',
  cgestor: '',
  ccanalaltIn: '',
  cscanalaltIn: '',
});

export function portalPerfilFromApi(
  raw: Record<string, unknown> | null | undefined,
): PortalPerfilForm {
  if (!raw) return defaultOperatorPortalPerfil();
  return {
    resolverGestorPorEmail: raw.resolverGestorPorEmail !== false,
    centidad: String(raw.centidad ?? 'C'),
    citem: String(raw.citem ?? ''),
    cproductor: String(raw.cproductor ?? ''),
    cusuario: String(raw.cusuario ?? ''),
    cgestor: String(raw.cgestor ?? ''),
    ccanalaltIn: String(raw.ccanalaltIn ?? ''),
    cscanalaltIn: String(raw.cscanalaltIn ?? ''),
  };
}

export function portalPerfilToPayload(form: PortalPerfilForm) {
  return {
    resolverGestorPorEmail: form.resolverGestorPorEmail,
    centidad: form.centidad || null,
    citem: form.citem || null,
    cproductor: form.cproductor || null,
    cusuario: form.cusuario || null,
    cgestor: form.cgestor || null,
    ccanalaltIn: form.ccanalaltIn || null,
    cscanalaltIn: form.cscanalaltIn || null,
  };
}

type Props = {
  value: PortalPerfilForm;
  onChange: (next: PortalPerfilForm) => void;
};

export function PortalPerfilFormFields({ value, onChange }: Props) {
  const set = (patch: Partial<PortalPerfilForm>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="rounded-xl border border-[#e4e6ee] bg-[#F7F8FA] p-4 space-y-3">
      <div>
        <p className="text-sm font-bold text-[#091133]">Canal Sis2000 (operador)</p>
        <p className="text-xs text-[#777777] mt-0.5">
          Misma configuración que un operador del portal (productor, canal, gestor por correo).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#091133]">
        <input
          type="checkbox"
          checked={value.resolverGestorPorEmail}
          onChange={(e) => set({ resolverGestorPorEmail: e.target.checked })}
        />
        Resolver canal por correo del operador (magestor)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Centidad</label>
          <select
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.centidad}
            onChange={(e) => set({ centidad: e.target.value })}
          >
            <option value="">(Automático)</option>
            <option value="P">P — Productor</option>
            <option value="C">C — Comercializador</option>
            <option value="G">G — Gestor</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Citem</label>
          <input
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.citem}
            onChange={(e) => set({ citem: e.target.value })}
            placeholder="27"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Productor</label>
          <input
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.cproductor}
            onChange={(e) => set({ cproductor: e.target.value })}
            placeholder="80080"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Usuario Sis2000</label>
          <input
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.cusuario}
            onChange={(e) => set({ cusuario: e.target.value })}
            placeholder="4"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Gestor (cgestor)</label>
          <input
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.cgestor}
            onChange={(e) => set({ cgestor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#555] mb-1">Canal alt.</label>
          <input
            className="w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30"
            value={value.ccanalaltIn}
            onChange={(e) => set({ ccanalaltIn: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
