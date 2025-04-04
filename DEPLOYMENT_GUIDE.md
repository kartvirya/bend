# Dragway Website Deployment Guide

This guide provides instructions for deploying the Dragway Website application to a production server.

## Prerequisites

- Web server (such as Apache, Nginx, etc.)
- Access to the Outix server or target hosting environment

## Deployment Steps

### 1. Extract the Build Files

Unzip the `dragway-website.zip` file that contains the production build. The ZIP includes all necessary HTML, CSS, JavaScript, and asset files for deployment.

```bash
unzip dragway-website.zip -d /path/to/deployment
```

### 2. Configure the Web Server

Ensure your web server is configured to:

- Serve static files from the deployment directory
- Route all requests to `index.html` for client-side routing to work properly

#### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/deployment;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Serve static assets with cache headers
    location /assets {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        try_files $uri =404;
    }

    # Serve static images with cache headers
    location ~* \.(jpg|jpeg|png|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        try_files $uri =404;
    }
}
```

#### Example Apache Configuration (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 3. Environment Configuration

The application is configured to automatically detect its environment and adjust API endpoints accordingly:

- **Production**: When hosted on `outix.co` domains, the app directly communicates with the API without a proxy
- **Development/Staging**: Uses a proxy for API communication to avoid CORS issues

No additional configuration is needed as this is handled automatically by the application.

### 4. Troubleshooting

If you encounter any issues:

#### 404 Errors for Assets

Ensure all assets are properly copied and the paths are correct. The application uses relative paths (starting with `./`) which should work correctly when deployed.

#### API Connection Issues

Verify that API endpoints are accessible from the server. The application will automatically use direct API connections when deployed on `outix.co` domains.

#### Font Loading Issues

If fonts don't display correctly, ensure the font files in the `/fonts` directory are properly copied to the server.

## Support

For additional support or questions, please contact the development team. 