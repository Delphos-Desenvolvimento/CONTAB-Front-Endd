import React, { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Delete, Edit, Refresh, Search } from '@mui/icons-material'
import {
  createPrefeituraLink,
  deletePrefeituraLink,
  formatCnpj,
  getAdminPrefeituraLinks,
  lookupCnpja,
  refreshPrefeituraCnpja,
  updatePrefeituraLink,
  type CnpjaLookupResult,
  type CreatePrefeituraLinkDto,
  type PrefeituraLink,
} from '../../../API/prefeituraLinks'
import {
  DEFAULT_SYSTEM_DESCRIPTIONS,
  DEFAULT_SYSTEM_URLS,
} from '../../../config/prefeituraSystems'
import {
  fileToStoredImageDataUrl,
  normalizeImageSrc,
} from '../../../utils/imageStorage'

type FormState = CreatePrefeituraLinkDto & { passwordConfirm?: string }

const emptyForm = (): FormState => ({
  cnpj: '',
  password: '',
  passwordConfirm: '',
  description: '',
  imageBase64: '',
  order: 0,
  isActive: true,
  allowPca: true,
  allowRetencao: false,
  allowIa: false,
  urlPca: DEFAULT_SYSTEM_URLS.pca,
  urlRetencao: DEFAULT_SYSTEM_URLS.retencao,
  urlIa: DEFAULT_SYSTEM_URLS.ia,
  descPca: DEFAULT_SYSTEM_DESCRIPTIONS.pca,
  descRetencao: DEFAULT_SYSTEM_DESCRIPTIONS.retencao,
  descIa: DEFAULT_SYSTEM_DESCRIPTIONS.ia,
})

/** Avoid Chrome autofill green/yellow paint and label collisions in the dialog. */
const dialogFieldSx = {
  mb: 2,
  width: '100%',
  '& input': {
    WebkitTextFillColor: 'inherit',
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
    WebkitTextFillColor: 'inherit',
    transition: 'background-color 99999s ease-in-out 0s',
    boxShadow: '0 0 0 1000px #fff inset',
  },
}

const truncate = (value: string | null | undefined, max = 120) => {
  if (!value) return ''
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

const PrefeituraLinksAdminPage: React.FC = () => {
  const [links, setLinks] = useState<PrefeituraLink[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<PrefeituraLink | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm())
  const [lookup, setLookup] = useState<CnpjaLookupResult | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchLinks = async () => {
    try {
      setLoading(true)
      setLinks(await getAdminPrefeituraLinks())
    } catch {
      setError('Erro ao carregar prefeituras')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLinks()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setLookup(null)
    setFormData({ ...emptyForm(), order: links.length })
    setOpenDialog(true)
  }

  const openEdit = (link: PrefeituraLink) => {
    setEditing(link)
    setLookup(null)
    setFormData({
      cnpj: formatCnpj(link.cnpj || ''),
      password: '',
      passwordConfirm: '',
      title: link.title,
      description: link.description || '',
      imageBase64: normalizeImageSrc(link.imageBase64) || '',
      order: link.order,
      isActive: link.isActive,
      allowPca: link.allowPca ?? true,
      allowRetencao: link.allowRetencao ?? false,
      allowIa: link.allowIa ?? false,
      urlPca: link.urlPca || DEFAULT_SYSTEM_URLS.pca,
      urlRetencao: link.urlRetencao || DEFAULT_SYSTEM_URLS.retencao,
      urlIa: link.urlIa || DEFAULT_SYSTEM_URLS.ia,
      descPca: link.descPca || DEFAULT_SYSTEM_DESCRIPTIONS.pca,
      descRetencao: link.descRetencao || DEFAULT_SYSTEM_DESCRIPTIONS.retencao,
      descIa: link.descIa || DEFAULT_SYSTEM_DESCRIPTIONS.ia,
    })
    setOpenDialog(true)
  }

  const handleLookup = async () => {
    setError('')
    setLookingUp(true)
    try {
      const data = await lookupCnpja(formData.cnpj)
      setLookup(data)
      setFormData((p) => ({
        ...p,
        cnpj: formatCnpj(data.cnpj),
        title: data.title,
        description: truncate(data.description || '', 280),
      }))
    } catch (err: unknown) {
      setLookup(null)
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null
      setError(message || 'Falha ao consultar CNPJá')
    } finally {
      setLookingUp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!editing) {
      if (formData.cnpj.replace(/\D/g, '').length !== 14) {
        setError('CNPJ inválido')
        return
      }
      if (!formData.password || formData.password.length < 6) {
        setError('Senha deve ter ao menos 6 caracteres')
        return
      }
      if (formData.password !== formData.passwordConfirm) {
        setError('As senhas não coincidem')
        return
      }
      if (!lookup) {
        setError('Consulte o CNPJ no CNPJá antes de salvar')
        return
      }
    } else if (formData.password) {
      if (formData.password.length < 6) {
        setError('Senha deve ter ao menos 6 caracteres')
        return
      }
      if (formData.password !== formData.passwordConfirm) {
        setError('As senhas não coincidem')
        return
      }
    }

    if (!formData.allowPca && !formData.allowRetencao && !formData.allowIa) {
      setError('Libere ao menos um sistema (PCA, Retenção ou I.A)')
      return
    }

    try {
      if (editing) {
        const { passwordConfirm: _, cnpj: __, ...patch } = formData
        if (!patch.password) delete patch.password
        await updatePrefeituraLink(editing.id, patch)
        setSuccess('Prefeitura atualizada!')
      } else {
        const { passwordConfirm: _, ...payload } = formData
        await createPrefeituraLink(payload)
        setSuccess('Prefeitura cadastrada via CNPJá!')
      }
      setOpenDialog(false)
      await fetchLinks()
      setTimeout(() => setSuccess(''), 2500)
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : null
      setError(message || 'Erro ao salvar prefeitura')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir esta prefeitura?')) return
    try {
      await deletePrefeituraLink(id)
      setSuccess('Prefeitura excluída!')
      await fetchLinks()
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Erro ao excluir prefeitura')
    }
  }

  const handleRefresh = async (id: number) => {
    try {
      await refreshPrefeituraCnpja(id)
      setSuccess('Dados atualizados pelo CNPJá')
      await fetchLinks()
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Falha ao atualizar via CNPJá')
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setError('')
    void (async () => {
      try {
        const imageBase64 = await fileToStoredImageDataUrl(file)
        setFormData((prev) => ({ ...prev, imageBase64 }))
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Falha ao processar a imagem')
      }
    })()
  }

  const systemChips = (link: PrefeituraLink) => {
    const items: string[] = []
    if (link.allowPca) items.push('PCA')
    if (link.allowRetencao) items.push('Retenção')
    if (link.allowIa) items.push('I.A')
    return items
  }

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary">
              Prefeituras
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cadastro por CNPJ (CNPJá) · login público em /orgao
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Adicionar por CNPJ
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Imagem</TableCell>
                  <TableCell>CNPJ</TableCell>
                  <TableCell>Razão social</TableCell>
                  <TableCell>Sistemas</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      Nenhuma prefeitura cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        {normalizeImageSrc(link.imageBase64) ? (
                          <Box
                            component="img"
                            src={normalizeImageSrc(link.imageBase64)}
                            alt=""
                            sx={{ width: 40, height: 40, objectFit: 'contain' }}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {formatCnpj(link.cnpj || '')}
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>{link.tradeName || link.title}</Typography>
                        {link.tradeName && (
                          <Typography variant="caption" color="text.secondary">
                            {link.title}
                          </Typography>
                        )}
                        {(link.city || link.state) && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {[link.city, link.state].filter(Boolean).join('/')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {systemChips(link).map((name) => (
                            <Chip key={name} size="small" label={name} variant="outlined" />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={link.isActive ? 'Ativo' : 'Inativo'}
                          color={link.isActive ? 'success' : 'default'}
                          onClick={async () => {
                            await updatePrefeituraLink(link.id, { isActive: !link.isActive })
                            await fetchLinks()
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          size="small"
                          title="Atualizar CNPJá"
                          onClick={() => void handleRefresh(link.id)}
                        >
                          <Refresh />
                        </IconButton>
                        <IconButton color="primary" size="small" onClick={() => openEdit(link)}>
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => void handleDelete(link.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { maxHeight: '90vh' } }}
      >
        <DialogTitle>
          {editing ? 'Editar prefeitura' : 'Nova prefeitura (CNPJ + CNPJá)'}
        </DialogTitle>
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DialogContent dividers sx={{ overflowY: 'auto' }}>
            {!editing && (
              <>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    mb: 2,
                    alignItems: { xs: 'stretch', sm: 'flex-start' },
                  }}
                >
                  <TextField
                    margin="dense"
                    label="CNPJ"
                    fullWidth
                    required
                    value={formData.cnpj}
                    onChange={(e) => {
                      setLookup(null)
                      setFormData((p) => ({ ...p, cnpj: formatCnpj(e.target.value) }))
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      autoComplete: 'off',
                      inputMode: 'numeric',
                      maxLength: 18,
                    }}
                    sx={{ ...dialogFieldSx, mb: { xs: 0, sm: 0 }, flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={lookingUp ? <CircularProgress size={16} /> : <Search />}
                    onClick={() => void handleLookup()}
                    disabled={lookingUp || formData.cnpj.replace(/\D/g, '').length !== 14}
                    sx={{
                      mt: { xs: 0, sm: 1 },
                      whiteSpace: 'nowrap',
                      minWidth: { xs: '100%', sm: 140 },
                      flexShrink: 0,
                    }}
                  >
                    Consultar
                  </Button>
                </Box>

                {lookup && (
                  <Alert
                    severity="info"
                    sx={{
                      mb: 2,
                      alignItems: 'flex-start',
                      '& .MuiAlert-message': {
                        width: '100%',
                        minWidth: 0,
                        overflow: 'hidden',
                      },
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ wordBreak: 'break-word' }}
                    >
                      {truncate(lookup.title, 90)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    >
                      {[
                        lookup.tradeName,
                        lookup.registrationStatus,
                        truncate(lookup.mainActivity, 80),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 0.5, wordBreak: 'break-word' }}
                    >
                      {[lookup.street, lookup.addressNumber, lookup.district, lookup.city, lookup.state]
                        .filter(Boolean)
                        .join(', ')}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                      sx={{ mt: 1, wordBreak: 'break-word' }}
                    >
                      Dados CNPJá: razão social, fantasia, situação, CNAE e endereço.
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {editing && (
              <TextField
                margin="dense"
                label="CNPJ"
                fullWidth
                disabled
                value={formData.cnpj}
                InputLabelProps={{ shrink: true }}
                sx={dialogFieldSx}
              />
            )}

            <TextField
              margin="dense"
              label={editing ? 'Nova senha (opcional)' : 'Senha de acesso'}
              type="password"
              fullWidth
              required={!editing}
              value={formData.password}
              onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ autoComplete: 'new-password' }}
              sx={dialogFieldSx}
            />
            <TextField
              margin="dense"
              label="Confirmar senha"
              type="password"
              fullWidth
              required={!editing || !!formData.password}
              value={formData.passwordConfirm || ''}
              onChange={(e) => setFormData((p) => ({ ...p, passwordConfirm: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ autoComplete: 'new-password' }}
              sx={dialogFieldSx}
            />

            <TextField
              margin="dense"
              label="Descrição / observações"
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              value={formData.description || ''}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ ...dialogFieldSx, '& textarea': { wordBreak: 'break-word' } }}
            />
            <TextField
              margin="dense"
              label="Ordem"
              type="number"
              fullWidth
              value={formData.order ?? 0}
              onChange={(e) =>
                setFormData((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))
              }
              InputLabelProps={{ shrink: true }}
              sx={dialogFieldSx}
            />

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Button variant="outlined" component="label" sx={{ flexShrink: 0 }}>
                {formData.imageBase64 ? 'Trocar brasão / imagem' : 'Enviar brasão / imagem'}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
              {formData.imageBase64 ? (
                <Button
                  color="inherit"
                  onClick={() => setFormData((p) => ({ ...p, imageBase64: '' }))}
                  sx={{ textTransform: 'none' }}
                >
                  Remover imagem
                </Button>
              ) : null}
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    checked={formData.isActive ?? true}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                }
                label="Ativo"
              />
            </Box>
            {formData.imageBase64 ? (
              <Box
                component="img"
                src={normalizeImageSrc(formData.imageBase64)}
                alt="Prévia"
                sx={{ display: 'block', maxHeight: 96, maxWidth: '100%', mb: 2, objectFit: 'contain' }}
              />
            ) : null}

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Sistemas liberados
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.allowPca}
                  onChange={(e) => setFormData((p) => ({ ...p, allowPca: e.target.checked }))}
                />
              }
              label="PCA"
            />
            {formData.allowPca && (
              <>
                <TextField
                  margin="dense"
                  label="URL PCA"
                  fullWidth
                  value={formData.urlPca || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, urlPca: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...dialogFieldSx, mb: 1 }}
                />
                <TextField
                  margin="dense"
                  label="Descrição PCA"
                  fullWidth
                  value={formData.descPca || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, descPca: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  helperText="Texto exibido abaixo do nome do sistema na página de acesso"
                  sx={{ ...dialogFieldSx, mb: 1.5 }}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.allowRetencao}
                  onChange={(e) => setFormData((p) => ({ ...p, allowRetencao: e.target.checked }))}
                />
              }
              label="Retenção"
            />
            {formData.allowRetencao && (
              <>
                <TextField
                  margin="dense"
                  label="URL Retenção"
                  fullWidth
                  value={formData.urlRetencao || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, urlRetencao: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...dialogFieldSx, mb: 1 }}
                />
                <TextField
                  margin="dense"
                  label="Descrição Retenção"
                  fullWidth
                  value={formData.descRetencao || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, descRetencao: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText="Texto exibido abaixo do nome do sistema na página de acesso"
                  sx={{ ...dialogFieldSx, mb: 1.5 }}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={!!formData.allowIa}
                  onChange={(e) => setFormData((p) => ({ ...p, allowIa: e.target.checked }))}
                />
              }
              label="I.A"
            />
            {formData.allowIa && (
              <>
                <TextField
                  margin="dense"
                  label="URL I.A"
                  fullWidth
                  value={formData.urlIa || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, urlIa: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  sx={{ ...dialogFieldSx, mb: 1 }}
                />
                <TextField
                  margin="dense"
                  label="Descrição I.A"
                  fullWidth
                  value={formData.descIa || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, descIa: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  helperText="Texto exibido abaixo do nome do sistema na página de acesso"
                  sx={dialogFieldSx}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Salvar
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  )
}

export default PrefeituraLinksAdminPage
