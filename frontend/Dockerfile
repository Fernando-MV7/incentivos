# Etapa de construcción
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Reemplazar la URL de la API con la que se proporciona como variable de entorno
ARG API_HOST=localhost
RUN sed -i "s|http://localhost:8080|http://${API_HOST}:8080|g" src/environments/environment.ts

RUN npm run build --prod

FROM nginx:alpine
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

# Script para actualizar la configuración al iniciar
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]