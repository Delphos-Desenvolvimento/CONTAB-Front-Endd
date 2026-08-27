import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  Menu,
  MenuItem,
  alpha,
  styled
} from '@mui/material';
import { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Phone, Link as LinkIcon, Building2 } from 'lucide-react';

// Componente simplificado sem efeito de scroll

// Estilo personalizado para o AppBar
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#e8ebf0',
  color: theme.palette.text.primary,
  boxShadow: '0 1px 0 rgba(15, 23, 42, 0.08), 0 8px 24px rgba(15, 23, 42, 0.06)',
  borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
  backdropFilter: 'saturate(180%) blur(8px)',
  '& .MuiToolbar-root': {
    minHeight: '75px',
    padding: theme.spacing(0, 2),
    [theme.breakpoints.up('md')]: {
      minHeight: '85px',
      padding: theme.spacing(0, 3),
    },
  },
}));

// Botões claros sobre o cinza do cabeçalho
const MenuButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  padding: '10px 20px',
  backgroundColor: alpha('#fff', 0.72),
  color: theme.palette.primary.main,
  transition: 'all 0.2s ease',
  boxShadow: 'none',
  outline: 'none',
  border: '1px solid rgba(15, 23, 42, 0.06)',
  '&:focus,&:focus-visible': {
    outline: 'none',
    boxShadow: 'none',
  },
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: 'none',
    backgroundColor: '#ffffff',
    borderColor: alpha(theme.palette.primary.main, 0.25),
  },
  '&.active': {
    color: theme.palette.primary.main,
    backgroundColor: '#ffffff',
    borderColor: alpha(theme.palette.primary.main, 0.35),
    boxShadow: 'none',
  },
}));

// Menu móvel removido - não está sendo utilizado

// Menu móvel removido - não está sendo utilizado

// Componente principal do Header
function Header() {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  

  

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    if (sectionId === '') {
      if (location.pathname === '/' && !location.hash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0);
      }
      return;
    }
    if (sectionId === 'noticias') {
      navigate('/noticias');
      return;
    }
    const element = document.getElementById(sectionId);
    if (element && location.pathname === '/') {
      const target =
        sectionId === 'sobre'
          ? (element.querySelector('h1') as HTMLElement) || element
          : sectionId === 'solucoes'
          ? (element.querySelector('h2') as HTMLElement) || element
          : element;
      const headerEl = document.querySelector('header');
      const headerH = headerEl ? (headerEl as HTMLElement).getBoundingClientRect().height : 80;
      const y = target.getBoundingClientRect().top + window.scrollY - headerH;
      window.scrollTo({ top: y, behavior: 'smooth' });
    } else {
      navigate('/#' + sectionId);
    }
  };

  const menuItems = [
    {
      title: 'Home',
      path: '/',
      onClick: (e: React.MouseEvent) => scrollToSection(e, '')
    },
    {
      title: 'Notícias',
      path: '/noticias',
      onClick: (e: React.MouseEvent) => scrollToSection(e, 'noticias')
    },
    {
      title: 'Sobre',
      path: '/#sobre',
      onClick: (e: React.MouseEvent) => scrollToSection(e, 'sobre')
    },
    {
      title: 'Serviços',
      path: '/#solucoes',
      onClick: (e: React.MouseEvent) => scrollToSection(e, 'solucoes'),
      submenu: [
        {
          title: 'Prefeitura e Gestão',
          path: '/solucoes/prefeitura',
        },
        {
          title: 'Saúde',
          path: '/solucoes/saude',
        },
        {
          title: 'Educação',
          path: '/solucoes/educacao',
        },
      ],
    },
  ];

  return (
    <StyledAppBar position="fixed" sx={{
      zIndex: theme.zIndex.drawer + 1
    }}
    >
      <Container maxWidth={false} disableGutters>
        <Toolbar disableGutters>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            <Box
              component={RouterLink}
              to="/"
              sx={{
                minWidth: 110,
                textAlign: 'left',
                color: 'inherit',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src="/images/Logo_sem_fundo_Contab_2[1].png"
                alt="Logo"
                sx={(theme) => ({
                  height: { xs: 50, md: 65 },
                  width: 'auto',
                  objectFit: 'contain',
                  filter:
                    theme.palette.mode === 'dark'
                      ? 'drop-shadow(0 2px 8px rgba(255,255,255,0.25)) brightness(1.15) contrast(1.05)'
                      : 'none',
                })}
              />
            </Box>
          </Box>

          {/* Menu Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.submenu ? (
                  <>
                    <MenuButton
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (item.onClick) {
                          item.onClick(e);
                        }
                        handleMenuOpen(e);
                      }}
                      className={location.pathname.startsWith(item.path.replace('/#', '/')) ? 'active' : ''}
                    >
                      {item.title}
                    </MenuButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl) && item.submenu?.some(sub => sub.title === item.title)}
                      onClose={handleMenuClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'center',
                      }}
                      PaperProps={{
                        elevation: 3,
                        sx: {
                          mt: 1.5,
                          minWidth: 240,
                          borderRadius: 2,
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          overflow: 'hidden',
                        },
                      }}
                    >
                      {item.submenu?.map((subItem) => (
                        <MenuItem
                          key={subItem.title}
                          component={RouterLink}
                          to={subItem.path}
                          onClick={handleMenuClose}
                          sx={{
                            py: 1.5,
                            px: 2.5,
                            color: location.pathname === subItem.path ? 'primary.main' : 'text.primary',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: 'primary.main',
                                opacity: location.pathname === subItem.path ? 1 : 0,
                                mr: 1.5,
                                transition: 'all 0.2s ease',
                              }}
                            />
                            <Typography variant="body2" fontWeight={500}>
                              {subItem.title}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                ) : (
                  <Box
                    component="a"
                    href={item.path}
                    onClick={item.onClick}
                    sx={{ textDecoration: 'none' }}
                  >
                    <MenuButton
                      className={location.pathname === item.path.replace('/#', '/') ? 'active' : ''}
                    >
                      {item.title}
                    </MenuButton>
                  </Box>
                )}
              </div>
            ))}

            {/* Botões de ação */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 1, md: 2 } }}>
              <Box component={RouterLink} to="/links-uteis" sx={{ textDecoration: 'none' }}>
                <MenuButton
                  startIcon={<LinkIcon size={14} />}
                  sx={{ ml: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                >
                  Links Úteis
                </MenuButton>
              </Box>
              <MenuButton
                onClick={(e) => scrollToSection(e, 'contato')}
                startIcon={<Phone size={14} />}
                sx={{ ml: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
              >
                Contato
              </MenuButton>
              <Box component={RouterLink} to="/orgao" sx={{ textDecoration: 'none' }}>
                <MenuButton
                  startIcon={<Building2 size={14} />}
                  className={location.pathname.startsWith('/orgao') ? 'active' : ''}
                  sx={{ ml: 1, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
                >
                  Soluções
                </MenuButton>
              </Box>
            </Box>
          </Box>
        </Toolbar>
      </Container>

      {/* Menu Mobile */}
      <Box
        sx={{
          position: 'fixed',
          top: 70,
          left: 0,
          right: 0,
          backgroundColor: '#e8ebf0',
          boxShadow: 3,
          zIndex: 1100,
          maxHeight: mobileOpen ? 'calc(100vh - 70px)' : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <Box sx={{ p: 2 }}>
          {menuItems.map((item) => (
            <Button
              key={item.title}
              component={RouterLink}
              to={item.path}
              onClick={item.onClick}
              variant="text"
              color="inherit"
              sx={{
                mx: 1,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >{item.title}
            </Button>
          ))}
        </Box>
      </Box>
    </StyledAppBar>
  );
}

export default Header;
