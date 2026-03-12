# Render Deployment Guide

## Overview
This guide explains how to deploy the Mugs Restaurant Management System to Render.com.

## Prerequisites
- GitHub account with your code pushed to a repository
- Render.com account
- Azure MySQL database (or any MySQL database)
- Database credentials: host, username, password, database name

## Deployment Steps

### Step 1: Prepare Your Repository

1. Make sure `.env` file is in `.gitignore` (it should NOT be committed)
2. Ensure `.env.example` is in the repository (this shows what variables are needed)
3. Commit all changes:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### Step 2: Create a New Web Service on Render

1. Go to [render.com](https://render.com)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository where this code is stored
4. Select the repository

### Step 3: Configure the Web Service

#### Basic Settings:
- **Name**: mugs-restaurant (or your preferred name)
- **Environment**: Node
- **Region**: Choose closest to your users
- **Branch**: main (or your default branch)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

#### Environment Variables: 🔑 **CRITICAL STEP**

Click "Add Environment Variable" for each of these:

| Key | Value | Example |
|-----|-------|---------|
| `DB_HOST` | Your Azure MySQL hostname | `my-databases.mysql.database.azure.com` |
| `DB_USER` | Your database username | `kminnocent` |
| `DB_PASS` | Your database password | `MugsFigoz!2` |
| `DB_NAME` | Your database name | `restaurant_db` |
| `DB_PORT` | Database port (usually 3306) | `3306` |
| `NODE_ENV` | Environment type | `production` |
| `PORT` | Web server port | `3000` |

**⚠️ Important**: 
- Do NOT include these in code or `.env` files
- ✅ Always set them in Render Dashboard
- Do NOT commit credentials to Git

### Step 4: Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Run `npm install`
   - Run `npm start`
   - Assign you a URL

3. Monitor the deployment logs:
   - Click on your service
   - View "Logs" tab
   - Look for "✅ Database initialized successfully"
   - Look for "✅ Server running on port 3000"

### Step 5: Verify Deployment

After "Deploy successful" message:

1. Click the URL provided (e.g., `https://mugs-restaurant.onrender.com`)
2. You should see the login page
3. Log in with your credentials

### Troubleshooting

#### Error: "Connection timeout - database server is not responding"
- **Cause**: Azure MySQL firewall not allowing Render's IP
- **Solution for Azure MySQL**: 
  1. Go to Azure Portal → Your MySQL Server
  2. Click "Connection security" or "Networking"
  3. Click "Add current client IP" or add Render's IP manually
  4. For broad access: Add rule with Start IP: 0.0.0.0, End IP: 255.255.255.255
     - **⚠️ Warning**: This opens to all IPs - only for testing
  5. For production: Whitelist only Render's output IP
  6. Click "Save" and wait 1-2 minutes for firewall to update

#### Error: "Access denied for user"
- **Cause**: Wrong credentials (DB_USER, DB_PASS)
- **Solution**:
  1. Verify credentials in Azure Portal
  2. Check that credentials are copied exactly (watch for spaces)
  3. Ensure password doesn't have special characters that need escaping
  4. Re-deploy after updating

#### Error: "Unknown database"
- **Cause**: Database name is wrong or database doesn't exist
- **Solution**:
  1. Check DB_NAME matches database name in Azure MySQL
  2. Verify database was created: `SHOW DATABASES;`
  3. If missing, create it: `CREATE DATABASE restaurant_db;`
  4. Run migrations: `npm run migrate` (if you add this script)

#### Connection works locally but fails on Render
- **Cause**: SSL/TLS configuration or firewall differences
- **Solution**:
  1. Check Azure firewall allows broad IP range (temporary)
  2. Verify all environment variables exactly match local .env
  3. Check .env file has `DB_PORT=3306` not 3307

#### Logs show: "injecting env (0) from .env"
- **Cause**: Environment variables not set in Render
- **Solution**: Follow Step 3 again - add environment variables in Render Dashboard

#### Error: "invalid ELF header" or "ERR_DLOPEN_FAILED" for .node files
- **Cause**: Native modules (like sqlite3) compiled on Windows but running on Linux
- **Solution**:
  1. Ensure Build Command is set to: `npm run build`
  2. This uses `npm ci --clean-slate` to rebuild native modules for Linux
  3. Do NOT include `node_modules` in your git repository
  4. Verify `.gitignore` contains: `node_modules`
  5. Force redeploy: Go to your Render service → click "Manual Deploy" → "Deploy latest"
  6. Delete `.next` or build cache if present and redeploy
- **Prevention**: Never commit `node_modules` to git; always let the server rebuild them

### Automatic Redeploy

Render can automatically redeploy when you push to GitHub:

1. Go to your service settings
2. Check "Auto-Deploy" is enabled
3. Future Git pushes will trigger automatic deployment

### Database Backups

For production safety:

1. Regular backups through your database provider (Azure MySQL has built-in backups)
2. Consider setting backup frequency to daily
3. Test restore process occasionally

### Monitoring

After deployment:

1. Check logs regularly for errors
2. Monitor database connection health
3. Set up alarms if Render offers them
4. Keep your Azure MySQL maintenance windows in mind

## Support

If you encounter issues:

1. Check Render deployment logs
2. Verify all environment variables are set
3. Test locally: `npm start` (with local .env file)
4. Check database connectivity
5. Review error messages carefully

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node)
- [Azure MySQL Connection Issues](https://learn.microsoft.com/en-us/azure/mysql/how-to-troubleshoot-connection-issues)
