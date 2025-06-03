'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Designacao, Membro } from '@/lib/congregacao/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react'; // Para o botão de selecionar
import { EditableMemberCell } from './EditableMemberCell'; // Import the new component
import { Input } from '@/components/ui/input';

interface ScheduleTableProps {
  title: string;
  data: Designacao[];
  columns: { key: string; label: string }[];
  allMembers: Membro[];
  onCellClick?: (date: string, columnKey: string, originalMemberId: string | null, originalMemberName: string | null, tableTitle: string, finalized: boolean) => void;
  currentFullDateStrings: string[];
  isReadOnly: boolean;
}

export function ScheduleTable({
  title,
  data,
  columns,
  allMembers,
  onCellClick,
  currentFullDateStrings,
  isReadOnly,
}: ScheduleTableProps) {
  
  const getMemberName = (memberId: string | null): string | null => {
    if (!memberId) return null;
    const member = allMembers.find(m => m.id === memberId);
    return member ? member.nome : 'Desconhecido';
  };

  const noDataForTable = !data || data.length === 0;

  if (noDataForTable) {
    return (
      <Card className="flex-1 min-w-[300px]">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Nenhuma designação para exibir.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex-1 min-w-[300px]">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead 
                    key={col.key}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => {
                    const memberId = row[col.key] as string | null;
                    const memberName = getMemberName(memberId);
                    const fullDateStr = currentFullDateStrings[rowIndex]; 

                    if (col.key === 'data') {
                      return (
                        <TableCell key={col.key}>
                          <div className="flex items-center space-x-2">
                             <span>{row.data.split(' ')[0]}</span>
                             <Badge variant="outline" className={row.diaSemanaBadgeColor}>{row.data.split(' ')[1]}</Badge>
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell 
                        key={col.key}
                      >
                        {onCellClick && !isReadOnly ? (
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-normal text-primary hover:underline w-full justify-start"
                            onClick={() => {
                              if (onCellClick && fullDateStr) {
                                onCellClick(fullDateStr, col.key, memberId, memberName, title, false);
                              }
                            }}
                          >
                            {memberName || '--'}
                          </Button>
                        ) : (
                          memberName || '--'
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
