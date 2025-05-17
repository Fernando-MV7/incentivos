#!/bin/bash

# Detectar la IP de la interfaz principal conectada a la red local
# Este comando funciona en la mayoría de sistemas Linux
HOST_IP=$(ip route get 1 | sed -n 's/^.*src \([0-9.]*\) .*$/\1/p')

# Alternativa para macOS
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
fi

echo "Detected Host IP: $HOST_IP"

# Exportar la variable para que esté disponible para docker-compose
export HOST_IP

# Ejecutar docker-compose con la variable de entorno
docker-compose up -d