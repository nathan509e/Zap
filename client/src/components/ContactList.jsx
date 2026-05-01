function ContactList({ contacts, selected, onToggle, onSelectAll, onEdit, onDelete }) {
  if (contacts.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-medium">Nenhum contato ainda</p>
        <p className="text-sm mt-1">Clique em "Novo Contato" para começar</p>
      </div>
    )
  }

  return (
    <div>
      <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selected.length === contacts.length && contacts.length > 0}
          onChange={onSelectAll}
          className="w-4 h-4 text-[var(--wa-green)] rounded focus:ring-[var(--wa-green)]"
        />
        <span className="text-sm text-gray-600">
          {selected.length === contacts.length ? 'Desmarcar todos' : 'Selecionar todos'}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {contacts.map(contact => (
          <div
            key={contact.id}
            className={`p-3 border-b hover:bg-gray-50 transition-colors ${
              selected.includes(contact.id) ? 'bg-green-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(contact.id)}
                onChange={() => onToggle(contact.id)}
                className="w-4 h-4 text-[var(--wa-green)] rounded focus:ring-[var(--wa-green)]"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{contact.name}</p>
                <p className="text-sm text-gray-500">{contact.phone}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => onEdit(contact)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(contact.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
