'use client';

import React from 'react';
import { FieldServiceTemplateCard } from '@/components/congregacao/FieldServiceTemplateCard';

export default function HorariosPadraoPage() {
  return (
    <div className="container mx-auto py-8 bg-[#F0F2F5]">
      <h1 className="text-3xl font-bold mb-6">Horários Padrão do Serviço de Campo</h1>
      <FieldServiceTemplateCard />
    </div>
  );
}
