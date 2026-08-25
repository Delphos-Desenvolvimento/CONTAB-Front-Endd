import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { API_BASE_URL } from '../../API/baseUrl'
import {
  formatCnpj,
  type PrefeituraLoginResponse,
} from '../../API/prefeituraLinks'

const pageBg = '#0b0e14'
const panelBg = '#12161f'
const panelBorder = 'rgba(255,255,255,0.08)'
const accent = '#75a7ff'
const textMuted = 'rgba(230,230,230,0.65)'

const fieldSx = {
  mb: 2,
  '& .MuiOutlinedInput-root': {
    color: '#f5f7ff',
    backgroundColor: alpha('#000', 0.25),
    '& fieldset': { borderColor: panelBorder },
    '&:hover fieldset': { borderColor: alpha(accent, 0.45) },
    '&.Mui-focused fieldset': { borderColor: accent },
  },
  '& .MuiInputLabel-root': { color: textMuted },
  '& .MuiInputLabel-root.Mui-focused': { color: accent },
  // Chrome autofill on dark theme — avoids ghost/double text
  '& input': {
    color: '#f5f7ff',
    WebkitTextFillColor: '#f5f7ff',
    caretColor: '#f5f7ff',
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus':
    {
      WebkitTextFillColor: '#f5f7ff !important',
      caretColor: '#f5f7ff',
      transition: 'background-color 99999s ease-in-out 0s',
      boxShadow: `0 0 0 1000px ${panelBg} inset`,
      borderRadius: 'inherit',
    },
}

const PREF_TOKEN_KEY = 'prefeitura_token'
const PREF_DATA_KEY = 'prefeitura_session'

async function postPrefeituraLogin(
  cnpj: string,
  password: string,
): Promise<PrefeituraLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/prefeitura/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ cnpj, password }),
  })

  const raw = await res.text()
  let data: PrefeituraLoginResponse & { message?: string | string[] } = {
    access_token: '',
    prefeitura: {
      id: 0,
      cnpj: '',
      title: '',
      allowPca: false,
      allowRetencao: false,
      allowIa: false,
    },
  }
  try {
    data = raw ? JSON.parse(raw) : data
  } catch {
    throw new Error('Resposta inválida do servidor')
  }

  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message
    throw new Error(msg || `Falha no login (${res.status})`)
  }
  if (!data.access_token || !data.prefeitura?.id) {
    throw new Error('Resposta de login incompleta')
  }
  return data
}

export default function PrefeiturasPage() {
  const navigate = useNavigate()
  const [cnpj, setCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    // Prefer FormData so browser autofill values are included even if React state lagged
    const fd = new FormData(e.currentTarget)
    const cnpjRaw = String(fd.get('cnpj') || cnpj)
    const passwordRaw = String(fd.get('password') || password)
    const digits = cnpjRaw.replace(/\D/g, '')

    if (digits.length !== 14) {
      setError('Informe um CNPJ válido com 14 dígitos')
      return
    }
    if (!passwordRaw) {
      setError('Informe a senha')
      return
    }

    setLoading(true)
    try {
      const data = await postPrefeituraLogin(digits, passwordRaw)
      localStorage.setItem(PREF_TOKEN_KEY, data.access_token)
      localStorage.setItem(PREF_DATA_KEY, JSON.stringify(data.prefeitura))
      navigate(`/orgao/${data.prefeitura.id}`, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'CNPJ ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: { xs: '70vh', md: '78vh' },
        px: { xs: 2, md: 3 },
        pt: { xs: 12, md: 14 },
        pb: 8,
        background: `radial-gradient(1200px 500px at 50% -10%, #1a237e55 0%, transparent 55%),
          linear-gradient(165deg, #07090d 0%, ${pageBg} 45%, #10182b 100%)`,
        color: '#e8eaf0',
      }}
    >
      <Container maxWidth="sm">
        <Box textAlign="center" mb={4}>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: '#f5f7ff',
              fontSize: { xs: '1.85rem', md: '2.4rem' },
            }}
          >
            Acesso
          </Typography>
          <Typography variant="body1" sx={{ color: textMuted, mt: 1.5 }}>
            Entre com o CNPJ e a senha cadastrados pelo administrador Contab.
          </Typography>
        </Box>

        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            bgcolor: panelBg,
            border: `1px solid ${panelBorder}`,
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            name="cnpj"
            label="CNPJ"
            fullWidth
            required
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            onBlur={(e) => setCnpj(formatCnpj(e.target.value))}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              inputMode: 'numeric',
              autoComplete: 'off',
              autoCorrect: 'off',
              autoCapitalize: 'off',
              spellCheck: false,
              maxLength: 18,
            }}
            sx={fieldSx}
          />

          <TextField
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'new-password' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label="mostrar senha"
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    sx={{ color: textMuted }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ ...fieldSx, mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{
              py: 1.4,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: accent,
              color: '#0b0e14',
              '&:hover': { bgcolor: alpha(accent, 0.85) },
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: '#0b0e14' }} />
            ) : (
              'Entrar'
            )}
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
