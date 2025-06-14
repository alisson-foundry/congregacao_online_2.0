'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Membro, DesignacoesFeitas, DesignacaoSalva, TodosCronogramasSalvos } from '@/lib/congregacao/types';
import {
  carregarCacheDesignacoes,
  salvarCacheDesignacoes,
  limparCacheDesignacoes as limparStorageCacheDesignacoes,
  salvarTodosCronogramas,
  carregarTodosCronogramas,
  salvarDesignacoesUsuario,
  carregarTodosCronogramasFirestore,
  salvarTodosCronogramasFirestore
} from '@/lib/congregacao/storage';
import { calcularDesignacoesAction } from '@/lib/congregacao/assignment-logic';
import { FUNCOES_DESIGNADAS } from '@/lib/congregacao/constants';

interface UseScheduleManagementProps {
  membros: Membro[];
  updateMemberHistory: (updatedMembers: Membro[]) => void;
}

interface ScheduleState {
  designacoes: DesignacoesFeitas | null;
  mes: number | null;
  ano: number | null;
  status: 'rascunho' | 'finalizado' | null;
}

export function useScheduleManagement({ membros, updateMemberHistory }: UseScheduleManagementProps) {
  const [scheduleState, setScheduleState] = useState<ScheduleState>({
    designacoes: null,
    mes: null,
    ano: null,
    status: null,
  });

  useEffect(() => {
    const cached = carregarCacheDesignacoes();
    if (cached) {
      setScheduleState({ designacoes: cached.schedule, mes: cached.mes, ano: cached.ano, status: cached.status });
    }
    // Não carrega mais 'carregarDesignacoesUsuario' aqui. Usuário pode carregar explicitamente.
  }, []);

  const persistScheduleToStateAndCache = useCallback((newSchedule: DesignacoesFeitas | null, newMes: number | null, newAno: number | null, newStatus: 'rascunho' | 'finalizado' | null) => {
    console.log('persistScheduleToStateAndCache called with:', { newSchedule, newMes, newAno, newStatus });
    setScheduleState({ designacoes: newSchedule, mes: newMes, ano: newAno, status: newStatus });
    if (newSchedule && newMes !== null && newAno !== null && newStatus) {
      salvarCacheDesignacoes({ schedule: newSchedule, mes: newMes, ano: newAno, status: newStatus });
    } else {
      limparStorageCacheDesignacoes();
    }
  }, []);

  const internalUpdateMemberHistoryForMonth = useCallback((
    currentScheduleForMonth: DesignacoesFeitas,
    scheduleMes: number,
    scheduleAno: number,
    tabela?: 'Indicadores' | 'Volantes' | 'AV'
  ) => {
    const relevantFunctions = tabela ? FUNCOES_DESIGNADAS.filter(f => f.tabela === tabela).map(f => f.id) : FUNCOES_DESIGNADAS.filter(f => !f.id.startsWith("av") && !f.id.startsWith("limpeza")).map(f => f.id);
    const membrosComHistoricoAtualizado = [...membros].map(m => {
      const membroModificado = { ...m, historicoDesignacoes: { ...m.historicoDesignacoes } };
      Object.keys(membroModificado.historicoDesignacoes).forEach(histDateStr => {
        const histDateObj = new Date(histDateStr);
        if (histDateObj.getFullYear() === scheduleAno && histDateObj.getMonth() === scheduleMes) {
          const funcaoIdNoHistorico = membroModificado.historicoDesignacoes[histDateStr];
          if (relevantFunctions.includes(funcaoIdNoHistorico)) {
             delete membroModificado.historicoDesignacoes[histDateStr];
          }
        }
      });
      Object.entries(currentScheduleForMonth).forEach(([dateStr, funcoesDoDia]) => {
        const dataObj = new Date(dateStr);
        if (dataObj.getFullYear() === scheduleAno && dataObj.getMonth() === scheduleMes) {
          Object.entries(funcoesDoDia).forEach(([funcaoId, membroId]) => {
            if (membroId === m.id) {
              if (relevantFunctions.includes(funcaoId)) {
                membroModificado.historicoDesignacoes[dateStr] = funcaoId;
              }
            }
          });
        }
      });
      return membroModificado;
    });
    updateMemberHistory(membrosComHistoricoAtualizado);
  }, [membros, updateMemberHistory]);


  const generateNewSchedule = useCallback(
    async (
      mes: number,
      ano: number,
      tabela: 'Indicadores' | 'Volantes' | 'AV'
    ): Promise<{ success: boolean; error?: string; generatedSchedule?: DesignacoesFeitas }> => {
    const result = await calcularDesignacoesAction(mes, ano, membros, tabela);
    if ('error' in result) {
      return { success: false, error: result.error };
    }

    const newAssignments = result.designacoesFeitas;
    const mergedSchedule: DesignacoesFeitas = scheduleState.designacoes && scheduleState.mes === mes && scheduleState.ano === ano
      ? JSON.parse(JSON.stringify(scheduleState.designacoes))
      : {};

    const relevantFunctions = FUNCOES_DESIGNADAS.filter(f => f.tabela === tabela).map(f => f.id);
    Object.entries(newAssignments).forEach(([dateStr, assignments]) => {
      if (!mergedSchedule[dateStr]) mergedSchedule[dateStr] = { ...scheduleState.designacoes?.[dateStr] } as any;
      Object.entries(assignments).forEach(([funcId, memberId]) => {
        if (relevantFunctions.includes(funcId)) {
          mergedSchedule[dateStr][funcId] = memberId;
        }
      });
    });

    persistScheduleToStateAndCache(mergedSchedule, mes, ano, 'rascunho');
    if (tabela !== 'AV') {
      internalUpdateMemberHistoryForMonth(newAssignments, mes, ano, tabela);
    }

    return { success: true, generatedSchedule: mergedSchedule };
  }, [membros, scheduleState, persistScheduleToStateAndCache, internalUpdateMemberHistoryForMonth]);

  const confirmManualAssignmentOrSubstitution = useCallback((
    date: string,
    functionId: string,
    newMemberId: string | null,
    originalMemberId: string | null,
    currentScheduleData: DesignacoesFeitas,
    currentMesValue: number,
    currentAnoValue: number
  ) => {
    console.log('useScheduleManagement - confirmManualAssignmentOrSubstitution called with:', { date, functionId, newMemberId, originalMemberId, currentMesValue, currentAnoValue });
    console.log('useScheduleManagement - Confirming manual assignment/substitution:', { date, functionId, newMemberId, originalMemberId });
    const updatedSchedule = JSON.parse(JSON.stringify(currentScheduleData)) as DesignacoesFeitas;
    console.log('useScheduleManagement - updatedSchedule BEFORE assignment:', updatedSchedule);
    if (!updatedSchedule[date]) {
      updatedSchedule[date] = {};
    }
    updatedSchedule[date][functionId] = newMemberId;

    console.log('useScheduleManagement - updatedSchedule AFTER assignment:', updatedSchedule);

    // Mantém o status atual ao fazer uma substituição/designação manual.
    // Se o cronograma era 'finalizado', ele continua 'finalizado' mas com a alteração.
    // Se era 'rascunho', continua 'rascunho'.
    const currentStatus = scheduleState.status || 'rascunho'; 
    console.log('useScheduleManagement - Calling persistScheduleToStateAndCache with:', { updatedSchedule, currentMesValue, currentAnoValue, currentStatus });
    persistScheduleToStateAndCache(updatedSchedule, currentMesValue, currentAnoValue, currentStatus);

    const membrosComHistoricoAtualizado = [...membros].map(m => {
      const membroModificado = { ...m, historicoDesignacoes: { ...m.historicoDesignacoes } };
      if (originalMemberId && m.id === originalMemberId && membroModificado.historicoDesignacoes[date] === functionId) {
        delete membroModificado.historicoDesignacoes[date];
      }
      if (newMemberId && m.id === newMemberId && !functionId.startsWith('av') && !functionId.startsWith('limpeza')) {
        membroModificado.historicoDesignacoes[date] = functionId;
      }
      return membroModificado;
    });
    updateMemberHistory(membrosComHistoricoAtualizado);

  }, [membros, persistScheduleToStateAndCache, updateMemberHistory, scheduleState.status]);


  const updateLimpezaAssignment = useCallback((
    dateKey: string,
    type: 'aposReuniao' | 'semanal',
    value: string | null
  ) => {
    const currentStatus = scheduleState.status || 'rascunho';
    if (!scheduleState.designacoes || scheduleState.mes === null || scheduleState.ano === null) {
      const mesAtual = scheduleState.mes ?? new Date().getMonth();
      const anoAtual = scheduleState.ano ?? new Date().getFullYear();
      const novoSchedule: DesignacoesFeitas = {};
      if (!novoSchedule[dateKey]) novoSchedule[dateKey] = {};

      if (type === 'aposReuniao') {
        novoSchedule[dateKey].limpezaAposReuniaoGrupoId = value;
      } else {
        novoSchedule[dateKey].limpezaSemanalResponsavel = value || '';
      }
      persistScheduleToStateAndCache(novoSchedule, mesAtual, anoAtual, currentStatus);
      return;
    }

    const updatedSchedule = JSON.parse(JSON.stringify(scheduleState.designacoes)) as DesignacoesFeitas;
    if (!updatedSchedule[dateKey]) {
      updatedSchedule[dateKey] = {};
    }
    if (type === 'aposReuniao') {
      updatedSchedule[dateKey].limpezaAposReuniaoGrupoId = value;
    } else {
      updatedSchedule[dateKey].limpezaSemanalResponsavel = value || '';
    }
    persistScheduleToStateAndCache(updatedSchedule, scheduleState.mes, scheduleState.ano, currentStatus);
  }, [scheduleState, persistScheduleToStateAndCache]);

  const clearMainScheduleAndCache = useCallback(() => {
    persistScheduleToStateAndCache(null, null, null, null);
  }, [persistScheduleToStateAndCache]);

  const clearScheduleForMonth = useCallback((mesToClear: number, anoToClear: number): boolean => {
    console.log(`Attempting to clear schedule for ${mesToClear}/${anoToClear}`);
    const todosOsCronogramas = carregarTodosCronogramas() || {};
    const yearMonthKey = `${anoToClear}-${String(mesToClear + 1).padStart(2, '0')}`;

    if (todosOsCronogramas[yearMonthKey]) {
      delete todosOsCronogramas[yearMonthKey];
      salvarTodosCronogramas(todosOsCronogramas);
      salvarTodosCronogramasFirestore(todosOsCronogramas).catch(err =>
        console.error('Erro ao atualizar cronogramas no Firestore ao limpar mês:', err)
      );
      console.log(`Schedule for ${yearMonthKey} cleared successfully.`);

      // Se o mês e ano limpado for o que está atualmente no estado/cache, também limpamos o estado/cache
      if (scheduleState.mes === mesToClear && scheduleState.ano === anoToClear) {
        persistScheduleToStateAndCache(null, null, null, null);
      }
      return true;
    } else {
      console.log(`No schedule found for ${yearMonthKey} to clear.`);
      // Se o mês e ano limpado for o que está atualmente no estado/cache (mas não encontrado nos salvos), limpamos o estado/cache
       if (scheduleState.mes === mesToClear && scheduleState.ano === anoToClear) {
        persistScheduleToStateAndCache(null, null, null, null);
      }
      return false; // Indica que não havia dados para limpar para aquele mês
    }
  }, [persistScheduleToStateAndCache, scheduleState.mes, scheduleState.ano]);

  const salvarDesignacoes = useCallback(() => {
    if (scheduleState.designacoes && scheduleState.mes !== null && scheduleState.ano !== null) {
      salvarDesignacoesUsuario({
        schedule: scheduleState.designacoes,
        mes: scheduleState.mes,
        ano: scheduleState.ano,
        status: 'rascunho',
      });
      // Atualiza também o estado local e o cache para refletir o status 'rascunho'
      persistScheduleToStateAndCache(scheduleState.designacoes, scheduleState.mes, scheduleState.ano, 'rascunho');
      const todos = carregarTodosCronogramas();
      if (todos) {
        salvarTodosCronogramasFirestore(todos).catch(err =>
          console.error('Erro ao salvar cronogramas no Firestore:', err)
        );
      }
      return { success: true };
    } else {
      return { success: false, error: "Nenhuma designação gerada para salvar." };
    }
  }, [scheduleState, persistScheduleToStateAndCache]);

  const finalizarCronograma = useCallback((): { success: boolean; error?: string } => {
    if (!scheduleState.designacoes || scheduleState.mes === null || scheduleState.ano === null) {
      return { success: false, error: "Nenhum cronograma carregado para finalizar." };
    }
  
    for (const date in scheduleState.designacoes) {
      const assignmentsForDay = scheduleState.designacoes[date];
      for (const functionId in assignmentsForDay) {
        if (functionId !== 'limpezaAposReuniaoGrupoId' && functionId !== 'limpezaSemanalResponsavel') {
           const assignedMemberId = assignmentsForDay[functionId];
           if (assignedMemberId === null || assignedMemberId === '') {
             return { success: false, error: "Existem designações em branco. Preencha todas as designações antes de finalizar." };
           }
        }
      }
    }
  
    const todosOsCronogramas = carregarTodosCronogramas() || {};
    const yearMonthKey = `${scheduleState.ano}-${String(scheduleState.mes + 1).padStart(2, '0')}`;
  
    todosOsCronogramas[yearMonthKey] = {
        schedule: scheduleState.designacoes,
        mes: scheduleState.mes,
        ano: scheduleState.ano,
        status: 'finalizado',
    };
    salvarTodosCronogramas(todosOsCronogramas);
    salvarTodosCronogramasFirestore(todosOsCronogramas).catch(err =>
      console.error('Erro ao salvar cronogramas finalizados no Firestore:', err)
    );
    
    // O cache deve refletir o estado finalizado
    persistScheduleToStateAndCache(scheduleState.designacoes, scheduleState.mes, scheduleState.ano, 'finalizado');
    // limparStorageCacheDesignacoes(); // Não limpar o cache, mas sim atualizá-lo para 'finalizado'
    
    return { success: true };
  }, [scheduleState, persistScheduleToStateAndCache]);

  const carregarDesignacoes = useCallback(async (mes: number, ano: number) => {
    console.log('Carregando designações para', { mes, ano });
    try {
      const firestoreData = await carregarTodosCronogramasFirestore();
      const allSchedules = firestoreData || carregarTodosCronogramas();
      const yearMonthKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;
      const saved = allSchedules ? allSchedules[yearMonthKey] : null;

      console.log('Dados salvos encontrados no cache/Firestore para', yearMonthKey, ':', saved);

      if (saved) {
        persistScheduleToStateAndCache(saved.schedule, saved.mes, saved.ano, saved.status);
      } else {
        persistScheduleToStateAndCache(null, mes, ano, null);
      }
    } catch (err) {
      console.error('Erro ao carregar cronogramas do Firestore:', err);
      const allSchedules = carregarTodosCronogramas();
      const yearMonthKey = `${ano}-${String(mes + 1).padStart(2, '0')}`;
      const saved = allSchedules ? allSchedules[yearMonthKey] : null;
      if (saved) {
        persistScheduleToStateAndCache(saved.schedule, saved.mes, saved.ano, saved.status);
      } else {
        persistScheduleToStateAndCache(null, mes, ano, null);
      }
    }
  }, [persistScheduleToStateAndCache]);

  return {
    scheduleData: scheduleState.designacoes,
    scheduleMes: scheduleState.mes,
    scheduleAno: scheduleState.ano,
    status: scheduleState.status,
    generateNewSchedule,
    confirmManualAssignmentOrSubstitution,
    updateLimpezaAssignment,
    clearMainScheduleAndCache,
    clearScheduleForMonth,
    salvarDesignacoes,
    finalizarCronograma, // Exportar a função de finalizar
    carregarDesignacoes,
  };
}
