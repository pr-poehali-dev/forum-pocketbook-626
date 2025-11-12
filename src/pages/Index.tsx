import { useState, useEffect } from 'react';
import { authService } from '@/lib/auth';
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
  const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);

  const [ideas, setIdeas] = useState<Idea[]>([]);

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

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '629116677903-9uu1j8b3bvj0dku0vpqstm58d9jdgbmp.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    const scope = 'profile email';
    const responseType = 'token';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=${responseType}&scope=${scope}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    authService.getCurrentUser().then(currentUser => {
      if (currentUser) {
        setUser(currentUser);
      }
    });

    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        authService.loginWithGoogle(accessToken)
          .then(response => {
            setUser(response.user);
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch(err => {
            console.error('Authentication error:', err);
            alert('Ошибка авторизации. Попробуйте снова.');
          });
      }
    }
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleSubmitIdea = () => {
    if (!user) {
      alert('Пожалуйста, войдите через Google, чтобы публиковать идеи');
      return;
    }
    if (newIdea.title.trim() && newIdea.description.trim()) {
      const idea: Idea = {
        id: Date.now().toString(),
        title: newIdea.title,
        description: newIdea.description,
        author: user.name,
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
    if (!user) {
      alert('Пожалуйста, войдите через Google, чтобы комментировать');
      return;
    }
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
                author: user.name,
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
    if (activeTab === 'mine') return user && idea.author === user.name;
    if (activeTab === 'search') {
      return idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div className="inline-block">
              <div className="bg-gradient-vibrant p-4 rounded-3xl shadow-2xl">
                <h1 className="text-4xl font-bold text-white drop-shadow-lg">
                  Pocketbook Forum
                </h1>
              </div>
            </div>
            {!user ? (
              <Button
                onClick={handleGoogleLogin}
                className="bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 shadow-lg px-6 h-12 rounded-xl"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Войти через Google
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-lg">
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <img src={user.picture} alt={user.name} />
                    <AvatarFallback className="bg-gradient-vibrant text-white font-bold">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="h-12 rounded-xl"
                >
                  <Icon name="LogOut" size={18} className="mr-2" />
                  Выйти
                </Button>
              </div>
            )}
          </div>
          <p className="text-lg text-muted-foreground text-center">
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