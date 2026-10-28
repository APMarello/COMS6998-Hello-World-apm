update public.terms
set term = 'POV',
    guidance = 'Use as an optional opener for a concise first-person perspective caption, such as “POV: …”.',
    sort_order = 1,
    is_active = true,
    updated_at = now()
where lower(term) = 'pov';

update public.terms
set term = 'Me when',
    guidance = 'Use as an optional opener for a relatable reaction to a specific situation, such as “Me when …”.',
    sort_order = 2,
    is_active = true,
    updated_at = now()
where lower(term) = 'reaction';

update public.terms
set term = 'The face you make when',
    guidance = 'Use as an optional opener that frames the image as a facial reaction to a recognizable situation.',
    sort_order = 3,
    is_active = true,
    updated_at = now()
where lower(term) = 'ironic humor';

insert into public.terms (term, guidance, sort_order)
values
  ('Nobody:', 'Use as an optional setup for an unsolicited or exaggerated reaction, such as “Nobody: … / Me: …”.', 4),
  ('When you', 'Use as an optional situation-based opener, such as “When you realize …”.', 5),
  ('That feeling when', 'Use as an optional opener for a highly relatable emotional or awkward moment.', 6),
  ('How it feels when', 'Use as an optional opener that dramatizes a familiar experience.', 7),
  ('Me trying to', 'Use as an optional opener for a failed, overconfident, or chaotic attempt.', 8),
  ('Me pretending to', 'Use as an optional opener for performative confidence, understanding, or composure.', 9),
  ('Expectation vs. reality', 'Use as an optional contrast format between an idealized expectation and the actual outcome.', 10),
  ('Tell me you [x] without telling me', 'Use as an optional indirect-callout format; replace [x] with an image-relevant trait or situation.', 11),
  ('Nobody asked, but', 'Use as an optional opener for an unnecessary, overshared, or dramatic response.', 12),
  ('Why is nobody talking about', 'Use as an optional mock-serious opener for an oddly specific observation.', 13)
on conflict (lower(term)) do update
set guidance = excluded.guidance,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();
