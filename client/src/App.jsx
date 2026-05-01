import { useState, useEffect, useRef } from 'react'
import ContactList from './components/ContactList'
import ContactForm from './components/ContactForm'
import MessageComposer from './components/MessageComposer'
import SendProgress from './components/SendProgress'
import QRCode from 'qrcode'

const API_URL = 'https://throughout-persons-nevertheless-love.trycloudflare.com'

function App() {
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('whatsapp-contacts')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedContacts, setSelectedContacts] = useState([])
  const [message, setMessage] = useState('')
  const [delay, setDelay] = useState(5000)
  const [sending, setSending] = useState(false)
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })
  const [editingContact, setEditingContact] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected')
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const fileInputRef = useRef(null)
  const qrPollingRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('whatsapp-contacts', JSON.stringify(contacts))
  }, [contacts])

  // Poll status every 3s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/status`)
        const data = await res.json()
        setWhatsappStatus(data.status)
        if (data.status === 'connected') {
          setShowQRModal(false)
          setQrDataUrl(null)
        }
      } catch {
        setWhatsappStatus('disconnected')
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Poll QR code when modal is open
  useEffect(() => {
    if (showQRModal) {
      const pollQR = async () => {
        try {
          const res = await fetch(`${API_URL}/qr`)
          const data = await res.json()
          if (data.qr) {
            const dataUrl = await QRCode.toDataURL(data.qr, { width: 280, margin: 2 })
            setQrDataUrl(dataUrl)
          } else if (data.status === 'connected') {
            setShowQRModal(false)
            setQrDataUrl(null)
          }
        } catch (e) {
          // ignore
        }
      }
      pollQR()
      qrPollingRef.current = setInterval(pollQR, 2000)
      return () => clearInterval(qrPollingRef.current)
    } else {
      clearInterval(qrPollingRef.current)
    }
  }, [showQRModal])

  const connectWhatsApp = async () => {
    setWhatsappStatus('connecting')
    setQrDataUrl(null)
    setShowQRModal(true)
    try {
      const res = await fetch(`${API_URL}/connect`, { method: 'POST' })
      const data = await res.json()
      if (!data.success) {
        setWhatsappStatus('disconnected')
        setShowQRModal(false)
        alert(data.error || 'Erro ao conectar')
      }
    } catch (err) {
      setWhatsappStatus('disconnected')
      setShowQRModal(false)
      alert('Não foi possível conectar ao servidor. O servidor está rodando?')
    }
  }

  const disconnectWhatsApp = async () => {
    try {
      await fetch(`${API_URL}/disconnect`, { method: 'POST' })
      setWhatsappStatus('disconnected')
    } catch (e) {}
  }

  const parseVCF = (content) => {
    const contacts = []
    const vcards = content.split(/BEGIN:VCARD/i)
    
    for (const vcard of vcards) {
      if (!vcard.trim()) continue
      
      let name = ''
      let phone = ''
      
      // Divide por quebras de linha (suporta \n e \r\n)
      const lines = vcard.split(/\r?\n/)
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.toUpperCase().startsWith('FN:') || trimmedLine.toUpperCase().startsWith('FN;')) {
          // Pega tudo após o primeiro ':'
          name = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim()
        } else if (trimmedLine.toUpperCase().startsWith('TEL')) {
          // Extrai apenas os dígitos do que vem após o ':'
          const phonePart = trimmedLine.substring(trimmedLine.indexOf(':') + 1)
          phone = phonePart.replace(/\D/g, '')
        }
      }
      
      if (phone && phone.length >= 8) {
        contacts.push({ 
          id: Date.now() + Math.random(), 
          name: name || 'Sem nome', 
          phone: phone 
        })
      }
    }
    return contacts
  }

  const handleVCFImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const imported = parseVCF(event.target.result)
      if (imported.length > 0) {
        setContacts(prev => [...prev, ...imported])
        alert(`${imported.length} contato(s) importado(s)!`)
      } else {
        alert('Nenhum contato encontrado no arquivo')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const addContact = (contact) => {
    setContacts([...contacts, { ...contact, id: Date.now() }])
    setShowForm(false)
  }

  const updateContact = (updated) => {
    setContacts(contacts.map(c => c.id === updated.id ? updated : c))
    setEditingContact(null)
    setShowForm(false)
  }

  const deleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id))
    setSelectedContacts(selectedContacts.filter(cid => cid !== id))
  }

  const toggleSelect = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    setSelectedContacts(selectedContacts.length === contacts.length ? [] : contacts.map(c => c.id))
  }

  const formatPhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '')
    
    // Se começar com 0, remove o 0 (ex: 011...)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }

    // Se tiver 10 ou 11 dígitos (DDD + número), e não começar com 55, adiciona 55
    // Números no Brasil com DDD tem 10 ou 11 dígitos
    if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    
    return cleaned
  }

  const sendMessages = async () => {
    if (selectedContacts.length === 0 || !message.trim()) return

    setSending(true)
    setSendProgress({ current: 0, total: selectedContacts.length, success: 0, failed: 0 })

    const selected = contacts.filter(c => selectedContacts.includes(c.id))

    try {
      const res = await fetch(`${API_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: selected.map(c => ({ phone: formatPhone(c.phone), name: c.name })),
          message,
          delay
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSendProgress({ 
          current: selected.length, 
          total: selected.length, 
          success: data.successCount, 
          failed: data.failedCount 
        })
      } else {
        alert(data.error || 'Erro ao enviar mensagens')
      }
    } catch (err) {
      alert('Erro de conexão com o servidor')
    }

    setTimeout(() => {
      setSending(false)
      setSendProgress({ current: 0, total: 0, success: 0, failed: 0 })
    }, 3000)
  }

  const clearAllContacts = () => {
    if (window.confirm('Tem certeza que deseja remover TODOS os contatos da lista?')) {
      setContacts([])
      setSelectedContacts([])
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-gray-100 relative overflow-hidden">
      {/* Dynamic Particle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/10 rounded-full animate-float"
            style={{
              width: Math.random() * 4 + 'px',
              height: Math.random() * 4 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDuration: Math.random() * 10 + 10 + 's',
              animationDelay: Math.random() * 5 + 's'
            }}
          />
        ))}
      </div>

      <header className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.468A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.156 0-4.154-.684-5.787-1.848l-.414-.281-2.742.867.875-2.674-.308-.446A9.701 9.701 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                WhatsApp <span className="text-green-400">Ziv</span> Sender
              </h1>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">Premium Bulk Messaging</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all duration-500 ${
              whatsappStatus === 'connected' ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 
              whatsappStatus === 'connecting' || whatsappStatus === 'qr' ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${whatsappStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></span>
              {whatsappStatus === 'connected' ? 'SISTEMA ONLINE' : 
               whatsappStatus === 'connecting' ? 'INICIANDO...' : 
               whatsappStatus === 'qr' ? 'AGUARDANDO SCAN' : 'SISTEMA OFFLINE'}
            </div>
            {whatsappStatus === 'connected' ? (
              <button
                onClick={disconnectWhatsApp}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                Sair
              </button>
            ) : (
              <button
                onClick={connectWhatsApp}
                disabled={whatsappStatus === 'connecting'}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {whatsappStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 bg-[#020617]/90 backdrop-blur-sm" onClick={() => setShowQRModal(false)}></div>
          <div className="bg-[#1e293b] border border-white/10 rounded-[32px] shadow-2xl p-10 max-w-sm w-full relative z-10 text-center scale-in-center">
            <h2 className="text-2xl font-bold text-white mb-2">Escaneie o QR</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">Acesse o WhatsApp no seu celular e aponte a câmera para esta tela.</p>

            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-8">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-[240px] h-[240px]" />
              ) : (
                <div className="w-[240px] h-[240px] flex items-center justify-center text-green-500">
                  <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="w-full py-4 text-gray-400 hover:text-white transition-colors font-medium"
            >
              Cancelar Conexão
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-5 gap-8 relative z-10">
        <div className="md:col-span-3 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl flex flex-col h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h2 className="text-xl font-bold text-white">Contatos</h2>
                <p className="text-xs text-gray-500 font-medium">{contacts.length} registros encontrados</p>
              </div>
              <div className="flex gap-2">
                <input type="file" accept=".vcf" ref={fileInputRef} onChange={handleVCFImport} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-gray-300"
                  title="Importar VCF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
                <button
                  onClick={clearAllContacts}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20"
                  title="Limpar Lista"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                <button
                  onClick={() => { setShowForm(true); setEditingContact(null) }}
                  className="px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 transition-all active:scale-95"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {(showForm || editingContact) && (
                <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 slide-down">
                  <ContactForm
                    contact={editingContact}
                    onSave={editingContact ? updateContact : addContact}
                    onCancel={() => { setShowForm(false); setEditingContact(null) }}
                  />
                </div>
              )}

              <ContactList
                contacts={contacts}
                selected={selectedContacts}
                onToggle={toggleSelect}
                onSelectAll={selectAll}
                onEdit={(contact) => { setEditingContact(contact); setShowForm(true) }}
                onDelete={deleteContact}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl">
            <MessageComposer
              message={message}
              onChange={setMessage}
              delay={delay}
              onDelayChange={setDelay}
              selectedCount={selectedContacts.length}
              onSend={sendMessages}
              disabled={sending}
            />
          </div>

          {sending && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-xl animate-bounce-subtle">
              <SendProgress progress={sendProgress} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
