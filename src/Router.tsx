import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { parseRoute } from './route.ts'
import { useNotas } from './notas.ts'
import { toast } from 'sonner'
import { SidebarProvider } from '@/components/ui/sidebar.tsx'
import { Toaster } from '@/components/ui/sonner.tsx'

// Cada vista es code-split: al navegar solo se descarga lo que la ruta necesita.
const Landing = lazy(() => import('./Landing.tsx'))
const Cuestionarios = lazy(() => import('./Cuestionarios.tsx'))
const Antiguos = lazy(() => import('./Antiguos.tsx'))
const LectorArchivo = lazy(() => import('./LectorArchivo.tsx'))
const Cambios = lazy(() => import('./Cambios.tsx'))
const LectorNorma = lazy(() => import('./LectorNorma.tsx'))
const PaginaNotas = lazy(() => import('./PaginaNotas.tsx'))
const Guia = lazy(() => import('./Guia.tsx'))
const App = lazy(() => import('./App.tsx'))

function VistaCargando() {
  return (
    <div className="pantalla" role="status">
      Cargando…
    </div>
  )
}

export default function Router() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const notas = useNotas()

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // El aviso lo pidió la vista que estaba abierta: al cambiar de ruta no tiene nada
  // que decir sobre lo que se ve ahora.
  useEffect(() => {
    toast.dismiss()
  }, [route])

  const ir = useCallback((destino: string) => {
    location.hash = `/${destino.replace(/^\/+/, '')}`
  }, [])

  // El provider de shadcn va arriba de todo: el estado de la barra (y del atajo ⌘B) es
  // el mismo en el lector y en la guía, y se guarda entre sesiones.
  return (
    <SidebarProvider>
      {route.name === 'landing' && (
        <Suspense fallback={<VistaCargando />}>
          <Landing />
        </Suspense>
      )}
      {route.name === 'cuestionarios' && (
        <Suspense fallback={<VistaCargando />}>
          <Cuestionarios onInicio={() => ir('')} />
        </Suspense>
      )}
      {route.name === 'antiguos' && (
        <Suspense fallback={<VistaCargando />}>
          <Antiguos onInicio={() => ir('')} />
        </Suspense>
      )}
      {route.name === 'antiguo' && (
        <Suspense fallback={<VistaCargando />}>
          <LectorArchivo id={route.id} onNavigate={ir} />
        </Suspense>
      )}
      {route.name === 'cambios' && (
        <Suspense fallback={<VistaCargando />}>
          <Cambios onInicio={() => ir('')} />
        </Suspense>
      )}
      {route.name === 'cambio' && (
        <Suspense fallback={<VistaCargando />}>
          <LectorNorma norma={route.norma} bloque={route.bloque} onNavigate={ir} notas={notas} />
        </Suspense>
      )}
      {route.name === 'notas' && (
        <Suspense fallback={<VistaCargando />}>
          <PaginaNotas
            notas={notas.notas}
            onInicio={() => ir('')}
            onIr={(nota) => ir(`${nota.vista}/${nota.origen}?nota=${nota.id}`)}
            onQuitar={(nota) => notas.quitar(nota.id)}
            onColor={(nota, color) => notas.color(nota.id, color)}
            onEtiquetar={(nota, tag) => notas.etiquetar(nota.id, tag)}
            onDesetiquetar={(nota, tag) => notas.desetiquetar(nota.id, tag)}
            onCombinar={notas.combinar}
          />
        </Suspense>
      )}
      {route.name === 'guia' && (
        <Suspense fallback={<VistaCargando />}>
          <Guia
            id={route.id}
            nota={route.nota}
            notas={notas}
            onSelect={(id) => ir(`guia/${encodeURIComponent(id)}`)}
            onInicio={() => ir('')}
            onVolver={() => ir('guia')}
            onVerNotas={() => ir('notas')}
          />
        </Suspense>
      )}
      {route.name === 'rebt' && (
        <Suspense fallback={<VistaCargando />}>
          <App docId={route.id ?? undefined} nota={route.nota} notas={notas} onNavigate={ir} />
        </Suspense>
      )}
      <Toaster />
    </SidebarProvider>
  )
}
