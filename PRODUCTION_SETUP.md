# Brief Group AI Production Setup

## 1. Add Firebase Environment Variables

The app now includes Vercel-safe Firebase fallback values so deployment can work
even if your Vercel account does not show the variable form. Environment
variables are still supported and preferred for a cleaner production setup.

1. In VS Code, open the project folder: `C:\Users\HomePC\Desktop\briefgroup-ai`.
2. Copy `.env.example` and rename the copy to `.env.local`.
3. Go to Firebase Console, open your project, then open Project settings.
4. In Your apps, copy the web app Firebase config values.
5. Paste the values into `.env.local`.
6. In Vercel, open the project, not the Team settings page.
7. Go to Settings, then Environment Variables.
8. Click Add New if the button is visible.
9. Add the same variables from `.env.local`.
10. Redeploy the Vercel project.

Do not commit `.env.local`. The `.gitignore` already protects `.env*`.

If the Add New button is not visible in Vercel, continue deployment anyway. This
codebase will use the fallback Firebase web config from `app/lib/firebase.ts`.

## 2. Secure Firebase Auth

1. In Firebase Console, open Authentication.
2. Enable Email/Password sign-in.
3. Add your real admin email to `NEXT_PUBLIC_ADMIN_EMAILS`.
4. In Vercel, update `NEXT_PUBLIC_ADMIN_EMAILS` with the same email.
5. Visit `/register`, create your account, then visit `/dashboard`.
6. Visit `/admin` only with an email listed in `NEXT_PUBLIC_ADMIN_EMAILS`.

## 3. Publish Firestore And Storage Rules

1. Open Firebase Console.
2. Go to Firestore Database, then Rules.
3. Copy the contents of `firestore.rules`.
4. Replace `replace-with-your-admin-email@example.com` with your admin email.
5. Publish the rules.
6. Go to Storage, then Rules.
7. Copy the contents of `storage.rules`.
8. Publish the rules.

## 4. API Security

The routes under `app/api` require a Firebase bearer token and include basic
rate limiting:

- `/api/weather`
- `/api/reports`
- `/api/inspections`

The dashboard sends the signed-in user's Firebase token automatically.

## 5. Add A Custom Domain From Truehost To Vercel

1. In Vercel, open your Brief Group project.
2. Go to Settings, then Domains.
3. Add your domain, for example `briefgroup.com`.
4. Vercel will show DNS records to add.
5. Log in to your Truehost cPanel.
6. Open Zone Editor under Domains.
7. Click Manage next to your domain.
8. Add or edit the apex/root record:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`
9. Add or edit the `www` record:
   - Type: `CNAME`
   - Name: `www`
   - Value: the CNAME target Vercel shows for your project
10. Save the records.
11. Return to Vercel and click Verify.
12. Wait for DNS propagation. It can take a few minutes, and sometimes longer.

If Truehost already has old website records for `@` or `www`, edit those
records instead of creating duplicates.

## 6. Deploy From VS Code

Run these commands in the VS Code terminal:

```bash
npm run build
git status
git add .
git commit -m "Add production security and SaaS features"
git push origin main
```

After the push, Vercel will redeploy automatically from GitHub.
