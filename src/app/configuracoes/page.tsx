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

export default function ConfiguracoesPage() {
  const { toast } = useToast();

  // Hooks for accessing data and persistence functions
  const { 
    membros, 
    persistMembros: hookPersistMembros 
  } = useMemberManagement();
  const scheduleManagement = useScheduleManagement({ membros, updateMemberHistory: () => {} }); // Pass dummy updateMemberHistory
  const { clearPublicAssignments } = usePublicMeetingAssignments();

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

  const confirmClearAction = () => {
    switch (clearType) {
      case 'history':
        // Clear history for ALL members on this page
        const membrosAtualizados = membros.map(m => ({ ...m, historicoDesignacoes: {} }));
        hookPersistMembros(membrosAtualizados);
        toast({ title: "Histórico Limpo", description: "Histórico de designações de TODOS os membros foi limpo." });
        break;
      case 'main_schedule':
        scheduleManagement.clearMainScheduleAndCache();
        toast({ title: "Cronograma Principal Limpo", description: "O cronograma principal e cache associado foram limpos." });
        break;
      case 'public_meeting':
        clearPublicAssignments();
        toast({ title: "Designações de Reunião Pública Limpas", description: "Todas as designações de reunião pública foram limpas." });
        break;
      case 'nvmc':
        limparStorageNVMCAssignments();
        toast({ title: "Designações NVMC Limpas", description: "Todas as designações NVMC foram limpas." });
        break;
      case 'field_service':
        limparStorageFieldServiceAssignments();
        toast({ title: "Designações de Serviço de Campo Limpas", description: "Todas as designações de serviço de campo foram limpas." });
        break;
      case 'all':
        // Clear everything (members, schedules, etc.) - Implement with caution!
        // This might require clearing multiple storage keys and resetting states
        // For now, let's focus on the specific clears.
        toast({ title: "Funcionalidade Não Implementada", description: "A limpeza completa de dados ainda não está disponível.", variant: "destructive" });
        break;
      default:
        break;
    }
    setIsConfirmClearOpen(false);
    setClearType(null);
  };

  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Limpeza de Dados</CardTitle>
          <CardDescription>Gerencie as opções de limpeza e reset de dados da aplicação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-destructive text-sm font-semibold">Use com cuidado. Estas ações são irreversíveis.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="secondary" onClick={() => handleClearData('history')}>Limpar Histórico de Designações de Todos</Button>
            <Button variant="secondary" onClick={() => handleClearData('main_schedule')}>Limpar Cronograma Principal</Button>
            <Button variant="secondary" onClick={() => handleClearData('public_meeting')}>Limpar Dados da Reunião Pública</Button>
            <Button variant="secondary" onClick={() => handleClearData('nvmc')}>Limpar Dados NVMC</Button>
            <Button variant="secondary" onClick={() => handleClearData('field_service')}>Limpar Dados do Serviço de Campo</Button>
          </div>
          <div className="mt-6 border-t pt-4 border-border">
            <Button variant="destructive" onClick={() => handleClearData('all')} className="w-full">Limpar TODOS os Dados da Congregação</Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmClearDialog
        isOpen={isConfirmClearOpen}
        onOpenChange={setIsConfirmClearOpen}
        onClearHistory={confirmClearAction}
        onClearAllData={confirmClearAction}
        onClearMainScheduleData={confirmClearAction}
        onClearPublicMeetingData={confirmClearAction}
        onClearNvmcData={confirmClearAction}
        onClearFieldServiceData={confirmClearAction}
        clearType={clearType}
        targetMemberName={targetMemberName}
      />
    </div>
  );
} 