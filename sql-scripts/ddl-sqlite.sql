-- Drop tables

drop table if exists variant_img;
drop table if exists variant;
drop index if exists media_ref_external_idx;
drop table if exists media_ref;
drop index if exists media_owner_id_idx;
drop table if exists media;

-- Create tables

create table media (
  media_id integer not null primary key autoincrement,
  ts timestamp not null default current_timestamp,
  base_name varchar(255),
  orig_name varchar(255),
  owner_id varchar(255)
);

create index media_owner_id_idx on media(owner_id);

create table media_ref (
  media_id bigint not null primary key references media(media_id) on delete cascade,
  external_type varchar(50) not null, -- examples: 'contributorAvatar', 'task'
  external_id varchar(255) not null
);

create index media_ref_external_idx on media_ref(external_type, external_id);

create table variant (
  variant_id integer not null primary key autoincrement,
  media_id bigint not null references media(media_id),
  code varchar(255) not null, -- examples: 'orig', '800x600', '80x80'
  weight_b integer not null,
  im_type varchar(255) not null,
  bin_data blob not null,
  unique (media_id, code)
);

create table variant_img (
  variant_id bigint not null references variant(variant_id) on delete cascade,
  width integer not null,
  height integer not null,
  dpi integer
);
