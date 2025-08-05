ALTER TABLE public.tracks
ADD CONSTRAINT tracks_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.projects(id)
ON DELETE CASCADE;
