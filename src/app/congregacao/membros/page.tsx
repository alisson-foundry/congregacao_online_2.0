'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMemberManagement } from '@/hooks/congregacao/useMemberManagement';
// Removed schedule and public meeting hooks imports
// import { useScheduleManagement } from '@/hooks/congregacao/useScheduleManagement';
// import { usePublicMeetingAssignments } from '@/hooks/congregacao/usePublicMeetingAssignments';

import { MemberManagementCard, type MemberManagementCardProps } from '@/components/congregacao/MemberManagementCard';
// Removed other component imports that are not specific to member management
// import { ScheduleGenerationCard } from '@/components/congregacao/ScheduleGenerationCard';
// import { PublicMeetingAssignmentsCard } from '@/components/congregacao/PublicMeetingAssignmentsCard';
// import { NvmcAssignmentsCard } from '@/components/congregacao/NvmcAssignmentsCard';
// import { FieldServiceAssignmentsCard } from '@/components/congregacao/FieldServiceAssignmentsCard';
import { MemberFormDialog } from '@/components/congregacao/MemberFormDialog';
import { BulkAddDialog } from '@/components/congregacao/BulkAddDialog';
import { ConfirmClearDialog, type ConfirmClearDialogProps } from '@/components/congregacao/ConfirmClearDialog';
// Removed SubstitutionDialog import
// import { SubstitutionDialog } from '@/components/congregacao/SubstitutionDialog';
// Removed CongregationIcon import
// import { CongregationIcon } from '@/components/icons/CongregationIcon';

import type { Membro } from '@/lib/congregacao/types'; // Kept Membro type
// Removed other type imports
// import type { DesignacoesFeitas, SubstitutionDetails, AllNVMCAssignments, NVMCDailyAssignments, AllFieldServiceAssignments, FieldServiceMonthlyData } from '@/lib/congregacao/types';

// Removed constants and utility imports not specific to member management
// import { APP_NAME, NOMES_MESES } from '@/lib/congregacao/constants';
// import { 
//   carregarNVMCAssignments,
//   salvarNVMCAssignments,
//   limparNVMCAssignments as limparStorageNVMCAssignments,
//   carregarFieldServiceAssignments,
//   salvarFieldServiceAssignments,
//   limparStorageFieldServiceAssignments
// } from '@/lib/congregacao/storage';
// import { formatarDataParaChave } from '@/lib/congregacao/utils';

import { useToast } from "@/hooks/use-toast";
// Removed Accordion and Button imports
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
// import { Button } from '@/components/ui/button';
// Removed Card imports
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
// Removed Tabs imports
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Kept icons used in member management if any, removing others.
import { Users, History, Trash2 } from 'lucide-react'; // Assuming these are used in member management


const MemberManagementPage = () => {
  const {
    membros,
    isMemberFormOpen,
    setIsMemberFormOpen,
    memberToEdit,
    isBulkAddOpen,
    setIsBulkAddOpen,
    openNewMemberForm,
    openEditMemberForm,
    handleSaveMember,
    handleDeleteMember,
    handleBulkAddMembers,
    handleExportMembers,
    handleImportMembers: hookHandleImportMembers,
    updateMemberHistory,
    persistMembros: hookPersistMembros,
  } = useMemberManagement();
  
  // Removed schedule management hook and related state/functions
  // const scheduleManagement = useScheduleManagement({ membros, updateMemberHistory }); 
  // const {
  //   status, 
  //   salvarDesignacoes, 
  //   finalizarCronograma,
  //   carregarDesignacoes, 
  // } = scheduleManagement;

  // Removed public meeting hook and related state/functions
  // const {
  //   publicAssignmentsData,
  //   savePublicAssignments,
  //   clearPublicAssignments,
  // } = usePublicMeetingAssignments();
  
  // Removed NVMC and Field Service state and handlers
  // const [allNvmcAssignmentsData, setAllNvmcAssignmentsData] = useState<AllNVMCAssignments | null>(null);
  // const [allFieldServiceAssignmentsData, setAllFieldServiceAssignmentsData] = useState<AllFieldServiceAssignments | null>(null);
  // const [publicMeetingCardKey, setPublicMeetingCardKey] = useState(0);

  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [clearType, setClearType] = useState<'history' | 'all' | 'public_meeting' | 'nvmc' | 'field_service' | 'main_schedule' | null>(null); // Keep clearType for history
  const [memberIdForAdvancedOptions, setMemberIdForAdvancedOptions] = useState<string | null>(null);

  // Removed substitution state and handlers
  // const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  // const [substitutionDetails, setSubstitutionDetails] = useState<SubstitutionDetails | null>(null);

  const { toast } = useToast();

  // Removed useEffect for loading NVMC/Field Service
  // useEffect(() => {
  //   setAllNvmcAssignmentsData(carregarNVMCAssignments());
  //   setAllFieldServiceAssignmentsData(carregarFieldServiceAssignments());
  // }, []);


  // Removed schedule and other cache clearing handlers
  // const handleLimparCachePrincipal = useCallback(() => {
  //   scheduleManagement.clearMainScheduleAndCache();
  // }, [scheduleManagement]);
  // const limparCacheDesignacoesPublicMeetingCallback = useCallback(() => {
  //   clearPublicAssignments();
  //   setPublicMeetingCardKey(prev => prev + 1); 
  // }, [clearPublicAssignments]);
  // const limparCacheNVMCAssignments = useCallback(() => {
  //   setAllNvmcAssignmentsData(null);
  //   limparStorageNVMCAssignments();
  // }, []);
  // const limparCacheFieldService = useCallback(() => {
  //   setAllFieldServiceAssignmentsData(null);
  //   limparStorageFieldServiceAssignments();
  // }, []);

  // Adjusted handleImportMembers to only clear member-related cache if necessary or simplify.
  // Assuming hookHandleImportMembers handles its own cache invalidation, simplified callback.
  const handleImportMembersWithUICallback = (file: File) => {
    hookHandleImportMembers(file, () => {
        // Only member-related cache invalidation if necessary
        // If hookPersistMembros invalidates cache, no extra calls needed here.
        // For now, assuming minimal needed here.
    });
  };

  // Removed other save handlers
  // const handleScheduleGeneratedCallback = async (mes: number, ano: number) => { /* ... */ };
  // const handleSaveNvmcAssignments = (monthAssignments: { [dateStr: string]: NVMCDailyAssignments }, mes: number, ano: number) => { /* ... */ };
  // const handleSaveFieldServiceAssignments = (monthAssignments: FieldServiceMonthlyData, mes: number, ano: number) => { /* ... */ };

  const handleOpenAdvancedOptions = (memberId: string | null) => {
    setMemberIdForAdvancedOptions(memberId);
    setIsMemberFormOpen(false); 
    setIsConfirmClearOpen(true);
  };

  const handleClearMemberHistory = () => {
    if (memberIdForAdvancedOptions) {
        const membro = membros.find(m => m.id === memberIdForAdvancedOptions);
        if (membro) {
            const membrosAtualizados = membros.map(m =>
                m.id === memberIdForAdvancedOptions ? { ...m, historicoDesignacoes: {} } : m
            );
            hookPersistMembros(membrosAtualizados); 
            toast({ title: "Histórico Limpo", description: `Histórico de ${membro.nome} foi limpo.` });
        }
    } else { 
        // This part clears ALL history, which might belong on a different page (e.g., Configurations)
        // For now, keeping it here, but consider moving.
        const membrosAtualizados = membros.map(m => ({ ...m, historicoDesignacoes: {} }));
        hookPersistMembros(membrosAtualizados);
        toast({ title: "Histórico Limpo", description: "Histórico de designações de TODOS os membros foi limpo." });
    }
    setMemberIdForAdvancedOptions(null);
  };

  // Removed handleClearAllData as it likely belongs on a different page
  // const handleClearAllData = () => { /* ... */ };

  // Removed substitution handlers
  // const handleOpenSubstitutionModal = (details: SubstitutionDetails) => { /* ... */ };
  // const handleConfirmSubstitution = (newMemberId: string) => { /* ... */ };
  // const handleDirectAssignAV = (date: string, functionId: string, newMemberId: string | null, originalMemberId: string | null) => { /* ... */ };


  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Membros</h1>
      
      <MemberManagementCard className="bg-white text-black border-none shadow-none"
         members={membros}
         onAddMember={openNewMemberForm}
         onEditMember={openEditMemberForm}
         onDeleteMember={handleDeleteMember}
         onBulkAdd={() => setIsBulkAddOpen(true)}
         onExportMembers={handleExportMembers}
         onImportMembers={handleImportMembersWithUICallback}
         handleOpenAdvancedOptions={handleOpenAdvancedOptions}
      />

      <MemberFormDialog
        isOpen={isMemberFormOpen}
        onOpenChange={setIsMemberFormOpen}
        onSave={handleSaveMember}
        memberToEdit={memberToEdit}
        onOpenAdvancedOptions={handleOpenAdvancedOptions}
      />

      <BulkAddDialog
        isOpen={isBulkAddOpen}
        onOpenChange={setIsBulkAddOpen}
        onSaveBulk={handleBulkAddMembers}
      />
      
       <ConfirmClearDialog
         isOpen={isConfirmClearOpen}
         onOpenChange={setIsConfirmClearOpen}
         onClearHistory={handleClearMemberHistory}
         onClearAllData={() => {}}
         clearType={clearType}
         targetMemberName={memberIdForAdvancedOptions ? membros.find(m => m.id === memberIdForAdvancedOptions)?.nome : null}
       />
       
       {/* Removed other component renderings */}
       {/* <ScheduleGenerationCard ... /> */}
       {/* <PublicMeetingAssignmentsCard ... /> */}
       {/* <NvmcAssignmentsCard ... /> */}
       {/* <FieldServiceAssignmentsCard ... /> */}
       {/* <SubstitutionDialog ... /> */}

    </div>
  );
};

export default MemberManagementPage;
