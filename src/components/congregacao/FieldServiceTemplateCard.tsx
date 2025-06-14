'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { FieldServiceWeeklyTemplate, FieldServiceTemplateSlot, ManagedListItem } from '@/lib/congregacao/types';
import { NOMES_DIAS_SEMANA_COMPLETOS, FIELD_SERVICE_TIME_OPTIONS } from '@/lib/congregacao/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, ClipboardList } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { carregarModalidades, carregarLocaisBase, carregarFieldServiceTemplate, salvarFieldServiceTemplate } from '@/lib/congregacao/storage';

const generateSlotId = () => `slot_${Date.now()}_${Math.random().toString(36).substring(2,9)}`;

export function FieldServiceTemplateCard() {
  const [templateData, setTemplateData] = useState<FieldServiceWeeklyTemplate>({});
  const [modalidadesList, setModalidadesList] = useState<ManagedListItem[]>([]);
  const [locaisBaseList, setLocaisBaseList] = useState<ManagedListItem[]>([]);
  const { toast } = useToast();

  const loadManagedLists = useCallback(() => {
    setModalidadesList(carregarModalidades());
    setLocaisBaseList(carregarLocaisBase());
  }, []);

  useEffect(() => { loadManagedLists(); }, [loadManagedLists]);

  useEffect(() => {
    const loaded = carregarFieldServiceTemplate();
    if (loaded) setTemplateData(loaded);
  }, []);

  const handleAddSlot = (dayOfWeek: number) => {
    const dayKey = dayOfWeek.toString();
    const newSlot: FieldServiceTemplateSlot = {
      id: generateSlotId(),
      time: FIELD_SERVICE_TIME_OPTIONS[0].value,
      modalityId: null,
      baseLocationId: null,
      additionalDetails: '',
    };
    setTemplateData(prev => ({
      ...prev,
      [dayKey]: { slots: [...(prev[dayKey]?.slots || []), newSlot] }
    }));
  };

  const handleRemoveSlot = (dayOfWeek: number, slotId: string) => {
    const dayKey = dayOfWeek.toString();
    setTemplateData(prev => ({
      ...prev,
      [dayKey]: { slots: prev[dayKey]?.slots.filter(s => s.id !== slotId) || [] }
    }));
  };

  const handleSlotInputChange = (
    dayOfWeek: number,
    slotId: string,
    field: keyof Omit<FieldServiceTemplateSlot, 'id'>,
    value: string | null
  ) => {
    const dayKey = dayOfWeek.toString();
    setTemplateData(prev => ({
      ...prev,
      [dayKey]: {
        slots: prev[dayKey]?.slots.map(slot =>
          slot.id === slotId ? { ...slot, [field]: value === '' ? null : value } : slot
        ) || []
      }
    }));
  };

  const handleSaveTemplate = () => {
    salvarFieldServiceTemplate(templateData);
    toast({ title: 'Sucesso', description: 'Horários Padrão salvos.' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ClipboardList className="mr-2 h-5 w-5 text-primary" /> Horários Padrão do Serviço de Campo
        </CardTitle>
        <CardDescription>Configure pontos de encontro recorrentes para cada dia da semana.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button onClick={handleSaveTemplate}>Salvar Horários</Button>
        </div>
        {NOMES_DIAS_SEMANA_COMPLETOS.map((dayName, dayIndex) => (
          <div key={dayIndex} className="space-y-4 p-4 border rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-primary">{dayName}</h3>
              <Button variant="outline" size="sm" onClick={() => handleAddSlot(dayIndex)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ponto de Encontro
              </Button>
            </div>
            {(templateData[dayIndex.toString()]?.slots || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum ponto de encontro para {dayName.toLowerCase()}.</p>
            )}
            {(templateData[dayIndex.toString()]?.slots || []).map((slot, slotIndex) => (
              <Card key={slot.id} className="bg-muted/30">
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md">Ponto de Encontro #{slotIndex + 1}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveSlot(dayIndex, slot.id)} className="text-destructive h-7 w-7">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0 pb-4 px-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`slot-time-${slot.id}`}>Horário</Label>
                      <Select value={slot.time} onValueChange={(value) => handleSlotInputChange(dayIndex, slot.id, 'time', value)}>
                        <SelectTrigger id={`slot-time-${slot.id}`} className="h-9">
                          <SelectValue placeholder="Horário" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_SERVICE_TIME_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`slot-modality-${slot.id}`}>Modalidade</Label>
                      <Select value={slot.modalityId || ''} onValueChange={(value) => handleSlotInputChange(dayIndex, slot.id, 'modalityId', value)}>
                        <SelectTrigger id={`slot-modality-${slot.id}`} className="h-9">
                          <SelectValue placeholder="Modalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {modalidadesList.map(mod => (
                            <SelectItem key={mod.id} value={mod.id}>{mod.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`slot-baseLocation-${slot.id}`}>Local Base</Label>
                      <Select value={slot.baseLocationId || ''} onValueChange={(value) => handleSlotInputChange(dayIndex, slot.id, 'baseLocationId', value)}>
                        <SelectTrigger id={`slot-baseLocation-${slot.id}`} className="h-9">
                          <SelectValue placeholder="Local Base" />
                        </SelectTrigger>
                        <SelectContent>
                          {locaisBaseList.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`slot-details-${slot.id}`}>Grupos / Detalhes Adicionais</Label>
                    <Input id={`slot-details-${slot.id}`} value={slot.additionalDetails || ''} onChange={(e) => handleSlotInputChange(dayIndex, slot.id, 'additionalDetails', e.target.value)} placeholder="Ex: Grupos 1,2 ou 1º Sábado" className="h-9" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
