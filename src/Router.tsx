import { useCallback, useEffect, useState } from 'react'
import App from './App.tsx'
import Guia from './Guia.tsx'
import Landing from './Landing.tsx'
import { parseRoute } from './route.ts'

export default function Router() {
  const [route, setRoute] = useState(() => parseRoute(location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const ir = useCallback((destino: string) => {
    location.hash = `/${destino.replace(/^\/+/, '')}`
  }, [])

  if (route.name === 'landing') return <Landing onIr={ir} />
  if (route.name === 'guia') {
    return (
      <Guia
        id={route.id}
        onSelect={(id) => ir(`guia/${encodeURIComponent(id)}`)}
        onInicio={() => ir('')}
        onVolver={() => ir('guia')}
      />
    )
  }
  return <App docId={route.id ?? undefined} onNavigate={ir} />
}
