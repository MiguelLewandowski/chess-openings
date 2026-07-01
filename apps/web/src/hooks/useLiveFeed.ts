'use client'

import { useEffect, useState } from 'react'

// Conecta a um servidor WebSocket e devolve a última mensagem recebida (`data`)
// mais o estado da conexão (`connected`). Fecha o socket ao sair da página.
export function useLiveFeed<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket = new WebSocket(url)

    socket.onopen = () => setConnected(true)
    socket.onclose = () => setConnected(false)
    // A cada mensagem empurrada pelo servidor, atualiza o estado e a tela repinta.
    socket.onmessage = (event) => setData(JSON.parse(event.data) as T)

    return () => socket.close()
  }, [url])

  return { data, connected }
}
