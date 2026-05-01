function MessageComposer({ message, onChange, selectedCount, onSend, disabled, delay, onDelayChange }) {
  return (
    <div className="bg-transparent p-0">
      <h2 className="text-xl font-bold text-white mb-4">Mensagem</h2>
      <textarea
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite sua mensagem aqui..."
        rows={8}
        className="w-full px-4 py-3 rounded-2xl focus:outline-none resize-none transition-all"
      />
      <div className="flex items-center gap-4 mt-4">
        <label className="text-sm text-gray-400">Intervalo entre mensagens:</label>
        <select
          value={delay}
          onChange={(e) => onDelayChange(Number(e.target.value))}
          className="bg-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none"
        >
          <option value={3000}>3 segundos</option>
          <option value={5000}>5 segundos</option>
          <option value={10000}>10 segundos</option>
          <option value={15000}>15 segundos</option>
          <option value={30000}>30 segundos</option>
        </select>
      </div>
      <div className="flex justify-between items-center mt-5">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          {selectedCount === 0
            ? 'Selecione contatos'
            : `${selectedCount} selecionado${selectedCount > 1 ? 's' : ''}`}
        </span>
        <button
          onClick={onSend}
          disabled={disabled || selectedCount === 0 || !message.trim()}
          className={`px-8 py-3 rounded-xl font-bold transition-all ${
            disabled || selectedCount === 0 || !message.trim()
              ? 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20 hover:-translate-y-0.5'
          }`}
        >
          {disabled ? 'Enviando...' : 'Enviar Mensagem'}
        </button>
      </div>
    </div>
  )
}

export default MessageComposer
