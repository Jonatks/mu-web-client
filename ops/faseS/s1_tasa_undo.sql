begin;
update config."GameConfiguration" g set "ExperienceRate" = b."ExperienceRate", "MasterExperienceRate" = b."MasterExperienceRate"
from mu_plugins.gameconfig_bak_s1 b where b."Id" = g."Id";
drop table mu_plugins.gameconfig_bak_s1;
commit;
