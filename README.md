# AulaConecta · App

[![CI](https://github.com/florenciaPenaSepulveda/aulaconecta-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/florenciaPenaSepulveda/aulaconecta-app/actions/workflows/ci.yml)

Aplicación móvil de **AulaConecta**, plataforma de gestión escolar para profesores y apoderados. Construida con Expo y React Native; también corre en el navegador.

## Repositorios del proyecto

| Repositorio | Descripción |
|---|---|
| [aulaconecta-backend](https://github.com/florenciaPenaSepulveda/aulaconecta-backend) | API GraphQL y base de datos (necesaria para usar la app) |
| [aulaconecta-web](https://github.com/florenciaPenaSepulveda/aulaconecta-web) | Panel web por rol |
| **aulaconecta-app** (este) | Aplicación móvil |

## Qué incluye

- **Apoderado:** resumen académico de sus pupilos, notas y asistencia por asignatura, anuncios y mensajes con los profesores.
- **Profesor y administrador:** asignaturas, asistencia por fecha, calendario de asistencia, asistencia por curso y por estudiante, notas, anuncios y mensajes.

## Requisitos

- Node.js 24 LTS (ver `.nvmrc`)
- El backend en ejecución con datos de ejemplo (ver el README de [aulaconecta-backend](https://github.com/florenciaPenaSepulveda/aulaconecta-backend)).

## Verla en el computador

```
npm install
npm run web
```

Abre `http://localhost:8081`. Para una vista parecida a un teléfono, usa el modo dispositivo del navegador (F12).

## Verla en un teléfono

1. Instala Expo Go desde Play Store o App Store.
2. Conecta el teléfono y el computador a la misma red Wi-Fi.
3. Ejecuta `npm start` y escanea el código QR con Expo Go (Android) o con la cámara (iOS).
4. Si Windows pregunta por el firewall, permite el acceso en redes privadas.

La app detecta automáticamente la IP del computador para conectarse al backend en el puerto 3000. Para fijarla manualmente, crea un archivo `.env` con:

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/graphql
```

## Verla en un emulador

- Android Studio: `npm run android` (usa `10.0.2.2` para llegar al backend del computador).
- Xcode (solo macOS): `npm run ios`.

## Seguridad

- En el teléfono la sesión se guarda cifrada en el almacén seguro del dispositivo (Keychain en iOS, Keystore en Android) con `expo-secure-store`; en la versión web se usa el almacenamiento del navegador.
- Si el servidor informa que el token expiró, la app cierra la sesión y avisa.
- Las contraseñas deben tener entre 8 y 72 caracteres, con letras y números, igual que en la API.
- Una pantalla de error evita que la app quede en blanco si algo falla.

## Pruebas

```
npm test
npm run test:cov
```

Umbral de cobertura del 80 %; actual 98 %.

## Usuarios de ejemplo

Contraseña `Demo1234`: `profesor@aulaconecta.cl` y `apoderado@aulaconecta.cl`.

## Autoría

Proyecto académico desarrollado en equipo (originalmente ClosedAI); esta versión forma parte del portafolio de [Florencia Peña Sepúlveda](https://github.com/florenciaPenaSepulveda).
