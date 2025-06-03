'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';
import { NOMES_MESES } from '@/lib/congregacao/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface ConfirmClearDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClearHistory: () => void;
  onClearAllData: () => void;
  onClearMainScheduleData?: (mes: number, ano: number) => void;
  onClearPublicMeetingData?: () => void;
  onClearNvmcData?: () => void; 
  onClearFieldServiceData?: () => void;
  clearType: 'history' | 'all' | 'public_meeting' | 'nvmc' | 'field_service' | 'main_schedule' | null;
  targetMemberName?: string | null;
  mes?: number | null;
  ano?: number | null;
}

export function ConfirmClearDialog({
  isOpen,
  onOpenChange,
  onClearHistory,
  onClearAllData,
  onClearMainScheduleData,
  onClearPublicMeetingData,
  onClearNvmcData, 
  onClearFieldServiceData,
  clearType,
  targetMemberName,
  mes: initialMes,
  ano: initialAno,
}: ConfirmClearDialogProps) {
  
  const [selectedMes, setSelectedMes] = useState<string | null>(initialMes !== null && initialMes !== undefined ? initialMes.toString() : null);
  const [selectedAno, setSelectedAno] = useState<string | null>(initialAno !== null && initialAno !== undefined ? initialAno.toString() : null);

  useEffect(() => {
    setSelectedMes(initialMes !== null && initialMes !== undefined ? initialMes.toString() : null);
    setSelectedAno(initialAno !== null && initialAno !== undefined ? initialAno.toString() : null);
  }, [initialMes, initialAno]);

  const handleConfirm = () => {
    if (clearType === 'history') {
      onClearHistory();
    } else if (clearType === 'all') {
      onClearAllData();
    } else if (clearType === 'main_schedule' && onClearMainScheduleData) {
      if (selectedMes !== null && selectedAno !== null) {
        onClearMainScheduleData(parseInt(selectedMes, 10), parseInt(selectedAno, 10));
      } else {
        console.error("Month or year not selected for main schedule clear.");
        return;
      }
    } else if (clearType === 'public_meeting' && onClearPublicMeetingData) {
      onClearPublicMeetingData();
    } else if (clearType === 'nvmc' && onClearNvmcData) { 
      onClearNvmcData();
    } else if (clearType === 'field_service' && onClearFieldServiceData) {
      onClearFieldServiceData();
    }
    onOpenChange(false);
  };

  let title = "Confirmar Limpeza";
  let description = "Esta ação é irreversível.";

  if (clearType === 'history') {
    title = targetMemberName 
      ? `Limpar Histórico de ${targetMemberName}?` 
      : "Limpar Todo o Histórico de Designações?";
    description = targetMemberName
      ? `Tem certeza que deseja limpar todo o histórico de designações de ${targetMemberName}? Esta ação não pode ser desfeita.`
      : "Tem certeza que deseja limpar o histórico de designações de TODOS os membros? Esta ação não pode ser desfeita.";
  } else if (clearType === 'main_schedule') {
    title = "Limpar Designações (Indicadores/Volantes/AV/Limpeza) por Mês?";
    description = "Selecione o mês e ano abaixo para limpar as designações (Indicadores, Volantes, AV, Limpeza) somente para este período. O histórico dos membros NÃO será afetado por esta ação específica.";
  } else if (clearType === 'public_meeting') {
    title = "Limpar Dados da Reunião Pública?";
    description = "Tem certeza que deseja limpar todos os dados de Tema, Orador, Congregação, Dirigente e Leitor inseridos para as Reuniões Públicas? Esta ação não pode ser desfeita.";
  } else if (clearType === 'nvmc') { 
    title = "Limpar Dados NVMC?";
    description = "Tem certeza que deseja limpar todas as designações manuais da Reunião Nossa Vida e Ministério Cristão? Esta ação não pode ser desfeita.";
  } else if (clearType === 'field_service') {
    title = "Limpar Dados do Serviço de Campo?";
    description = "Tem certeza que deseja limpar todas as designações de pontos de encontro do serviço de campo? Esta ação não pode ser desfeita.";
  } else if (clearType === 'all') {
    title = "Limpar TODOS os Dados?";
    description = "ATENÇÃO! Isso removerá TODOS os membros, permissões, históricos, impedimentos e dados de todas as abas de designação (Indicadores/Volantes/AV/Limpeza, Reunião Pública, NVMC, Serviço de Campo). Esta ação é EXTREMAMENTE destrutiva e não pode ser desfeita. Confirma que deseja prosseguir?";
  }

  const currentYear = new Date().getFullYear();
  const yearsForSelect = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {clearType === 'main_schedule' && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Label htmlFor="selectMesClear">Mês</Label>
              <Select
                value={selectedMes || ''}
                onValueChange={setSelectedMes}
              >
                <SelectTrigger id="selectMesClear">
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
              <Label htmlFor="selectAnoClear">Ano</Label>
               <Select
                  value={selectedAno || ''}
                  onValueChange={setSelectedAno}
                >
                  <SelectTrigger id="selectAnoClear">
                      <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                      {yearsForSelect.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={clearType === 'main_schedule' && (selectedMes === null || selectedAno === null)}
            className={(clearType === 'all' || clearType === 'public_meeting' || clearType === 'nvmc' || clearType === 'field_service' || clearType === 'main_schedule') ? "bg-destructive hover:bg-destructive/90" : ""}
          >
            Confirmar Limpeza
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
