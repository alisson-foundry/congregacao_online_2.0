'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { NOMES_MESES, FUNCOES_DESIGNADAS, DIAS_REUNIAO, NONE_GROUP_ID } from '@/lib/congregacao/constants';
import type { DesignacoesFeitas, FuncaoDesignada, Membro, SubstitutionDetails } from '@/lib/congregacao/types';
import { ScheduleDisplay } from './ScheduleDisplay';
import { MemberSelectionDialog } from './MemberSelectionDialog';
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Loader2, UserPlus, Info } from 'lucide-react';
import { getPermissaoRequerida, formatarDataCompleta } from '@/lib/congregacao/utils';
import { generateMainSchedulePDF } from '@/lib/congregacao/pdf-generator';
import { ConfirmClearDialog } from './ConfirmClearDialog';

interface AVSelectionContext {
  dateStr: string;
  functionId: string;
  columnKey: string;
  currentMemberId: string | null;
  requiredPermissionId: string | null | undefined;
}

interface ScheduleGenerationCardProps {
  membros: Membro[];
  onScheduleGenerated: (mes: number, ano: number) => Promise<{ success: boolean; error?: string; generatedSchedule?: DesignacoesFeitas }>;
  currentSchedule: DesignacoesFeitas | null;
  currentMes: number | null;
  currentAno: number | null;
  status: string | null;
  onFinalizeSchedule: () => Promise<{ success: boolean; error?: string }>;
  onSaveProgress: () => void;
  onOpenSubstitutionModal: (details: SubstitutionDetails) => void;
  onLimpezaChange: (dateKey: string, type: 'aposReuniao' | 'semanal', value: string | null) => void;
  onMonthYearChangeRequest: (mes: number, ano: number) => void;
  onClearScheduleForMonth: (mes: number, ano: number) => void;
}

export function ScheduleGenerationCard({
  membros,
  onScheduleGenerated,
  currentSchedule,
  currentMes,
  currentAno,
  status,
  onFinalizeSchedule,
  onSaveProgress,
  onOpenSubstitutionModal,
  onLimpezaChange,
  onMonthYearChangeRequest,
  onClearScheduleForMonth,
}: ScheduleGenerationCardProps) {
  const [selectedMes, setSelectedMes] = useState<string>(currentMes !== null ? currentMes.toString() : new Date().getMonth().toString());
  const [selectedAno, setSelectedAno] = useState<string>(currentAno !== null ? currentAno.toString() : new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentMes !== null && currentAno !== null) {
      setSelectedMes(currentMes.toString());
      setSelectedAno(currentAno.toString());
    }
    setError(null);
  }, [currentMes, currentAno]);

  const handleExportPDF = async () => {
    if (!currentSchedule || currentMes === null || currentAno === null || !membros) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Dados insuficientes para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Chamar a função de geração de PDF
      await generateMainSchedulePDF(currentSchedule, currentMes, currentAno, membros);
      toast({
        title: "PDF gerado com sucesso!",
        description: `O arquivo designacoes_${NOMES_MESES[currentMes].toLowerCase()}_${currentAno}.pdf foi baixado.`, // Nome do arquivo deve bater com o do pdf-generator
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao tentar gerar o PDF.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allRequiredFieldsFilled = useMemo(() => {
    if (!currentSchedule || status !== 'rascunho' || currentMes === null || currentAno === null) {
      return false;
    }
  
    const localDIAS_REUNIAO = {
      meioSemana: DIAS_REUNIAO.meioSemana,
      publica: DIAS_REUNIAO.publica,
    };
  
    const datasDeReuniaoNoMes: string[] = [];
    const primeiroDiaDoMes = new Date(Date.UTC(currentAno, currentMes, 1));
    const ultimoDiaDoMes = new Date(Date.UTC(currentAno, currentMes + 1, 0));
  
    for (let d = new Date(primeiroDiaDoMes); d <= ultimoDiaDoMes; d.setUTCDate(d.getUTCDate() + 1)) {
      const diaSemana = d.getUTCDay();
      if (diaSemana === localDIAS_REUNIAO.meioSemana || diaSemana === localDIAS_REUNIAO.publica) {
        datasDeReuniaoNoMes.push(formatarDataCompleta(d));
      }
    }
  
    // 1. Checar todas as funções (Indicadores, Volantes, AV) para cada dia de reunião
    for (const dateStr of datasDeReuniaoNoMes) {
      const assignmentsForDay = currentSchedule[dateStr];
      if (!assignmentsForDay) return false; 
  
      const dataObj = new Date(dateStr + "T00:00:00Z");
      const tipoReuniao = dataObj.getUTCDay() === localDIAS_REUNIAO.meioSemana ? 'meioSemana' : 'publica';
  
      const funcoesDoDia = FUNCOES_DESIGNADAS.filter(f => f.tipoReuniao.includes(tipoReuniao));
      for (const funcao of funcoesDoDia) {
        if (!assignmentsForDay[funcao.id]) { 
          return false;
        }
      }
  
      // 2. Checar limpeza após reunião para cada dia de reunião
      if (!assignmentsForDay.limpezaAposReuniaoGrupoId || assignmentsForDay.limpezaAposReuniaoGrupoId === NONE_GROUP_ID) {
        return false;
      }
    }
  
    // 3. Checar limpeza semanal para cada semana que tem reunião
    const weeksComReuniao = new Set<string>();
    datasDeReuniaoNoMes.forEach(dateStr => {
      const dataObj = new Date(dateStr + "T00:00:00Z");
      const domingoDaSemana = new Date(dataObj);
      domingoDaSemana.setUTCDate(dataObj.getUTCDate() - dataObj.getUTCDay());
      weeksComReuniao.add(formatarDataCompleta(domingoDaSemana));
    });
  
    for (const weekKey of Array.from(weeksComReuniao)) {
      const weeklyData = currentSchedule?.[weekKey];
      const responsavelSemanal: string | null = weeklyData?.limpezaSemanalResponsavel ?? null;
      if (!weeklyData || responsavelSemanal === null || responsavelSemanal.trim() === '') {
          return false;
      }
    }
  
    return true;
  }, [currentSchedule, status, currentMes, currentAno]);

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[DIAGNÓSTICO] Chamando onScheduleGenerated para mês:', selectedMes, 'ano:', selectedAno);
      const result = await onScheduleGenerated(parseInt(selectedMes, 10), parseInt(selectedAno, 10));
      console.log('[DIAGNÓSTICO] Resultado de onScheduleGenerated:', result);
      if (result.success) {
        console.log('[DIAGNÓSTICO] Estado atualizado com schedule:', result.generatedSchedule);
      } else {
        setError(result.error || 'Erro ao gerar designações.');
        console.log('[DIAGNÓSTICO] Erro ao gerar designações:', result.error);
      }
    } catch (err) {
      setError('Erro inesperado ao gerar designações.');
      console.error('[DIAGNÓSTICO] Exceção ao gerar designações:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYearValue = new Date().getFullYear();
  const yearsForSelect = Array.from({ length: 5 }, (_, i) => currentYearValue - 2 + i);

  // State for the confirmation dialog
  const [isConfirmClearDialogOpen, setIsConfirmClearDialogOpen] = useState(false);

  const handleClearMonthClick = () => {
    if (currentMes !== null && currentAno !== null) {
       setIsConfirmClearDialogOpen(true);
    } else {
       toast({
        title: "Atenção",
        description: "Selecione um mês e ano antes de limpar os dados.",
        variant: "default",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Selecione o mês e ano para gerar o cronograma de designações. As designações de Limpeza são manuais/editáveis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-end">
          <div className="flex-1">
            <Label htmlFor="selectMes">Mês</Label>
            <Select
              value={selectedMes}
              onValueChange={(value) => {
                const newMes = parseInt(value, 10);
                setSelectedMes(value);
                if (currentAno !== null) {
                    onMonthYearChangeRequest(newMes, parseInt(selectedAno, 10));
                }
              }}
            >
              <SelectTrigger id="selectMes">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {NOMES_MESES.map((nome, index) => (
                  <SelectItem key={index} value={index.toString()}>{nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label htmlFor="inputAno">Ano</Label>
             <Select
                value={selectedAno}
                onValueChange={(value) => {
                  const newAno = parseInt(value, 10);
                  setSelectedAno(value);
                   if (currentMes !== null) {
                    onMonthYearChangeRequest(parseInt(selectedMes, 10), newAno);
                  }
                }}
              >
                <SelectTrigger id="inputAno">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    {yearsForSelect.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleExportPDF}
            disabled={isLoading || !currentSchedule || currentMes === null || currentAno === null || membros.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Gerar PDF'}
          </Button>
           <Button
             onClick={handleGenerateSchedule}
             disabled={isLoading || status === 'rascunho' || status === 'finalizado'}
             className="w-full sm:w-auto"
           >
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Gerar Cronograma (Indicadores/Volantes/AV)'}
           </Button>
           {/* New Clear Month Button */}
           
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {status === 'rascunho' && currentSchedule && currentMes !== null && (
          <div className="mb-4 p-3 rounded-md bg-blue-100 text-blue-700 flex items-center text-sm">
            <Info className="h-5 w-5 mr-2" />
            <p>Um rascunho para {NOMES_MESES[currentMes]} de {currentAno} está carregado. Você pode continuar editando ou finalizar.</p>
          </div>
        )}
        {status === 'finalizado' && currentSchedule && currentMes !== null && (
          <div className="mb-4 p-3 rounded-md bg-green-100 text-green-700 flex items-center text-sm">
            <Info className="h-5 w-5 mr-2" />
            <p>O cronograma finalizado para {NOMES_MESES[currentMes]} de {currentAno} está carregado. Para editar, será necessário criar um novo rascunho (gerando novamente).</p>
          </div>
        )}


        <div id="resultadoDesignacoes" className="mt-6">
          {isLoading && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">{isLoading ? "Gerando designações, por favor aguarde..." : "Gerando PDF, por favor aguarde..."}</p>
            </div>
          )}
          {!isLoading && currentSchedule && currentMes !== null && currentAno !== null && (
            <>
              <h3 className="text-xl font-semibold mb-4 text-center text-foreground">
                Designações para {NOMES_MESES[currentMes]} de {currentAno}
              </h3>
              <ScheduleDisplay
                status={status}
                designacoesFeitas={currentSchedule}
                membros={membros}
                mes={currentMes}
                ano={currentAno}
                onOpenSubstitutionModal={onOpenSubstitutionModal}
                onCleaningChange={onLimpezaChange}
              />
               {status === 'rascunho' && (
                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={onSaveProgress} disabled={!currentSchedule || isLoading}>
                    Salvar Progresso
                  </Button>
                  <Button onClick={onFinalizeSchedule} disabled={!currentSchedule || isLoading || !allRequiredFieldsFilled}>
                    Finalizar e Salvar Mês
                  </Button>
                </div>
              )}
            </>
          )}
          {!isLoading && !currentSchedule && !error && !status && (
             <p className="text-muted-foreground text-center py-4">
              Nenhum cronograma carregado. Selecione o mês e ano e clique em &quot;Gerar Cronograma&quot; para iniciar.
            </p>
          )}
        </div>
      </CardContent>
      {status && <p className="text-sm text-center text-muted-foreground mt-4">Status: {status === 'rascunho' ? 'Rascunho' : 'Finalizado'}</p>}

      {/* Add the ConfirmClearDialog */}
      {/* Removed from here as functionality moved to Configurations page */}
      
    </Card>
  );
}

