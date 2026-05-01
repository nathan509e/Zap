import { useState, useEffect } from 'react'

function ContactForm({ contact, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  })

  useEffect(() => {
    if (contact) {
      setFormData({ name: contact.name, phone: contact.phone })
    }
  }, [contact])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...formData, id: contact?.id })
    setFormData({ name: '', phone: '' })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">WhatsApp</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="5511999999999"
            className="w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all"
            required
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-green-500/10"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all border border-white/5"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default ContactForm
