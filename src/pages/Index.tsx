import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

interface Idea {
  id: string;
  title: string;
  description: string;
  author: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  category: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'mine' | 'search'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewIdeaForm, setShowNewIdeaForm] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [likedIdeas, setLikedIdeas] = useState<Set<string>>(new Set());

  const [ideas, setIdeas] = useState<Idea[]>([
    {
      id: '1',
      title: 'Добавить темную тему в приложение',
      description: 'Было бы здорово иметь возможность переключаться между светлой и темной темой для комфортного чтения в разное время суток.',
      author: 'Алексей М.',
      likes: 42,
      comments: [
        { id: 'c1', author: 'Мария К.', text: 'Отличная идея! Поддерживаю', timestamp: '10 мин назад' },
        { id: 'c2', author: 'Иван П.', text: 'Уже давно жду эту функцию', timestamp: '25 мин назад' }
      ],
      timestamp: '2 часа назад',
      category: 'UI/UX'
    },
    {
      id: '2',
      title: 'Интеграция с облачными хранилищами',
      description: 'Возможность синхронизировать данные с Google Drive, Dropbox и другими сервисами.',
      author: 'Елена С.',
      likes: 38,
      comments: [],
      timestamp: '5 часов назад',
      category: 'Функционал'
    },
    {
      id: '3',
      title: 'Режим совместного редактирования',
      description: 'Добавить возможность работать над документами вместе с другими пользователями в реальном времени.',
      author: 'Дмитрий Л.',
      likes: 56,
      comments: [
        { id: 'c3', author: 'Ольга В.', text: 'Это будет прорыв!', timestamp: '1 час назад' }
      ],
      timestamp: '1 день назад',
      category: 'Функционал'
    }
  ]);

  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'Общее'
  });

  const handleLike = (ideaId: string) => {
    setLikedIdeas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ideaId)) {
        newSet.delete(ideaId);
        setIdeas(ideas.map(idea => 
          idea.id === ideaId ? { ...idea, likes: idea.likes - 1 } : idea
        ));
      } else {
        newSet.add(ideaId);
        setIdeas(ideas.map(idea => 
          idea.id === ideaId ? { ...idea, likes: idea.likes + 1 } : idea
        ));
      }
      return newSet;
    });
  };

  const handleSubmitIdea = () => {
    if (newIdea.title.trim() && newIdea.description.trim()) {
      const idea: Idea = {
        id: Date.now().toString(),
        title: newIdea.title,
        description: newIdea.description,
        author: 'Вы',
        likes: 0,
        comments: [],
        timestamp: 'только что',
        category: newIdea.category
      };
      setIdeas([idea, ...ideas]);
      setNewIdea({ title: '', description: '', category: 'Общее' });
      setShowNewIdeaForm(false);
    }
  };

  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});

  const handleAddComment = (ideaId: string) => {
    const commentText = newComment[ideaId]?.trim();
    if (commentText) {
      setIdeas(ideas.map(idea => {
        if (idea.id === ideaId) {
          return {
            ...idea,
            comments: [
              ...idea.comments,
              {
                id: Date.now().toString(),
                author: 'Вы',
                text: commentText,
                timestamp: 'только что'
              }
            ]
          };
        }
        return idea;
      }));
      setNewComment({ ...newComment, [ideaId]: '' });
    }
  };

  const filteredIdeas = ideas.filter(idea => {
    if (activeTab === 'popular') return idea.likes > 40;
    if (activeTab === 'mine') return idea.author === 'Вы';
    if (activeTab === 'search') {
      return idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 text-center animate-fade-in">
          <div className="inline-block mb-4">
            <div className="bg-gradient-vibrant p-6 rounded-3xl shadow-2xl">
              <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                Pocketbook Forum
              </h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground mt-4">
            Делитесь идеями, обсуждайте и вдохновляйте сообщество 💡
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-8 justify-center animate-scale-in">
          <Button
            onClick={() => setActiveTab('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-6 transition-all duration-300",
              activeTab === 'all' && "bg-gradient-vibrant border-0 shadow-lg hover:shadow-xl"
            )}
          >
            <Icon name="Home" size={18} className="mr-2" />
            Все идеи
          </Button>
          <Button
            onClick={() => setActiveTab('popular')}
            variant={activeTab === 'popular' ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-6 transition-all duration-300",
              activeTab === 'popular' && "bg-gradient-vibrant border-0 shadow-lg hover:shadow-xl"
            )}
          >
            <Icon name="TrendingUp" size={18} className="mr-2" />
            Популярное
          </Button>
          <Button
            onClick={() => setActiveTab('mine')}
            variant={activeTab === 'mine' ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-6 transition-all duration-300",
              activeTab === 'mine' && "bg-gradient-vibrant border-0 shadow-lg hover:shadow-xl"
            )}
          >
            <Icon name="User" size={18} className="mr-2" />
            Мои идеи
          </Button>
          <Button
            onClick={() => setActiveTab('search')}
            variant={activeTab === 'search' ? 'default' : 'outline'}
            className={cn(
              "rounded-full px-6 transition-all duration-300",
              activeTab === 'search' && "bg-gradient-vibrant border-0 shadow-lg hover:shadow-xl"
            )}
          >
            <Icon name="Search" size={18} className="mr-2" />
            Поиск
          </Button>
        </div>

        {activeTab === 'search' && (
          <div className="mb-8 animate-fade-in">
            <div className="relative">
              <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск идей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg rounded-2xl border-2 focus:border-primary"
              />
            </div>
          </div>
        )}

        <div className="mb-8">
          <Button
            onClick={() => setShowNewIdeaForm(!showNewIdeaForm)}
            className="w-full h-16 text-lg rounded-2xl bg-gradient-vibrant hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Icon name="Plus" size={24} className="mr-2" />
            Предложить идею
          </Button>
        </div>

        {showNewIdeaForm && (
          <Card className="mb-8 border-2 border-primary/20 shadow-xl animate-scale-in rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-vibrant" />
            <CardHeader>
              <h3 className="text-2xl font-bold">Новая идея</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Название идеи"
                value={newIdea.title}
                onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
                className="h-12 text-lg rounded-xl"
              />
              <Textarea
                placeholder="Опишите вашу идею подробнее..."
                value={newIdea.description}
                onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
                className="min-h-32 text-lg rounded-xl"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitIdea}
                  className="flex-1 h-12 bg-gradient-vibrant hover:opacity-90 rounded-xl"
                >
                  <Icon name="Send" size={18} className="mr-2" />
                  Опубликовать
                </Button>
                <Button
                  onClick={() => setShowNewIdeaForm(false)}
                  variant="outline"
                  className="h-12 rounded-xl"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {filteredIdeas.map((idea, index) => (
            <Card
              key={idea.id}
              className="border-2 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-2xl rounded-2xl overflow-hidden animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-1 bg-gradient-vibrant" />
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <Avatar className="w-12 h-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-gradient-vibrant text-white font-bold">
                        {idea.author.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2">{idea.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                        <span className="font-medium">{idea.author}</span>
                        <span>•</span>
                        <span>{idea.timestamp}</span>
                      </div>
                      <Badge className="bg-gradient-blue text-white border-0">
                        {idea.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-base leading-relaxed">{idea.description}</p>

                <div className="flex items-center gap-4 pt-4 border-t">
                  <Button
                    onClick={() => handleLike(idea.id)}
                    variant="ghost"
                    size="lg"
                    className={cn(
                      "rounded-xl transition-all duration-300",
                      likedIdeas.has(idea.id) && "text-pink-500 hover:text-pink-600"
                    )}
                  >
                    <Icon
                      name="Heart"
                      size={20}
                      className={cn(
                        "mr-2 transition-transform duration-300",
                        likedIdeas.has(idea.id) && "fill-current scale-110"
                      )}
                    />
                    <span className="font-semibold">{idea.likes}</span>
                  </Button>
                  <Button
                    onClick={() => setExpandedComments(expandedComments === idea.id ? null : idea.id)}
                    variant="ghost"
                    size="lg"
                    className="rounded-xl"
                  >
                    <Icon name="MessageCircle" size={20} className="mr-2" />
                    <span className="font-semibold">{idea.comments.length}</span>
                  </Button>
                </div>

                {expandedComments === idea.id && (
                  <div className="space-y-4 pt-4 border-t animate-fade-in">
                    {idea.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 p-4 bg-muted/50 rounded-xl">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {comment.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                          </div>
                          <p className="text-sm">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Написать комментарий..."
                        value={newComment[idea.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [idea.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment(idea.id)}
                        className="rounded-xl"
                      />
                      <Button
                        onClick={() => handleAddComment(idea.id)}
                        className="bg-gradient-vibrant hover:opacity-90 rounded-xl"
                      >
                        <Icon name="Send" size={18} />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIdeas.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-vibrant rounded-full mb-4">
              <Icon name="Lightbulb" size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Идей не найдено</h3>
            <p className="text-muted-foreground">
              {activeTab === 'search' ? 'Попробуйте изменить запрос' : 'Будьте первым, кто предложит идею!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
