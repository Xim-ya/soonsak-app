export const CONTENT_DATABASE = {
  TABLES: {
    CONTENTS: 'contents',
    VIDEOS: 'videos',
    CONTENT_COLLECTIONS: 'content_collections',
  },
  COLUMNS: {
    ID: 'id',
    TITLE: 'title',
    CONTENT_TYPE: 'content_type',
    POSTER_PATH: 'poster_path',
    UPLOADED_AT: 'uploaded_at',
  },
  RPC: {
    INCREMENT_VIEW_COUNT: 'increment_content_view_count',
    INCREMENT_PLAY_COUNT: 'increment_content_play_count',
    GET_REGISTERED_CONTENTS_WITH_ENDING: 'get_registered_contents_with_ending',
    GET_TOP_CONTENTS_BY_SCORE: 'get_top_contents_by_score',
    SEARCH_CONTENTS_KOREAN: 'search_contents_korean',
    GET_DISTINCT_CONTENTS_BY_CHANNEL: 'get_distinct_contents_by_channel',
    GET_CONTENTS_BY_GENRE: 'get_contents_by_genre',
    GET_LONG_RUNTIME_CONTENTS: 'get_long_runtime_contents',
    GET_RANDOM_CURATION_VIDEOS: 'get_random_curation_videos',
    GET_RANDOM_BANNER_CONTENTS: 'get_random_banner_contents',
    GET_CONTENT_COLLECTIONS: 'get_content_collections',
    GET_TRENDING_CONTENTS: 'get_trending_contents',
    GET_RECENT_TRENDING_CONTENTS: 'get_recent_trending_contents',
    GET_SOONSAK_TOP_TEN: 'get_soonsak_top_ten',
    GET_CHANNEL_VIDEOS: 'get_channel_videos',
    GET_EXPLORE_CONTENTS_BY_TRENDING_SCORE: 'get_explore_contents_by_trending_score',
  },
} as const;

export const CHANNEL_DATABASE = {
  TABLES: {
    CHANNELS: 'channels',
  },
  COLUMNS: {
    ID: 'id',
    NAME: 'name',
    IS_ACTIVE: 'is_active',
  },
  RPC: {
    GET_RANDOM_ACTIVE_CHANNELS: 'get_random_active_channels',
  },
  LIMITS: {
    MAX_CHANNELS: 20,
    DEFAULT_RANDOM: 12,
  },
} as const;

export const AUTH_DATABASE = {
  TABLES: {
    PROFILES: 'profiles',
  },
  COLUMNS: {
    ID: 'id',
    EMAIL: 'email',
    DISPLAY_NAME: 'display_name',
    AVATAR_URL: 'avatar_url',
    PROVIDER: 'provider',
    ROLE: 'role',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
    LAST_LOGIN_AT: 'last_login_at',
    ENTRY_COUNT: 'entry_count',
  },
  RPC: {
    INCREMENT_PROFILE_ENTRY_COUNT: 'increment_profile_entry_count',
  },
} as const;

export const PUSH_DATABASE = {
  TABLES: {
    PUSH_TOKENS: 'push_tokens',
  },
  COLUMNS: {
    ID: 'id',
    USER_ID: 'user_id',
    TOKEN: 'token',
    PLATFORM: 'platform',
    DEVICE_ID: 'device_id',
    IS_ACTIVE: 'is_active',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
  },
} as const;

export const DEVICE_DATABASE = {
  TABLES: {
    DEVICES: 'devices',
  },
  COLUMNS: {
    ID: 'id',
    DEVICE_ID: 'device_id',
    PLATFORM: 'platform',
    USER_ID: 'user_id',
    LINKED_AT: 'linked_at',
    CREATED_AT: 'created_at',
    UPDATED_AT: 'updated_at',
    ENTRY_COUNT: 'entry_count',
  },
  RPC: {
    INCREMENT_DEVICE_ENTRY_COUNT: 'increment_device_entry_count',
    TRANSFER_DEVICE_ENTRY_COUNT: 'transfer_device_entry_count',
  },
} as const;
