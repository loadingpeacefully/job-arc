export default function ScanBanner({ msg, onClose }) {
  const colors = {
    success: { bg: 'rgba(57,255,20,0.05)',  border: 'rgba(57,255,20,0.2)',   color: '#39FF14' },
    error:   { bg: 'rgba(248,81,73,0.05)',  border: 'rgba(248,81,73,0.2)',   color: '#F85149' },
    info:    { bg: 'rgba(88,166,255,0.05)', border: 'rgba(88,166,255,0.2)',  color: '#58A6FF' },
  }
  const c = colors[msg.type] || colors.info

  return (
    <div className="animate-fade mono" style={{
      background: c.bg, borderBottom: `1px solid ${c.border}`,
      padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 12, color: c.color, letterSpacing: '0.05em' }}>{msg.text}</span>
      <button onClick={onClose} style={{
        background: 'transparent', border: 'none', color: c.color, fontSize: 18, lineHeight: 1, padding: 2,
      }}>×</button>
    </div>
  )
}
