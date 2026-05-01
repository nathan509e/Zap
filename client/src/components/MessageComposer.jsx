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
      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => onChange(message + '{{nome}}')}
          className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded-md border border-white/10 transition-all"
        >
          + Inserir {"{{nome}}"}
        </button>
      </div>
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-400">Smart Anti-Ban Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Intervalo:</span>
            <select
              value={delay}
              onChange={(e) => onDelayChange(Number(e.target.value))}
              className="bg-[#1e293b] text-white px-2 py-1 rounded-lg text-xs font-bold focus:outline-none border border-white/10 hover:border-white/20 transition-all cursor-pointer appearance-none"
              style={{ backgroundColor: '#1e293b', color: 'white' }}
            >
              <option value={3000} className="bg-[#1e293b] text-white">3s</option>
              <option value={5000} className="bg-[#1e293b] text-white">5s</option>
              <option value={10000} className="bg-[#1e293b] text-white">10s</option>
              <option value={15000} className="bg-[#1e293b] text-white">15s</option>
              <option value={30000} className="bg-[#1e293b] text-white">30s</option>
            </select>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 px-1 leading-relaxed">
          * O sistema adiciona automaticamente variações aleatórias no tempo e pausas humanas para proteger seu número contra bloqueios.
        </p>
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
