import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

interface EditableParagraphProps {
  text: string;
  onSave: (oldText: string, newText: string) => void;
  children?: React.ReactNode;
}

export function EditableParagraph({ text, onSave, children }: EditableParagraphProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sincronizar el valor si el texto original cambia por la API o por la red
  useEffect(() => {
    if (!isEditing) {
      setEditValue(text);
    }
  }, [text, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      // Ajustar la altura automáticamente
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
      // Poner el cursor al final
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleBlur = () => {
    saveAndClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveAndClose();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(text); // Revertir
    }
  };

  const saveAndClose = () => {
    if (editValue.trim() !== text.trim() && editValue.trim().length > 0) {
      onSave(text, editValue);
    } else {
      setEditValue(text); // Si está vacío se ignora
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        value={editValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full resize-none overflow-hidden bg-background/50 border-primary focus:ring-primary shadow-inner p-1 !my-1 text-inherit !text-base font-inherit leading-inherit whitespace-pre-wrap -ml-1 transition-all"
        )}
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      className="cursor-text hover:bg-black/5 dark:hover:bg-white/10 transition-colors rounded-sm px-1 py-0.5 -ml-1 inline-block"
      title="Doble clic para editar"
    >
      {children || editValue}
    </span>
  );
}
