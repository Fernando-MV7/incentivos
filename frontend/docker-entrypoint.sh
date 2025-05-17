#!/bin/sh

# Si existe la variable HOST_IP, actualizar la URL de la API en el código compilado
if [ ! -z "$HOST_IP" ]; then
  echo "Actualizando API URL a $HOST_IP"
  # Buscar y reemplazar todas las ocurrencias de localhost:8080 por HOST_IP:8080
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s/localhost:8080/${HOST_IP}:8080/g" {} \;
fi

# Ejecutar el comando original
exec "$@"