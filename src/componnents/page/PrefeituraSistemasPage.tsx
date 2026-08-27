import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
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
import { ArrowUpRight, LogOut, MapPin } from 'lucide-react'
import {
  getPrefeituraSession,
  getPublicPrefeituraById,
  logoutPrefeitura,
  type PrefeituraLink,
} from '../../API/prefeituraLinks'
import {
  PREFEITURA_SYSTEMS,
  type PrefeituraSystemDef,
  type PrefeituraSystemKey,
} from '../../config/prefeituraSystems'
import { normalizeImageSrc } from '../../utils/imageStorage'

const pageBg = '#0a0c12'
const panelBg = '#12151d'
const panelBorder = 'rgba(255,255,255,0.09)'
const accent = '#6b9dff'
const textMuted = 'rgba(226,232,240,0.62)'

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

function resolveDescription(
  pref: PrefeituraLink,
  system: PrefeituraSystemDef,
): string {
  if (system.key === 'pca') return pref.descPca?.trim() || system.shortDescription
  if (system.key === 'retencao') {
    return pref.descRetencao?.trim() || system.shortDescription
  }
  return pref.descIa?.trim() || system.shortDescription
}

function formatCnpjDisplay(cnpj: string): string {
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '132px 1fr' },
        gap: { xs: 0.35, sm: 2 },
        alignItems: 'baseline',
        py: 1.15,
        borderBottom: `1px solid ${alpha('#fff', 0.06)}`,
        '&:last-of-type': { borderBottom: 'none', pb: 0 },
        '&:first-of-type': { pt: 0 },
      }}
    >
      <Typography
        sx={{
          color: alpha('#fff', 0.42),
          fontWeight: 650,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.68rem',
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: '#eef2f8',
          fontWeight: 600,
          fontSize: { xs: '0.95rem', md: '1rem' },
          lineHeight: 1.4,
          fontVariantNumeric: label === 'CNPJ' ? 'tabular-nums' : undefined,
          letterSpacing: label === 'CNPJ' ? '0.02em' : undefined,
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}

export default function PrefeituraSistemasPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const prefId = Number(id)
  const session = getPrefeituraSession()
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
      shortDescription: resolveDescription(pref, s),
    }))
  }, [pref])

  const displayName = pref ? pref.tradeName || pref.title : ''
  const showRazao = !!(pref?.tradeName && pref.tradeName !== pref.title)
  const locationLabel = pref
    ? [pref.city, pref.state].filter(Boolean).join(' · ')
    : ''

  if (!session || session.id !== prefId) {
    return <Navigate to="/orgao" replace />
  }

  return (
    <Box
      sx={{
        minHeight: { xs: '70vh', md: '78vh' },
        px: { xs: 2, md: 3 },
        pt: { xs: 11, md: 13 },
        pb: { xs: 8, md: 10 },
        background: `
          radial-gradient(900px 420px at 50% -8%, ${alpha('#1e3a6e', 0.45)} 0%, transparent 60%),
          linear-gradient(180deg, #07090e 0%, ${pageBg} 42%, #0e1420 100%)
        `,
        color: '#e8eaf0',
      }}
    >
      <Container maxWidth="md">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: accent }} size={34} thickness={4} />
          </Box>
        ) : error || !pref ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error || 'Prefeitura não encontrada'}
          </Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: { xs: 3.5, md: 4.5 },
              animation: 'orgaoFadeIn 420ms ease-out',
              '@keyframes orgaoFadeIn': {
                from: { opacity: 0, transform: 'translateY(10px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Top bar */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: alpha(accent, 0.95),
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontSize: '0.68rem',
                  }}
                >
                  Painel do órgão
                </Typography>
                <Typography
                  sx={{
                    color: alpha('#fff', 0.55),
                    fontSize: '0.88rem',
                    mt: 0.4,
                  }}
                >
                  Selecione um sistema para continuar
                </Typography>
              </Box>
              <Button
                startIcon={<LogOut size={15} />}
                onClick={() => {
                  logoutPrefeitura()
                  navigate('/orgao', { replace: true })
                }}
                sx={{
                  color: textMuted,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 1.5,
                  border: `1px solid ${panelBorder}`,
                  bgcolor: alpha('#fff', 0.02),
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.05),
                    borderColor: alpha('#fff', 0.16),
                    color: '#fff',
                  },
                }}
              >
                Sair
              </Button>
            </Box>

            {/* Org identity */}
            <Box
              sx={{
                borderRadius: 3,
                border: `1px solid ${panelBorder}`,
                bgcolor: alpha(panelBg, 0.92),
                overflow: 'hidden',
                boxShadow: `0 18px 40px ${alpha('#000', 0.28)}`,
              }}
            >
              <Box
                sx={{
                  height: 3,
                  background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.15)})`,
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2.5, sm: 3.5 },
                  p: { xs: 2.75, md: 3.5 },
                  alignItems: { xs: 'stretch', sm: 'flex-start' },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 76, md: 92 },
                    height: { xs: 76, md: 92 },
                    borderRadius: 2.5,
                    flexShrink: 0,
                    border: `1px solid ${alpha(accent, 0.28)}`,
                    bgcolor: '#0a0e16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {normalizeImageSrc(pref.imageBase64) ? (
                    <Box
                      component="img"
                      src={normalizeImageSrc(pref.imageBase64)}
                      alt=""
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 1,
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        color: accent,
                        fontWeight: 800,
                        fontSize: { xs: '1.35rem', md: '1.55rem' },
                        letterSpacing: '0.04em',
                      }}
                    >
                      {displayName.slice(0, 2).toUpperCase()}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    component="h1"
                    sx={{
                      color: '#f7f9fc',
                      fontWeight: 800,
                      fontSize: { xs: '1.7rem', sm: '2rem', md: '2.25rem' },
                      lineHeight: 1.15,
                      letterSpacing: '-0.025em',
                      wordBreak: 'break-word',
                    }}
                  >
                    {displayName}
                  </Typography>

                  {locationLabel ? (
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.75,
                        mt: 1.1,
                        color: textMuted,
                        fontSize: '0.9rem',
                        fontWeight: 500,
                      }}
                    >
                      <MapPin size={14} style={{ opacity: 0.8 }} />
                      {locationLabel}
                    </Box>
                  ) : null}

                  <Box sx={{ mt: 2.25, maxWidth: 560 }}>
                    {showRazao ? (
                      <MetaRow label="Razão social" value={pref.title} />
                    ) : null}
                    {pref.cnpj ? (
                      <MetaRow label="CNPJ" value={formatCnpjDisplay(pref.cnpj)} />
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Systems */}
            {systems.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 7,
                  borderRadius: 3,
                  border: `1px dashed ${panelBorder}`,
                  color: textMuted,
                  bgcolor: alpha(panelBg, 0.5),
                }}
              >
                Nenhum sistema liberado para este órgão.
              </Box>
            ) : (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    gap: 2,
                    mb: 1.75,
                  }}
                >
                  <Typography
                    sx={{
                      color: accent,
                      letterSpacing: '0.12em',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Sistemas disponíveis
                  </Typography>
                  <Typography sx={{ color: alpha('#fff', 0.38), fontSize: '0.82rem' }}>
                    {systems.length} {systems.length === 1 ? 'módulo' : 'módulos'}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${panelBorder}`,
                    bgcolor: alpha(panelBg, 0.75),
                    overflow: 'hidden',
                  }}
                >
                  {systems.map((system, index) => {
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
                            ? (e: MouseEvent) => {
                                e.preventDefault()
                              }
                            : undefined
                        }
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          px: { xs: 2, md: 2.5 },
                          py: { xs: 2, md: 2.25 },
                          width: '100%',
                          textAlign: 'left',
                          color: '#e8eaf0',
                          cursor: isPlaceholder ? 'default' : 'pointer',
                          borderBottom:
                            index < systems.length - 1
                              ? `1px solid ${alpha('#fff', 0.06)}`
                              : 'none',
                          transition:
                            'background-color 180ms ease, padding-left 180ms ease',
                          '&:hover': isPlaceholder
                            ? {}
                            : {
                                bgcolor: alpha(system.accent, 0.07),
                                pl: { xs: 2.25, md: 2.85 },
                              },
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: system.iconSrc
                              ? '#080b12'
                              : alpha(system.accent, 0.12),
                            color: system.accent,
                            border: `1px solid ${alpha(system.accent, 0.22)}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            flexShrink: 0,
                            overflow: 'hidden',
                            p: system.iconSrc ? 0.6 : 0,
                          }}
                        >
                          {system.iconSrc ? (
                            <Box
                              component="img"
                              src={system.iconSrc}
                              alt=""
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            system.name.slice(0, 3).toUpperCase()
                          )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{
                              color: '#f4f6fb',
                              fontWeight: 700,
                              fontSize: '1.02rem',
                              lineHeight: 1.25,
                            }}
                          >
                            {system.name}
                          </Typography>
                          <Typography
                            sx={{
                              color: textMuted,
                              fontSize: '0.88rem',
                              mt: 0.35,
                              lineHeight: 1.4,
                            }}
                          >
                            {system.shortDescription}
                            {isPlaceholder ? ' — em breve' : ''}
                          </Typography>
                        </Box>

                        {!isPlaceholder ? (
                          <Box
                            sx={{
                              display: { xs: 'none', sm: 'inline-flex' },
                              alignItems: 'center',
                              gap: 0.6,
                              color: alpha(system.accent, 0.95),
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              flexShrink: 0,
                            }}
                          >
                            Acessar
                            <ArrowUpRight size={15} />
                          </Box>
                        ) : null}
                      </Link>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
