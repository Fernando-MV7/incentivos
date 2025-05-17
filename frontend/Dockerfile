# Etapa de construcción
FROM node:18-alpine AS build

WORKDIR /app

# Copia primero los archivos de package.json para aprovechar la caché de Docker
COPY package*.json ./
RUN npm ci

# Copia el resto de los archivos del proyecto
COPY . .

# Compila la aplicación para producción
RUN npm run build --configuration=production -- --base-href=/

# Etapa de producción
FROM nginx:alpine

# Elimina la configuración por defecto de nginx
RUN rm -rf /etc/nginx/conf.d/default.conf
RUN rm -rf /etc/nginx/nginx.conf

# Crea el directorio conf.d para evitar advertencias
RUN mkdir -p /etc/nginx/conf.d

# Copia la configuración personalizada de nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Crea un archivo vacío para evitar advertencias
RUN touch /etc/nginx/conf.d/default.conf

# Elimina el contenido predeterminado de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia los archivos construidos desde la etapa de build
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Verifica si existe el directorio browser y copia su contenido si es necesario
RUN if [ -d /usr/share/nginx/html/browser ]; then \
        echo "Directorio browser encontrado - configuración para Angular v17+"; \
    else \
        echo "No se encontró directorio browser - configuración estándar"; \
    fi

# Asegúrate de que nginx tiene permisos para servir los archivos
RUN chmod -R 755 /usr/share/nginx/html

# Verifica que los archivos se hayan copiado correctamente
RUN ls -la /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]