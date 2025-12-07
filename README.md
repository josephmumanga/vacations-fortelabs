# FORTE - Gestión de Vacaciones

Sistema de gestión de vacaciones y permisos para FORTE Innovation Consulting con integración de IA (AURORA).

## Características

- 📅 Gestión de solicitudes de vacaciones, permisos y días económicos
- 🤖 Asistente virtual AURORA con IA (Gemini API)
- 👥 Sistema de roles y aprobaciones (RBAC)
- 📊 Dashboard personalizado
- 🔄 Flujo de aprobación multi-nivel (PM → Líder → RH)
- 🔐 Autenticación personalizada con Azure Functions (solo usuarios @forteinnovation.mx)
- ✉️ Magic Link (inicio de sesión sin contraseña)
- 🔑 Restablecimiento de contraseña por email

## Instalación

```bash
npm install
```

## Configuración de Azure SQL Database

1. Crea una base de datos en Azure SQL Database (usa el tier gratuito si es posible)
2. Ejecuta el script SQL en `azure-sql-schema.sql` en Azure SQL Database
3. Ejecuta el script de migración `azure-sql-migration-auth-tokens.sql` para agregar las tablas de tokens (magic links y password reset)
4. Ejecuta el script de migración `azure-sql-migration-magic-tokens-users.sql` para agregar las columnas MagicToken y MagicTokenExpires a la tabla users
5. Obtén la cadena de conexión de tu base de datos desde Azure Portal

## Configuración de Azure Functions

Las Azure Functions están en el directorio `api/`. Necesitas configurar las siguientes variables de entorno en Azure Static Web Apps:

### Variables de Entorno Requeridas

En Azure Portal, ve a tu Static Web App > Configuration > Application settings y agrega:

```
AZURE_SQL_SERVER=tu-servidor.database.windows.net
AZURE_SQL_DATABASE=nombre-de-tu-base-de-datos
AZURE_SQL_USER=tu-usuario
AZURE_SQL_PASSWORD=tu-contraseña
JWT_SECRET=tu-clave-secreta-para-jwt-cambiar-en-produccion
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@fortelabs.cloud
SMTP_PASS=<HOSTINGER_EMAIL_PASSWORD>
SMTP_FROM=noreply@fortelabs.cloud
APP_BASE_URL=https://<tu-static-web-app>.azurestaticapps.net
MAGIC_LINK_TTL_MINUTES=30
```

### Configuración SMTP (Para Magic Links y Password Reset)

Para habilitar el envío de emails (magic links y restablecimiento de contraseña), agrega estas variables de entorno:

#### Hostinger SMTP (Recomendado)

El sistema está configurado para usar Hostinger SMTP con tu dominio personalizado:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@fortelabs.cloud
SMTP_PASS=<HOSTINGER_EMAIL_PASSWORD>
SMTP_FROM=noreply@fortelabs.cloud
APP_BASE_URL=https://<tu-static-web-app>.azurestaticapps.net
MAGIC_LINK_TTL_MINUTES=30
```

**Configuración de Hostinger:**
1. Crea una cuenta de email en Hostinger (ejemplo: `noreply@fortelabs.cloud`)
2. Obtén la contraseña de la cuenta de email desde el panel de Hostinger
3. Usa esa contraseña en la variable de entorno `SMTP_PASS`
4. El servidor SMTP de Hostinger es `smtp.hostinger.com` en el puerto `587` (TLS)

**Nota:** También puedes usar `APP_URL` en lugar de `APP_BASE_URL` para compatibilidad con versiones anteriores.

### Instalación de Dependencias de Azure Functions

```bash
cd api
npm install
```

## Desarrollo Local

Para desarrollo local, necesitas:

1. Instalar Azure Functions Core Tools
2. Configurar las variables de entorno localmente
3. Ejecutar las funciones localmente:

```bash
cd api
func start
```

4. En otra terminal, ejecutar el frontend:

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Construcción

```bash
npm run build
```

## Despliegue en Azure Static Web Apps

1. Crea un Azure Static Web App en Azure Portal
2. Conecta tu repositorio GitHub/Azure DevOps
3. Configura las variables de entorno en Azure Portal (ver sección anterior)
4. El despliegue se realizará automáticamente cuando hagas push a la rama principal

### Configuración de Dominio Personalizado

1. En Azure Portal, ve a tu Static Web App > Custom domains
2. Agrega el dominio `vacations.fortelabs.cloud`
3. Configura los registros DNS en Hostinger según las instrucciones de Azure

## Autenticación

### Métodos de Inicio de Sesión

El sistema soporta autenticación mediante Magic Links como método principal, con opción de usar contraseña como alternativa:

1. **Magic Link** (Método Principal - Sin contraseña)
   - Ingresa solo tu email (@forteinnovation.mx)
   - Recibirás un enlace por email que te permitirá iniciar sesión
   - El enlace expira en 30 minutos (configurable via `MAGIC_LINK_TTL_MINUTES`)
   - Solo puede usarse una vez
   - El enlace se envía a través de Hostinger SMTP desde `noreply@fortelabs.cloud`

2. **Inicio de Sesión con Contraseña** (Alternativa)
   - Disponible como opción alternativa
   - Ingresa tu email y contraseña
   - Útil para usuarios que prefieren autenticación tradicional

3. **Restablecimiento de Contraseña**
   - Si olvidaste tu contraseña, haz clic en "Forgot password?"
   - Ingresa tu email y recibirás un enlace para restablecer tu contraseña
   - El enlace expira en 1 hora

### Cuenta de Administrador

**Email:** centro.id@forteinnovation.mx  
**Contraseña:** admin123

> **Nota:** Esta cuenta debe ser creada manualmente en la base de datos o a través del formulario de registro.

### Uso de Magic Link

1. En la pantalla de inicio de sesión, el método "Magic Link" está seleccionado por defecto
2. Ingresa tu email (@forteinnovation.mx)
3. Haz clic en "Send Magic Link"
4. Revisa tu correo electrónico (el email se envía desde `noreply@fortelabs.cloud`)
5. Haz clic en el enlace recibido (será redirigido a `/magic?token=...`)
6. Serás autenticado automáticamente y redirigido al dashboard

**Nota:** Si no recibes el email, verifica tu carpeta de spam y asegúrate de que la configuración SMTP de Hostinger esté correcta.

### Restablecimiento de Contraseña

1. En la pantalla de inicio de sesión, haz clic en "Forgot password?"
2. Ingresa tu email (@forteinnovation.mx)
3. Revisa tu correo electrónico y haz clic en el enlace de restablecimiento
4. Ingresa tu nueva contraseña (mínimo 6 caracteres)
5. Confirma tu nueva contraseña
6. Una vez restablecida, podrás iniciar sesión con tu nueva contraseña

## Tecnologías

- React 18
- Vite
- Tailwind CSS
- Lucide React (Iconos)
- Google Gemini API (AURORA AI)
- Azure SQL Database (Base de Datos)
- Azure Functions (Backend API)
- Azure Static Web Apps (Hosting)

## Estructura del Proyecto

```
├── api/                    # Azure Functions
│   ├── auth/              # Funciones de autenticación
│   ├── profiles/           # Funciones de perfiles
│   ├── requests/           # Funciones de solicitudes
│   └── lib/                # Utilidades compartidas
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   ├── lib/                # Utilidades (API client)
│   └── ...
├── azure-sql-schema.sql   # Esquema de base de datos
└── staticwebapp.config.json # Configuración de Azure Static Web Apps
```
