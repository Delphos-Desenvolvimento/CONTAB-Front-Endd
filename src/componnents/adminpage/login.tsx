import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import type { NavigateFunction } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };
  const navigate: NavigateFunction = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/admin';

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to admin if already logged in
      const redirectTo = from || '/admin';
      navigate(redirectTo, { replace: true });
    } else {
      setApiStatus('idle');
    }
  }, [navigate, from]);

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      console.log('Sending login request with:', { email: email.trim() });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        const text = await response.text();
        console.error('Failed to parse JSON response:', { status: response.status, statusText: response.statusText, text });
        throw new Error('Resposta inválida do servidor');
      }
      
      console.log('Login response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      if (!response.ok) {
        throw new Error(data.message || `Erro no login: ${response.status}`);
      }
      
      // Store the JWT token and user data
      if (!data.access_token) {
        throw new Error('Token de autenticação não recebido');
      }
      
      localStorage.setItem('token', data.access_token);
      
      // Store user data if available
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      console.log('Login successful, token stored');
      
      // Redirect to admin dashboard after successful login
      const redirectTo = from || '/admin';
      console.log('Redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      console.error('Login error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      
      let errorMessage = 'Ocorreu um erro ao fazer login. Verifique suas credenciais.';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'url(/images/Pagina_Principal_sem_textos[1].png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Paper elevation={1} sx={{ 
        p: 2, 
        width: '100%', 
        maxWidth: 360,
        minHeight: 280,
        position: 'relative', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <Box textAlign="center" mb={3} sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box 
            component="img"
            src="/images/Logo_sem_fundo_Contab_2[1].png"
            alt="Logo"
            sx={{ 
              width: '280px',
              maxWidth: '100%',
              height: 'auto',
              mb: 1.5,
              objectFit: 'contain'
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', mt: 1 }}>
            Faça login para continuar
          </Typography>
        </Box>

        {apiStatus === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {apiStatus === 'checking' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Conectando ao servidor...
          </Alert>
        )}
        
        {error && apiStatus !== 'error' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            size="small"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            disabled={loading}
          />
          <TextField
            size="small"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    disabled={loading}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                      '& .MuiSvgIcon-root': {
                        color: 'rgba(0, 0, 0, 0.6)',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      },
                      padding: '4px',
                      marginRight: '-4px',
                    }}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' }, mt: 3, mb: 2, fontSize: '1.1rem', padding: '8px 16px', borderRadius: '8px' }}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>

          <Box textAlign="center">
            <Button 
              component={Link} 
              to="/" 
              color="primary"
              size="small"
              disabled={loading}
            >
              ← Voltar para o site
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}