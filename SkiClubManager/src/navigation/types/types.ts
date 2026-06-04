import { NavigatorScreenParams } from '@react-navigation/native';
import { Entrenamiento } from '../types/entrenamiento'; 

export type Usuario = {
  correo: string;
  nombre: string;
  rol: 'admin' | 'entrenador' | 'padre' | 'deportista';
};

// Stack principal
export type RootStackParamList = {
  Login: undefined;
  RegisterRequest: undefined;
  AdminStack: { user: Usuario };
  EntrenadorStack: { user: Usuario };
  PadreStack: { user: Usuario };
};

// Tabs del entrenador
export type EntrenadorTabParamList = {
  HomeEntrenador: undefined;
  Calendario: undefined;
  PerfilEntrenador: undefined;
};

// Stack del entrenador
export type EntrenadorStackParamList = {
  InicioEntrenador: NavigatorScreenParams<EntrenadorTabParamList>;
  CrearEvento: undefined;
  EventoCreado: { tipo: 'creado' | 'modificado' | 'multiples'};
  DetalleEntrenamiento: { entrenamiento: Entrenamiento };
  ModificarEntrenamiento: { entrenamiento: Entrenamiento };
  GaleriaEntrenador: undefined;
  AsistenciaEntrenamiento: { eventoId: string };
  AsistenciaPista: undefined;        
  AdministrarTransporte: undefined;
};

//Tab admin
export type AdminTabParamList = {
  HomeAdmin: undefined;
  Calendario: undefined;
  GaleriaAdmin: undefined;
  PerfilAdmin: undefined;
};

//Stack del admin
export type AdminStackParamList = {
  InicioAdmin: NavigatorScreenParams<AdminTabParamList>;
  AdministrarUsuarios: undefined;
  DetalleEntrenamiento: { entrenamiento: Entrenamiento };
  GaleriaAdmin: undefined;
  AdministrarEntrenador: undefined;
  ListaEntrenadores: undefined;
  EditarEntrenador: { entrenadorId: string };
  AsistenciaEntrenamiento: { eventoId: string };
  AsistenciaPista: undefined;
  AdministrarTransporte: undefined;
};

export type PadreTabParamList = {
  HomePadre: undefined;
  Calendario: undefined;
  GaleriaPadre: undefined;
  PerfilPadre: undefined;
};

// Stack del padre
export type PadreStackParamList = {
  InicioPadre: undefined;
  SolicitarRegistro: undefined;
  DetalleDeportista: { deportistaId: string };
  CalendarioPadre: undefined;
  PerfilPadre: undefined;
  GaleriaPadre: undefined;
  GestionarPerfil: undefined;
  AnadirHijo: undefined; 
  DetalleEventoPadreApuntar: { entrenamiento: Entrenamiento };
  DetalleEventoPadreDesapuntar: { entrenamiento: Entrenamiento };
  AsistenciaPista: undefined;        
  AsistenciaFisico: undefined;
  AsistenciaTransporte: undefined;      
};

