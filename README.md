# Portal La Mundial de Seguros

> **Launcher SSO centralizado** para flujos de seguro: RCV, Patrimoniales y Funerario.  
> Stack: React 18 + Vite + TypeScript + Tailwind CSS  
> Repo: `https://github.com/jsotoexelixitech/lamundial-visual-new.git`

---

## Descripción

Portal web con login propio (credenciales Nexus), auditoría de accesos y lanzador SSO para los módulos Exélixi. El usuario hace login, elige el producto y el portal genera el acceso SSO automáticamente, sin necesidad de manipular URLs ni tokens manualmente.

### Flujos soportados

| Producto | Target SSO | Módulo de entrada |
|----------|-----------|-------------------|
| **RCV** | `ocr` | `/ocr/?nexus_token=…` |
| **Patrimoniales** | `emision` | `/emision/?nexus_token=…` |
| **Funerario** | `ocr` | `/ocr/?nexus_token=…&product=funerario` |

---

## Variables de entorno

Copiar `.env.example` → `.env.production`:

```env
VITE_NEXUS_API_URL=https://cierrelmds.exelixitech.com/nexus-api
VITE_PORTAL_OCR_URL=https://cierrelmds.exelixitech.com/ocr/
VITE_PORTAL_EMISION_URL=https://cierrelmds.exelixitech.com/emision/
VITE_PORTAL_FORM_URL=https://cierrelmds.exelixitech.com/formulario/
VITE_PORTAL_PAGOS_URL=https://cierrelmds.exelixitech.com/pagos/
VITE_APP_BASE=/portal/
VITE_LAMUNDIAL_RAMO_PATRIMONIAL=20
```

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
# → http://localhost:5173/
```

El `.env.development` ya apunta a `cierrelmds.exelixitech.com`.

---

## Deploy en srv001 (`jsoto@srv001`)

### 1. Primer deploy

```bash
# SSH al servidor
ssh jsoto@192.168.8.120

# Clonar el repo
mkdir -p ~/portal && cd ~/portal
git clone https://github.com/jsotoexelixitech/lamundial-visual-new.git .

# Build + PM2
bash scripts/build-deploy.sh
```

### 2. Updates posteriores

```bash
cd ~/portal
git pull
bash scripts/build-deploy.sh
```

### 3. Apache — agregar en el VirtualHost de cierrelmds

```apache
# Portal La Mundial (puerto 5190)
ProxyPass /portal/ http://127.0.0.1:5190/
ProxyPassReverse /portal/ http://127.0.0.1:5190/
```

Luego:
```bash
sudo apache2ctl configtest && sudo systemctl reload apache2
```

### 4. Verificar

```bash
# PM2
pm2 status
pm2 logs portal-lamundial --lines 20

# Puerto
ss -tlnp | grep 5190

# HTTP
curl -I https://cierrelmds.exelixitech.com/portal/
```

---

## Migración BD (nexus-api — Postgres)

Las tablas `portal_session` y `portal_audit_log` se agregan al schema Prisma de `exelixi-nexus-services`:

```bash
# En jsoto@srv001 o desde local apuntando a la BD
cd ~/nexus-api
npx prisma migrate dev --name add-portal-tables
# o en producción:
npx prisma migrate deploy
pm2 reload nexus-api
```

---

## PM2

| Entrada | Puerto | Script |
|---------|--------|--------|
| `portal-lamundial` | **5190** | `serve -s dist -l 5190` |

```bash
# Estado
pm2 status portal-lamundial

# Logs
pm2 logs portal-lamundial

# Reload sin downtime
pm2 reload portal-lamundial
```

---

## Estructura del proyecto

```
src/
├── pages/
│   ├── LoginPage.tsx      ← Login con animaciones premium
│   ├── DashboardPage.tsx  ← 3 tarjetas de producto + stats
│   └── AuditPage.tsx      ← Historial de acciones
├── components/
│   ├── ProductCard.tsx    ← Tarjeta RCV / Patrimoniales / Funerario
│   ├── LaunchModal.tsx    ← Modal SSO (credenciales o token)
│   └── Navbar.tsx
└── lib/
    ├── portal-config.ts   ← URLs base VITE_*
    ├── nexus-auth.ts      ← login, logout, ssoDelegate, audit
    └── module-launcher.ts ← buildModuleUrl (modo token directo)
```

---

## Puertos en uso (srv001)

| Servicio | Puerto |
|----------|--------|
| Portal La Mundial | **5190** ← nuevo |
| OCR | 5181 |
| Formulario | 5182 |
| Emisión | 5183 |
| Pagos | 5184 |
| nexus-api | 3092 |

---

## Checklist pruebas manuales

- [ ] `https://cierrelmds.exelixitech.com/portal/` → redirige a `/portal/login`
- [ ] Login con usuario Nexus válido → entra al dashboard
- [ ] Tarjeta RCV → modal → modo credenciales → API key + cproductor → abre OCR con nexus_token
- [ ] Tarjeta RCV → modal → modo token → pegar token → abre OCR
- [ ] Tarjeta Patrimoniales → abre emisión con cramo correcto
- [ ] Tarjeta Funerario → abre OCR con `?product=funerario`
- [ ] Menú → Auditoría → muestra historial de acciones
- [ ] Logout → redirige a login
- [ ] Assets del build no dan 404 (`/portal/assets/…`)
