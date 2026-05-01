function ContactList({ contacts, selected, onToggle, onSelectAll, onEdit, onDelete }) {
  if (contacts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-bold text-gray-400">Nenhum contato ainda</p>
        <p className="text-sm mt-1">Adicione contatos para começar</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="p-4 bg-white/5 rounded-2xl flex items-center gap-3 mb-4 sticky top-0 backdrop-blur-md border border-white/5">
        <input
          type="checkbox"
          checked={selected.length === contacts.length && contacts.length > 0}
          onChange={onSelectAll}
          className="w-5 h-5 accent-green-500 rounded-lg cursor-pointer"
        />
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {selected.length === contacts.length ? 'Desmarcar todos' : 'Selecionar todos'}
        </span>
      </div>

      <div className="space-y-2">
        {contacts.map(contact => (
          <div
            key={contact.id}
            className={`p-4 rounded-2xl transition-all border group ${
              selected.includes(contact.id) 
                ? 'bg-green-500/10 border-green-500/20' 
                : 'bg-white/5 border-transparent hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={selected.includes(contact.id)}
                onChange={() => onToggle(contact.id)}
                className="w-5 h-5 accent-green-500 rounded-lg cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{contact.name}</p>
                <p className="text-sm text-gray-500 font-medium">{contact.phone}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(contact)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(contact.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Excluir"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContactList
