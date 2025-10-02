"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranscriptionSession } from "@/app/types";
import { cn } from "@/lib/utils";
import { FileClock, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

type SessionSidebarProps = {
  sessions: TranscriptionSession[];
  activeSessionId?: string;
  onSelectSession: (session: TranscriptionSession) => void;
  onDeleteSession: (sessionId: string) => void;
};

export function SessionSidebar({ sessions, activeSessionId, onSelectSession, onDeleteSession }: SessionSidebarProps) {
  const [sessionToDelete, setSessionToDelete] = useState<TranscriptionSession | null>(null);
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileClock className="h-5 w-5" />
            Archived Lectures
        </CardTitle>
        <CardDescription>Review your past transcription sessions.</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-6.5rem)] p-0">
        <ScrollArea className="h-full">
          {sessions.length > 0 ? (
            <div className="flex flex-col gap-1 p-2">
              {sessions.map((session) => (
                <div key={session.id} className="group relative rounded-md hover:bg-muted/50">
                  <button
                    className={cn(
                      "w-full justify-start text-left h-auto p-2 pr-10 rounded-md text-sm",
                      activeSessionId === session.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => onSelectSession(session)}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold truncate">{session.title}</span>
                      <span className={cn("text-xs text-muted-foreground", activeSessionId === session.id && "text-accent-foreground/70")}>
                        {new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  </button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => setSessionToDelete(session)}
                    aria-label={`Delete session ${session.title}`}
                   >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
              <p>No archived sessions yet. <br/> Stop a transcription to save it.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the session "{sessionToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if(sessionToDelete) {
                  onDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
