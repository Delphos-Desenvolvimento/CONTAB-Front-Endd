import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Link,
  Typography,
  alpha,
} from '@mui/material'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import {
  getPublicPrefeituraById,
  type PrefeituraLink,
} from '../../API/prefeituraLinks'
import {
  PREFEITURA_SYSTEMS,
  type PrefeituraSystemDef,
  type PrefeituraSystemKey,
} from '../../config/prefeituraSystems'

const pageBg = '#0b0e14'
const panelBg = '#12161f'
const panelBorder = 'rgba(255,255,255,0.08)'
const accent = '#75a7ff'
const textMuted = 'rgba(230,230,230,0.65)'

function isAllowed(pref: PrefeituraLink, key: PrefeituraSystemKey): boolean {
  if (key === 'pca') return !!pref.allowPca
  if (key === 'retencao') return !!pref.allowRetencao
  return !!pref.allowIa
}

function resolveUrl(pref: PrefeituraLink, system: PrefeituraSystemDef): string {
  if (system.key === 'pca') return pref.urlPca?.trim() || system.placeholderUrl
  if (system.key === 'retencao') return pref.urlRetencao?.trim() || system.placeholderUrl
  return pref.urlIa?.trim() || system.placeholderUrl
}

export default function PrefeituraSistemasPage() {
  const { id } = useParams<{ id: string }>()
  const prefId = Number(id)
  const [pref, setPref] = useState<PrefeituraLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!Number.isFinite(prefId)) {
        setError('Prefeitura inválida')
        setLoading(false)
        return
      }
      try {
        const data = await getPublicPrefeituraById(prefId)
        if (!cancelled) setPref(data)
      } catch {
        if (!cancelled) setError('Não foi possível carregar esta prefeitura.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [prefId])

  const systems = useMemo(() => {
    if (!pref) return []
    return PREFEITURA_SYSTEMS.filter((s) => isAllowed(pref, s.key)).map((s) => ({
      ...s,
      href: resolveUrl(pref, s),
    }))
  }, [pref])

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
      <Container maxWidth="md">
        <Button
          component={RouterLink}
          to="/prefeituras"
          startIcon={<ArrowLeft size={16} />}
          sx={{ color: accent, textTransform: 'none', mb: 3 }}
        >
          Voltar às prefeituras
        </Button>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: accent }} />
          </Box>
        ) : error || !pref ? (
          <Alert severity="error">{error || 'Prefeitura não encontrada'}</Alert>
        ) : (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 4,
                p: 2.5,
                borderRadius: 3,
                bgcolor: panelBg,
                border: `1px solid ${panelBorder}`,
              }}
            >
              {pref.imageBase64 ? (
                <Box
                  component="img"
                  src={pref.imageBase64}
                  alt=""
                  sx={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    borderRadius: 2,
                    bgcolor: alpha('#fff', 0.04),
                    p: 0.5,
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    bgcolor: alpha(accent, 0.12),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: accent,
                    fontWeight: 800,
                    fontSize: '1.1rem',
                  }}
                >
                  {pref.title.slice(0, 2).toUpperCase()}
                </Box>
              )}
              <Box>
                <Typography variant="overline" sx={{ color: accent, letterSpacing: '0.12em' }}>
                  Sistemas disponíveis
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#f5f7ff', fontSize: { xs: '1.5rem', md: '2rem' } }}>
                  {pref.title}
                </Typography>
                {pref.description && (
                  <Typography variant="body2" sx={{ color: textMuted, mt: 0.5 }}>
                    {pref.description}
                  </Typography>
                )}
              </Box>
            </Box>

            {systems.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 6,
                  borderRadius: 3,
                  border: `1px dashed ${panelBorder}`,
                  color: textMuted,
                }}
              >
                Nenhum sistema liberado para esta prefeitura.
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 2 }}>
                {systems.map((system) => {
                  const isPlaceholder = !system.href || system.href === '#'
                  return (
                    <Link
                      key={system.key}
                      component={isPlaceholder ? 'button' : 'a'}
                      href={isPlaceholder ? undefined : system.href}
                      target={isPlaceholder ? undefined : '_blank'}
                      rel={isPlaceholder ? undefined : 'noopener noreferrer'}
                      underline="none"
                      onClick={
                        isPlaceholder
                          ? (e) => {
                              e.preventDefault()
                            }
                          : undefined
                      }
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2.5,
                        textAlign: 'left',
                        width: '100%',
                        borderRadius: 3,
                        bgcolor: panelBg,
                        border: `1px solid ${panelBorder}`,
                        color: '#e8eaf0',
                        cursor: isPlaceholder ? 'default' : 'pointer',
                        transition: 'border-color 0.2s ease, transform 0.2s ease',
                        '&:hover': isPlaceholder
                          ? {}
                          : {
                              borderColor: alpha(system.accent, 0.7),
                              transform: 'translateY(-2px)',
                            },
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          bgcolor: alpha(system.accent, 0.16),
                          color: system.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {system.name.slice(0, 3).toUpperCase()}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} sx={{ color: '#f0f2f8' }}>
                          {system.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: textMuted }}>
                          {system.shortDescription}
                          {isPlaceholder ? ' — placeholder' : ''}
                        </Typography>
                      </Box>
                      {!isPlaceholder && <ExternalLink size={16} style={{ opacity: 0.7 }} />}
                    </Link>
                  )
                })}
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  )
}
