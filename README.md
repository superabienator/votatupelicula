# VotaTuPelícula · CineFórum Democrático ESO (Zero-Cost Stack)

Aplicación web interactiva, educativa y cinematográfica para realizar votaciones escolares de películas con **Voto Preferencial (Recuento Borda)**, tematización dinámica por cartelera y control antifraude OTP sin bloqueo de navegador compartido.

---

## Arquitectura 100 % gratuita (Zero-Cost Stack)

| Capa | Tecnología | Coste |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion | 0 € (Vercel, Netlify o GitHub Pages) |
| **Base de datos y RLS** | Supabase PostgreSQL (Plan gratuito permanente) | 0 € |
| **Backend / API** | Supabase Edge Functions (Deno) | 0 € |
| **Despacho OTP (Correo)** | Google Apps Script + Gmail / Workspace Edu (`EmailRelay.gs`) o Brevo / Resend | 0 € |
| **Carteles / Metadatos / IA** | TMDB API + extracción de paleta JPEG/Canvas + Gemini Flash (opcional) | 0 € |

---

## Características clave

1. **Educación Cívica y Democrática (`¿Cómo funciona tu voto?`)**: Modal siempre accesible con explicación visual juvenil y simulador interactivo comparando **Mayoría Simple**, **Voto Aprobatorio** y **Voto Preferencial (Borda)**.
2. **Mecánica de Votación TOP 3 / TOP 5**: Selección directa (`1º`, `2º`, `3º`) en cada ficha y reordenación táctil/arrastrar-y-soltar (`Framer Motion Reorder`) + confirmación estilo **Entrada de Cine**.
3. **Gestor de Contenidos en 2 Fases**:
   - **Fase 1 (`draft`)**: Barrido asíncrono por lista de títulos con TMDB/OMDb/Gemini y extracción automática de paleta dominante.
   - **Fase 2 (`published`)**: Previsualización, edición de ficha/colores, selector de tema visual (*Blend dinámico* o *Película principal*) y botón **Aprobar y Publicar Cartelera**.
4. **Antifraude apto para dispositivos compartidos**:
   - Sin `localStorage`, `sessionStorage`, cookies persistentes ni bloqueo por IP.
   - Validación RFC 5322 + lista negra de +200 dominios desechables + filtro opcional de dominio del centro.
   - Código OTP de 4 dígitos (10 min de validez, máx. 3 intentos, cooldown de 60 s).
   - Unicidad estricta en PostgreSQL por `email` normalizado y `huella_alumno` (`lower(sin_tildes(nombre)) + "_" + lower(sin_tildes(apellidos)) + "_" + curso`).
5. **Dashboard de Resultados**: Podio interactivo, barras ponderadas, participación por curso/grupo y comparativa pedagógica entre **1ª opción (Mayoría Simple)** y **Consenso TOP 3 (Borda)**.

---

## Prueba local inmediata (< 30 segundos)

Si arrancas la aplicación sin variables `VITE_SUPABASE_*`, entra automáticamente en **Modo Demo Local** (en memoria, sin `localStorage`) para probar toda la interfaz, el flujo OTP simulado, el barrido Fase 1/Fase 2 y el Dashboard:

```bash
npm install
npm run dev
```

* Acceso de Usuario Administrador (`/admin`) en Modo Demo: clave `demo1234`
* Ejecutar pruebas unitarias e integración: `npm test`
* Compilar para producción: `npm run build`

---

## Guía de despliegue rápido en la nube (< 5 minutos, 0 €)

### Paso 1: Crear base de datos gratuita en Supabase (1 min)
1. Crea un proyecto gratuito en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta en orden:
   1. `supabase/migrations/001_initial_schema.sql`
   2. `supabase/migrations/002_rpc_and_policies.sql`
   3. *(Opcional)* `supabase/seed.sql` si quieres películas iniciales de prueba.

### Paso 2: Configurar el envío de correos OTP sin coste (1 min)
**Opción A recomendada para centros escolares (0 € con Gmail / Google Workspace):**
1. Abre [script.google.com](https://script.google.com), crea un proyecto y pega `extras/google-apps-script/EmailRelay.gs`.
2. En **Configuración del proyecto -> Propiedades de secuencia de comandos**, añade `RELAY_SECRET` con una contraseña aleatoria larga.
3. Pulsa **Implementar -> Nueva implementación -> Aplicación web** (*Ejecutar como: Yo*, *Acceso: Cualquier usuario*) y copia la URL `/exec`.

*(Alternativa B: crea una cuenta gratuita en Brevo para 300 correos/día con `BREVO_API_KEY` + `MAIL_FROM_EMAIL`.)*

### Paso 3: Desplegar las Edge Functions de Supabase (2 min)
Con [Supabase CLI](https://supabase.com/docs/guides/cli) instalada:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF

# Configura tus secretos privados en el servidor
supabase secrets set \
  ADMIN_SECRET="clave-segura-administrador" \
  TMDB_API_KEY="tu_api_key_gratuita_de_tmdb" \
  GEMINI_API_KEY="opcional_clave_gemini_flash" \
  GAS_EMAIL_WEBHOOK_URL="https://script.google.com/macros/s/.../exec" \
  GAS_WEBHOOK_SECRET="mismo_secreto_que_RELAY_SECRET"

# Despliega las 6 Edge Functions
supabase functions deploy get-ballot-data --no-verify-jwt
supabase functions deploy request-otp --no-verify-jwt
supabase functions deploy verify-otp --no-verify-jwt
supabase functions deploy admin-auth-check --no-verify-jwt
supabase functions deploy admin-movies --no-verify-jwt
supabase functions deploy admin-results --no-verify-jwt
```

### Paso 4: Publicar el Frontend gratis en Vercel, Netlify o GitHub Pages (1 min)
1. Copia `.env.example` a `.env` (o configúralas en el panel de Vercel/Netlify):
   * `VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co`
   * `VITE_SUPABASE_ANON_KEY=tu_anon_public_key`
2. **Vercel / Netlify**: Conecta el repositorio o ejecuta `npx vercel --prod` / `npx netlify deploy --prod --dir=dist`.
3. **GitHub Pages**: Ejecuta `npm run build` y publica la carpeta `dist/` (la app usa rutas relativas `base: './'`).

---

## Estructura del proyecto

* `supabase/migrations/001_initial_schema.sql` — Tablas (`movies`, `voting_settings`, `otp_tokens`, `votes`, `vote_choices`), índices únicos y normalización SQL.
* `supabase/migrations/002_rpc_and_policies.sql` — Políticas RLS estrictas y RPC atómica `complete_vote_with_otp`.
* `supabase/functions/` — Edge Functions (`get-ballot-data`, `request-otp`, `verify-otp`, `admin-auth-check`, `admin-movies`, `admin-results`) y utilidades compartidas en `_shared/`.
* `extras/google-apps-script/EmailRelay.gs` — Relay gratuito de correo OTP sobre Gmail.
* `src/` — Frontend React + TypeScript + Tailwind CSS + Framer Motion.
