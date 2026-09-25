# Auth email branding

This file is prepared for manual installation; it is NOT applied to hosted Supabase by committing it.

In Supabase Authentication → Email Templates → Confirm sign up:
- Subject: Confirm your Business Client OS account
- Paste confirmation.html as the HTML body. Preserve the Go template variable `{{ .ConfirmationURL }}` exactly.

In the project's Auth URL configuration, set the actual production Site URL and allow the exact `/auth/callback` URL used by this app. Add staging redirects separately. Use a real verified sending domain and configure custom SMTP with sender name `Business Client OS`; enter SMTP credentials only in the Supabase dashboard/secret store. Configure SPF/DKIM/DMARC as instructed by the chosen provider and disable link tracking for auth emails.

Test a fresh signup, expired/reused link, same-browser callback and sign-in in staging. Dashboard plan/provider restrictions may affect template customization. No SMTP settings, templates or dashboard configuration were changed by this commit.

References: https://supabase.com/docs/guides/auth/auth-email-templates and https://supabase.com/docs/guides/auth/auth-smtp
