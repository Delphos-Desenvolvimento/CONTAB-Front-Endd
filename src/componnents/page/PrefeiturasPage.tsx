import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  CircularProgress,
  Container,
  Link,
  Typography,
  alpha,
} from '@mui/material'
import { ChevronRight } from 'lucide-react'
import {
  getPublicPrefeituraLinks,
  type PrefeituraLink,
} from '../../API/prefeituraLinks'

const pageBg = '#0b0e14'
const panelBg = '#12161f'
const panelBorder = 'rgba(255,255,255,0.08)'
const accent = '#75a7ff'
const textMuted = 'rgba(230,230,230,0.65)'

export default function PrefeiturasPage() {
  const [links, setLinks] = useState<PrefeituraLink[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getPublicPrefeituraLinks()
        if (!cancelled) setLinks(data)
      } catch {
        if (!cancelled) setLinks([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
      <Container maxWidth="lg">
        <Box textAlign="center" mb={{ xs: 4, md: 6 }}>
          <Typography
            variant="overline"
            sx={{ color: accent, letterSpacing: '0.16em', fontWeight: 700 }}
          >
            Acessos
          </Typography>
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              color: '#f5f7ff',
              fontSize: { xs: '1.85rem', md: '2.6rem' },
              mt: 1,
            }}
          >
            Prefeituras
          </Typography>
          <Typography variant="body1" sx={{ color: textMuted, mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            Selecione a prefeitura para ver os sistemas disponíveis.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : links.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 3,
              borderRadius: 3,
              border: `1px dashed ${panelBorder}`,
              bgcolor: alpha(panelBg, 0.6),
            }}
          >
            <Typography sx={{ color: textMuted }}>
              Nenhuma prefeitura cadastrada ainda.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 2.5,
            }}
          >
            {links.map((item) => (
              <Link
                key={item.id}
                component={RouterLink}
                to={`/prefeituras/${item.id}`}
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2.5,
                  borderRadius: 3,
                  bgcolor: panelBg,
                  border: `1px solid ${panelBorder}`,
                  color: '#e8eaf0',
                  transition: 'border-color 0.2s ease, transform 0.2s ease, background-color 0.2s ease',
                  '&:hover': {
                    borderColor: alpha(accent, 0.55),
                    bgcolor: alpha(accent, 0.06),
                    transform: 'translateY(-3px)',
                  },
                }}
              >
                {item.imageBase64 ? (
                  <Box
                    component="img"
                    src={item.imageBase64}
                    alt=""
                    sx={{
                      width: 56,
                      height: 56,
                      objectFit: 'contain',
                      borderRadius: 1.5,
                      bgcolor: alpha('#fff', 0.04),
                      p: 0.5,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 1.5,
                      bgcolor: alpha(accent, 0.12),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: accent,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {item.title.slice(0, 2).toUpperCase()}
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={700} sx={{ color: '#f0f2f8' }}>
                    {item.title}
                  </Typography>
                  {item.description && (
                    <Typography variant="body2" sx={{ color: textMuted, mt: 0.35 }}>
                      {item.description}
                    </Typography>
                  )}
                </Box>
                <ChevronRight size={18} style={{ opacity: 0.65, flexShrink: 0 }} />
              </Link>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}
