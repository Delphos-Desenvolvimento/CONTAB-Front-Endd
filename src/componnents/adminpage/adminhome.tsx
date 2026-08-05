import { useState, useEffect, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NewsService, { type NewsItem as ApiNewsItem } from '../../API/news';
import PartnersService, { type Partner } from '../../API/partners';
import RichTextEditor from '../common/RichTextEditor';
import StatsService, { type StatsOverview } from '../../API/stats';
import ContentAdminPage from '../page/admin/ContentAdminPage';
import TeamAdminPage from '../page/admin/TeamAdminPage';
import LinksAdminPage from '../page/admin/LinksAdminPage';
import PrefeituraLinksAdminPage from '../page/admin/PrefeituraLinksAdminPage';
import LogsAdminPage from '../page/admin/LogsAdminPage';
import ProfileAdminPage from '../page/admin/ProfileAdminPage';
import type { SelectChangeEvent } from '@mui/material/Select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
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
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Article as ArticleIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  Edit as EditIcon,
  DeleteForever as DeleteForeverIcon,
  Archive as ArchiveIcon,
  Restore as RestoreIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  People as PeopleIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  Handshake as HandshakeIcon,
  Link as LinkIcon,
  Group as GroupIcon,
  Menu as MenuIcon,
  AccountBalance as PrefeituraIcon,
} from '@mui/icons-material';
import { History as HistoryIcon, Person as PersonIcon } from '@mui/icons-material';



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
    navigate('/admin/login');
  };



  const drawer = (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between'
    }}>
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
          <ListItemLink to="/admin/parceiros" icon={<HandshakeIcon />} primary="Parceiros" />
          <ListItemLink to="/admin/links-uteis" icon={<LinkIcon />} primary="Links Úteis" />
          <ListItemLink to="/admin/prefeituras" icon={<PrefeituraIcon />} primary="Prefeituras" />
          <ListItemLink to="/admin/conteudo" icon={<DescriptionIcon />} primary="Conteúdo" />
          <ListItemLink to="/admin/equipe" icon={<GroupIcon />} primary="Nossa Equipe" />
          <ListItemLink to="/admin/logs" icon={<HistoryIcon />} primary="Logs" />
          <ListItemLink to="/admin/perfil" icon={<PersonIcon />} primary="Perfil" />
        </List>
      </div>
      <div>
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
    </Box>
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
    images?: { id?: number; base64: string; altText?: string }[];
  };

  // Função para converter da API para o tipo local
  const toLocalNewsItem = useCallback((apiItem: ApiNewsItem): NewsItem => ({
    id: apiItem.id ?? null,
    title: apiItem.title,
    content: apiItem.content,
    category: apiItem.category,
    status: apiItem.status,
    date: apiItem.date,
    views: apiItem.views,
    images: apiItem.images
  }), []);

  // Função para converter para o tipo da API
  const toApiNewsItem = (item: NewsItem): Omit<ApiNewsItem, 'id'> & { id?: number } => ({
    id: item.id ?? undefined,
    title: item.title,
    content: item.content,
    category: item.category,
    status: item.status,
    date: item.date,
    views: item.views ?? 0,
    images: item.images
  });

  // Estado para controlar a aba ativa (notícias ativas ou histórico)
  const [activeTab, setActiveTab] = useState('active');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // State for statistics
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [chartData, setChartData] = useState<Array<{ date: string; label: string; views: number }>>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [overviewStats, setOverviewStats] = useState<StatsOverview | null>(null);

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
  }, [toLocalNewsItem]);

  // Buscar estatísticas das notícias
  const fetchNewsStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const days = timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
      const [trend, overview] = await Promise.all([
        StatsService.getEventsByDay('news_view', days),
        StatsService.getOverview()
      ]);
      const mapped = trend.map((pt) => ({
        date: pt.date,
        label: (() => {
          try { return format(parseISO(pt.date), 'dd/MM'); } catch { return pt.date; }
        })(),
        views: pt.count,
      }));
      const sum = mapped.reduce((a, b) => a + (Number(b.views) || 0), 0);
      // Fallback: if selected range has no data but there are views overall, load month
      if (sum === 0 && (overview?.totalViews || 0) > 0 && days < 30) {
        const monthTrend = await StatsService.getEventsByDay('news_view', 30);
        setChartData(monthTrend.map((pt) => ({
          date: pt.date,
          label: (() => { try { return format(parseISO(pt.date), 'dd/MM'); } catch { return pt.date; } })(),
          views: pt.count,
        })));
      } else {
        setChartData(mapped);
      }
      setOverviewStats(overview);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar estatísticas',
        severity: 'error'
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [timeRange]);

  // Carregar notícias e estatísticas ao inicializar
  useEffect(() => {
    loadNews();
    fetchNewsStats();
  }, [loadNews, fetchNewsStats]);

  // Atualizar estatísticas quando o período for alterado
  useEffect(() => {
    fetchNewsStats();
  }, [timeRange, fetchNewsStats]);

  



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
  const partnerFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Partners state management
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [openPartnerDialog, setOpenPartnerDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState<Partial<Partner> & { logoPreview?: string }>({
    name: '',
    displayOrder: 0,
    active: true,
    logoPreview: ''
  });
  const [selectedPartnerLogo, setSelectedPartnerLogo] = useState<File | null>(null);
  const [partnerErrors, setPartnerErrors] = useState<Record<string, string>>({});

  // Load partners
  const loadPartners = useCallback(async () => {
    try {
      setIsLoadingPartners(true);
      const allPartners = await PartnersService.getAll(false);
      setPartners(allPartners);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar parceiros. Tente novamente mais tarde.',
        severity: 'error'
      });
    } finally {
      setIsLoadingPartners(false);
    }
  }, []);

  // Load partners on mount
  useEffect(() => {
    if (location.pathname.includes('/admin/parceiros')) {
      loadPartners();
    }
  }, [location.pathname, loadPartners]);

  // Partner handlers
  const handleOpenPartnerDialog = (partner: Partner | null = null) => {
    if (partner) {
      setCurrentPartner({
        ...partner,
        logoPreview: partner.logoBase64.startsWith('data:') ? partner.logoBase64 : `data:image/jpeg;base64,${partner.logoBase64}`
      });
    } else {
      setCurrentPartner({
        name: '',
        displayOrder: 0,
        active: true,
        logoPreview: ''
      });
      setSelectedPartnerLogo(null);
    }
    setPartnerErrors({});
    setOpenPartnerDialog(true);
  };

  const handleClosePartnerDialog = () => {
    setOpenPartnerDialog(false);
    setCurrentPartner({
      name: '',
      displayOrder: 0,
      active: true,
      logoPreview: ''
    });
    setSelectedPartnerLogo(null);
    setPartnerErrors({});
  };

  const handlePartnerLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPartnerLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPartner(prev => ({
          ...prev,
          logoPreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePartnerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPartner(prev => ({
      ...prev,
      [name]: name === 'displayOrder' ? parseInt(value) || 0 : value
    }));
    if (partnerErrors[name]) {
      setPartnerErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validatePartnerForm = () => {
    const newErrors: Record<string, string> = {};
    if (!currentPartner.name?.trim()) newErrors.name = 'Nome é obrigatório';
    if (!currentPartner.id && !selectedPartnerLogo && !currentPartner.logoPreview) {
      newErrors.logo = 'Logo é obrigatória';
    }
    setPartnerErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePartner = async () => {
    if (!validatePartnerForm()) return;

    try {
      if (currentPartner.id) {
        // Update existing partner
        const updated = await PartnersService.update(
          currentPartner.id,
          {
            name: currentPartner.name,
            displayOrder: currentPartner.displayOrder,
            active: currentPartner.active
          },
          selectedPartnerLogo || undefined
        );
        setPartners(prevPartners =>
          prevPartners.map(p => p.id === updated.id ? updated : p)
        );
        setSnackbar({
          open: true,
          message: 'Parceiro atualizado com sucesso!',
          severity: 'success'
        });
      } else {
        // Create new partner
        const created = await PartnersService.create(
          {
            name: currentPartner.name!,
            displayOrder: currentPartner.displayOrder || 0,
            active: currentPartner.active ?? true,
            logoBase64: '' // Will be set by the file
          },
          selectedPartnerLogo!
        );
        setPartners(prevPartners => [...prevPartners, created]);
        setSnackbar({
          open: true,
          message: 'Parceiro adicionado com sucesso!',
          severity: 'success'
        });
      }
      handleClosePartnerDialog();
    } catch (error) {
      console.error('Erro ao salvar parceiro:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao salvar parceiro. Tente novamente.',
        severity: 'error'
      });
    }
  };

  const handleDeletePartner = async (id: number) => {
    if (window.confirm('Tem certeza que deseja remover este parceiro?')) {
      try {
        await PartnersService.delete(id);
        setPartners(prevPartners => prevPartners.filter(p => p.id !== id));
        setSnackbar({
          open: true,
          message: 'Parceiro removido com sucesso!',
          severity: 'success'
        });
      } catch (error) {
        console.error('Erro ao remover parceiro:', error);
        setSnackbar({
          open: true,
          message: 'Erro ao remover parceiro. Tente novamente.',
          severity: 'error'
        });
      }
    }
  };

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
        console.log('[AdminHome] Saving news:', { id, updateData, hasSelectedImage: !!selectedImageFile, selectedImageFile });
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

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
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

  // Helper to convert base64 to File
  const base64ToFile = (dataurl: string, filename: string) => {
    try {
      let bstr;
      let mime = 'image/jpeg';
      if (dataurl.includes(',')) {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (mimeMatch) mime = mimeMatch[1];
        bstr = atob(arr[1]);
      } else {
        bstr = atob(dataurl);
      }
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    } catch (e) {
      console.error('Error converting base64 to file:', e);
      return null;
    }
  };

  const handleOpenNewsDialog = async (newsItem: NewsItem | null = null) => {
    try {
      if (newsItem && newsItem.id) {
        // Se for uma edição e o conteúdo completo não estiver disponível, busca da API
        if (!newsItem.content) {
          const fullNews = await NewsService.getById(newsItem.id);
          const localNews = toLocalNewsItem(fullNews);

          let imgPreview = '';
          if (localNews.images && localNews.images.length > 0) {
            const img = localNews.images[0];
            imgPreview = img.base64.startsWith('data:')
              ? img.base64
              : `data:image/jpeg;base64,${img.base64}`;

            const file = base64ToFile(imgPreview, `image-${localNews.id}.jpg`);
            console.log('[AdminHome] Converted existing image to file:', file);
            if (file) setSelectedImageFile(file);
          } else {
            setSelectedImageFile(null);
          }

          setCurrentNews({
            ...localNews,
            imagePreview: imgPreview
          });
        } else {
          let imgPreview = '';
          if (newsItem.images && newsItem.images.length > 0) {
            const img = newsItem.images[0];
            imgPreview = img.base64.startsWith('data:')
              ? img.base64
              : `data:image/jpeg;base64,${img.base64}`;

            const file = base64ToFile(imgPreview, `image-${newsItem.id}.jpg`);
            console.log('[AdminHome] Converted existing image to file (from list):', file);
            if (file) setSelectedImageFile(file);
          } else {
            setSelectedImageFile(null);
          }

          setCurrentNews({
            ...newsItem,
            content: newsItem.content || '',
            imagePreview: imgPreview
          });
        }
      } else {
        // Nova notícia
        setSelectedImageFile(null);
        setCurrentNews({
          id: null,
          title: '',
          content: '',
          category: 'Notícia', // Valor padrão
          status: 'rascunho',
          date: new Date().toISOString().split('T')[0],
          views: 0,
          imagePreview: ''
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
            {location.pathname.includes('noticias') ? 'Notícias' :
              location.pathname.includes('parceiros') ? 'Parceiros' :
                location.pathname.includes('conteudo') ? 'Conteúdo' :
                  location.pathname.includes('equipe') ? 'Nossa Equipe' :
                    location.pathname.includes('prefeituras') ? 'Prefeituras' :
                    location.pathname.includes('links-uteis') ? 'Links Úteis' :
                      location.pathname.includes('logs') ? 'Logs' :
                      location.pathname.includes('perfil') ? 'Meu Perfil' :
                      'Dashboard'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ width: 40, height: 40 }}>A</Avatar>
          </Box>
        </Paper>

        {/* Conteúdo */}
        <Box sx={{ p: 3 }}>
          {location.pathname.includes('/admin/links-uteis') ? (
            <Box>
              <Typography variant="h5" sx={{ mb: 3, color: 'primary.main' }}>
                Gerenciar Links Úteis
              </Typography>
              <LinksAdminPage />
            </Box>
          ) : location.pathname.includes('/admin/prefeituras') ? (
            <PrefeituraLinksAdminPage />
          ) : location.pathname.includes('/admin/noticias') ? (
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
                            subheader={(
                              <Typography variant="body2" color="text.secondary">
                                <span>{news.category}</span>
                                <Box component="span" sx={{ mx: 1, display: 'inline-block', width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled', position: 'relative', top: -1 }} />
                                <span>{news.date}</span>
                              </Typography>
                            )}
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
                              textOverflow: 'ellipsis',
                              whiteSpace: 'normal'
                            }}>
                              {stripHtml(news.content)}
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
                                    <span>{news.category}</span>
                                    <Box component="span" sx={{ mx: 1, display: 'inline-block', width: 4, height: 4, borderRadius: '50%', bgcolor: 'text.disabled', position: 'relative', top: -1 }} />
                                    <span>{news.date}</span>
                                  </Typography>
                                  <br />
                                  {stripHtml(news.content).slice(0, 140)}...
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

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                      Conteúdo *
                    </Typography>
                    <RichTextEditor
                      content={currentNews.content}
                      onChange={(content) => {
                        setCurrentNews(prev => ({ ...prev, content }));
                        if (errors.content) {
                          setErrors(prev => ({ ...prev, content: '' }));
                        }
                      }}
                      error={!!errors.content}
                    />
                    {errors.content && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {errors.content}
                      </Typography>
                    )}
                  </Box>
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
          ) : location.pathname.includes('/admin/parceiros') ? (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Gerenciamento de Parceiros
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenPartnerDialog()}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Adicionar Parceiro
                </Button>
              </Box>

              <Grid container spacing={3}>
                {isLoadingPartners ? (
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Grid>
                ) : partners.length === 0 ? (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body1" color="textSecondary">
                        Nenhum parceiro cadastrado.
                      </Typography>
                    </Paper>
                  </Grid>
                ) : (
                  partners.map((partner) => (
                    <Grid item xs={12} sm={6} md={4} key={partner.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <img
                              src={partner.logoBase64.startsWith('data:') ? partner.logoBase64 : `data:image/jpeg;base64,${partner.logoBase64}`}
                              alt={partner.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '120px',
                                objectFit: 'contain'
                              }}
                            />
                          </Box>
                          <Typography variant="h6" align="center" gutterBottom>
                            {partner.name}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Chip
                              label={partner.active ? 'Ativo' : 'Inativo'}
                              size="small"
                              color={partner.active ? 'success' : 'default'}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Ordem: {partner.displayOrder}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Tooltip title="Editar">
                              <IconButton onClick={() => handleOpenPartnerDialog(partner)} size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir">
                              <IconButton onClick={() => handleDeletePartner(partner.id)} size="small" color="error">
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>

              {/* Partner Dialog */}
              <Dialog
                open={openPartnerDialog}
                onClose={handleClosePartnerDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                  },
                }}
              >
                <DialogTitle sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.12)', pb: 2 }}>
                  {currentPartner.id ? 'Editar Parceiro' : 'Adicionar Novo Parceiro'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, '& > :not(style)': { mb: 2 } }}>
                  <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    name="name"
                    label="Nome do Parceiro"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={currentPartner.name || ''}
                    onChange={handlePartnerInputChange}
                    error={!!partnerErrors.name}
                    helperText={partnerErrors.name}
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    margin="dense"
                    id="displayOrder"
                    name="displayOrder"
                    label="Ordem de Exibição"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={currentPartner.displayOrder || 0}
                    onChange={handlePartnerInputChange}
                    helperText="Números menores aparecem primeiro"
                    sx={{ mb: 3 }}
                  />

                  {/* Logo upload */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Logo do Parceiro {!currentPartner.id && '*'}
                    </Typography>
                    <Box
                      onClick={() => partnerFileInputRef.current?.click()}
                      sx={{
                        border: '2px dashed',
                        borderColor: partnerErrors.logo ? 'error.main' : 'divider',
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
                      {currentPartner.logoPreview ? (
                        <Box>
                          <img
                            src={currentPartner.logoPreview}
                            alt="Preview"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '150px',
                              objectFit: 'contain',
                              marginBottom: '16px'
                            }}
                          />
                          <Typography>Clique para alterar a logo</Typography>
                        </Box>
                      ) : (
                        <Box>
                          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography>Clique para fazer upload da logo</Typography>
                          <Typography variant="caption" color="textSecondary">
                            Formatos suportados: JPG, PNG, WebP
                          </Typography>
                        </Box>
                      )}
                      <input
                        type="file"
                        ref={partnerFileInputRef}
                        onChange={handlePartnerLogoChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                    </Box>
                    {partnerErrors.logo && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                        {partnerErrors.logo}
                      </Typography>
                    )}
                  </Box>

                  <FormControl fullWidth>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip
                        label={currentPartner.active ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={currentPartner.active ? 'success' : 'default'}
                        onClick={() => setCurrentPartner(prev => ({ ...prev, active: !prev.active }))}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    onClick={handleClosePartnerDialog}
                    color="inherit"
                    sx={{ borderRadius: 2 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSavePartner}
                    variant="contained"
                    color="primary"
                    startIcon={currentPartner.id ? <EditIcon /> : <AddIcon />}
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                  >
                    {currentPartner.id ? 'Atualizar' : 'Criar'} Parceiro
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Snackbar */}
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
            </Box>
          ) : location.pathname.includes('/admin/conteudo') ? (
            <ContentAdminPage />
          ) : location.pathname.includes('/admin/equipe') ? (
            <TeamAdminPage />
          ) : location.pathname.includes('/admin/logs') ? (
            <LogsAdminPage />
          ) : location.pathname.includes('/admin/perfil') ? (
            <ProfileAdminPage />
          ) : (
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>Visão Geral</Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>

                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="textSecondary" variant="body2">
                          Total de Usuários
                        </Typography>
                        <PeopleIcon fontSize="large" color="primary" />
                      </Box>
                      <Typography variant="h5" component="div">
                        {overviewStats?.adminCount || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="textSecondary" variant="body2">
                          Total de Visualizações
                        </Typography>
                        <VisibilityIcon fontSize="large" color="secondary" />
                      </Box>
                      <Typography variant="h5" component="div">
                        {overviewStats?.totalViews || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography color="textSecondary" variant="body2">
                          Total de Notícias
                        </Typography>
                        <ArticleIcon fontSize="large" color="info" />
                      </Box>
                      <Typography variant="h5" component="div">
                        {overviewStats?.totalNews || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Gráfico de Estatísticas */}
              <Card sx={{ mb: 4, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Visualizações por Notícia</Typography>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month' | 'year')}
                      sx={{ height: 36 }}
                      >
                        <MenuItem value="day">Últimas 24h</MenuItem>
                        <MenuItem value="week">Esta Semana</MenuItem>
                        <MenuItem value="month">Este Mês</MenuItem>
                        <MenuItem value="year">Este Ano</MenuItem>
                      </Select>
                  </FormControl>
                </Box>

                {isLoadingStats ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <CircularProgress />
                  </Box>
                ) : chartData.length > 0 ? (
                  <Box sx={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12 }}
                          interval="preserveStartEnd"
                          angle={0}
                          textAnchor="middle"
                          height={40}
                          minTickGap={16}
                          tickMargin={8}
                        />
                        <YAxis allowDecimals={false} domain={[0, 'dataMax + 1']} tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                          formatter={(value) => [value, 'Visualizações']}
                          labelFormatter={(label, payload) => {
                            const d = payload && payload[0]?.payload?.date;
                            if (typeof d === 'string') {
                              try { return format(parseISO(d), 'dd/MM/yyyy'); } catch { return d; }
                            }
                            return label as string;
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="views"
                          name="Visualizações"
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: 300,
                    border: '1px dashed #ddd',
                    borderRadius: 1,
                    p: 3,
                    textAlign: 'center'
                  }}>
                    <Typography color="textSecondary">
                      Nenhum dado disponível para o período selecionado.
                    </Typography>
                  </Box>
                )}
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
