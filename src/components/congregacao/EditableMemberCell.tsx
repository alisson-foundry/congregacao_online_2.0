'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Membro } from '@/lib/congregacao/types';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableMemberCellProps {
  currentMemberId: string | null;
  allMembers: Membro[];
  onMemberSelect: (newMemberId: string | null) => void;
  placeholder?: string;
  isReadOnly?: boolean;
}

export function EditableMemberCell({
  currentMemberId,
  allMembers,
  onMemberSelect,
  placeholder = 'Adicionar...',
  isReadOnly = false,
}: EditableMemberCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find initial selected member name
  useEffect(() => {
    const member = allMembers.find(m => m.id === currentMemberId);
    setSelectedMemberName(member ? member.nome : null);
    setInputValue(member ? member.nome : '');
  }, [currentMemberId, allMembers]);

  const handleSelect = (memberId: string | null) => {
    const member = allMembers.find(m => m.id === memberId);
    const newName = member ? member.nome : null;
    setSelectedMemberName(newName);
    setInputValue(newName || '');
    onMemberSelect(memberId);
    setIsEditing(false);
    setPopoverOpen(false);
  };

  const filteredMembers = allMembers.filter(member =>
    member.nome.toLowerCase().includes(inputValue.toLowerCase())
  );

  if (isReadOnly) {
    return <span>{selectedMemberName || '--'}</span>;
  }

  return (
    <div
      ref={containerRef}
      className="w-full cursor-pointer"
      onClick={() => {
        if (!isEditing && !isReadOnly) {
          setIsEditing(true);
          setTimeout(() => setPopoverOpen(true), 50);
          requestAnimationFrame(() => {
             if (inputRef.current) {
                inputRef.current.focus();
             }
          });
        }
      }}
      onBlur={(e) => {
        if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
           setTimeout(() => {
             if (!popoverOpen) {
                const member = allMembers.find(m => m.id === currentMemberId);
                const currentName = member ? member.nome : null;
                setInputValue(currentName || '');
                setSelectedMemberName(currentName);
                setIsEditing(false);
             }
           }, 100);
        }
      }}
      tabIndex={isReadOnly ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isEditing && !isReadOnly) {
          setIsEditing(true);
           setTimeout(() => setPopoverOpen(true), 50);
           requestAnimationFrame(() => {
             if (inputRef.current) {
                inputRef.current.focus();
             }
          });
        }
      }}
    >
      {isEditing ? (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
             <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="h-6 p-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    const member = allMembers.find(m => m.id === currentMemberId);
                    const currentName = member ? member.nome : null;
                    setInputValue(currentName || '');
                    setSelectedMemberName(currentName);
                    setIsEditing(false);
                    setPopoverOpen(false);
                  }
                }}
             />
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Buscar membro..." className="h-8 text-sm" value={inputValue} onValueChange={setInputValue} />
              <CommandList>
                <CommandEmpty>Membro não encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.nome}
                      onSelect={() => handleSelect(member.id)}
                      className="text-sm"
                    >
                      {member.nome}
                      <Check
                        className={cn(
                          'ml-auto h-4 w-4',
                          selectedMemberName === member.nome ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  ))}
                   {/* Option to clear the assignment */}
                   {selectedMemberName && (
                     <CommandItem
                       value="Limpar Designação"
                       onSelect={() => handleSelect(null)}
                       className="text-sm text-red-500"
                     >
                       Limpar Designação
                     </CommandItem>
                   )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        // Display mode
        <span className={cn(
           "text-sm",
           !selectedMemberName && "text-muted-foreground italic"
        )}>{selectedMemberName || placeholder}</span>
      )}
    </div>
  );
} 