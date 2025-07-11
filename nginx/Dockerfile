FROM nginx:1.25-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY cors-fix.conf /etc/nginx/cors-fix.conf

# Copy custom error pages
COPY 502.html /usr/share/nginx/html/502.html

# Health check configuration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
