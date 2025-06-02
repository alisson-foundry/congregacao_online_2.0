'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    // console.log('EditableMemberCell useEffect - currentMemberId:', currentMemberId);
    const member = allMembers.find(m => m.id === currentMemberId);
    // console.log('EditableMemberCell useEffect - found member:', member);
    setSelectedMemberName(member ? member.nome : null);
    setInputValue(member ? member.nome : '');
  }, [currentMemberId, allMembers]);

  const handleSelectMember = useCallback((memberId: string | null) => {
    console.log('EditableMemberCell - handleSelectMember called with memberId:', memberId);
    const member = allMembers.find(m => m.id === memberId);
    console.log('EditableMemberCell - Selected member object:', member);
    setSelectedMemberName(member ? member.nome : null);
    setInputValue(member ? member.nome : '');
    setPopoverOpen(false);
    setIsEditing(false);
    onMemberSelect(memberId);
  }, [allMembers, onMemberSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

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
        if (!isReadOnly) {
          if (currentMemberId) {
            // If there's a member, trigger the substitution modal flow
            // We pass the current memberId up via onMemberSelect.
            // The handling in ScheduleTable and ScheduleDisplay will open the modal.
            onMemberSelect(currentMemberId);
          } else if (!isEditing) {
            // If no member and not already editing, start editing to select one.
            setIsEditing(true);
            setTimeout(() => setPopoverOpen(true), 50);
            requestAnimationFrame(() => {
               if (inputRef.current) {
                  inputRef.current.focus();
               }
            });
          }
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
                onChange={handleInputChange}
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
                      onSelect={() => handleSelectMember(member.id)}
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
                       onSelect={() => handleSelectMember(null)}
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
        // Display mode - Add onClick here to also trigger for the span
        <span
           className={cn(
           "text-sm",
           !selectedMemberName && "text-muted-foreground italic",
           selectedMemberName && !isReadOnly && "text-primary hover:underline cursor-pointer"
        )}
           onClick={() => {
             if (!isReadOnly && currentMemberId) {
                // Also handle click on the displayed member name to open modal
                 onMemberSelect(currentMemberId);
             }
           }}
        >{selectedMemberName || placeholder}</span>
      )}
    </div>
  );
} 