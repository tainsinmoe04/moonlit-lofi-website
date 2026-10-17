import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const tracks = sqliteTable('tracks', { id: text('id').primaryKey(), title: text('title').notNull(), mood: text('mood').notNull(), audio: text('audio').notNull(), cover: text('cover').notNull(), youtube: text('youtube'), created: integer('created').notNull(), status: text('status').notNull().default('published'), audience: text('audience').notNull().default('public'), releaseAt: integer('release_at') });
export const events = sqliteTable('events', { id: text('id').primaryKey(), track: text('track').notNull(), country: text('country').notNull(), at: integer('at').notNull(), seconds: integer('seconds').notNull() });
export const playlists = sqliteTable('playlists', {id:text('id').primaryKey(),title:text('title').notNull(),description:text('description').notNull(),trackIds:text('track_ids').notNull(),created:integer('created').notNull()});
export const settings = sqliteTable('settings',{key:text('key').primaryKey(),value:text('value').notNull()});

export const members = sqliteTable('members',{id:text('id').primaryKey(),name:text('name').notNull(),tokenHash:text('token_hash').notNull().unique(),active:integer('active').notNull().default(1),expires:integer('expires').notNull(),created:integer('created').notNull()});
