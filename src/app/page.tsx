'use client';

import React, { useState, useEffect } from 'react';
import { useMemberManagement } from '@/hooks/congregacao/useMemberManagement';
import { useScheduleManagement } from '@/hooks/congregacao/useScheduleManagement';
import { usePublicMeetingAssignments } from '@/hooks/congregacao/usePublicMeetingAssignments';
import { CongregationIcon } from '@/components/icons/CongregationIcon';
import type { Membro, DesignacoesFeitas } from '@/lib/congregacao/types';
import { APP_NAME, NOMES_MESES, TIPOS_DESIGNACAO } from '@/lib/congregacao/constants';
import { formatarDataCompleta, formatarDataParaChave } from '@/lib/congregacao/utils';
import { 
  carregarNVMCAssignments,
  carregarFieldServiceAssignments,
} from '@/lib/congregacao/storage';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Users, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { signIn, signOut, useSession } from 'next-auth/react';

// Simple helper to parse YYYY-MM-DD to Date
const parseDateKey = (dateStr: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null;
  }
  // Parse as UTC to avoid timezone issues affecting date comparisons
  return new Date(dateStr + 'T00:00:00Z');
};

export default function Home() {
  const { data: session, status } = useSession();
  const {
    membros,
  } = useMemberManagement();
  
  const scheduleManagement = useScheduleManagement({ membros, updateMemberHistory: () => {} });
  const {
    scheduleData,
    scheduleMes,
    scheduleAno,
    status: mainScheduleStatus,
  } = scheduleManagement;

  const { publicAssignmentsData } = usePublicMeetingAssignments();

  const [allNvmcAssignmentsData, setAllNvmcAssignmentsData] = useState<{[key: string]: any} | null>(null);
  const [allFieldServiceAssignmentsData, setAllFieldServiceAssignmentsData] = useState<{[key: string]: any} | null>(null);

  useEffect(() => {
    setAllNvmcAssignmentsData(carregarNVMCAssignments());
    setAllFieldServiceAssignmentsData(carregarFieldServiceAssignments());
  }, []);

  const { toast } = useToast();

  // State for managing notices
  const [notices, setNotices] = useState<string[]>([]);
  const [newNotice, setNewNotice] = useState('');
  const [showNoticeInput, setShowNoticeInput] = useState(false);

  // Load notices from local storage on mount
  useEffect(() => {
    const savedNotices = localStorage.getItem('congregacao_notices');
    if (savedNotices) {
      try {
        setNotices(JSON.parse(savedNotices));
      } catch (e) {
        console.error("Failed to parse notices from local storage", e);
        // Optionally clear invalid data
        localStorage.removeItem('congregacao_notices');
      }
    }
  }, []);

  // Save notices to local storage whenever the notices state changes
  useEffect(() => {
    localStorage.setItem('congregacao_notices', JSON.stringify(notices));
  }, [notices]);

  // Function to handle adding a new notice
  const handleAddNotice = () => {
    if (newNotice.trim()) {
      setNotices([...notices, newNotice.trim()]);
      setNewNotice('');
      setShowNoticeInput(false); // Hide input after adding
      toast({ title: "Aviso Adicionado", description: "Novo aviso salvo com sucesso." });
    } else {
      toast({ title: "Aviso Vazio", description: "Não é possível adicionar um aviso vazio.", variant: "destructive" });
    }
  };

  // Function to handle deleting a notice
  const handleDeleteNotice = (indexToDelete: number) => {
    setNotices(notices.filter((_, index) => index !== indexToDelete));
    toast({ title: "Aviso Excluído", description: "Aviso removido com sucesso." });
  };

  const totalMembers = membros.length;

  const getUpcomingAssignments = (
    schedule: DesignacoesFeitas | null,
    mes: number | null,
    ano: number | null,
    membrosList: Membro[],
  ) => {
    if (!schedule || mes === null || ano === null) {
      return [] as string[];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: { data: string; funcaoId: string; membroId: string }[] = [];

    for (const [dateStr, assignments] of Object.entries(schedule)) {
      const assignmentDate = parseDateKey(dateStr);
      if (
        !assignmentDate ||
        assignmentDate < today
      ) {
        continue;
      }

      for (const [funcaoId, membroId] of Object.entries(assignments)) {
        if (
          membroId &&
          funcaoId !== 'limpezaAposReuniaoGrupoId' &&
          funcaoId !== 'limpezaSemanalResponsavel'
        ) {
          upcoming.push({ data: dateStr, funcaoId, membroId: membroId as string });
        }
      }
    }

    upcoming.sort((a, b) => {
      const dateA = parseDateKey(a.data)!;
      const dateB = parseDateKey(b.data)!;
      return dateA.getTime() - dateB.getTime();
    });

    return upcoming.slice(0, 5).map((assignment) => {
      const membro = membrosList.find((m) => m.id === assignment.membroId);
      const nomeMembro = membro
        ? `${membro.nome.split(' ')[0]} ${membro.nome.split(' ')[1]?.charAt(0) || ''}.`
        : 'Membro Desconhecido';
      const tipoDesignacao = TIPOS_DESIGNACAO[assignment.funcaoId] || assignment.funcaoId;
      const dataFormatada = formatarDataCompleta(parseDateKey(assignment.data)!);
      return `${nomeMembro} - ${tipoDesignacao} (${dataFormatada})`;
    });
  };

  const upcomingAssignments = React.useMemo(
    () => getUpcomingAssignments(scheduleData, scheduleMes, scheduleAno, membros),
    [scheduleData, scheduleMes, scheduleAno, membros]
  );

  const currentYearMonthKey = scheduleMes !== null && scheduleAno !== null ? formatarDataParaChave(new Date(scheduleAno, scheduleMes, 1)) : null;
  
  const publicMeetingStatus = currentYearMonthKey && publicAssignmentsData && publicAssignmentsData[currentYearMonthKey]
    ? 'Dados existentes'
    : 'Sem dados';

  const nvmcStatus = currentYearMonthKey && allNvmcAssignmentsData && allNvmcAssignmentsData[currentYearMonthKey]
    ? 'Dados existentes'
    : 'Sem dados';

  const fieldServiceStatus = currentYearMonthKey && allFieldServiceAssignmentsData && allFieldServiceAssignmentsData[currentYearMonthKey]
    ? 'Dados existentes'
    : 'Sem dados';

  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {!session && (
        <div className="flex justify-center mb-6">
          <Button onClick={() => signIn('google')}>Sign in with Google</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white text-black border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Membros Ativos</CardTitle>
            <CardDescription>Total de membros cadastrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-blue-600">{totalMembers}</span>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white text-black border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Próximas Designações</CardTitle>
            <CardDescription>Visualização rápida das designações da semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingAssignments.length > 0 ? (
              upcomingAssignments.map((assignment, index) => (
                <p key={index} className="text-sm text-black mb-1">- {assignment}</p>
              ))
            ) : (
              <p className="text-sm text-gray-600">Nenhuma designação próxima encontrada.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white text-black border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Avisos</CardTitle>
            {!showNoticeInput && (
              <Button variant="ghost" size="icon" onClick={() => setShowNoticeInput(true)}>
                <PlusCircle className="h-5 w-5" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {notices.length > 0 ? (
              notices.map((notice, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-black mb-1">
                  <span>- {notice}</span>
                  <Button variant="ghost" size="icon" className="w-4 h-4 p-0" onClick={() => handleDeleteNotice(index)}>
                    {/* Use a simple X or Trash icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-muted-foreground">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">Nenhum aviso importante no momento.</p>
            )}
            
            {showNoticeInput && (
              <div className="mt-4 space-y-2 text-black">
                <Textarea
                  placeholder="Digite um novo aviso aqui..."
                  value={newNotice}
                  onChange={(e) => setNewNotice(e.target.value)}
                  className="text-black"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNoticeInput(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleAddNotice}>Salvar Aviso</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white text-black border-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Status do Cronograma Mensal</CardTitle>
            <CardDescription>Situação das designações por seção para o mês atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            {scheduleMes !== null && scheduleAno !== null ? (
              <>
                <p>Mês: <span className="font-semibold">{NOMES_MESES[scheduleMes]} de {scheduleAno}</span></p>
                <p>Indicadores/Volantes/AV/Limpeza: <span className="font-semibold">{mainScheduleStatus === 'rascunho' ? 'Rascunho' : 'Finalizado'}</span></p>
                <p>Reunião Pública: <span className="font-semibold">{publicMeetingStatus}</span></p>
                <p>NVMC: <span className="font-semibold">{nvmcStatus}</span></p>
                <p>Serviço de Campo: <span className="font-semibold">{fieldServiceStatus}</span></p>
              </>
            ) : (
              <p className="text-sm text-gray-600">Nenhum cronograma carregado.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
    
