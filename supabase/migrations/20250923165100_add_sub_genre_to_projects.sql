-- Add sub_genre column to projects table for storing multiple sub-genre tags
ALTER TABLE projects ADD COLUMN sub_genre text[];