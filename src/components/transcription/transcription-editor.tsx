"use client";

import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Highlighter, StickyNote, Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TranscriptionSession } from '@/app/types';
import { Textarea } from '../ui/textarea';

type TranscriptionEditorProps = {
  content: string;
  onContentChange: (content: string) => void;
  isReadOnly: boolean;
  session: TranscriptionSession | null;
};

export function TranscriptionEditor({ content, onContentChange, isReadOnly, session }: TranscriptionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (!isReadOnly) {
      const newContent = e.currentTarget.innerHTML;
      if(contentRef.current !== newContent) {
        onContentChange(newContent);
        contentRef.current = newContent;
      }
    }
  };

  const handleHighlight = () => {
    if (document.queryCommandSupported('hiliteColor')) {
      document.execCommand('hiliteColor', false, 'hsl(var(--accent))');
      if (editorRef.current) {
        onContentChange(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex h-full flex-col lg:col-span-2">
            <div className="flex items-center justify-between pb-2">
                <h2 className="text-lg font-semibold">Lecture Transcription</h2>
                <div className="flex gap-2">
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isReadOnly} aria-label="Highlight text">
                              <Highlighter className="h-4 w-4" />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2">
                          <Button onClick={handleHighlight} disabled={isReadOnly}>Highlight Selected Text</Button>
                      </PopoverContent>
                  </Popover>
                </div>
            </div>
            <ScrollArea className="flex-1 rounded-md border bg-card">
              {!session && !isReadOnly ? (
                 <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                   <p>Click "Start Transcription" to begin a new session.</p>
                 </div>
              ) : (
                <div
                    ref={editorRef}
                    contentEditable={!isReadOnly}
                    onInput={handleInput}
                    suppressContentEditableWarning={true}
                    className="h-full min-h-[300px] p-4 text-sm leading-relaxed focus:outline-none"
                    aria-label="Transcription text"
                />
              )}
            </ScrollArea>
        </div>
        <div className="flex flex-col">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <StickyNote className="h-5 w-5" />
                        Notes & Summary
                    </CardTitle>
                    <CardDescription>Extras for your lecture.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {session?.summary && (
                        <div>
                            <h4 className="font-semibold mb-2">AI Summary</h4>
                            <ScrollArea className="h-32 rounded-md bg-muted p-3">
                              <p className="text-sm text-muted-foreground">{session.summary}</p>
                            </ScrollArea>
                        </div>
                    )}
                     {!session?.summary && session && (
                        <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 flex-shrink-0"/>
                            <span>Generate a summary after stopping transcription.</span>
                        </div>
                    )}
                    <div>
                        <h4 className="font-semibold mb-2">My Notes</h4>
                        <Textarea placeholder="Add your personal notes for this session..." className="h-48 resize-none" disabled={!session}/>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
