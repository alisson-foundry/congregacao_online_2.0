'use client';

import React, { useMemo } from 'react';
import type { Membro, DesignacoesFeitas, Designacao, SubstitutionDetails } from '@/lib/congregacao/types';
import { FUNCOES_DESIGNADAS, NOMES_MESES, NOMES_DIAS_SEMANA_ABREV, DIAS_REUNIAO, DIAS_SEMANA_REUNIAO_CORES, GRUPOS_LIMPEZA_APOS_REUNIAO, NONE_GROUP_ID } from '@/lib/congregacao/constants';
import { ScheduleTable } from './ScheduleTable';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatarDataCompleta, getRealFunctionId } from '@/lib/congregacao/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EditableMemberCell } from './EditableMemberCell';

export function prepararDadosTabela(
  designacoesFeitas: DesignacoesFeitas,
  mes: number,
  ano: number,
  tipoTabela: 'Indicadores' | 'Volantes' | 'AV'
): { data: Designacao[], columns: { key: string; label: string }[], fullDateStrings: string[] } {

  let columns: { key: string; label: string }[];
  const dataTabela: Designacao[] = [];
  const datasNoMesComReuniao: Set<string> = new Set();
  const fullDateStrings: string[] = [];

  Object.keys(designacoesFeitas).forEach(dataStr => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return;
    const [yearStr, monthStr, dayStr] = dataStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed
    const day = parseInt(dayStr, 10);

    const dataObj = new Date(year, month, day);

    if (isNaN(dataObj.getTime())) return;

    if (dataObj.getFullYear() === ano && dataObj.getMonth() === mes) {
        const diaSemana = dataObj.getDay();
        if(diaSemana === DIAS_REUNIAO.meioSemana || diaSemana === DIAS_REUNIAO.publica) {
             datasNoMesComReuniao.add(dataStr);
        }
    }
  });

  const sortedDates = Array.from(datasNoMesComReuniao).sort();
  console.log('prepararDadosTabela - sortedDates:', sortedDates);
  sortedDates.forEach(d => fullDateStrings.push(d));

  if (tipoTabela === 'Indicadores') {
    columns = [
      { key: 'data', label: 'Data' },
      { key: 'indicadorExterno', label: 'Indicador Externo' },
      { key: 'indicadorPalco', label: 'Indicador Palco' },
    ];

    sortedDates.forEach(dataStr => {
      const [yearStr, monthStr, dayStr] = dataStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed
      const day = parseInt(dayStr, 10);

      const dataObj = new Date(year, month, day);

      const dia = dataObj.getDate();
      const diaSemanaIndex = dataObj.getDay();

      // Logs for depuração
      console.log('Data (prepararDadosTabela loop): ', dataObj.toISOString());
      console.log('getDay() (prepararDadosTabela loop): ', diaSemanaIndex);
      console.log('Dia da semana esperado (Local) (prepararDadosTabela loop):', dataObj.toLocaleDateString('pt-BR', { weekday: 'long' }));
      console.log('DIAS_REUNIAO.meioSemana (in prepararDadosTabela loop):', DIAS_REUNIAO.meioSemana);
      // Fim dos logs para depuração

      const diaAbrev = NOMES_DIAS_SEMANA_ABREV[diaSemanaIndex];

      let badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.outroDia;
      if (diaSemanaIndex === DIAS_REUNIAO.meioSemana) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.meioSemana;
      else if (diaSemanaIndex === DIAS_REUNIAO.publica) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.publica;

      const row: Designacao = {
        data: `${dia} ${diaAbrev}`,
        diaSemanaBadgeColor: badgeColorClass,
      };

      const designacoesDoDia = designacoesFeitas[dataStr] || {};

      if (diaSemanaIndex === DIAS_REUNIAO.meioSemana) {
        row['indicadorExternoQui'] = designacoesDoDia['indicadorExternoQui'];
        row['indicadorPalcoQui'] = designacoesDoDia['indicadorPalcoQui'];
      } else if (diaSemanaIndex === DIAS_REUNIAO.publica) {
        row['indicadorExternoDom'] = designacoesDoDia['indicadorExternoDom'];
        row['indicadorPalcoDom'] = designacoesDoDia['indicadorPalcoDom'];
      }
      dataTabela.push(row);
    });

      const MAPPED_COL_KEYS_INDICADORES = {
        indicadorExterno: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorExternoQui' : 'indicadorExternoDom',
        indicadorPalco: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorPalcoQui' : 'indicadorPalcoDom',
      }
      const remappedDataIndicadores = dataTabela.map((row, index) => {
        const dataObj = new Date(sortedDates[index] + 'T00:00:00');
        const diaSemanaIndex = dataObj.getDay();
        return {
            ...row,
            indicadorExterno: row[MAPPED_COL_KEYS_INDICADORES.indicadorExterno(diaSemanaIndex)] ?? null,
            indicadorPalco: row[MAPPED_COL_KEYS_INDICADORES.indicadorPalco(diaSemanaIndex)] ?? null,
        }
      });
      return { data: remappedDataIndicadores, columns, fullDateStrings };

  } else if (tipoTabela === 'Volantes') {
    columns = [
      { key: 'data', label: 'Data' },
      { key: 'volante1', label: 'Volante 1' },
      { key: 'volante2', label: 'Volante 2' },
    ];
    const MAPPED_COL_KEYS_VOLANTES = {
      volante1: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'volante1Qui' : 'volante1Dom',
      volante2: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'volante2Qui' : 'volante2Dom',
    };
    const dataTabelaVolantes: Designacao[] = [];
    sortedDates.forEach(dataStr => {
      const [yearStr, monthStr, dayStr] = dataStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed
      const day = parseInt(dayStr, 10);

      const dataObj = new Date(year, month, day);

      const dia = dataObj.getDate();
      const diaSemanaIndex = dataObj.getDay();
      const diaAbrev = NOMES_DIAS_SEMANA_ABREV[diaSemanaIndex];
      let badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.outroDia;
      if (diaSemanaIndex === DIAS_REUNIAO.meioSemana) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.meioSemana;
      else if (diaSemanaIndex === DIAS_REUNIAO.publica) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.publica;

      const designacoesDoDia = designacoesFeitas[dataStr] || {};
      const row: Designacao = { 
        data: `${dia} ${diaAbrev}`, 
        diaSemanaBadgeColor: badgeColorClass,
        volante1: designacoesDoDia[MAPPED_COL_KEYS_VOLANTES.volante1(diaSemanaIndex)] ?? null,
        volante2: designacoesDoDia[MAPPED_COL_KEYS_VOLANTES.volante2(diaSemanaIndex)] ?? null
      };
      dataTabelaVolantes.push(row);
    });
    return { data: dataTabelaVolantes, columns, fullDateStrings };
  } else if (tipoTabela === 'AV') {
    columns = [
      { key: 'data', label: 'Data' },
      { key: 'av', label: 'AV' },
      { key: 'indicadorZoom', label: 'Indicador Zoom' },
    ];
    const MAPPED_COL_KEYS_AV = {
      av: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'avQui' : 'avDom',
      indicadorZoom: (diaSemanaIndex: number) => diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorZoomQui' : 'indicadorZoomDom',
    };
    const dataTabelaAV: Designacao[] = [];
    sortedDates.forEach(dataStr => {
      const [yearStr, monthStr, dayStr] = dataStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed
      const day = parseInt(dayStr, 10);

      const dataObj = new Date(year, month, day);

      const dia = dataObj.getDate();
      const diaSemanaIndex = dataObj.getDay();
      const diaAbrev = NOMES_DIAS_SEMANA_ABREV[diaSemanaIndex];
      let badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.outroDia;
      if (diaSemanaIndex === DIAS_REUNIAO.meioSemana) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.meioSemana;
      else if (diaSemanaIndex === DIAS_REUNIAO.publica) badgeColorClass = DIAS_SEMANA_REUNIAO_CORES.publica;

      const designacoesDoDia = designacoesFeitas[dataStr] || {};
      const row: Designacao = {
        data: `${dia} ${diaAbrev}`,
        diaSemanaBadgeColor: badgeColorClass,
        av: designacoesDoDia[MAPPED_COL_KEYS_AV.av(diaSemanaIndex)] ?? null,
        indicadorZoom: designacoesDoDia[MAPPED_COL_KEYS_AV.indicadorZoom(diaSemanaIndex)] ?? null
      };
      dataTabelaAV.push(row);
    });
    return { data: dataTabelaAV, columns, fullDateStrings };
  }
  return { data: [], columns: [], fullDateStrings: [] };
}

interface ScheduleDisplayProps {
  status: string | null;
  designacoesFeitas: DesignacoesFeitas;
  membros: Membro[];
  mes: number;
  ano: number;
  onOpenSubstitutionModal: (details: SubstitutionDetails) => void;
  onCleaningChange: (dateKey: string, type: 'aposReuniao' | 'semanal', value: string | null) => void;
}

// Helper function to get ISO week number
function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
}

// Procure onde está definido DIAS_REUNIAO - Este log será adicionado fora das funções principais para mostrar o valor importado.
console.log('DIAS_REUNIAO completo (module level):', DIAS_REUNIAO);

export function ScheduleDisplay({
  status,
  designacoesFeitas,
  membros,
  mes,
  ano,
  onOpenSubstitutionModal,
  onCleaningChange,
}: ScheduleDisplayProps) {
  const { toast } = useToast();

  // Use a função externa que tem acesso aos dados corretos
  const dadosIndicadores = prepararDadosTabela(designacoesFeitas, mes, ano, 'Indicadores');
  const dadosVolantes = prepararDadosTabela(designacoesFeitas, mes, ano, 'Volantes');
  const dadosAV = prepararDadosTabela(designacoesFeitas, mes, ano, 'AV');

  const hasAnyMeetingDates = dadosIndicadores.fullDateStrings.length > 0 || dadosVolantes.fullDateStrings.length > 0 || dadosAV.fullDateStrings.length > 0;
  const hasAnyDataForMonth = Object.values(designacoesFeitas).some(dayAssignments =>
    Object.keys(dayAssignments).length > 0 && Object.values(dayAssignments).some(val => val !== null && val !== '' && val !== NONE_GROUP_ID)
  );

  const handleCellClick = (
    date: string,
    columnKey: string,
    memberIdOrNewMemberId: string | null,
    memberName: string | null,
    tableTitle: string,
    finalized: boolean
  ) => {
    if (status === 'finalizado') {
      return; // Do nothing if the schedule is finalized
    }

    // Create date object using year, monthIndex, and day for local time interpretation
    const [year, month, day] = date.split('-').map(Number);
    // Month is 0-indexed in Date constructor, so subtract 1 from the month string.
    const dateObj = new Date(year, month - 1, day);

    // Use getDay() for local day of the week
    const diaSemanaIndex = dateObj.getDay();

    console.log("handleCellClick - Date:", date);
    console.log("handleCellClick - columnKey:", columnKey);
    console.log("handleCellClick - tableTitle:", tableTitle);
    console.log("handleCellClick - diaSemanaIndex (getDay()):", diaSemanaIndex);
    console.log("handleCellClick - DIAS_REUNIAO.meioSemana (inside function):", DIAS_REUNIAO.meioSemana);
    const isMeioSemanaCheck = diaSemanaIndex === DIAS_REUNIAO.meioSemana;
    console.log("handleCellClick - isMeioSemana (check result):", isMeioSemanaCheck);
    console.log("handleCellClick - DIAS_REUNIAO.publica:", DIAS_REUNIAO.publica);

    let functionId: string;
    // Directly map columnKey and local Day index to the correct functionId
    if (tableTitle === 'Indicadores') {
      if (columnKey === 'indicadorExterno') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorExternoQui' : 'indicadorExternoDom';
      } else if (columnKey === 'indicadorPalco') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorPalcoQui' : 'indicadorPalcoDom';
      } else {
        return;
      }
    } else if (tableTitle === 'Volantes') {
      if (columnKey === 'volante1') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'volante1Qui' : 'volante1Dom';
      } else if (columnKey === 'volante2') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'volante2Qui' : 'volante2Dom';
      } else {
        return;
      }
    } else if (tableTitle === 'AV') {
      if (columnKey === 'av') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'avQui' : 'avDom';
      } else if (columnKey === 'indicadorZoom') {
        functionId = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? 'indicadorZoomQui' : 'indicadorZoomDom';
      } else {
        return;
      }
    } else {
      return;
    }

    const details: SubstitutionDetails = {
      date: date,
      functionId: functionId,
      originalMemberId: memberIdOrNewMemberId,
      originalMemberName: memberName || 'Membro',
      tableTitle: tableTitle,
      currentFunctionGroupId: tableTitle as any,
    };
    onOpenSubstitutionModal(details);
  };

  const meetingDatesForCleaning = useMemo(() => {
    const dates: Date[] = [];
    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);

    for (let d = new Date(primeiroDiaDoMes); d <= ultimoDiaDoMes; d.setDate(d.getDate() + 1)) {
      const diaSemana = d.getDay();
      if (diaSemana === DIAS_REUNIAO.meioSemana || diaSemana === DIAS_REUNIAO.publica) {
        dates.push(new Date(d));
      }
    }
    return dates;
  }, [mes, ano]);

  const weeksForCleaning = useMemo(() => {
    const weeks: { dateKey: string; weekLabel: string }[] = [];
    const primeiroDiaDoMes = new Date(ano, mes, 1);
    const ultimoDiaDoMes = new Date(ano, mes + 1, 0);

    // Encontra a primeira segunda-feira do mês
    let primeiraSegunda = new Date(primeiroDiaDoMes);
    while (primeiraSegunda.getDay() !== 1) {
      primeiraSegunda.setDate(primeiraSegunda.getDate() + 1);
    }

    // Se a primeira segunda-feira for depois do dia 7, vamos para a segunda-feira anterior
    if (primeiraSegunda.getDate() > 7) {
      primeiraSegunda.setDate(primeiraSegunda.getDate() - 7);
    }

    // Gera as semanas a partir da primeira segunda-feira
    for (let d = new Date(primeiraSegunda); d <= ultimoDiaDoMes; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(d.getDate() + 6);

      // Only add the week if its start date (Monday) is in the current mês
      if (weekStart.getMonth() === mes) {
        weeks.push({
          dateKey: formatarDataCompleta(weekStart),
          weekLabel: `${weekStart.getDate().toString().padStart(2, '0')}/${(weekStart.getMonth() + 1).toString().padStart(2, '0')} - ${weekEnd.getDate().toString().padStart(2, '0')}/${(weekEnd.getMonth() + 1).toString().padStart(2, '0')}`
        });
      }
    }
    return weeks;
  }, [mes, ano]);

  if (!hasAnyMeetingDates) {
    return <p className="text-muted-foreground text-center py-4">Nenhuma data de reunião para {NOMES_MESES[mes]} de {ano}.</p>;
  }

  return (
    <div className="space-y-6">
      {hasAnyMeetingDates && (
        <>
          <ScheduleTable
            title="Indicadores"
            data={dadosIndicadores.data}
            columns={dadosIndicadores.columns}
            allMembers={membros}
            onCellClick={handleCellClick}
            currentFullDateStrings={dadosIndicadores.fullDateStrings}
            isReadOnly={status === 'finalizado'}
          />

          <ScheduleTable
            title="Volantes"
            data={dadosVolantes.data}
            columns={dadosVolantes.columns}
            allMembers={membros}
            onCellClick={handleCellClick}
            currentFullDateStrings={dadosVolantes.fullDateStrings}
            isReadOnly={status === 'finalizado'}
          />

          <ScheduleTable
            title="AV"
            data={dadosAV.data}
            columns={dadosAV.columns}
            allMembers={membros}
            onCellClick={handleCellClick}
            currentFullDateStrings={dadosAV.fullDateStrings}
            isReadOnly={status === 'finalizado'}
          />
        </>
      )}

      {/* Seção de Limpeza - Ajustada para layout similar */}
      <Card className="flex-1 min-w-[300px]">
        <CardHeader>
          <CardTitle className="text-lg">Limpeza</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Limpeza Após a Reunião */}
            <div className="flex-1 space-y-3 min-w-[280px]">
              <h4 className="font-medium text-md text-foreground">Limpeza Após a Reunião</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {meetingDatesForCleaning.map(dateObj => {
                  const dateStr = formatarDataCompleta(dateObj);
                  const dia = dateObj.getDate();
                  const diaSemanaIndex = dateObj.getDay();
                  const diaAbrev = NOMES_DIAS_SEMANA_ABREV[diaSemanaIndex];
                  const badgeColorClass = diaSemanaIndex === DIAS_REUNIAO.meioSemana ? DIAS_SEMANA_REUNIAO_CORES.meioSemana : DIAS_SEMANA_REUNIAO_CORES.publica;
                  const currentGroupId = designacoesFeitas[dateStr]?.limpezaAposReuniaoGrupoId;

                  return (
                    <div key={dateStr} className="flex items-center gap-3">
                      <div className="flex items-center space-x-2 w-24">
                         <span>{dia.toString().padStart(2,'0')}</span>
                         <Badge variant="outline" className={badgeColorClass}>{diaAbrev}</Badge>
                      </div>
                      <Select
                        value={currentGroupId ?? NONE_GROUP_ID}
                        onValueChange={(value) => onCleaningChange(dateStr, 'aposReuniao', value === NONE_GROUP_ID ? null : value)}
                        disabled={status === 'finalizado'}
                      >
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRUPOS_LIMPEZA_APOS_REUNIAO.map(grupo => (
                            <SelectItem key={grupo.id} value={grupo.id}>{grupo.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Limpeza Semanal */}
            <div className="flex-1 space-y-3 min-w-[280px]">
              <h4 className="font-medium text-md text-foreground">Limpeza Semanal</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {weeksForCleaning.map(week => {
                  const currentResponsavel = designacoesFeitas[week.dateKey]?.limpezaSemanalResponsavel || '';
                  return (
                    <div key={week.dateKey} className="flex items-center gap-3">
                      <Label htmlFor={`limpeza-semanal-${week.dateKey}`} className="w-32 text-sm">{week.weekLabel}</Label>
                      <Input
                        id={`limpeza-semanal-${week.dateKey}`}
                        value={currentResponsavel}
                        onChange={(e) => onCleaningChange(week.dateKey, 'semanal', e.target.value)}
                        placeholder="Responsáveis"
                        disabled={status === 'finalizado'}
                        className="flex-1 h-9 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
