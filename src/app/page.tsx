'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Monitor, ShieldCheck, GraduationCap, Users, User, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SettingsButton } from '@/components/settings/SettingsButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Home() {
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen items-center justify-start sm:justify-center p-4 pt-20 sm:pt-4 pb-10 sm:pb-4 overflow-x-hidden">
      <div className="absolute top-4 right-4">
        <SettingsButton />
      </div>
      <div className="max-w-5xl w-full mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Accesibilidad Educativa en Tiempo Real
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Transcribe<span className="text-primary">Assist</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Una plataforma inteligente diseñada para cerrar la brecha de comunicación en el aula,
            convirtiendo voz a texto al instante con herramientas integradas de aprendizaje.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Card Maestro */}
          <Link href="/teacher" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 overflow-hidden group-hover:bg-primary/[0.02]">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Maestro</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                  Inicia una sala y comparte la transcripción de tu clase en tiempo real.
                  Permite que tus alumnos sigan cada palabra y tomen notas.
                </p>
                <div className="flex items-center text-primary font-semibold text-sm">
                  Empezar clase <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Alumno */}
          <Link href="/student" className="group">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 overflow-hidden group-hover:bg-primary/[0.02]">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Alumno</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                  Conéctate a la sala de tu maestro. Visualiza la transcripción,
                  toma notas personalizadas y utiliza el marcador para estudiar mejor.
                </p>
                <div className="flex items-center text-primary font-semibold text-sm">
                  Unirse a sala <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Personal */}
          <Link href="/solo" className="group md:col-span-2 lg:col-span-1">
            <Card className="h-full border-2 border-transparent transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 overflow-hidden group-hover:bg-primary/[0.02]">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                  <User className="h-7 w-7" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Uso Personal</h2>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-grow">
                  Ideal para conferencias o estudio individual. Acceso a todas las herramientas
                  sin necesidad de compartir sala o estar conectado.
                </p>
                <div className="flex items-center text-primary font-semibold text-sm">
                  Modo individual <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Bloque de espacio vacío exclusivo para móvil para evitar solapamiento */}
        <div className="h-10 sm:hidden" aria-hidden="true" />
      </div>

      {/* Aviso legal en el pie de página */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              Este software <strong>no graba ni almacena audio</strong>. Únicamente genera una transcripción en texto plano
              procesada localmente en tu navegador. Al utilizar esta herramienta, aceptas nuestros{' '}
              <button
                onClick={() => setTermsOpen(true)}
                className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
              >
                Términos de Uso
              </button>.
            </p>
          </div>
        </div>
      </div>

      {/* Diálogo de Términos de Uso */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Términos de Uso y Aviso de Privacidad
            </DialogTitle>
            <DialogDescription>
              Última actualización: Febrero 2026
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-4">
            <div className="space-y-6 text-sm leading-relaxed text-muted-foreground pb-4">

              <section>
                <h3 className="font-semibold text-foreground mb-2">1. Propósito del Software</h3>
                <p>
                  Este sistema de transcripción automática ha sido desarrollado como parte de un proyecto académico
                  con el objetivo de facilitar la accesibilidad en entornos educativos. Está diseñado para
                  convertir voz en texto en tiempo real, apoyando a estudiantes con discapacidad auditiva
                  y a cualquier persona que se beneficie de una transcripción textual de las exposiciones.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">2. No Grabación de Audio</h3>
                <p>
                  Este software <strong className="text-foreground">no graba, almacena ni transmite audio</strong> en
                  ningún momento. El procesamiento de voz se realiza íntegramente a través de la API de
                  Reconocimiento de Voz nativa del navegador (Web Speech API). El audio captado por el micrófono
                  es procesado en tiempo real y descartado inmediatamente; únicamente el texto resultante de la
                  transcripción es mostrado en pantalla.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">3. Tratamiento de Datos</h3>
                <p>
                  La transcripción generada se mantiene exclusivamente en la memoria del navegador durante
                  la sesión activa. <strong className="text-foreground">No se envían datos a servidores externos ni se
                    almacenan en bases de datos</strong>. En el modo de maestro con sala compartida, el texto se
                  transmite directamente entre dispositivos mediante conexión punto a punto (P2P), sin pasar
                  por servidores intermedios. Al cerrar o recargar la página, toda la información se elimina.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">4. Consentimiento de Uso</h3>
                <p>
                  Al acceder y utilizar este software, el usuario declara que:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>Ha leído y comprendido estos términos de uso.</li>
                  <li>Acepta que la transcripción es una aproximación automática y puede contener errores.</li>
                  <li>Es responsable de informar a las personas presentes que se está realizando una transcripción en texto.</li>
                  <li>Se compromete a utilizar el software con fines lícitos y conforme a la normatividad aplicable.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">5. Precisión de la Transcripción</h3>
                <p>
                  La transcripción se genera mediante reconocimiento de voz automático y su precisión depende
                  de múltiples factores como la calidad del micrófono, el ruido ambiental y la dicción del
                  hablante. <strong className="text-foreground">El texto resultante no debe considerarse como una
                    transcripción oficial o certificada</strong>, y no sustituye a servicios profesionales de
                  interpretación o estenografía.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">6. Propiedad Intelectual</h3>
                <p>
                  Este software es un producto académico desarrollado como parte de un trabajo de tesis.
                  Todos los derechos sobre el código, diseño y funcionalidad están reservados por sus autores.
                  Se permite su uso con fines educativos y de accesibilidad conforme a los términos aquí descritos.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">7. Limitación de Responsabilidad</h3>
                <p>
                  Los desarrolladores de este software no se hacen responsables de:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                  <li>Errores, omisiones o inexactitudes en la transcripción generada.</li>
                  <li>El uso indebido que terceros puedan dar al texto transcrito.</li>
                  <li>Interrupciones o fallos derivados de la compatibilidad del navegador o la conectividad.</li>
                  <li>Cualquier daño directo o indirecto derivado del uso del software.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">8. Modificaciones</h3>
                <p>
                  Estos términos pueden ser actualizados en cualquier momento sin previo aviso. Se recomienda
                  revisarlos periódicamente. El uso continuado del software después de cualquier modificación
                  constituye la aceptación de los términos actualizados.
                </p>
              </section>

            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setTermsOpen(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
