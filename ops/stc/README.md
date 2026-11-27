# STC backup automation

Add these GitHub Actions repository secrets (Settings → Secrets and variables → Actions):
- SUPABASE_DB_URL: direct PostgreSQL connection URI for this project.
- SUPABASE_URL: Supabase project URL.
- SUPABASE_SERVICE_ROLE_KEY: server-only service role/secret key.
- STC_ENCRYPTION_PASSPHRASE: unique random passphrase, preferably 32+ random characters. Keep it in a password manager. Losing it makes the archives unrecoverable.

Daily schedule: 05:00 Asia/Riyadh (02:00 UTC), plus manual dispatch.

The workflow captures a PostgreSQL custom-format dump, the main-branch source tree and commit, all downloadable objects from Supabase Storage, and the track-event Edge Function source. It encrypts the archive with OpenSSL AES-256-CBC/PBKDF2 before uploading it as a GitHub Release asset.

IMPORTANT: The GitHub repository is public. Only encrypted ciphertext is uploaded; never upload plaintext backups or secrets. The decryption passphrase stays in GitHub Actions Secrets. This provides an off-Supabase copy but still depends on GitHub availability.

Limitations to close before claiming full recovery: Auth user restoration, Vercel environment variables, project-level settings, and a tested restore into a separate Supabase project. Verify every run and do a restore drill before relying on it.
