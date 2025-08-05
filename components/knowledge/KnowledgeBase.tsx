'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  Calendar,
  User,
  Tag,
  Filter,
  Grid,
  List,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { KnowledgeChat } from './KnowledgeChat';

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  articleCount?: number;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  author?: {
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  metaDescription?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
  category?: {
    name: string;
    color: string;
    icon: string;
  };
  tags?: string[];
}

export function KnowledgeBase() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArticle, setSelectedArticle] = useState<Article | KnowledgeArticle | null>(null);

  // Log estratégico para verificar tipos
  console.log('🔍 DEBUG KnowledgeBase:', {
    selectedArticle,
    selectedArticleType: typeof selectedArticle,
    selectedArticleKeys: selectedArticle ? Object.keys(selectedArticle) : null,
    selectedArticleTitle: selectedArticle?.title,
    selectedArticleAuthor: selectedArticle?.author,
  });

  // Log para verificar dados mock
  console.log('🔍 DEBUG Mock Articles:', {
    articlesCount: articles?.length,
    firstArticle: articles?.[0],
    firstArticleType: typeof articles?.[0],
    firstArticleKeys: articles?.[0] ? Object.keys(articles[0]) : null,
  });

  const userRole = session?.user?.role;
  const canManage = userRole === 'ADMIN' || userRole === 'COORDINATOR';

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Para usuários comuns, forçar apenas artigos publicados
      const effectivePublishedFilter = canManage ? publishedFilter : 'true';

      // Carregar categorias e artigos em paralelo
      const [categoriesResponse, articlesResponse] = await Promise.all([
        fetch('/api/knowledge/categories?includeArticleCount=true'),
        fetch(
          `/api/knowledge/articles?${new URLSearchParams({
            ...(selectedCategory !== 'all' && { categoryId: selectedCategory }),
            ...(effectivePublishedFilter !== 'all' && {
              published: effectivePublishedFilter,
            }),
            ...(searchTerm && { search: searchTerm }),
            limit: '50',
          })}`
        ),
      ]);

      if (!categoriesResponse.ok || !articlesResponse.ok) {
        throw new Error('Erro ao carregar dados');
      }

      const [categoriesData, articlesData] = await Promise.all([
        categoriesResponse.json(),
        articlesResponse.json(),
      ]);

      setCategories(categoriesData.data || []);
      setArticles(articlesData.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados da Docs e IA da Adm');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, publishedFilter, searchTerm, canManage]);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Visualizar artigo
  const viewArticle = async (article: Article) => {
    try {
      const response = await fetch(`/api/knowledge/articles/${article.id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar artigo');
      }

      const data = await response.json();
      setSelectedArticle(data.data as Article);
      console.log('🔍 DEBUG setSelectedArticle from API:', {
        data: data.data,
        dataType: typeof data.data,
        dataKeys: data.data ? Object.keys(data.data) : null,
        castedType: typeof (data.data as Article),
      });
    } catch (error) {
      console.error('Erro ao carregar artigo:', error);
      toast.error('Erro ao carregar artigo');
    }
  };

  // Deletar artigo
  const deleteArticle = async (articleId: string) => {
    if (!confirm('Tem certeza que deseja deletar este artigo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar artigo');
      }

      setArticles(prev => prev.filter(article => article.id !== articleId));
      toast.success('Artigo deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar artigo:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao deletar artigo'
      );
    }
  };

  // Filtrar artigos
  const filteredArticles = articles.filter(article => {
    if (selectedCategory !== 'all' && article.category.id !== selectedCategory)
      return false;
    if (publishedFilter === 'true' && !article.isPublished) return false;
    if (publishedFilter === 'false' && article.isPublished) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        article.title.toLowerCase().includes(searchLower) ||
        article.content.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Artigos em destaque
  const featuredArticles = filteredArticles.filter(article => article.isFeatured);

  // Renderizar visualização de artigo
  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => {
            console.log('🔍 DEBUG Clearing selectedArticle');
            setSelectedArticle(null);
          }}>
            ← Voltar
          </Button>
          {canManage && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // TODO: Implementar edição
                  toast.info('Funcionalidade de edição será implementada');
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {userRole === 'ADMIN' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteArticle(selectedArticle.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              )}
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">
                    {selectedArticle.title}
                  </h1>
                  {selectedArticle.metaDescription && (
                    <p className="text-lg text-gray-600">
                      {selectedArticle.metaDescription}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedArticle.isFeatured && (
                    <Badge
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-800"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={
                      selectedArticle.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedArticle.isPublished ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span style={{ color: selectedArticle.category?.color }}>
                    {selectedArticle.category?.icon}
                  </span>
                  <span>{selectedArticle.category?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{selectedArticle.author?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{selectedArticle.viewCount} visualizações</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(selectedArticle.updatedAt || selectedArticle.createdAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-gray-500" />
                  {selectedArticle.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="tactical-layout space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <BookOpen className="h-8 w-8 text-primary" />
            Docs e IA da Adm
          </h1>
          <p className="text-muted-foreground">
            Base de conhecimento e chat inteligente para procedimentos administrativos
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button className="tactical-button">
              <Plus className="w-4 h-4 mr-2" />
              Novo Artigo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">Documentação</TabsTrigger>
          <TabsTrigger value="chat">Chat IA</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 tactical-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 tactical-input">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="tactical-card">
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManage && (
              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-40 tactical-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="tactical-card">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Publicados</SelectItem>
                  <SelectItem value="false">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="tactical-button bg-blue-600 hover:bg-blue-700"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="tactical-button bg-green-600 hover:bg-green-700"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Artigos */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="tactical-card animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <Card className="tactical-card">
              <CardContent className="p-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum artigo encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Ainda não há artigos na base de conhecimento'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredArticles.map((article) => (
                <Card
                  key={article.id}
                  className="tactical-card-hover cursor-pointer"
                  onClick={() => viewArticle(article)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {article.metaDescription || article.content}
                        </p>
                      </div>
                      {article.isFeatured && (
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {article.author?.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(article.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: article.category?.color + '20',
                          color: article.category?.color,
                        }}
                      >
                        {article.category?.name}
                      </Badge>
                      {article.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {article.tags?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{article.tags?.length - 2}
                        </Badge>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleEdit(article);
                          }}
                          className="flex-1"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteArticle(article.id);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card className="tactical-card">
            <KnowledgeChat />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      {selectedArticle && (selectedArticle as Article | KnowledgeArticle).title && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {(selectedArticle as Article | KnowledgeArticle).title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>Por {(selectedArticle as Article | KnowledgeArticle).author?.name || 'Usuário'}</span>
                <span>
                  {formatDistanceToNow(new Date((selectedArticle as Article | KnowledgeArticle).createdAt || new Date()), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: (selectedArticle as Article | KnowledgeArticle).content || '' }}
          />
        </div>
      )}
    </div>
  );
}
