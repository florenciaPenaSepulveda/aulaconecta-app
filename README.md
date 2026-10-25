# AulaConecta App

Aplicación móvil construida con Expo y React Native. Se conecta a la API GraphQL del backend.

## Verla en el computador

1. Levanta la base de datos y el backend (ver README de la raíz).
2. Desde esta carpeta:

   ```
   npm install
   npm run web
   ```

3. Abre `http://localhost:8081`. Para una vista parecida a un teléfono, usa las herramientas del navegador (F12, modo dispositivo).

## Verla en un teléfono

1. Instala la app Expo Go desde Play Store o App Store.
2. Conecta el teléfono y el computador a la misma red Wi-Fi.
3. Ejecuta `npm start` y escanea el código QR con Expo Go (Android) o con la cámara (iOS).
4. Si Windows pregunta por el firewall al iniciar el backend o Expo, permite el acceso en redes privadas.

La app detecta automáticamente la IP del computador para conectarse al backend en el puerto 3000. Si necesitas fijarla manualmente, crea un archivo `.env` con:

```
EXPO_PUBLIC_API_URL=http://192.168.1.50:3000/graphql
```

## Verla en un emulador

- Android Studio: `npm run android` (usa `10.0.2.2` para llegar al backend del computador).
- Xcode (solo macOS): `npm run ios`.

## Pruebas

```
npm test
npm run test:cov
```

## Usuarios de ejemplo

Contraseña `Demo1234`: `profesor@aulaconecta.cl` y `apoderado@aulaconecta.cl`.
