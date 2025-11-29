import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, Badge, Button } from '@parallel/ui';
import {
  Image,
  Music,
  Video,
  FileText,
  Eye,
  Trash2,
  Flag,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const page = parseInt(params.page || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // Fetch content stats
  const [
    { count: totalContent },
    { count: imageCount },
    { count: musicCount },
    { count: videoCount },
    { count: flaggedCount },
  ] = await Promise.all([
    supabase.from('generated_content').select('*', { count: 'exact', head: true }),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('content_type', 'image'),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('content_type', 'music'),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('content_type', 'video'),
    supabase.from('generated_content').select('*', { count: 'exact', head: true }).eq('status', 'flagged'),
  ]);

  // Fetch content with user data
  let query = supabase
    .from('generated_content')
    .select(`
      *,
      profiles:user_id (
        id,
        email,
        display_name,
        username
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.type) {
    query = query.eq('content_type', params.type);
  }

  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { data: content, count } = await query;
  const totalPages = Math.ceil((count || 0) / limit);

  const stats = [
    { title: 'Total Content', value: totalContent || 0, icon: FileText, color: 'text-blue-400' },
    { title: 'Images', value: imageCount || 0, icon: Image, color: 'text-green-400' },
    { title: 'Music', value: musicCount || 0, icon: Music, color: 'text-violet-400' },
    { title: 'Videos', value: videoCount || 0, icon: Video, color: 'text-amber-400' },
  ];

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'flagged':
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const buildPaginationUrl = (newPage: number) => {
    const typeParam = params.type ? `&type=${params.type}` : '';
    const statusParam = params.status ? `&status=${params.status}` : '';
    return `/admin/content?page=${newPage}${typeParam}${statusParam}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Generated Content</h1>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {flaggedCount && flaggedCount > 0 && (
            <Button variant="destructive">
              <Flag className="w-4 h-4 mr-2" />
              {flaggedCount} Flagged
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <h3 className="text-3xl font-bold">{stat.value.toLocaleString()}</h3>
              <p className="text-white/60">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Type Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'image', 'music', 'video'].map((type) => (
          <Link
            key={type}
            href={type === 'all' ? '/admin/content' : `/admin/content?type=${type}`}
            className={`px-4 py-2 rounded-xl text-sm transition ${
              (type === 'all' && !params.type) || params.type === type
                ? 'bg-violet-500 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {content?.map((item: any) => (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
              {item.content_type === 'image' && item.output_url ? (
                <img
                  src={item.output_url}
                  alt={item.prompt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white/20">
                  {getContentIcon(item.content_type)}
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {getContentIcon(item.content_type)}
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm text-white/80 line-clamp-2 mb-2">{item.prompt}</p>
              <p className="text-xs text-white/40 mb-3">
                by {item.profiles?.display_name || item.profiles?.username || 'Anonymous'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Flag className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-8">
        <p className="text-white/60">
          Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0}
        </p>
        <div className="flex items-center gap-2">
          {page <= 1 ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Link href={buildPaginationUrl(page - 1)}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          )}
          <span className="px-4">
            Page {page} of {totalPages || 1}
          </span>
          {page >= totalPages ? (
            <Button variant="outline" size="sm" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Link href={buildPaginationUrl(page + 1)}>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
