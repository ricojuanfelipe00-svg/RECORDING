# Recuérdame (RECORDING)

PWA de gestor de tareas y recordatorios — proyecto de grado.

## Stack

- **Frontend:** React + Vite + Tailwind CSS + vite-plugin-pwa
- **Backend:** Node.js + Express
- **Base de datos:** MySQL (Clever Cloud)

## Estructura

```
backend-recording/   API Express + JWT + MySQL
frontend-recording/  PWA React + Tailwind (UI Figma Recuérdame)
docs/                Requerimientos, HU, esquema y script SQL
```

## Configuración

### Backend

```bash
cd backend-recording
cp .env.example .env
npm install
npm run dev
```

API en `http://localhost:4000`

### Frontend

```bash
cd frontend-recording
npm install
npm run dev
```

App en `http://localhost:5173`

## Pantallas (Figma)

Login, Registro, Inicio, Lista de tareas, Nuevo/Editar, Detalle, Calendario, Notificaciones, Perfil.
