'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMemberManagement } from '@/hooks/congregacao/useMemberManagement';
import { MemberManagementCard } from '@/components/congregacao/MemberManagementCard';
import { MemberFormDialog } from '@/components/congregacao/MemberFormDialog';
import { BulkAddDialog } from '@/components/congregacao/BulkAddDialog';
import { ConfirmClearDialog } from '@/components/congregacao/ConfirmClearDialog';
import type { Membro } from '@/lib/congregacao/types';
import { useToast } from "@/hooks/use-toast";
import { Users, History, Trash2 } from 'lucide-react';

const CongregacaoPage = () => {
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
  
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [clearType, setClearType] = useState<'history' | 'all' | 'public_meeting' | 'nvmc' | 'field_service' | 'main_schedule' | null>(null);
  const [memberIdForAdvancedOptions, setMemberIdForAdvancedOptions] = useState<string | null>(null);

  const { toast } = useToast();

  const handleImportMembersWithUICallback = (file: File) => {
    hookHandleImportMembers(file, () => {
        // Only member-related cache invalidation if necessary
        // If hookPersistMembros invalidates cache, no extra calls needed here.
        // For now, assuming minimal needed here.
    });
  };

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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Membros</h1>
      
      <MemberManagementCard 
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
    </div>
  );
};

export default CongregacaoPage; 
