'use client';

import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

// Import hooks and types needed for clearing data
import { useMemberManagement } from '@/hooks/congregacao/useMemberManagement';
import { useScheduleManagement } from '@/hooks/congregacao/useScheduleManagement';
import { usePublicMeetingAssignments } from '@/hooks/congregacao/usePublicMeetingAssignments';
import { 
  limparNVMCAssignments as limparStorageNVMCAssignments,
  limparFieldServiceAssignments as limparStorageFieldServiceAssignments
} from '@/lib/congregacao/storage';

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfirmClearDialog, type ConfirmClearDialogProps } from '@/components/congregacao/ConfirmClearDialog';
import type { Membro } from '@/lib/congregacao/types';
import { Label } from '@/components/ui/label';
import { NOMES_MESES } from '@/lib/congregacao/constants';

export default function ConfiguracoesPage() {
  const { toast } = useToast();

  // Hooks for accessing data and persistence functions
  const { 
    membros, 
    persistMembros: hookPersistMembros 
  } = useMemberManagement();
  const scheduleManagement = useScheduleManagement({ membros, updateMemberHistory: () => {} }); // Pass dummy updateMemberHistory
  const { clearPublicAssignments } = usePublicMeetingAssignments();
  const { scheduleMes, scheduleAno, clearScheduleForMonth } = scheduleManagement;

  // State for confirmation dialog
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [clearType, setClearType] = useState<'history' | 'all' | 'public_meeting' | 'nvmc' | 'field_service' | 'main_schedule' | null>(null);
  // memberIdForAdvancedOptions is not needed on this page as we clear for all members or types
  const [targetMemberName, setTargetMemberName] = useState<string | null>(null);

  const handleClearData = (type: 'history' | 'all' | 'public_meeting' | 'nvmc' | 'field_service' | 'main_schedule') => {
    setClearType(type);
    // No specific member for general clearing, so targetMemberName can be null
    setTargetMemberName(null);
    setIsConfirmClearOpen(true);
  };

  // Function to handle clearing main schedule after month/year selection in modal
  // This function will be passed to the ConfirmClearDialog
  const handleConfirmClearMainSchedule = (mes: number, ano: number) => {
     if (clearScheduleForMonth) {
        clearScheduleForMonth(mes, ano);
        toast({ title: "Sucesso", description: `Dados do cronograma principal para ${NOMES_MESES[mes]} de ${ano} limpos.` });
     } else {
         toast({ title: "Erro", description: "Função de limpeza não disponível.", variant: "destructive" });
     }
  };

  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerenciamento de Dados</CardTitle>
          <CardDescription>Opções para limpar dados específicos ou todos os dados salvos localmente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clear-history">Limpar Histórico de Designações de Todos os Membros</Label>
            <Button 
              id="clear-history" 
              variant="destructive" 
              onClick={() => handleClearData('history')}
              className="mt-2 w-full"
            >
              Limpar Histórico
            </Button>
          </div>

          <div>
            <Label htmlFor="clear-main-schedule">Limpar Designações (Indicadores/Volantes/AV/Limpeza) por Mês</Label>
             <Button 
              id="clear-main-schedule" 
              variant="destructive" 
              onClick={() => handleClearData('main_schedule')}
              className="mt-2 w-full"
            >
              Limpar Cronograma Principal (Mês Específico)
            </Button>
          </div>

          <div>
            <Label htmlFor="clear-public-meeting-data">Limpar Dados da Reunião Pública</Label>
            <Button 
              id="clear-public-meeting-data" 
              variant="destructive" 
              onClick={() => handleClearData('public_meeting')}
              className="mt-2 w-full"
            >
              Limpar Reunião Pública
            </Button>
          </div>
          
          <div>
            <Label htmlFor="clear-nvmc-data">Limpar Dados da NVMC</Label>
            <Button 
              id="clear-nvmc-data" 
              variant="destructive" 
              onClick={() => handleClearData('nvmc')}
              className="mt-2 w-full"
            >
              Limpar NVMC
            </Button>
          </div>
          
          <div>
            <Label htmlFor="clear-field-service-data">Limpar Dados do Serviço de Campo</Label>
            <Button 
              id="clear-field-service-data" 
              variant="destructive" 
              onClick={() => handleClearData('field_service')}
              className="mt-2 w-full"
            >
              Limpar Serviço de Campo
            </Button>
          </div>

          <div className="border-t pt-4 mt-4">
            <Label htmlFor="clear-all-data" className="text-lg font-semibold text-destructive">Limpar TODOS os Dados (Reset Completo)</Label>
            <CardDescription className="text-destructive">ATENÇÃO: Esta ação removerá permanentemente todos os membros, históricos e todos os dados de designação de todas as abas. Não pode ser desfeita.</CardDescription>
            <Button 
              id="clear-all-data" 
              variant="destructive" 
              onClick={() => handleClearData('all')}
              className="mt-2 w-full"
            >
              Limpar TODOS os Dados
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmClearDialog
        isOpen={isConfirmClearOpen}
        onOpenChange={setIsConfirmClearOpen}
        onClearHistory={() => { /* TODO: Implementar lógica de limpeza de histórico geral aqui, ou manter apenas no member-form */ toast({title: "Funcionalidade", description: "A limpeza de histórico geral ainda não está implementada aqui."}); setIsConfirmClearOpen(false); }}
        onClearAllData={() => { /* TODO: Implementar lógica de limpeza total aqui */ toast({title: "Funcionalidade", description: "A limpeza total ainda não está implementada aqui."}); setIsConfirmClearOpen(false); }}
        onClearPublicMeetingData={() => { if(clearPublicAssignments) clearPublicAssignments(); toast({title: "Sucesso", description: "Dados da Reunião Pública limpos."}); setIsConfirmClearOpen(false); }}
        onClearNvmcData={() => { /* TODO: Implementar limpeza NVMC */ toast({title: "Funcionalidade", description: "A limpeza de dados NVMC ainda não está implementada."}); setIsConfirmClearOpen(false); }}
        onClearFieldServiceData={() => { /* TODO: Implementar limpeza Serviço de Campo */ toast({title: "Funcionalidade", description: "A limpeza de dados do Serviço de Campo ainda não está implementada."}); setIsConfirmClearOpen(false); }}
        onClearMainScheduleData={handleConfirmClearMainSchedule}
        clearType={clearType}
      />
    </div>
  );
} 