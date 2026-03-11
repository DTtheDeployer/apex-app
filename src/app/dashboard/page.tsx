export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A1628',
        color: '#E8EEF4',
        padding: '40px'
      }}
    >
      <h1 style={{ color: '#00A896', fontSize: '28px', marginBottom: '16px' }}>
        APEX Dashboard
      </h1>

      <p>Dashboard loaded successfully.</p>
    </div>
  )
}