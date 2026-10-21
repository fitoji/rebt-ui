import { useCallback, useEffect, useState } from 'react'
import App from './App.tsx'
import Guia from './Guia.tsx'
import Landing from './Landing.tsx'
import PaginaNotas from './PaginaNotas.tsx'
import { parseRoute } from './route.ts'
import { useNotas } from './notas.ts'

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

  if (route.name === 'landing') return <Landing onIr={ir} />
  if (route.name === 'notas') {
    return (
      <PaginaNotas
        notas={notas.notas}
        onInicio={() => ir('')}
        onIr={(nota) => ir(`${nota.vista}/${nota.origen}?nota=${nota.id}`)}
        onQuitar={(nota) => notas.quitar(nota.id)}
        onColor={(nota, color) => notas.color(nota.id, color)}
      />
    )
  }
  if (route.name === 'guia') {
    return (
      <Guia
        id={route.id}
        nota={route.nota}
        notas={notas}
        onSelect={(id) => ir(`guia/${encodeURIComponent(id)}`)}
        onInicio={() => ir('')}
        onVolver={() => ir('guia')}
        onVerNotas={() => ir('notas')}
      />
    )
  }
  return (
    <App
      docId={route.id ?? undefined}
      nota={route.nota}
      notas={notas}
      onNavigate={ir}
    />
  )
}
