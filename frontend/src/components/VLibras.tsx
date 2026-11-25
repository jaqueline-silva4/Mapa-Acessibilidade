import { useEffect } from 'react'

// VLibras: tradutor automático de textos para a Língua Brasileira de Sinais (Libras),
// oferecido pelo Governo Federal. https://vlibras.gov.br
//
// O plugin se inicia sozinho depois de carregado: cria o botão de acesso, em um
// shadow DOM, e só carrega o tradutor completo quando a pessoa clica nele.
const URL_SCRIPT = 'https://vlibras.gov.br/app/vlibras-plugin.js'
const ID_SCRIPT = 'vlibras-plugin-script'

export default function VLibras() {
  useEffect(() => {
    // Evita carregar o plugin mais de uma vez (por exemplo, no modo estrito do React).
    if (document.getElementById(ID_SCRIPT)) return

    // Se o script não carregar (sem internet, por exemplo), o site segue funcionando.
    const script = document.createElement('script')
    script.id = ID_SCRIPT
    script.src = URL_SCRIPT
    script.async = true
    document.body.appendChild(script)
  }, [])

  return null
}
