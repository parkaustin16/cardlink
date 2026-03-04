import { supabase } from '@/lib/supabase';
import type { CardSet } from '@/lib/supabase';
import type { Language } from '@/lib/i18n';

export const fetchGameId = async (
  gameSlug: string
): Promise<{ gameId: string | null; errorMessage: string | null }> => {
  const normalizedSlug = gameSlug?.trim();
  if (!normalizedSlug || normalizedSlug === 'undefined') {
    return {
      gameId: null,
      errorMessage: 'Missing game slug in URL',
    };
  }

  const { data: slugData, error: slugError } = await supabase
    .from('games')
    .select('game_id')
    .eq('slug', normalizedSlug)
    .maybeSingle();

  if (slugError) {
    return {
      gameId: null,
      errorMessage: slugError.message,
    };
  }

  if (slugData) {
    return { gameId: slugData.game_id, errorMessage: null };
  }

  const { data: legacySlugData, error: legacySlugError } = await supabase
    .from('games')
    .select('game_id')
    .ilike('slug', `${normalizedSlug}%`)
    .limit(1)
    .maybeSingle();

  if (legacySlugError) {
    return {
      gameId: null,
      errorMessage: legacySlugError.message,
    };
  }

  if (legacySlugData) {
    return { gameId: legacySlugData.game_id, errorMessage: null };
  }

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      normalizedSlug
    );

  if (!isUuid) {
    return {
      gameId: null,
      errorMessage: 'No game found for this slug or id',
    };
  }

  const { data: idData, error: idError } = await supabase
    .from('games')
    .select('game_id')
    .eq('game_id', normalizedSlug)
    .maybeSingle();

  if (idError) {
    return {
      gameId: null,
      errorMessage: idError.message,
    };
  }

  if (!idData) {
    return {
      gameId: null,
      errorMessage: 'No game found for this slug or id',
    };
  }

  return { gameId: idData.game_id, errorMessage: null };
};

export const fetchSet = async (
  gameId: string | null,
  setSlug: string,
  language: Language
): Promise<{
  set: CardSet | null;
  localizedName: string | null;
  errorMessage: string | null;
}> => {
  const normalizedSlug = setSlug?.trim();
  if (!normalizedSlug || normalizedSlug === 'undefined') {
    return {
      set: null,
      localizedName: null,
      errorMessage: 'Missing set slug in URL',
    };
  }

  if (!gameId) {
    return {
      set: null,
      localizedName: null,
      errorMessage: 'Missing game_id for set query',
    };
  }

  if (language !== 'en') {
    const { data: localizationData, error: localizationError } = await supabase
      .from('set_localizations')
      .select('set_id, name, local_set_slug, master_set_slug, language')
      .eq('language', language)
      .ilike('local_set_slug', normalizedSlug)
      .limit(1)
      .maybeSingle();

    if (localizationError) {
      return {
        set: null,
        localizedName: null,
        errorMessage: localizationError.message,
      };
    }

    if (localizationData) {
      const { data, error } = await supabase
        .from('sets')
        .select('set_id, game_id, name, code, slug')
        .eq('game_id', gameId)
        .ilike('slug', localizationData.master_set_slug)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return {
          set: null,
          localizedName: localizationData.name,
          errorMessage: error?.message ?? 'Unknown error fetching set',
        };
      }

      return {
        set: data,
        localizedName: localizationData.name,
        errorMessage: null,
      };
    }
  }

  const { data, error } = await supabase
    .from('sets')
    .select('set_id, game_id, name, code, slug')
    .eq('game_id', gameId)
    .eq('slug', normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (data) {
    return { set: data, localizedName: null, errorMessage: null };
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('sets')
    .select('set_id, game_id, name, code, slug')
    .eq('game_id', gameId)
    .ilike('slug', normalizedSlug)
    .limit(1)
    .maybeSingle();

  if (error || fallbackError || !fallbackData) {
    return {
      set: null,
      localizedName: null,
      errorMessage:
        error?.message ??
        fallbackError?.message ??
        'Unknown error fetching set',
    };
  }

  return { set: fallbackData, localizedName: null, errorMessage: null };
};

export const fetchSetLocalization = async (
  setId: string,
  language: Language
): Promise<string | null> => {
  if (language === 'en') return null;

  const { data, error } = await supabase
    .from('set_localizations')
    .select('name, language')
    .eq('set_id', setId)
    .eq('language', language)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.name;
};
