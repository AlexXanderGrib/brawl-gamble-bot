
CREATE TYPE public.balance AS (
  income NUMERIC(17, 2),
  spent NUMERIC(17, 2)
)

CREATE TYPE public.user_role AS ENUM (
  'user',
  'moderator',
  'admin'
);


CREATE TABLE public.users (
  role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
  
  user_id integer NOT NULL CONSTRAINT unsigned_vk_user_id CHECK ((user_id >= 0)),
  group_id integer NOT NULL CONSTRAINT unsigned_vk_group_id CHECK ((group_id >= 0)),
  
  deposit_balance public.balance DEFAULT ROW(0, 0)::public.balance NOT NULL,
  game_balance public.balance DEFAULT ROW(0, 0)::public.balance NOT NULL,
  diamond_balance public.balance DEFAULT ROW(0, 0)::public.balance NOT NULL,

  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  subscriptions jsonb DEFAULT '{}'::jsonb NOT NULL,
  
  achievements character varying[] DEFAULT ARRAY[]::character varying[] NOT NULL,
  referrer integer,
  registration_date timestamp not null default current_timestamp,
  rank_points integer not null default 0,
  last_recorded_rank integer not null default 0,
  last_active timestamp not null default current_timestamp,

  PRIMARY KEY(user_id, group_id)
);
 

