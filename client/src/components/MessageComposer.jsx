function MessageComposer({ message, onChange, selectedCount, onSend, disabled }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Mensagem</h2>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite sua mensagem aqui..."
        rows={5}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--wa-green)] resize-none"
      />
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-500">
          {selectedCount === 0
            ? 'Selecione contatos para enviar'
            : `${selectedCount} contato${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`}
        </span>
        <button
          onClick={onSend}
          disabled={disabled || selectedCount === 0 || !message.trim()}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            disabled || selectedCount === 0 || !message.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[var(--wa-green)] hover:bg-[var(--wa-dark-green)] text-white'
          }`}
        >
          {disabled ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}

export default MessageComposer
