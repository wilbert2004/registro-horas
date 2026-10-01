# Guía de Instalación y Despliegue: Sistema de Registro de Horas con Supabase & Vercel

Esta guía te explica cómo configurar la base de datos en Supabase y conectar tu proyecto estático en JavaScript Vanilla para desplegarlo en Vercel.

---

## 🚀 Paso 1: Configurar la Base de Datos en Supabase (Gratis)

1. Ingresa a [supabase.com](https://supabase.com/) e inicia sesión o crea una cuenta gratuita.
2. Haz clic en **"New Project"**, dale un nombre (ej. `registro-horas`) y define una contraseña segura para la base de datos.
3. Una vez creado el proyecto, ve al menú lateral izquierdo y selecciona **"SQL Editor"**.
4. Haz clic en **"New Query"**, copia todo el contenido del archivo [`schema.sql`](./schema.sql) y pégalo allí.
5. Presiona el botón **"Run"** para ejecutar el script. Esto creará:
   - Las tablas `profiles` y `time_logs`.
   - Las políticas de seguridad **Row Level Security (RLS)** que aíslan los datos de cada usuario.
   - La función segura `get_totals_per_practicante()` para el rol de Asesor.

---

## 🔑 Paso 2: Obtener las Credenciales de Supabase

1. En el panel lateral de tu proyecto Supabase, ve a **Project Settings** (el icono de engranaje ⚙️) -> **API**.
2. Copia los dos valores siguientes:
   - **Project URL** (ejemplo: `https://xyzcompany.supabase.co`)
   - **anon / public Key** (una cadena larga que empieza con `eyJ...`)

---

## 💻 Paso 3: Conectar el Proyecto Estático

Tienes dos opciones para poner las credenciales:

### Opción A (Sin modificar archivos - Desde el Navegador)
1. Abre el archivo `index.html` en tu navegador.
2. Haz clic en el botón superior derecho **"Conexión Supabase"**.
3. Pega tu `Project URL` y tu `Anon Key`. Se guardarán automáticamente en tu navegador.

### Opción B (Pre-configurar en el código)
Abre el archivo `supabaseClient.js` y reemplaza las líneas 7 y 8 con tus credenciales:
```javascript
const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU-SUPABASE-ANON-KEY";
```

---

## 🔒 Paso 4: Cómo Probar los Roles

### Prueba como Practicante:
1. En la pantalla principal, selecciona la pestaña **"Registrarse"**.
2. Ingresa tus datos y en **Tipo de Usuario** selecciona **Practicante**.
3. Una vez dentro, registra varias entradas de horas (ej. 4.5 horas hoy).
4. Verás que solo tú puedes ver y eliminar tus propias entradas de historial.

### Prueba como Asesor Externo:
1. Cierra sesión.
2. Crea un segundo usuario seleccionando el rol **Asesor Externo**.
3. Al iniciar sesión como Asesor, verás una tabla limpia con la **suma acumulada de cada practicante** (ej. *Juan Perez: 4.50 hrs*).
4. El asesor **NO** podrá ver fechas, descripciones ni tareas individuales.

---

## 🌐 Paso 5: Despliegue en Vercel

Como tu proyecto es JavaScript Vanilla estático, desplegarlo en Vercel es automático:

1. Sube estos archivos a tu repositorio de GitHub (o arrastra la carpeta directamente en el panel de Vercel).
2. Estructura de archivos requerida:
   - `index.html`
   - `supabaseClient.js`
   - `app.js`
3. ¡Listo! Vercel servirá el sitio estático y Supabase se encargará de sincronizar todos los teléfonos, laptops y computadoras en tiempo real con la máxima seguridad.
