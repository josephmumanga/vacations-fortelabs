# FORTE - Gestión de Vacaciones

Sistema de gestión de vacaciones y permisos para FORTE Innovation Consulting con integración de IA (AURORA).

## Características

- 📅 Gestión de solicitudes de vacaciones, permisos y días económicos
- 🤖 Asistente virtual AURORA con IA (Gemini API)
- 👥 Sistema de roles y aprobaciones (RBAC)
- 📊 Dashboard personalizado
- 🔄 Flujo de aprobación multi-nivel (PM → Líder → RH)
- 🔐 Autenticación personalizada con Azure Functions (solo usuarios @forteinnovation.mx)

## Instalación

```bash
npm install
```

## Configuración de Azure SQL Database

1. Crea una base de datos en Azure SQL Database (usa el tier gratuito si es posible)
2. Ejecuta el script SQL en `azure-sql-schema.sql` en Azure SQL Database
3. Obtén la cadena de conexión de tu base de datos desde Azure Portal

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
```

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

## Cuenta de Administrador

**Email:** centro.id@forteinnovation.mx  
**Contraseña:** admin123

> **Nota:** Esta cuenta debe ser creada manualmente en la base de datos o a través del formulario de registro.

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
