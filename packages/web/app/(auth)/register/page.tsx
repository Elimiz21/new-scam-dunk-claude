'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth-store'

// Inline styles for consistent design
const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
    padding: '16px',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  container: {
    width: '100%',
    maxWidth: '400px'
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: '32px'
  },
  logoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: '#1e40af'
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    padding: '32px'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '24px'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.875rem',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
    color: '#1f2937',
    backgroundColor: 'white'
  },
  inputFocus: {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },
  inputError: {
    borderColor: '#ef4444'
  },
  inputContainer: {
    position: 'relative' as const
  },
  eyeButton: {
    position: 'absolute' as const,
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px'
  },
  error: {
    fontSize: '0.75rem',
    color: '#ef4444',
    marginTop: '4px'
  },
  alert: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  passwordRequirement: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.75rem',
    marginTop: '4px'
  },
  passwordRequirementMet: {
    color: '#059669'
  },
  passwordRequirementUnmet: {
    color: '#6b7280'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '0.875rem'
  },
  checkboxInput: {
    marginTop: '2px'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonHover: {
    backgroundColor: '#1d4ed8'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    fontSize: '0.75rem',
    color: '#6b7280',
    textTransform: 'uppercase' as const
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#e5e7eb'
  },
  dividerText: {
    padding: '0 12px',
    backgroundColor: 'white'
  },
  socialButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px'
  },
  socialButton: {
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    transition: 'border-color 0.2s, background-color 0.2s'
  },
  loginLink: {
    textAlign: 'center' as const,
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '500'
  }
}

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  terms: boolean
}

const passwordRequirements = [
  { regex: /.{8,}/, text: 'At least 8 characters long' },
  { regex: /[A-Z]/, text: 'Contains uppercase letter' },
  { regex: /[a-z]/, text: 'Contains lowercase letter' },
  { regex: /\d/, text: 'Contains number' },
  { regex: /[^A-Za-z0-9]/, text: 'Contains special character' },
]

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    terms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const registerUser = useAuthStore((state) => state.register)
  const authLoading = useAuthStore((state) => state.loading)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleInputChange = (field: keyof RegisterForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // Clear error when user types
  }

  const validatePassword = (password: string) => {
    return passwordRequirements.every(req => req.regex.test(password))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!validatePassword(formData.password)) {
      setError('Password must meet all requirements')
      return
    }

    if (!formData.terms) {
      setError('Please accept the terms and conditions')
      return
    }

    try {
      await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
      })

      router.replace('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>
          <Link href="/" style={styles.logoLink}>
            <Shield style={{ width: '40px', height: '40px' }} />
            <span style={styles.logoText}>Scam Dunk</span>
          </Link>
        </div>

        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Create your account</h1>
            <p style={styles.subtitle}>Join thousands of families staying safe from scams</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {error && (
              <div style={styles.alert}>
                <AlertCircle style={{ width: '16px', height: '16px' }} />
                {error}
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone Number (Optional)</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={styles.input}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                Used for emergency alerts and two-factor authentication
              </p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div>
                  {passwordRequirements.map((req, index) => {
                    const isMet = req.regex.test(formData.password)
                    return (
                      <div
                        key={index}
                        style={{
                          ...styles.passwordRequirement,
                          color: isMet ? styles.passwordRequirementMet.color : styles.passwordRequirementUnmet.color
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>{req.text}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputContainer}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  style={styles.input}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={styles.checkbox}>
              <input
                type="checkbox"
                id="terms"
                checked={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.checked)}
                style={styles.checkboxInput}
              />
              <label htmlFor="terms" style={{ fontSize: '0.875rem', color: '#374151' }}>
                I agree to the{' '}
                <Link href="/terms" style={styles.link}>Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" style={styles.link}>Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...(authLoading ? styles.buttonDisabled : {})
              }}
              disabled={authLoading}
              onMouseOver={(e) => !authLoading && (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => !authLoading && (e.currentTarget.style.backgroundColor = '#3b82f6')}
            >
              {authLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>Or continue with</span>
            <div style={styles.dividerLine}></div>
          </div>

          <div style={styles.socialButtons}>
            <button style={styles.socialButton}>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button style={styles.socialButton}>
              <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <p style={styles.loginLink}>
            Already have an account?{' '}
            <Link href="/login" style={styles.link}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
