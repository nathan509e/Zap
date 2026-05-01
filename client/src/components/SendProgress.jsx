function SendProgress({ progress }) {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Enviando mensagens...</h3>
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
        <div
          className="bg-[var(--wa-green)] h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{progress.current} de {progress.total}</span>
        <div className="flex gap-3">
          <span className="text-green-600">✓ {progress.success} enviados</span>
          {progress.failed > 0 && <span className="text-red-600">✗ {progress.failed} falhas</span>}
        </div>
      </div>
    </div>
  )
}

export default SendProgress
