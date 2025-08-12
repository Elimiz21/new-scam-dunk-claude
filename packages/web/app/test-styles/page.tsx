'use client'

export default function TestStyles() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#3b82f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          🎨 Style Test SUCCESS!
        </h1>
        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          ✅ Blue background visible<br/>
          ✅ White card with shadow<br/>
          ✅ Proper typography<br/>
          ✅ Inline styles working!
        </p>
        <button style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          fontWeight: 'bold',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
          Test Button Working! 🚀
        </button>
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          If you see all these styles, the design system is working properly!
        </div>
      </div>
    </div>
  )
}