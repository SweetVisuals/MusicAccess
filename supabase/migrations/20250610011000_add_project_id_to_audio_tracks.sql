ALTER TABLE public.audio_tracks
ADD COLUMN project_id UUID;

ALTER TABLE public.audio_tracks
ADD CONSTRAINT fk_project_id
FOREIGN KEY (project_id)
REFERENCES public.projects(id)
ON DELETE CASCADE;
