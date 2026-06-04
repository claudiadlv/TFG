export interface Entrenamiento {
  id: number;
  tipo: string;
  fecha: string;
  hora?: string;
  categoria: string | string[];
  disciplina?: string | null;
  nombreCarrera?: string | null;
  id_transporte?: number;
  plazas_totales?: number | null;
  plazas_disponibles?: number;
  conTransporte?: boolean;
  plazas_ocupadas?: number;
  listaHijosFurgoneta?: number[]; // IDs de hijos apuntados al transporte
  viaje_id?: number | null; // ID del viaje asociado, si lo hay
};