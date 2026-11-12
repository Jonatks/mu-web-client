# Admin web (Vercel)

Static page plus serverless functions. Sign-in uses the admins in the `ADMIN_USERS` environment variable; the functions in `api/` forward
calls to the VM service with `MU_ADMIN_KEY`. Nothing secret is in the repo. See [readme.md in admin/](../readme.md).
