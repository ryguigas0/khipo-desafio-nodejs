alter table "public"."Task"
add constraint task_status_constraint check ("status" in ('pending', 'ongoing', 'done'))