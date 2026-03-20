import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string | null;
  industry: string | null;
  brand_voice: string | null;
  color_1: string | null;
  color_2: string | null;
  color_3: string | null;
  logo_url: string | null;
}

export function useBrandProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['brand-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as BrandProfile | null;
    },
    enabled: !!user,
  });

  const upsert = useMutation({
    mutationFn: async (profile: Partial<BrandProfile>) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('brand_profiles')
        .upsert({ ...profile, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-profile'] });
    },
  });

  const completionScore = (() => {
    const p = query.data;
    if (!p) return 0;
    let score = 0;
    if (p.brand_name) score += 20;
    if (p.industry) score += 20;
    if (p.brand_voice) score += 20;
    if (p.color_1 && p.color_2 && p.color_3) score += 20;
    if (p.logo_url) score += 20;
    return score;
  })();

  return { profile: query.data, isLoading: query.isLoading, upsert, completionScore };
}
