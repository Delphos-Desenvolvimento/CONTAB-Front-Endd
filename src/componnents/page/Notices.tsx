import { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, CardActionArea, Button, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import NewsService from '../../API/news';
import type { NewsItem, NewsImage } from '../../API/news';

// Extendendo a interface para incluir a descrição que é usada no frontend
interface ExtendedNewsItem extends Omit<NewsItem, 'content'> {
  description: string;
}

// Tipagem para as props do componente NewsCard
interface NewsCardProps extends ExtendedNewsItem {}

// Componente de cartão de notícia
const NewsCard = ({ 
  id, 
  title, 
  description, 
  date, 
  category, 
  images 
}: NewsCardProps & { images?: NewsImage[] }) => {
  const base64 = images && images.length > 0 ? images[0].base64 : undefined;
  const src = base64
    ? (base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`)
    : undefined;
  return (
    <Grid item xs={12} sm={6} md={4} lg={4} sx={{ px: { xs: 1, sm: 2 } }}>
      <div style={{ height: '100%' }}>
        <CardActionArea component={RouterLink} to={`/noticias/${id}`}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: 6
            }
          }}>
            <Box
              sx={{
                width: '100%',
                height: { xs: 180, sm: 200, md: 220 },
                backgroundImage: `url(${src || `https://picsum.photos/300/200?random=${id}`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
                backgroundRepeat: 'no-repeat',
                overflow: 'hidden',
              }}
            />
            <CardContent sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2 } }}>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                display="block" 
                mb={1}
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {date || 'Sem data'}
              </Typography>
              <Typography 
                variant="h6" 
                component="h3" 
                gutterBottom
                sx={{
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                  lineHeight: 1.3,
                  mb: { xs: 1, sm: 1.5 }
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  mb: 2,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  minHeight: { xs: '4.5em', sm: '5em' }
                }}
              >
                {description}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mt: 'auto'
              }}>
                <Typography 
                  variant="caption" 
                  color="primary" 
                  fontWeight="bold"
                  sx={{
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                >
                  {category || 'Geral'}
                </Typography>
                <ArrowRight size={16} color="#1976d2" />
              </Box>
            </CardContent>
          </Card>
        </CardActionArea>
      </div>
    </Grid>
  );
};

// Using NoticesService for API calls

function Notices() {
  const [news, setNews] = useState<ExtendedNewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const newsData = await NewsService.getAll();
        // Garantir que todos os itens tenham os campos necessários
        const formattedNews = newsData.map(item => ({
          id: item.id || 0,
          title: item.title,
          description: item.content?.substring(0, 100) + (item.content?.length > 100 ? '...' : '') || '',
          content: item.content || '',
          date: item.date || new Date().toISOString().split('T')[0],
          category: item.category || 'Geral',
          status: item.status || 'publicada',
          views: item.views || 0,
          images: item.images || []
        } as ExtendedNewsItem));
        setNews(formattedNews);
      } catch (err) {
        console.error('Erro ao buscar notícias:', err);
        setError('Não foi possível carregar as notícias. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 4, sm: 6, md: 8 }, backgroundColor: '#f9f9f9' }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          mb={6}
          sx={{
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            fontWeight: 700,
            color: 'primary.main',
            position: 'relative',
            '&:after': {
              content: '""',
              display: 'block',
              width: '80px',
              height: '4px',
              backgroundColor: 'primary.main',
              margin: '16px auto 0',
              borderRadius: '2px'
            }
          }}
        >
          Últimas Notícias
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {news.length > 0 ? (
            news.map((item) => (
              <NewsCard key={item.id} {...item} images={item.images} />
            ))
          ) : (
            <Box width="100%" textAlign="center" py={4}>
              <Typography variant="body1" color="text.secondary">
                Nenhuma notícia encontrada.
              </Typography>
            </Box>
          )}
        </Grid>
        
        <Box mt={6} textAlign="center">
          <Button 
            variant="outlined" 
            color="primary" 
            endIcon={<ArrowRight size={20} />}
            component={RouterLink}
            to="/noticias"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '50px',
              '&:hover': {
                backgroundColor: 'primary.main',
                color: 'white',
              }
            }}
          >
            Ver todas as notícias
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

export default Notices;
