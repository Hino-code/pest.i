# Deployment Guide

## Overview

This guide covers deploying Pesti to production environments, specifically optimized for Vercel deployment.

## Prerequisites

- GitHub repository with code
- Vercel account (free tier available)
- Backend API deployed and accessible
- Domain name (optional)

## Vercel Deployment

### Step 1: Prepare Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration

### Step 3: Configure Build Settings

Vercel should auto-detect these settings:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node Version**: 18.x or higher

### Step 4: Environment Variables

Add the following environment variables in Vercel dashboard:

| Variable            | Value                      | Description                     |
| ------------------- | -------------------------- | ------------------------------- |
| `VITE_API_BASE_URL` | `https://your-api-url.com` | Production API URL              |
| `VITE_USE_MOCKS`    | `false`                    | Disable mock data in production |

**To add environment variables:**

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)
4. Save

### Step 5: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a deployment URL

### Step 6: Verify Deployment

1. Visit the deployment URL
2. Test authentication flow
3. Verify API connectivity
4. Check browser console for errors
5. Test on mobile devices

## Environment Configuration

### Production Environment

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCKS=false
```

### Preview Environment (Staging)

```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com
VITE_USE_MOCKS=false
```

### Development Environment

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=true
```

## Custom Domain

### Adding Custom Domain

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed
4. Wait for DNS propagation

### DNS Configuration

Add CNAME record:

```
Type: CNAME
Name: www (or @)
Value: cname.vercel-dns.com
```

## Build Optimization

### Production Build

The production build includes:

- **Code Splitting**: Automatic code splitting by route
- **Tree Shaking**: Unused code removed
- **Minification**: JavaScript and CSS minified
- **Asset Optimization**: Images and fonts optimized
- **Source Maps**: Disabled in production (can be enabled)

### Build Size Optimization

Monitor bundle size:

```bash
npm run build
# Check dist/ folder size
```

Optimize if needed:

- Remove unused dependencies
- Use dynamic imports
- Optimize images
- Enable compression

## Performance Monitoring

### Vercel Analytics

Enable Vercel Analytics for performance monitoring:

1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. View performance metrics

### Error Monitoring

Consider integrating error monitoring:

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Logs**: Built-in logging

## CI/CD Pipeline

### Automatic Deployments

Vercel automatically deploys:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Deployment Hooks

Configure deployment hooks if needed:

1. Go to Project Settings → Git
2. Configure deployment hooks
3. Set up notifications

## Rollback

### Rollback Deployment

1. Go to Deployments tab
2. Find previous deployment
3. Click "..." → "Promote to Production"

## Troubleshooting

### Build Failures

**Issue**: Build fails with TypeScript errors

- **Solution**: Fix TypeScript errors locally first
- **Check**: Run `npm run build` locally

**Issue**: Build fails with dependency errors

- **Solution**: Clear cache and rebuild
- **Command**: `npm ci` instead of `npm install`

**Issue**: Build succeeds but app doesn't work

- **Solution**: Check environment variables
- **Check**: Verify API URL is correct

### Runtime Errors

**Issue**: API calls failing

- **Solution**: Check `VITE_API_BASE_URL` is set correctly
- **Check**: Verify CORS is configured on backend

**Issue**: Authentication not working

- **Solution**: Verify JWT token handling
- **Check**: Check browser console for errors

**Issue**: Assets not loading

- **Solution**: Check asset paths in build
- **Check**: Verify `public/` folder contents

## Security Checklist

- [ ] Environment variables set correctly
- [ ] `VITE_USE_MOCKS=false` in production
- [ ] API endpoints use HTTPS
- [ ] CORS configured on backend
- [ ] Authentication tokens secure
- [ ] No sensitive data in client code
- [ ] Error messages don't expose sensitive info

## Monitoring

### Health Checks

Set up health check endpoints:

```typescript
// Example health check
GET / health;
Response: {
  status: "ok";
}
```

### Uptime Monitoring

Use services like:

- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Advanced monitoring
- **StatusCake**: Comprehensive monitoring

## Backup Strategy

### Code Backup

- **GitHub**: Primary code repository
- **Regular Commits**: Commit frequently
- **Branch Protection**: Protect main branch

### Data Backup

- **Database**: Regular database backups
- **User Data**: Backup user data regularly
- **Configuration**: Backup environment variables

## Scaling

### Vercel Limits

Free tier limits:

- **Bandwidth**: 100GB/month
- **Builds**: Unlimited
- **Functions**: 100GB-hours/month

### Upgrading

Upgrade to Pro for:

- More bandwidth
- Team collaboration
- Advanced analytics
- Priority support

## Maintenance

### Regular Updates

- **Dependencies**: Update regularly
- **Security Patches**: Apply immediately
- **Node Version**: Keep updated
- **Build Tools**: Update Vite and plugins

### Monitoring

- **Error Rates**: Monitor error rates
- **Performance**: Track load times
- **User Feedback**: Collect and address feedback
- **Analytics**: Review usage patterns

## Support

For deployment issues:

1. Check Vercel documentation
2. Review build logs
3. Check environment variables
4. Verify API connectivity
5. Contact Vercel support if needed

---

**Last Updated**: December 2024
