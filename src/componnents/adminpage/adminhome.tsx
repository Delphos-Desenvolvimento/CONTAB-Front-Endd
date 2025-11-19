import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NewsService, { type NewsItem as ApiNewsItem } from '../../API/news';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Collapse,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  DeleteForever as DeleteForeverIcon,
  Description as DescriptionIcon,
  Menu as MenuIcon,
  Archive as ArchiveIcon,
  RestoreFromTrash as RestoreIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

// Dados de exemplo para estatísticas
const statsData = [
  { 
    title: 'Total de Usuários', 
    value: '1,254', 
    icon: <PeopleIcon fontSize="large" color="primary" />,
    progress: 75,
    trend: 'up'
  },
  { 
    title: 'Documentos Pendentes', 
    value: '24', 
    icon: <DescriptionIcon fontSize="large" color="secondary" />,
    progress: 30,
    trend: 'down'
  },
  { 
    title: 'Notícias Publicadas', 
    value: '156', 
    icon: <ArticleIcon fontSize="large" color="info" />,
    progress: 45,
    trend: 'up'
  }
];

interface ListItemLinkProps {
  icon?: React.ReactNode;
  primary: string;
  to: string;
}

const ListItemLink = (props: ListItemLinkProps) => {
  const { icon, primary, to } = props;
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <ListItemButton
      component="a"
      href={to}
      selected={isActive}
      sx={{
        '&.Mui-selected': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
          },
        },
      }}
    >
      {icon ? <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>{icon}</ListItemIcon> : null}
      <ListItemText primary={primary} primaryTypographyProps={{ color: isActive ? 'primary' : 'inherit' }} />
    </ListItemButton>
  );
};

export default function AdminHome() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleEditNews = () => {
    navigate('/admin/noticias');
  };

  const drawer = (
    <div>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" color="primary">
          Painel Administrativo
        </Typography>
      </Box>
      <Divider />
      <List>
        <ListItemLink to="/admin" icon={<DashboardIcon />} primary="Dashboard" />
        <ListItemLink to="/admin/noticias" icon={<ArticleIcon />} primary="Notícias" />
        <ListItemLink to="/admin/configuracoes" icon={<SettingsIcon />} primary="Configurações" />
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
        >
          Sair
        </Button>
      </Box>
    </div>
  );

  // Estado para gerenciamento de notícias
  type NewsItem = {
    id: number | null;
    title: string;
    content: string;
    category: string;
    status: 'rascunho' | 'publicada' | 'arquivada';
    date: string;
    views?: number;
  };
  
  // Função para converter da API para o tipo local
  const toLocalNewsItem = (apiItem: ApiNewsItem): NewsItem => ({
    id: apiItem.id ?? null,
    title: apiItem.title,
    content: apiItem.content,
    category: apiItem.category,
    status: apiItem.status,
    date: apiItem.date,
    views: apiItem.views
  });
  
  // Função para converter para o tipo da API
  const toApiNewsItem = (item: NewsItem): Omit<ApiNewsItem, 'id'> & { id?: number } => ({
    id: item.id ?? undefined,
    title: item.title,
    content: item.content,
    category: item.category,
    status: item.status,
    date: item.date,
    views: item.views ?? 0
  });

  // Estado para controlar a aba ativa (notícias ativas ou histórico)
  const [activeTab, setActiveTab] = useState('active');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Estados para notícias ativas e histórico
  const [activeNews, setActiveNews] = useState<NewsItem[]>([]);
  const [newsHistory, setNewsHistory] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega as notícias da API
  const loadNews = useCallback(async () => {
    try {
      setIsLoading(true);
      const allNews = await NewsService.getAll();
      
      // Separa notícias ativas (não arquivadas) do histórico (arquivadas)
      const active = allNews
        .filter((news: ApiNewsItem) => news.status !== 'arquivada')
        .map(toLocalNewsItem);
        
      const history = allNews
        .filter((news: ApiNewsItem) => news.status === 'arquivada')
        .map(toLocalNewsItem);
      
      setActiveNews(active);
      setNewsHistory(history);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar notícias. Tente novamente mais tarde.',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega as notícias quando o componente é montado
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Estados para controle da interface
  const [openNewsDialog, setOpenNewsDialog] = useState(false);
  const [currentNews, setCurrentNews] = useState<NewsItem & { imagePreview?: string }>({
    id: null,
    title: '',
    content: '',
    category: 'Notícia',
    status: 'rascunho',
    date: new Date().toISOString().split('T')[0],
    views: 0,
    imagePreview: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSaveNews = async (updatedNews: NewsItem) => {
    try {
      if (updatedNews.id) {
        // Atualiza notícia existente
        const { id, ...updateData } = toApiNewsItem(updatedNews);
        const updated = await NewsService.update(
          id!, 
          updateData,
          selectedImageFile ? [selectedImageFile] : undefined
        );
        
        setActiveNews(prevNews => 
          prevNews.map(item => item.id === updated.id ? toLocalNewsItem(updated) : item)
        );
        
        setSnackbar({
          open: true,
          message: 'Notícia atualizada com sucesso!',
          severity: 'success'
        });
      } else {
        // Cria nova notícia
        const newNews = await NewsService.create(
          {
            ...toApiNewsItem(updatedNews),
            date: new Date().toISOString().split('T')[0]
          },
          selectedImageFile ? [selectedImageFile] : undefined
        );
        
        setActiveNews(prevNews => [toLocalNewsItem(newNews), ...prevNews]);
        
        setSnackbar({
          open: true,
          message: 'Notícia adicionada com sucesso!',
          severity: 'success'
        });
      }
      setOpenNewsDialog(false);
      setSelectedImageFile(null);
      setCurrentNews(prev => ({ ...prev, imagePreview: '' }));
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar a notícia. Verifique os dados e tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleArchiveNews = async (id: number) => {
    try {
      const archivedNews = await NewsService.archive(id);
      
      setActiveNews(prevNews => prevNews.filter(news => news.id !== id));
      setNewsHistory(prevHistory => [toLocalNewsItem(archivedNews), ...prevHistory]);
      
      setSnackbar({
        open: true,
        message: 'Notícia arquivada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao arquivar notícia:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao arquivar a notícia. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleDeleteNews = async (id: number | null) => {
    if (!id) return;
    
    if (window.confirm('Tem certeza que deseja remover permanentemente esta notícia?')) {
      try {
        await NewsService.delete(id);
        
        setNewsHistory(prevHistory => prevHistory.filter(news => news.id !== id));
        
        setSnackbar({
          open: true,
          message: 'Notícia removida permanentemente!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Erro ao remover notícia:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao remover notícia. Tente novamente mais tarde.',
          severity: 'error'
        });
      }
    }
  };

  const handleRestoreNews = async (id: number) => {
    try {
      const restoredNews = await NewsService.restore(id);
      
      setNewsHistory(prevHistory => prevHistory.filter(news => news.id !== id));
      setActiveNews(prevNews => [toLocalNewsItem(restoredNews), ...prevNews]);
      
      setSnackbar({
        open: true,
        message: 'Notícia restaurada com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erro ao restaurar notícia:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao restaurar a notícia. Tente novamente.',
        severity: 'error'
      });
    }
  };

  // Função para validar o formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!currentNews.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!currentNews.content.trim()) newErrors.content = 'Conteúdo é obrigatório';
    if (!currentNews.category) newErrors.category = 'Categoria é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos do formulário
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentNews(prev => ({
          ...prev,
          imagePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target as { name: string; value: string };
    setCurrentNews(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpa o erro quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleOpenNewsDialog = async (newsItem: NewsItem | null = null) => {
    try {
      if (newsItem && newsItem.id) {
        // Se for uma edição e o conteúdo completo não estiver disponível, busca da API
        if (!newsItem.content) {
          const fullNews = await NewsService.getById(newsItem.id);
          setCurrentNews(toLocalNewsItem(fullNews));
        } else {
          setCurrentNews({
            ...newsItem,
            content: newsItem.content || ''
          });
        }
      } else {
        // Nova notícia
        setCurrentNews({
          id: null,
          title: '',
          content: '',
          category: 'Notícia', // Valor padrão
          status: 'rascunho',
          date: new Date().toISOString().split('T')[0],
          views: 0
        });
      }
      setOpenNewsDialog(true);
    } catch (error) {
      console.error('Erro ao abrir editor de notícia:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar a notícia. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleCloseNewsDialog = () => {
    setOpenNewsDialog(false);
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    handleSaveNews(currentNews);
  };

  // Renderização do conteúdo principal
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhora a performance no mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            {location.pathname.includes('noticias') ? 'Notícias' : 'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
            <Avatar sx={{ width: 40, height: 40 }}>A</Avatar>
          </Box>
        </Paper>

        {/* Conteúdo */}
        <Box sx={{ p: 3 }}>
          {location.pathname.includes('/admin/noticias') ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Gerenciamento de Notícias
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenNewsDialog()}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Adicionar Notícia
                </Button>
              </Box>

              <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                >
                  <Tab 
                    value="active" 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArticleIcon fontSize="small" />
                        <span>Notícias Ativas</span>
                        <Chip 
                          label={activeNews.length} 
                          size="small" 
                          color="primary" 
                          sx={{ minWidth: 24, height: 24, fontSize: '0.75rem' }} 
                        />
                      </Box>
                    } 
                  />
                  <Tab 
                    value="history" 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon fontSize="small" />
                        <span>Histórico</span>
                        <Chip 
                          label={newsHistory.length} 
                          size="small" 
                          color="secondary" 
                          sx={{ minWidth: 24, height: 24, fontSize: '0.75rem' }} 
                        />
                      </Box>
                    } 
                  />
                </Tabs>
              </Paper>

              {/* Lista de Notícias Ativas */}
              <Collapse in={activeTab === 'active'}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {isLoading ? (
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                      <CircularProgress />
                    </Grid>
                  ) : activeNews.length === 0 ? (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                          Nenhuma notícia encontrada.
                        </Typography>
                      </Paper>
                    </Grid>
                  ) : (
                    activeNews.map((news) => (
                      <Grid item xs={12} md={6} key={news.id}>
                        <Card>
                          <CardHeader
                            title={news.title}
                            subheader={`${news.category} • ${news.date}`}
                            action={
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Editar">
                                  <IconButton onClick={() => handleOpenNewsDialog(news)}>
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Arquivar">
                                  <IconButton onClick={() => handleArchiveNews(news.id!)}>
                                    <ArchiveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          />
                          <CardContent>
                            <Typography variant="body2" color="text.secondary" sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {news.content}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, alignItems: 'center' }}>
                              <Chip 
                                label={news.status === 'publicada' ? 'Publicada' : 'Rascunho'} 
                                size="small" 
                                color={news.status === 'publicada' ? 'success' : 'default'}
                                icon={news.status === 'publicada' ? <CheckCircleIcon fontSize="small" /> : <PendingIcon fontSize="small" />}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {news.views} visualizações
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              </Collapse>

              {/* Lista de Notícias Arquivadas */}
              <Collapse in={activeTab === 'history'}>
                <Paper sx={{ p: 2, mb: 4 }}>
                  <List>
                    {isLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : newsHistory.length === 0 ? (
                      <Typography variant="body1" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
                        Nenhuma notícia arquivada.
                      </Typography>
                    ) : (
                      newsHistory.map((news) => (
                        <div key={news.id}>
                          <ListItem 
                            secondaryAction={
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Restaurar">
                                  <IconButton edge="end" onClick={() => handleRestoreNews(news.id!)}>
                                    <RestoreIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Excluir permanentemente">
                                  <IconButton edge="end" onClick={() => handleDeleteNews(news.id)} color="error">
                                    <DeleteForeverIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemText
                              primary={news.title}
                              secondary={
                                <>
                                  <Typography component="span" variant="body2" color="text.primary">
                                    {news.category} • {news.date}
                                  </Typography>
                                  <br />
                                  {news.content.substring(0, 100)}...
                                </>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </div>
                      ))
                    )}
                  </List>
                </Paper>
              </Collapse>

              {/* Snackbar para feedback */}
              <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Alert 
                  onClose={handleCloseSnackbar} 
                  severity={snackbar.severity}
                  variant="filled"
                  sx={{ width: '100%' }}
                >
                  {snackbar.message}
                </Alert>
              </Snackbar>

              {/* Diálogo para adicionar/editar notícia */}
              <Dialog 
                open={openNewsDialog} 
                onClose={handleCloseNewsDialog} 
                maxWidth="md" 
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                  },
                }}
              >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 2 }}>
                  {currentNews.id ? 'Editar Notícia' : 'Adicionar Nova Notícia'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, '& > :not(style)': { mb: 2 } }}>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="title"
                    name="title"
                    label="Título"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={currentNews.title}
                    onChange={handleInputChange}
                    error={!!errors.title}
                    helperText={errors.title}
                    sx={{ mb: 3 }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="category-label">Categoria</InputLabel>
                    <Select
                      labelId="category-label"
                      id="category"
                      name="category"
                      value={currentNews.category}
                      label="Categoria"
                      onChange={handleInputChange}
                      error={!!errors.category}
                    >
                      <MenuItem value="Notícia">Notícia</MenuItem>
                      <MenuItem value="Atualização">Atualização</MenuItem>
                      <MenuItem value="Manutenção">Manutenção</MenuItem>
                      <MenuItem value="Evento">Evento</MenuItem>
                      <MenuItem value="Novidade">Novidade</MenuItem>
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error">
                        {errors.category}
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={currentNews.status}
                      label="Status"
                      onChange={handleInputChange}
                    >
                      <MenuItem value="rascunho">Rascunho</MenuItem>
                      <MenuItem value="publicada">Publicada</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Campo de upload de imagem */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Imagem de Destaque
                    </Typography>
                    <Box 
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      {currentNews.imagePreview ? (
                        <Box>
                          <img 
                            src={currentNews.imagePreview} 
                            alt="Preview" 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '200px',
                              borderRadius: '8px',
                              marginBottom: '16px'
                            }} 
                          />
                          <Typography>Clique para alterar a imagem</Typography>
                        </Box>
                      ) : (
                        <Box>
                          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography>Clique para fazer upload de uma imagem</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Formatos suportados: JPG, PNG
                          </Typography>
                        </Box>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                    </Box>
                  </Box>

                  <TextField
                    id="content"
                    name="content"
                    label="Conteúdo"
                    multiline
                    rows={10}
                    fullWidth
                    variant="outlined"
                    value={currentNews.content}
                    onChange={handleInputChange}
                    error={!!errors.content}
                    helperText={errors.content || ' '}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                  <Button 
                    onClick={handleCloseNewsDialog} 
                    color="inherit"
                    sx={{ borderRadius: 2 }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSaveClick} 
                    variant="contained" 
                    color="primary"
                    startIcon={currentNews.id ? <EditIcon /> : <AddIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {currentNews.id ? 'Atualizar' : 'Criar'} Notícia
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>Visão Geral</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {statsData.map((stat, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography color="textSecondary" variant="body2">
                            {stat.title}
                          </Typography>
                          {stat.icon}
                        </Box>
                        <Typography variant="h5" component="div">
                          {stat.value}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={stat.progress} />
                          </Box>
                          <Typography variant="body2" color={stat.trend === 'up' ? 'success.main' : 'error.main'}>
                            {stat.trend === 'up' ? '↑' : '↓'} {stat.progress}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Ações Rápidas */}
              <Typography variant="h6" sx={{ mb: 3 }}>Ações Rápidas</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ArticleIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Gerenciar Notícias</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Adicione, edite ou remova notícias do site.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEditNews}
                      >
                        Editar Notícias
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <PeopleIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">Gerenciar Usuários</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Gerencie contas de usuários e permissões.
                      </Typography>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<PeopleIcon />}
                      >
                        Gerenciar Usuários
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
