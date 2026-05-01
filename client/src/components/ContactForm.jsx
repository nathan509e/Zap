import { useState, useEffect } from 'react'

function ContactForm({ contact, onSave, onCancel }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (contact) {
      setName(contact.name)
      setPhone(contact.phone)
    }
  }, [contact])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    onSave({
      id: contact?.id || Date.now(),
      name: name.trim(),
      phone: phone.trim()
    })

    setName('')
    setPhone('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          type="text"
          placeholder="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--wa-green)]"
          required
        />
      </div>
      <div>
        <input
          type="tel"
          placeholder="Telefone (ex: 5511999999999)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--wa-green)]"
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-[var(--wa-green)] hover:bg-[var(--wa-dark-green)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {contact ? 'Salvar' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default ContactForm
