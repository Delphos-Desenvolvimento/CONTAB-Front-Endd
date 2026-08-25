import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import { Edit, Delete, Add, DragIndicator } from '@mui/icons-material';
import { getAllLinksAdmin, createLink, updateLink, deleteLink, type Link, type CreateLinkDto } from '../../../API/content';
import { fileToStoredImageDataUrl, normalizeImageSrc } from '../../../utils/imageStorage';

const LinksAdminPage: React.FC = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [formData, setFormData] = useState<CreateLinkDto>({
    title: '',
    url: '',
    description: '',
    imageBase64: '',
    order: 0,
    isActive: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      console.log('Fetching links from API...');
      const data = await getAllLinksAdmin();
      console.log('Links received:', data);
      console.log('Number of links:', data.length);
      setLinks(data);
    } catch (error) {
      console.error('Erro ao buscar links:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      setError('Erro ao carregar links');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (link?: Link) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        title: link.title,
        url: link.url,
        description: link.description || '',
        imageBase64: link.imageBase64 || '',
        order: link.order,
        isActive: link.isActive
      });
    } else {
      setEditingLink(null);
      setFormData({
        title: '',
        url: '',
        description: '',
        imageBase64: '',
        order: links.length,
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLink(null);
    setFormData({
      title: '',
      url: '',
      description: '',
      imageBase64: '',
      order: 0,
      isActive: true
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.url.trim()) {
      setError('Título e URL são obrigatórios');
      return;
    }

    try {
      console.log('Submitting link data:', formData);
      if (editingLink) {
        const updated = await updateLink(editingLink.id, formData);
        console.log('Link updated:', updated);
        setSuccess('Link atualizado com sucesso!');
      } else {
        const created = await createLink(formData);
        console.log('Link created:', created);
        setSuccess('Link adicionado com sucesso!');
      }

      handleCloseDialog();
      fetchLinks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      setError('Erro ao salvar link');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este link?')) return;

    try {
      await deleteLink(id);
      setSuccess('Link excluído com sucesso!');
      fetchLinks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      setError('Erro ao excluir link');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'order' ? parseInt(value) || 0 : value)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    void (async () => {
      try {
        const imageBase64 = await fileToStoredImageDataUrl(file);
        setFormData((prev) => ({ ...prev, imageBase64 }));
        setError('');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Falha ao processar a imagem');
      }
    })();
  };

  const toggleActive = async (link: Link) => {
    try {
      await updateLink(link.id, { isActive: !link.isActive });
      setSuccess('Status atualizado!');
      fetchLinks();
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status');
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h2" fontWeight="bold" color="primary">
            Gerenciar Links Úteis
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Adicionar Link
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
                  <TableCell width="40"><DragIndicator color="disabled" /></TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {links.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhum link cadastrado ainda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  links.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        <DragIndicator color="disabled" sx={{ cursor: 'grab' }} />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">{link.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          component="a"
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {link.url.length > 40 ? link.url.substring(0, 40) + '...' : link.url}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {link.description || 'Sem descrição'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={link.isActive ? 'Ativo' : 'Inativo'}
                          color={link.isActive ? 'success' : 'default'}
                          size="small"
                          onClick={() => toggleActive(link)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(link)}
                          size="small"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(link.id)}
                          size="small"
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

      {/* Dialog para adicionar/editar link */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLink ? 'Editar Link' : 'Adicionar Novo Link'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Título"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleInputChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="url"
              label="URL"
              type="url"
              fullWidth
              variant="outlined"
              value={formData.url}
              onChange={handleInputChange}
              required
              placeholder="https://exemplo.com"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Descrição (opcional)"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="order"
              label="Ordem de exibição"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.order}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            {/* Image Upload */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Imagem do Link (opcional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
              >
                Escolher Imagem
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {formData.imageBase64 && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <img
                    src={normalizeImageSrc(formData.imageBase64)}
                    alt="Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      border: '1px solid #ddd'
                    }}
                  />
                  <Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setFormData(prev => ({ ...prev, imageBase64: '' }))}
                      sx={{ mt: 1 }}
                    >
                      Remover Imagem
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="Link ativo (visível na página pública)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingLink ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LinksAdminPage;
