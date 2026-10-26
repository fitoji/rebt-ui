import { useCallback, useEffect, useState } from 'react'
import App from './App.tsx'
import Guia from './Guia.tsx'
import Landing from './Landing.tsx'
import PaginaNotas from './PaginaNotas.tsx'
import { parseRoute } from './route.ts'
import { useNotas } from './notas.ts'
import { SidebarProvider } from '@/components/ui/sidebar.tsx'

export default function Router() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))
  const notas = useNotas()

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const ir = useCallback((destino: string) => {
    location.hash = `/${destino.replace(/^\/+/, '')}`
  }, [])

  // El provider de shadcn va arriba de todo: el estado de la barra (y el atajo ⌘B) es
  // el mismo en el lector y en la guía, y se guarda entre sesiones.
  return (
    <SidebarProvider>
      {route.name === 'landing' && <Landing onIr={ir} />}
      {route.name === 'notas' && (
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
      )}
      {route.name === 'guia' && (
        <Guia
          id={route.id}
          nota={route.nota}
          notas={notas}
          onSelect={(id) => ir(`guia/${encodeURIComponent(id)}`)}
          onInicio={() => ir('')}
          onVolver={() => ir('guia')}
          onVerNotas={() => ir('notas')}
        />
      )}
      {route.name === 'rebt' && (
        <App
          docId={route.id ?? undefined}
          nota={route.nota}
          notas={notas}
          onNavigate={ir}
        />
      )}
    </SidebarProvider>
  )
}
