import { useState, useEffect, useRef } from 'react'
import ContactList from './components/ContactList'
import ContactForm from './components/ContactForm'
import MessageComposer from './components/MessageComposer'
import SendProgress from './components/SendProgress'
import QRCode from 'qrcode'

const API_URL = 'http://187.127.251.127:3001'

function App() {
  const [contacts, setContacts] = useState(() => {
    const saved = localStorage.getItem('whatsapp-contacts')
    return saved ? JSON.parse(saved) : []
  })
  const [selectedContacts, setSelectedContacts] = useState([])
  const [message, setMessage] = useState('')
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
          message
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[var(--wa-teal)] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.468A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.156 0-4.154-.684-5.787-1.848l-.414-.281-2.742.867.875-2.674-.308-.446A9.701 9.701 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
            </svg>
            <div>
              <h1 className="text-xl font-bold">WhatsApp Bulk Sender</h1>
              <p className="text-sm text-green-200">Envie mensagens para múltiplos contatos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm px-3 py-1 rounded-full ${
              whatsappStatus === 'connected' ? 'bg-green-500' : 
              whatsappStatus === 'connecting' || whatsappStatus === 'qr' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {whatsappStatus === 'connected' ? '✓ Conectado' : 
               whatsappStatus === 'connecting' ? '⏳ Iniciando...' : 
               whatsappStatus === 'qr' ? '📱 Escaneie o QR' : '✗ Desconectado'}
            </span>
            {whatsappStatus === 'connected' ? (
              <button
                onClick={disconnectWhatsApp}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={connectWhatsApp}
                disabled={whatsappStatus === 'connecting'}
                className="bg-[var(--wa-green)] hover:bg-[var(--wa-dark-green)] disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {whatsappStatus === 'connecting' ? 'Iniciando...' : 
                 whatsappStatus === 'qr' ? 'Ver QR Code' : 'Conectar WhatsApp'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* QR Code Modal */}
      {showQRModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.468A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.156 0-4.154-.684-5.787-1.848l-.414-.281-2.742.867.875-2.674-.308-.446A9.701 9.701 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>
              </svg>
              <h2 className="text-xl font-bold text-gray-800">Conectar WhatsApp</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Abra o WhatsApp no seu celular → Dispositivos conectados → Conectar dispositivo → Escaneie o QR Code
            </p>

            <div className="flex items-center justify-center min-h-[280px]">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code WhatsApp"
                  className="rounded-xl border-4 border-green-100 shadow"
                  style={{ width: 280, height: 280 }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-400">
                  <svg className="w-12 h-12 animate-spin text-green-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <p className="text-sm">Aguardando QR code...<br/>Pode levar alguns segundos</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              O QR code atualiza automaticamente a cada 2 segundos
            </p>
            <button
              onClick={() => setShowQRModal(false)}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Contatos ({contacts.length})
            </h2>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".vcf"
                ref={fileInputRef}
                onChange={handleVCFImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Importar VCF
              </button>
              <button
                onClick={() => { setShowForm(true); setEditingContact(null) }}
                className="bg-[var(--wa-green)] hover:bg-[var(--wa-dark-green)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                + Novo Contato
              </button>
            </div>
          </div>

          {(showForm || editingContact) && (
            <div className="p-4 border-b bg-gray-50">
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

        <div className="space-y-6">
          <MessageComposer
            message={message}
            onChange={setMessage}
            selectedCount={selectedContacts.length}
            onSend={sendMessages}
            disabled={sending}
          />

          {sending && (
            <SendProgress progress={sendProgress} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
