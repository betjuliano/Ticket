'use client';

import { useState, useEffect } from 'react';
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

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  published: boolean;
  featured: boolean;
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

export function KnowledgeBase() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [publishedFilter, setPublishedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const userRole = session?.user?.role;
  const canManage = userRole === 'ADMIN' || userRole === 'COORDINATOR';

  // Carregar dados
  useEffect(() => {
    loadData();
  }, [selectedCategory, publishedFilter, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Para usuários comuns, forçar apenas artigos publicados
      const effectivePublishedFilter = canManage ? publishedFilter : 'true';

      // Carregar categorias e artigos em paralelo
      const [categoriesResponse, articlesResponse] = await Promise.all([
        fetch('/api/knowledge/categories?includeArticleCount=true'),
        fetch(
          `/api/knowledge/articles?${new URLSearchParams({
            ...(selectedCategory && { categoryId: selectedCategory }),
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
      toast.error('Erro ao carregar dados da Knowledge Base');
    } finally {
      setIsLoading(false);
    }
  };

  // Visualizar artigo
  const viewArticle = async (article: Article) => {
    try {
      const response = await fetch(`/api/knowledge/articles/${article.id}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar artigo');
      }

      const data = await response.json();
      setSelectedArticle(data.data);
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
    if (selectedCategory && article.category.id !== selectedCategory)
      return false;
    if (publishedFilter === 'true' && !article.published) return false;
    if (publishedFilter === 'false' && article.published) return false;
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
  const featuredArticles = filteredArticles.filter(article => article.featured);

  // Renderizar visualização de artigo
  if (selectedArticle) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedArticle(null)}>
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
                  {selectedArticle.featured && (
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
                      selectedArticle.published
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedArticle.published ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span style={{ color: selectedArticle.category.color }}>
                    {selectedArticle.category.icon}
                  </span>
                  <span>{selectedArticle.category.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{selectedArticle.author.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{selectedArticle.viewCount} visualizações</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(selectedArticle.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              {selectedArticle.tags.length > 0 && (
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
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">
            Base de conhecimento e documentação
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() =>
              toast.info('Funcionalidade de criação será implementada')
            }
            className="tactical-button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Artigo
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="tactical-card">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="tactical-input pl-10"
                />
              </div>
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: category.color }}>
                        {category.icon}
                      </span>
                      <span>{category.name}</span>
                      {category.articleCount !== undefined && (
                        <Badge variant="secondary" className="ml-auto">
                          {category.articleCount}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManage && (
              <Select
                value={publishedFilter}
                onValueChange={setPublishedFilter}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Publicados</SelectItem>
                  <SelectItem value="false">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            )}

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Artigos em destaque */}
      {featuredArticles.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Artigos em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredArticles.slice(0, 3).map(article => (
              <Card
                key={article.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="font-semibold line-clamp-2">
                        {article.title}
                      </h3>
                      {article.metaDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.metaDescription}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${article.category.color}20`,
                        color: article.category.color,
                      }}
                    >
                      {article.category.icon}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.viewCount}</span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(article.updatedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={() => viewArticle(article)}
                  >
                    Ler artigo
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Lista de artigos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Todos os Artigos ({filteredArticles.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Nenhum artigo encontrado</p>
              {canManage && (
                <Button
                  className="mt-4"
                  onClick={() =>
                    toast.info('Funcionalidade de criação será implementada')
                  }
                >
                  Criar primeiro artigo
                </Button>
              )}
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
            {filteredArticles.map(article => (
              <Card
                key={article.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold line-clamp-2">
                          {article.title}
                        </h3>
                        {!article.published && (
                          <Badge variant="outline" className="text-xs">
                            Rascunho
                          </Badge>
                        )}
                      </div>
                      {article.metaDescription && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {article.metaDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${article.category.color}20`,
                          color: article.category.color,
                        }}
                      >
                        <span className="mr-1">{article.category.icon}</span>
                        {article.category.name}
                      </Badge>
                    </div>

                    {article.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{article.viewCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{article.author.name}</span>
                        </div>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(article.updatedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        variant="outline"
                        onClick={() => viewArticle(article)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toast.info(
                                'Funcionalidade de edição será implementada'
                              )
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {userRole === 'ADMIN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteArticle(article.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
