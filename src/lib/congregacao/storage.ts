
'use client';

import type {
  Membro,
  DesignacoesFeitas,
  AllPublicMeetingAssignments,
  PublicMeetingAssignment,
  AllNVMCAssignments,
  NVMCDailyAssignments,
  AllFieldServiceAssignments,
  FieldServiceMonthlyData,
  ManagedListItem,
  FieldServiceWeeklyTemplate,
  DesignacaoSalva,
  TodosCronogramasSalvos,
} from './types';
import {
  LOCAL_STORAGE_KEY_MEMBROS,
  LOCAL_STORAGE_KEY_SCHEDULE_CACHE,
  LOCAL_STORAGE_KEY_PUBLIC_MEETING_ASSIGNMENTS,
  LOCAL_STORAGE_KEY_NVMC_ASSIGNMENTS,
  LOCAL_STORAGE_KEY_FIELD_SERVICE_ASSIGNMENTS,
  LOCAL_STORAGE_KEY_FIELD_SERVICE_MODALITIES,
  LOCAL_STORAGE_KEY_FIELD_SERVICE_LOCATIONS,
  LOCAL_STORAGE_KEY_FIELD_SERVICE_TEMPLATE,
  LOCAL_STORAGE_KEY_USER_SCHEDULE,
} from './constants';
import { validarEstruturaMembro } from './utils';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function carregarMembrosLocalmente(): Membro[] {
  if (typeof window === 'undefined') return [];
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_MEMBROS);
    if (dadosSalvos) {
      const membrosSalvos = JSON.parse(dadosSalvos) as Partial<Membro>[];
      const membrosValidos = membrosSalvos.map(m => validarEstruturaMembro(m, false)).filter(Boolean) as Membro[];
      return membrosValidos.sort((a, b) => a.nome.localeCompare(b.nome));
    }
  } catch (error) {
    console.error("Erro ao carregar membros do localStorage:", error);
  }
  return [];
}

export function salvarMembrosLocalmente(membros: Membro[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_MEMBROS, JSON.stringify(membros));
  } catch (error) {
    console.error("Erro ao salvar membros no localStorage:", error);
  }
}

export async function carregarMembrosFirestore(): Promise<Membro[]> {
  const querySnapshot = await getDocs(collection(db, 'membros'));
  const membros = querySnapshot.docs.map(d => validarEstruturaMembro(d.data(), false)).filter(Boolean) as Membro[];
  return membros.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function salvarMembrosFirestore(membros: Membro[]): Promise<void> {
  const col = collection(db, 'membros');
  await Promise.all(membros.map(m => setDoc(doc(col, m.id), m)));
}

export function carregarCacheDesignacoes(): DesignacaoSalva | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_SCHEDULE_CACHE);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as DesignacaoSalva;
      // Adicionar validação básica da estrutura se necessário
      if (parsedData && typeof parsedData === 'object' && 
          'schedule' in parsedData && 'mes' in parsedData && 'ano' in parsedData && 'status' in parsedData) {
        return parsedData;
      } else {
         console.warn("Cache de designações encontrado, mas com estrutura inválida. Limpando.");
         localStorage.removeItem(LOCAL_STORAGE_KEY_SCHEDULE_CACHE);
         return null;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar cache de designações:", error);
  }
  return null;
}

export function salvarCacheDesignacoes(data: DesignacaoSalva): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SCHEDULE_CACHE, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar cache de designações:", error);
  }
}

export function limparCacheDesignacoes(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_SCHEDULE_CACHE);
  } catch (error) {
    console.error("Erro ao limpar cache de designações:", error);
  }
}


export function carregarTodosCronogramas(): TodosCronogramasSalvos | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_USER_SCHEDULE);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as TodosCronogramasSalvos;
      // Basic validation: check if it's an object (and not an array)
      if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        // Further validation for each entry can be added here if needed
        return parsedData;
      } else {
        console.warn("Dados de cronogramas salvos encontrados, mas com estrutura inválida (esperado objeto, recebido array ou outro). Limpando.");
        localStorage.removeItem(LOCAL_STORAGE_KEY_USER_SCHEDULE);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar todos os cronogramas do localStorage:", error);
  }
  return null; // Return null if not found or error
}

export function salvarTodosCronogramas(cronogramas: TodosCronogramasSalvos): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_SCHEDULE, JSON.stringify(cronogramas));
  } catch (error) {
    console.error("Erro ao salvar todos os cronogramas no localStorage:", error);
  }
}

export function salvarDesignacoesUsuario(designacaoParaSalvar: DesignacaoSalva): void {
  if (typeof window === 'undefined') return;
  try {
    const todosCronogramas = carregarTodosCronogramas() || {};
    const yearMonthKey = `${designacaoParaSalvar.ano}-${String(designacaoParaSalvar.mes + 1).padStart(2, '0')}`;
    todosCronogramas[yearMonthKey] = designacaoParaSalvar; // Salva com status 'rascunho'
    salvarTodosCronogramas(todosCronogramas);
    // O cache principal (LOCAL_STORAGE_KEY_SCHEDULE_CACHE) pode ser atualizado aqui também se desejado,
    // ou deixado para ser carregado a partir de LOCAL_STORAGE_KEY_USER_SCHEDULE na próxima vez.
    // Por consistência com o botão "Finalizar", que limpa o cache, talvez seja melhor não salvar no cache aqui.
    // Ou, se salvar, garantir que o status 'rascunho' seja o correto.
    // Vamos manter o cache atualizado com o que está sendo trabalhado:
    salvarCacheDesignacoes(designacaoParaSalvar);
  } catch (error) {
    console.error("Erro ao salvar designações do usuário:", error);
  }
}

export function limparTodosCronogramasSalvos(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_USER_SCHEDULE);
  } catch (error) {
    console.error("Erro ao limpar todos os cronogramas salvos:", error);
  }
}

export async function carregarTodosCronogramasFirestore(): Promise<TodosCronogramasSalvos | null> {
  const querySnapshot = await getDocs(collection(db, 'schedules'));
  if (querySnapshot.empty) return null;
  const result: TodosCronogramasSalvos = {};
  querySnapshot.docs.forEach(docSnap => {
    result[docSnap.id] = docSnap.data() as DesignacaoSalva;
  });
  return result;
}

export async function salvarTodosCronogramasFirestore(data: TodosCronogramasSalvos): Promise<void> {
  const col = collection(db, 'schedules');
  await Promise.all(
    Object.entries(data).map(([yearMonth, sched]) => setDoc(doc(col, yearMonth), sched))
  );
}

export async function limparTodosCronogramasFirestore(): Promise<void> {
  const col = collection(db, 'schedules');
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}


// Funções para a aba "Reunião Pública"
export function carregarPublicMeetingAssignments(): AllPublicMeetingAssignments | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_PUBLIC_MEETING_ASSIGNMENTS);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as AllPublicMeetingAssignments;
      if (parsedData && typeof parsedData === 'object') {
        return parsedData;
      } else {
         console.warn("Cache de Reunião Pública encontrado, mas com estrutura inválida. Limpando.");
         localStorage.removeItem(LOCAL_STORAGE_KEY_PUBLIC_MEETING_ASSIGNMENTS);
         return null;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar designações da Reunião Pública:", error);
  }
  return null;
}

export function salvarPublicMeetingAssignments(data: AllPublicMeetingAssignments): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PUBLIC_MEETING_ASSIGNMENTS, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar designações da Reunião Pública:", error);
  }
}

export function limparPublicMeetingAssignments(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_PUBLIC_MEETING_ASSIGNMENTS);
  } catch (error) {
    console.error("Erro ao limpar designações da Reunião Pública:", error);
  }
}

export async function carregarPublicMeetingAssignmentsFirestore(): Promise<AllPublicMeetingAssignments | null> {
  const querySnapshot = await getDocs(collection(db, 'public_meetings'));
  if (querySnapshot.empty) return null;
  const result: AllPublicMeetingAssignments = {};
  querySnapshot.docs.forEach(docSnap => {
    result[docSnap.id] = docSnap.data() as { [dateStr: string]: PublicMeetingAssignment };
  });
  return result;
}

export async function salvarPublicMeetingAssignmentsFirestore(data: AllPublicMeetingAssignments): Promise<void> {
  const col = collection(db, 'public_meetings');
  await Promise.all(Object.entries(data).map(([yearMonth, monthData]) => setDoc(doc(col, yearMonth), monthData)));
}

export async function limparPublicMeetingAssignmentsFirestore(): Promise<void> {
  const col = collection(db, 'public_meetings');
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}

// Funções para a aba "NVMC"
export function carregarNVMCAssignments(): AllNVMCAssignments | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_NVMC_ASSIGNMENTS);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as AllNVMCAssignments;
      if (parsedData && typeof parsedData === 'object') {
        return parsedData;
      } else {
         console.warn("Cache de NVMC encontrado, mas com estrutura inválida. Limpando.");
         localStorage.removeItem(LOCAL_STORAGE_KEY_NVMC_ASSIGNMENTS);
         return null;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar designações NVMC:", error);
  }
  return null;
}

export function salvarNVMCAssignments(data: AllNVMCAssignments): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_NVMC_ASSIGNMENTS, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar designações NVMC:", error);
  }
}

export function limparNVMCAssignments(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_NVMC_ASSIGNMENTS);
  } catch (error) {
    console.error("Erro ao limpar designações NVMC:", error);
  }
}

export async function carregarNVMCAssignmentsFirestore(): Promise<AllNVMCAssignments | null> {
  const querySnapshot = await getDocs(collection(db, 'nvmc'));
  if (querySnapshot.empty) return null;
  const result: AllNVMCAssignments = {};
  querySnapshot.docs.forEach(docSnap => {
    result[docSnap.id] = docSnap.data() as { [dateStr: string]: NVMCDailyAssignments };
  });
  return result;
}

export async function salvarNVMCAssignmentsFirestore(data: AllNVMCAssignments): Promise<void> {
  const col = collection(db, 'nvmc');
  await Promise.all(
    Object.entries(data).map(([yearMonth, monthData]) => setDoc(doc(col, yearMonth), monthData))
  );
}

export async function limparNVMCAssignmentsFirestore(): Promise<void> {
  const col = collection(db, 'nvmc');
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}

// Funções para a aba "Serviço de Campo"
export function carregarFieldServiceAssignments(): AllFieldServiceAssignments | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_ASSIGNMENTS);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as AllFieldServiceAssignments;
      if (parsedData && typeof parsedData === 'object') {
        return parsedData;
      } else {
         console.warn("Cache de Serviço de Campo encontrado, mas com estrutura inválida. Limpando.");
         localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_ASSIGNMENTS);
         return null;
      }
    }
  } catch (error) {
    console.error("Erro ao carregar designações do Serviço de Campo:", error);
  }
  return null;
}

export function salvarFieldServiceAssignments(data: AllFieldServiceAssignments): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_ASSIGNMENTS, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar designações do Serviço de Campo:", error);
  }
}

export function limparFieldServiceAssignments(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_ASSIGNMENTS);
  } catch (error) {
    console.error("Erro ao limpar designações do Serviço de Campo:", error);
  }
}

export async function carregarFieldServiceAssignmentsFirestore(): Promise<AllFieldServiceAssignments | null> {
  const querySnapshot = await getDocs(collection(db, 'field_service'));
  if (querySnapshot.empty) return null;
  const result: AllFieldServiceAssignments = {};
  querySnapshot.docs.forEach(docSnap => {
    result[docSnap.id] = docSnap.data() as FieldServiceMonthlyData;
  });
  return result;
}

export async function salvarFieldServiceAssignmentsFirestore(data: AllFieldServiceAssignments): Promise<void> {
  const col = collection(db, 'field_service');
  await Promise.all(
    Object.entries(data).map(([yearMonth, monthData]) => setDoc(doc(col, yearMonth), monthData))
  );
}

export async function limparFieldServiceAssignmentsFirestore(): Promise<void> {
  const col = collection(db, 'field_service');
  const snapshot = await getDocs(col);
  await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
}

// --- Template Semanal do Serviço de Campo ---
export function carregarFieldServiceTemplate(): FieldServiceWeeklyTemplate | null {
  if (typeof window === 'undefined') return null;
  try {
    const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_TEMPLATE);
    if (dadosSalvos) {
      const parsedData = JSON.parse(dadosSalvos) as FieldServiceWeeklyTemplate;
      if (parsedData && typeof parsedData === 'object') {
        return parsedData;
      } else {
        console.warn('Template de Serviço de Campo com estrutura inválida. Limpando.');
        localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_TEMPLATE);
        return null;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar template do Serviço de Campo:', error);
  }
  return null;
}

export function salvarFieldServiceTemplate(data: FieldServiceWeeklyTemplate): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_TEMPLATE, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar template do Serviço de Campo:', error);
  }
}

export function limparFieldServiceTemplate(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_TEMPLATE);
  } catch (error) {
    console.error('Erro ao limpar template do Serviço de Campo:', error);
  }
}

export async function carregarFieldServiceTemplateFirestore(): Promise<FieldServiceWeeklyTemplate | null> {
  const docRef = doc(collection(db, 'field_service_template'), 'weekly');
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as FieldServiceWeeklyTemplate) : null;
}

export async function salvarFieldServiceTemplateFirestore(data: FieldServiceWeeklyTemplate): Promise<void> {
  const docRef = doc(collection(db, 'field_service_template'), 'weekly');
  await setDoc(docRef, data);
}

export async function limparFieldServiceTemplateFirestore(): Promise<void> {
  const docRef = doc(collection(db, 'field_service_template'), 'weekly');
  await deleteDoc(docRef);
}

// Funções para listas gerenciadas do Serviço de Campo (Modalidades e Locais Base)
function carregarManagedList(key: string): ManagedListItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const dadosSalvos = localStorage.getItem(key);
    if (dadosSalvos) {
      const items = JSON.parse(dadosSalvos) as ManagedListItem[];
      if (Array.isArray(items) && items.every(item => item && typeof item.id === 'string' && typeof item.name === 'string')) {
        return items.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        console.warn(`Lista gerenciada em '${key}' com estrutura inválida. Limpando.`);
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error(`Erro ao carregar lista gerenciada de '${key}':`, error);
  }
  return [];
}

function salvarManagedList(key: string, items: ManagedListItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Erro ao salvar lista gerenciada em '${key}':`, error);
  }
}

export function carregarModalidades(): ManagedListItem[] {
  return carregarManagedList(LOCAL_STORAGE_KEY_FIELD_SERVICE_MODALITIES);
}
export function salvarModalidades(items: ManagedListItem[]): void {
  salvarManagedList(LOCAL_STORAGE_KEY_FIELD_SERVICE_MODALITIES, items);
}
export function limparModalidades(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_MODALITIES);
}

export function carregarLocaisBase(): ManagedListItem[] {
  return carregarManagedList(LOCAL_STORAGE_KEY_FIELD_SERVICE_LOCATIONS);
}
export function salvarLocaisBase(items: ManagedListItem[]): void {
  salvarManagedList(LOCAL_STORAGE_KEY_FIELD_SERVICE_LOCATIONS, items);
}
export function limparLocaisBase(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_STORAGE_KEY_FIELD_SERVICE_LOCATIONS);
}
