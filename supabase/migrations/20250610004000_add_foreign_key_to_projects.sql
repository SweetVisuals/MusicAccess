ALTER TABLE public.projects
ADD CONSTRAINT fk_profiles
FOREIGN KEY (user_id)
REFERENCES public.profiles(id);
