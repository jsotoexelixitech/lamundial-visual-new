import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Plus, RefreshCw, UserCog, X } from 'lucide-react';
import {
  createPortalUser,
  fetchPortalRoles,
  fetchPortalUsers,
  getCurrentUser,
  togglePortalUserStatus,
  updatePortalUser,
  type PortalManagedUser,
  type PortalRoleOption,
} from '@/lib/nexus-auth';
import { isPortalAdmin } from '@/lib/portal-sso-config';
import {
  PortalPerfilFormFields,
  defaultOperatorPortalPerfil,
  portalPerfilFromApi,
  portalPerfilToPayload,
  type PortalPerfilForm,
} from '@/components/PortalPerfilForm';

const inputClass =
  'w-full rounded-xl border border-[#e4e6ee] bg-white px-3 py-2.5 text-sm text-[#091133] focus:outline-none focus:ring-2 focus:ring-[#2E6DBF]/30';

function apiMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const body = err.response.data as { message?: string };
    if (body.message) return body.message;
  }
  return err instanceof Error ? err.message : fallback;
}

type Mode = 'list' | 'create' | 'edit';

export function UsersAdminPage() {
  const navigate = useNavigate();
  const me = getCurrentUser();
  const userId = me?.id;
  const canAdmin = Boolean(me && isPortalAdmin(me));
  const loadSeq = useRef(0);
  const [users, setUsers] = useState<PortalManagedUser[]>([]);
  const [roles, setRoles] = useState<PortalRoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [portalPerfil, setPortalPerfil] = useState<PortalPerfilForm>(
    defaultOperatorPortalPerfil(),
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError('');
    try {
      const [u, r] = await Promise.all([fetchPortalUsers(), fetchPortalRoles()]);
      if (seq !== loadSeq.current) return;
      setUsers(u);
      setRoles(r);
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(apiMessage(e, 'No se pudo cargar usuarios.'));
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    void load();
  }, [userId, canAdmin, navigate, load]);

  const resetForm = () => {
    setForm({ nombre: '', email: '', password: '', roleId: '' });
    setPortalPerfil(defaultOperatorPortalPerfil());
    setEditId(null);
    setMode('list');
    setCreatedPassword(null);
  };

  const startCreate = () => {
    resetForm();
    const operador = roles.find((r) => r.nombre.toLowerCase().includes('operador'));
    setForm((f) => ({
      ...f,
      roleId: operador ? String(operador.id) : roles[0]?.id ? String(roles[0].id) : '',
    }));
    setMode('create');
  };

  const startEdit = (u: PortalManagedUser) => {
    setEditId(u.id);
    setForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      roleId: String(u.roleId),
    });
    setPortalPerfil(portalPerfilFromApi(u.portalPerfil ?? undefined));
    setMode('edit');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.roleId) {
      setError('Complete nombre, correo y rol.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        roleId: parseInt(form.roleId, 10),
        portalPerfil: portalPerfilToPayload(portalPerfil),
      };
      if (mode === 'create') {
        const body = {
          ...payload,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        };
        const { temporaryPassword } = await createPortalUser(body);
        setCreatedPassword(
          form.password.trim() || temporaryPassword || null,
        );
        await load();
        setMode('list');
        setForm({ nombre: '', email: '', password: '', roleId: '' });
      } else if (editId != null) {
        const body = {
          ...payload,
          ...(form.password.trim() ? { password: form.password.trim() } : {}),
        };
        await updatePortalUser(editId, body);
        await load();
        resetForm();
      }
    } catch (err) {
      setError(apiMessage(err, 'Error al guardar.'));
    } finally {
      setSaving(false);
    }
  };

  const onToggle = async (id: number) => {
    try {
      await togglePortalUserStatus(id);
      await load();
    } catch (err) {
      setError(apiMessage(err, 'No se pudo cambiar el estado.'));
    }
  };

  if (!canAdmin || !me) return null;

  return (
    <div className="portal-page">
      <div className="portal-page-header flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="min-w-0">
          <p className="portal-page-eyebrow">Administración</p>
          <h1 className="portal-page-title flex flex-wrap items-center gap-2">
            <UserCog size={24} className="text-[#7eb8ff] shrink-0" aria-hidden />
            <span>Usuarios del portal</span>
          </h1>
          <p className="portal-page-subtitle">
            Operadores y administradores de su empresa. Canal Sis2000 por usuario.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          {mode === 'list' && (
            <button
              type="button"
              onClick={startCreate}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#0F1A5A] text-sm font-semibold hover:bg-[#f0f2f8]"
            >
              <Plus size={16} />
              Nuevo usuario
            </button>
          )}
        </div>
      </div>

      <div className="portal-page-body space-y-6">
        {createdPassword && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-bold">Usuario creado</p>
            <p className="mt-1">
              Contraseña para entregar al operador:{' '}
              <code className="font-mono bg-white px-2 py-0.5 rounded border">{createdPassword}</code>
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold underline"
              onClick={() => setCreatedPassword(null)}
            >
              Cerrar
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {(mode === 'create' || mode === 'edit') && (
          <div className="portal-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#091133]">
                {mode === 'create' ? 'Nuevo usuario' : 'Editar usuario'}
              </h2>
              <button type="button" onClick={resetForm} className="p-2 text-[#777] hover:text-[#091133]">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => void submit(e)} className="space-y-4 max-w-2xl">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1">Nombre *</label>
                  <input
                    className={inputClass}
                    value={form.nombre}
                    onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                    required
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1">Correo *</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1">Rol *</label>
                  <select
                    className={inputClass}
                    value={form.roleId}
                    onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                    required
                  >
                    <option value="">Seleccione…</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#555] mb-1">
                    Contraseña {mode === 'create' ? '(opcional)' : '(dejar vacío para no cambiar)'}
                  </label>
                  <input
                    type="password"
                    className={inputClass}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <PortalPerfilFormFields value={portalPerfil} onChange={setPortalPerfil} />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 rounded-xl border border-[#e4e6ee] py-2.5 text-sm font-semibold text-[#555]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#E84F51] py-2.5 text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="portal-panel overflow-hidden rounded-xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-[#0F1A5A]" />
            </div>
          ) : users.length === 0 ? (
            <p className="px-4 py-12 text-center text-[#777] text-sm">No hay usuarios registrados.</p>
          ) : (
            <>
              <ul className="md:hidden divide-y divide-[#eceef4]">
                {users.map((u) => {
                  const pp = u.portalPerfil as Record<string, string> | null;
                  const canal =
                    pp?.centidad && pp?.citem
                      ? `${pp.centidad} / ${pp.citem}`
                      : 'Por defecto empresa';
                  return (
                    <li key={u.id} className="p-4 space-y-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#091133] break-words">{u.nombre}</p>
                        <p className="text-xs text-[#777] break-all mt-0.5">{u.email}</p>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                        <div>
                          <dt className="text-[#ACACAC] uppercase tracking-wide font-bold">Rol</dt>
                          <dd className="text-[#091133] mt-0.5">{u.role}</dd>
                        </div>
                        <div>
                          <dt className="text-[#ACACAC] uppercase tracking-wide font-bold">Canal</dt>
                          <dd className="text-[#555] mt-0.5">{canal}</dd>
                        </div>
                        <div>
                          <dt className="text-[#ACACAC] uppercase tracking-wide font-bold">Estado</dt>
                          <dd className="mt-0.5">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="button"
                          className="text-sm font-semibold text-[#2E6DBF]"
                          onClick={() => startEdit(u)}
                        >
                          Editar
                        </button>
                        {u.id !== me.id && (
                          <button
                            type="button"
                            className="text-sm font-semibold text-[#E84F51]"
                            onClick={() => void onToggle(u.id)}
                          >
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead className="bg-[#F0F2F8] text-left text-xs uppercase tracking-wide text-[#777]">
                    <tr>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3">Canal</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const pp = u.portalPerfil as Record<string, string> | null;
                      const canal =
                        pp?.centidad && pp?.citem
                          ? `${pp.centidad} / ${pp.citem}`
                          : 'Por defecto empresa';
                      return (
                        <tr key={u.id} className="border-t border-[#eceef4] hover:bg-[#FAFBFD]">
                          <td className="px-4 py-3 max-w-[220px]">
                            <p className="font-semibold text-[#091133] truncate">{u.nombre}</p>
                            <p className="text-xs text-[#777] truncate">{u.email}</p>
                          </td>
                          <td className="px-4 py-3">{u.role}</td>
                          <td className="px-4 py-3 text-xs text-[#555]">{canal}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                u.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {u.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="text-xs font-semibold text-[#2E6DBF] hover:underline"
                                onClick={() => startEdit(u)}
                              >
                                Editar
                              </button>
                              {u.id !== me.id && (
                                <button
                                  type="button"
                                  className="text-xs font-semibold text-[#E84F51] hover:underline"
                                  onClick={() => void onToggle(u.id)}
                                >
                                  {u.activo ? 'Desactivar' : 'Activar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
