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
import { Add, Delete, Edit } from '@mui/icons-material'
import {
  createPrefeituraLink,
  deletePrefeituraLink,
  getAdminPrefeituraLinks,
  updatePrefeituraLink,
  type CreatePrefeituraLinkDto,
  type PrefeituraLink,
} from '../../../API/prefeituraLinks'

const emptyForm = (): CreatePrefeituraLinkDto => ({
  title: '',
  url: '',
  description: '',
  imageBase64: '',
  order: 0,
  isActive: true,
  allowPca: true,
  allowRetencao: false,
  allowIa: false,
  urlPca: 'https://pca.iarm.dev.br/login',
  urlRetencao: '',
  urlIa: '',
})

const PrefeituraLinksAdminPage: React.FC = () => {
  const [links, setLinks] = useState<PrefeituraLink[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<PrefeituraLink | null>(null)
  const [formData, setFormData] = useState<CreatePrefeituraLinkDto>(emptyForm())
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
    setFormData({ ...emptyForm(), order: links.length })
    setOpenDialog(true)
  }

  const openEdit = (link: PrefeituraLink) => {
    setEditing(link)
    setFormData({
      title: link.title,
      url: link.url || '',
      description: link.description || '',
      imageBase64: link.imageBase64 || '',
      order: link.order,
      isActive: link.isActive,
      allowPca: link.allowPca ?? true,
      allowRetencao: link.allowRetencao ?? false,
      allowIa: link.allowIa ?? false,
      urlPca: link.urlPca || 'https://pca.iarm.dev.br/login',
      urlRetencao: link.urlRetencao || '',
      urlIa: link.urlIa || '',
    })
    setOpenDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Nome da prefeitura é obrigatório')
      return
    }
    if (!formData.allowPca && !formData.allowRetencao && !formData.allowIa) {
      setError('Libere ao menos um sistema (PCA, Retenção ou I.A)')
      return
    }
    try {
      if (editing) {
        await updatePrefeituraLink(editing.id, formData)
        setSuccess('Prefeitura atualizada!')
      } else {
        await createPrefeituraLink(formData)
        setSuccess('Prefeitura criada!')
      }
      setOpenDialog(false)
      await fetchLinks()
      setTimeout(() => setSuccess(''), 2500)
    } catch {
      setError('Erro ao salvar prefeitura')
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx. 5MB)')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, imageBase64: reader.result as string }))
    }
    reader.readAsDataURL(file)
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
              Cadastro em /prefeituras — cada ícone abre a página de sistemas liberados
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
            Adicionar prefeitura
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
                  <TableCell>Título</TableCell>
                  <TableCell>Sistemas</TableCell>
                  <TableCell>Ordem</TableCell>
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
                        {link.imageBase64 ? (
                          <Box
                            component="img"
                            src={link.imageBase64}
                            alt=""
                            sx={{ width: 40, height: 40, objectFit: 'contain' }}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{link.title}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {systemChips(link).length === 0 ? (
                            <Typography variant="caption" color="text.secondary">
                              Nenhum
                            </Typography>
                          ) : (
                            systemChips(link).map((name) => (
                              <Chip key={name} size="small" label={name} variant="outlined" />
                            ))
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{link.order}</TableCell>
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
                        <IconButton color="primary" size="small" onClick={() => openEdit(link)}>
                          <Edit />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => void handleDelete(link.id)}>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar prefeitura' : 'Nova prefeitura'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              margin="dense"
              label="Nome da prefeitura"
              fullWidth
              required
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Descrição"
              fullWidth
              value={formData.description || ''}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              sx={{ mb: 2 }}
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
              sx={{ mb: 2 }}
            />
            <Button variant="outlined" component="label" sx={{ mb: 1 }}>
              {formData.imageBase64 ? 'Trocar brasão / imagem' : 'Enviar brasão / imagem'}
              <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
            </Button>
            {formData.imageBase64 && (
              <Box
                component="img"
                src={formData.imageBase64}
                alt="Prévia"
                sx={{ display: 'block', maxHeight: 80, mb: 2 }}
              />
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive ?? true}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                />
              }
              label="Ativo"
            />

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Sistemas liberados
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
              Só os sistemas marcados aparecem na página da prefeitura. URLs opcionais; se vazias, usa placeholder.
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
              <TextField
                margin="dense"
                label="URL PCA"
                fullWidth
                placeholder="https://pca.iarm.dev.br/login"
                value={formData.urlPca || ''}
                onChange={(e) => setFormData((p) => ({ ...p, urlPca: e.target.value }))}
                sx={{ mb: 1.5 }}
              />
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
              <TextField
                margin="dense"
                label="URL Retenção (placeholder)"
                fullWidth
                placeholder="Em breve — deixe vazio"
                value={formData.urlRetencao || ''}
                onChange={(e) => setFormData((p) => ({ ...p, urlRetencao: e.target.value }))}
                sx={{ mb: 1.5 }}
              />
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
              <TextField
                margin="dense"
                label="URL I.A (placeholder)"
                fullWidth
                placeholder="Em breve — deixe vazio"
                value={formData.urlIa || ''}
                onChange={(e) => setFormData((p) => ({ ...p, urlIa: e.target.value }))}
                sx={{ mb: 1 }}
              />
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
