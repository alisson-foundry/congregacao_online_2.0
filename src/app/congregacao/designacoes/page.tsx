'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMemberManagement } from '@/hooks/congregacao/useMemberManagement';
import { useScheduleManagement } from '@/hooks/congregacao/useScheduleManagement';
import { usePublicMeetingAssignments } from '@/hooks/congregacao/usePublicMeetingAssignments';
import { ScheduleGenerationCard } from '@/components/congregacao/ScheduleGenerationCard';
import { PublicMeetingAssignmentsCard } from '@/components/congregacao/PublicMeetingAssignmentsCard';
import { NvmcAssignmentsCard } from '@/components/congregacao/NvmcAssignmentsCard';
import { FieldServiceAssignmentsCard } from '@/components/congregacao/FieldServiceAssignmentsCard';
import { SubstitutionDialog } from '@/components/congregacao/SubstitutionDialog';
import type { Membro, DesignacoesFeitas, SubstitutionDetails, AllNVMCAssignments, NVMCDailyAssignments, AllFieldServiceAssignments, FieldServiceMonthlyData } from '@/lib/congregacao/types';
import { APP_NAME, NOMES_MESES, DIAS_REUNIAO } from '@/lib/congregacao/constants';
import { 
  carregarNVMCAssignments,
  salvarNVMCAssignments,
  limparNVMCAssignments as limparStorageNVMCAssignments,
  carregarFieldServiceAssignments,
  salvarFieldServiceAssignments,
  limparFieldServiceAssignments as limparStorageFieldServiceAssignments,
  carregarNVMCAssignmentsFirestore,
  salvarNVMCAssignmentsFirestore,
  carregarFieldServiceAssignmentsFirestore,
  salvarFieldServiceAssignmentsFirestore
} from '@/lib/congregacao/storage';
import { formatarDataParaChave, getRealFunctionId } from '@/lib/congregacao/utils';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListChecks, BookOpen, BookUser, ClipboardList } from 'lucide-react';

export default function DesignacoesPage() {
  const {
    membros,
    updateMemberHistory,
  } = useMemberManagement();
  
  const scheduleManagement = useScheduleManagement({ membros, updateMemberHistory }); 
  const {
    status, 
    salvarDesignacoes, 
    finalizarCronograma,
    carregarDesignacoes, 
  } = scheduleManagement;

  const {
    publicAssignmentsData,
    savePublicAssignments,
    clearPublicAssignments,
  } = usePublicMeetingAssignments();
  
  const [allNvmcAssignmentsData, setAllNvmcAssignmentsData] = useState<AllNVMCAssignments | null>(null);
  const [allFieldServiceAssignmentsData, setAllFieldServiceAssignmentsData] = useState<AllFieldServiceAssignments | null>(null);
  const [publicMeetingCardKey, setPublicMeetingCardKey] = useState(0);

  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [substitutionDetails, setSubstitutionDetails] = useState<SubstitutionDetails | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    carregarNVMCAssignmentsFirestore()
      .then(data => {
        if (data) setAllNvmcAssignmentsData(data);
        else setAllNvmcAssignmentsData(carregarNVMCAssignments());
      })
      .catch(err => {
        console.error('Erro ao carregar designações NVMC do Firestore:', err);
        setAllNvmcAssignmentsData(carregarNVMCAssignments());
      });

    carregarFieldServiceAssignmentsFirestore()
      .then(data => {
        if (data) setAllFieldServiceAssignmentsData(data);
        else setAllFieldServiceAssignmentsData(carregarFieldServiceAssignments());
      })
      .catch(err => {
        console.error('Erro ao carregar designações do Serviço de Campo do Firestore:', err);
        setAllFieldServiceAssignmentsData(carregarFieldServiceAssignments());
      });
  }, []);

  const handleScheduleGeneratedCallback = async (mes: number, ano: number) => {
    const { success, error, generatedSchedule } = await scheduleManagement.generateNewSchedule(mes, ano);
    if (success && generatedSchedule) {
      toast({ title: "Designações Geradas", description: `Cronograma para ${NOMES_MESES[mes]} de ${ano} gerado com sucesso.` });
    } else if (error) {
      toast({ title: "Erro ao Gerar Designações", description: error, variant: "destructive" });
    }
    return { success, error };
  };
  
  const handleSaveNvmcAssignments = (
    monthAssignments: { [dateStr: string]: NVMCDailyAssignments },
    mes: number,
    ano: number
  ) => {
    const yearMonthKey = formatarDataParaChave(new Date(ano, mes, 1));
    const updatedAllAssignments = {
      ...(allNvmcAssignmentsData || {}),
      [yearMonthKey]: monthAssignments,
    };
    setAllNvmcAssignmentsData(updatedAllAssignments);
    salvarNVMCAssignments(updatedAllAssignments);
    salvarNVMCAssignmentsFirestore(updatedAllAssignments).catch(err =>
      console.error('Erro ao salvar designações NVMC no Firestore:', err)
    );
    toast({ title: "Sucesso", description: "Designações NVMC salvas." });
  };

  const handleSaveFieldServiceAssignments = (
    monthAssignments: FieldServiceMonthlyData,
    mes: number,
    ano: number
  ) => {
    const yearMonthKey = formatarDataParaChave(new Date(ano, mes, 1));
    const updatedAllAssignments = {
      ...(allFieldServiceAssignmentsData || {}),
      [yearMonthKey]: monthAssignments,
    };
    setAllFieldServiceAssignmentsData(updatedAllAssignments);
    salvarFieldServiceAssignments(updatedAllAssignments);
    salvarFieldServiceAssignmentsFirestore(updatedAllAssignments).catch(err =>
      console.error('Erro ao salvar designações do Serviço de Campo no Firestore:', err)
    );
    toast({ title: "Sucesso", description: "Designações do Serviço de Campo salvas." });
  };

  const handleOpenSubstitutionModal = (details: SubstitutionDetails) => {
    setSubstitutionDetails(details);
    setIsSubstitutionModalOpen(true);
  };

  const handleConfirmSubstitution = (newMemberId: string) => {
    if (!substitutionDetails || scheduleManagement.scheduleData === null || scheduleManagement.scheduleMes === null || scheduleManagement.scheduleAno === null) {
      toast({ title: "Erro", description: "Não foi possível processar a substituição. Dados do cronograma ausentes.", variant: "destructive" });
      return;
    }

    const { date, functionId, originalMemberId } = substitutionDetails;
    const isNewDesignation = !originalMemberId || originalMemberId === '';

    const dataObj = new Date(date);
    const diaSemana = dataObj.getDay();
    const isMeioSemana = diaSemana === DIAS_REUNIAO.meioSemana;
    const isPublica = diaSemana === DIAS_REUNIAO.publica;

    // Resolve the function ID based on the day
    const resolvedFunctionId = getRealFunctionId(functionId, date);

    console.log('Original functionId:', functionId);
    console.log('Resolved functionId:', resolvedFunctionId);

    scheduleManagement.confirmManualAssignmentOrSubstitution(
      date,
      resolvedFunctionId,
      newMemberId,
      originalMemberId,
      scheduleManagement.scheduleData,
      scheduleManagement.scheduleMes,
      scheduleManagement.scheduleAno
    );

    toast({
      title: isNewDesignation ? "Designação Realizada" : "Substituição Realizada", 
      description: isNewDesignation ? "A designação foi atribuída com sucesso." : "A designação foi atualizada com sucesso." 
    });
    setIsSubstitutionModalOpen(false);
    setSubstitutionDetails(null);
  };

  const handleSaveProgressClick = () => {
    salvarDesignacoes();
    toast({ title: "Progresso Salvo", description: "Cronograma atual salvo no cache do navegador." });
  };

  const handleFinalizeScheduleClick = async () => {
    const { success, error } = scheduleManagement.finalizarCronograma(); 
    if (success) {
      toast({ title: "Cronograma Finalizado", description: "Cronograma do mês atual salvo e aplicado ao histórico dos membros." });
    } else if (error) {
      toast({ title: "Erro ao Finalizar Cronograma", description: error, variant: "destructive" });
    }
    return { success, error };
  };

  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Gerar Designações</h1>
      
      <Tabs defaultValue="indicadores-volantes-limpeza" className="w-full">
        <TabsList className="mb-4 bg-transparent">
          <TabsTrigger value="indicadores-volantes-limpeza" className="flex items-center">
            <ListChecks className="mr-2 h-4 w-4" /> Indicadores/Volantes/Limpeza
          </TabsTrigger>
          <TabsTrigger value="reuniao-publica" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" /> Reunião Pública
          </TabsTrigger>
          <TabsTrigger value="nvmc" className="flex items-center">
            <BookUser className="mr-2 h-4 w-4" /> NVMC
          </TabsTrigger>
          <TabsTrigger value="servico-de-campo" className="flex items-center">
            <ClipboardList className="mr-2 h-4 w-4" /> Serviço de Campo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicadores-volantes-limpeza">
          <ScheduleGenerationCard
            membros={membros}
            onScheduleGenerated={handleScheduleGeneratedCallback}
            currentSchedule={scheduleManagement.scheduleData}
            currentMes={scheduleManagement.scheduleMes}
            currentAno={scheduleManagement.scheduleAno}
            onOpenSubstitutionModal={handleOpenSubstitutionModal}
            onLimpezaChange={scheduleManagement.updateLimpezaAssignment}
            status={status} 
            onSaveProgress={handleSaveProgressClick} 
            onFinalizeSchedule={handleFinalizeScheduleClick}
            onMonthYearChangeRequest={carregarDesignacoes} 
            onClearScheduleForMonth={scheduleManagement.clearScheduleForMonth}
          />
        </TabsContent>

        <TabsContent value="reuniao-publica">
          <PublicMeetingAssignmentsCard
            key={`public-meeting-card-${publicMeetingCardKey}`}
            allMembers={membros}
            allPublicAssignments={publicAssignmentsData} 
            currentScheduleForMonth={scheduleManagement.scheduleData} 
            initialMonth={scheduleManagement.scheduleMes ?? new Date().getMonth()}
            initialYear={scheduleManagement.scheduleAno ?? new Date().getFullYear()}
            onSaveAssignments={savePublicAssignments} 
            onOpenSubstitutionModal={handleOpenSubstitutionModal}
          />
        </TabsContent>

        <TabsContent value="nvmc">
          <NvmcAssignmentsCard
            allMembers={membros}
            allNvmcAssignments={allNvmcAssignmentsData}
            initialMonth={scheduleManagement.scheduleMes ?? new Date().getMonth()}
            initialYear={scheduleManagement.scheduleAno ?? new Date().getFullYear()}
            onSaveNvmcAssignments={handleSaveNvmcAssignments}
          />
        </TabsContent>

        <TabsContent value="servico-de-campo">
          <FieldServiceAssignmentsCard
            allFieldServiceAssignments={allFieldServiceAssignmentsData}
            initialMonth={scheduleManagement.scheduleMes ?? new Date().getMonth()}
            initialYear={scheduleManagement.scheduleAno ?? new Date().getFullYear()}
            onSaveFieldServiceAssignments={handleSaveFieldServiceAssignments}
          />
        </TabsContent>
      </Tabs>

      {isSubstitutionModalOpen && substitutionDetails && scheduleManagement.scheduleData && (
        <SubstitutionDialog
          isOpen={isSubstitutionModalOpen}
          onOpenChange={setIsSubstitutionModalOpen}
          onConfirmSubstitution={handleConfirmSubstitution}
          substitutionDetails={substitutionDetails}
          allMembers={membros}
          currentAssignmentsForMonth={scheduleManagement.scheduleData}
        />
      )}
    </div>
  );
} 