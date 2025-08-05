# Email Confirmation Setup Guide

To enable email confirmation for user signups in TuneFlow, follow these steps in your Supabase dashboard:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your TuneFlow project
3. Go to Authentication → Settings
4. Under "Email Confirmations", ensure:
   - "Enable email confirmations" is checked
   - "Double confirm before updating email" is checked (recommended)
5. Under "Email Templates", customize the confirmation email if needed
6. Save your changes

## Required Configuration

Make sure these settings are properly configured:

- **Confirmation Email**: Enabled
- **Redirect URL**: Should match your application's callback URL (`${window.location.origin}/auth/callback`)
- **Site URL**: Should be your application's base URL

## Testing

After enabling email confirmations:

1. Try signing up as a new user
2. Check your email for a confirmation link
3. Click the link to verify it redirects properly to your app
4. The user should see a "Email confirmed successfully" toast message

## Troubleshooting

If confirmations aren't working:

1. Check Supabase logs for email sending errors
2. Verify your SMTP settings in Supabase
3. Ensure your domain is properly verified if using custom domains
4. Check spam folders for confirmation emails
