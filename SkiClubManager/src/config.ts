// src/config.ts

// Detecta si estás en desarrollo
const isDev = __DEV__;

// En entorno de desarrollo: usar IP local manual o 10.0.2.2 para emulador
const LOCAL_API_IP = '10.0.2.2'; 

export const API_URL = isDev
  ? `http://${LOCAL_API_IP}:3000`
  : 'https://tuservidor-en-produccion.com'; 
