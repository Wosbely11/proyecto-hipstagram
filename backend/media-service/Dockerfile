# Etapa 1: Construcción (Compilar TS a JS)
FROM node:18-alpine AS builder

WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos todas las dependencias (incluyendo las de desarrollo para tsc)
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos el proyecto (genera la carpeta /dist)
RUN npm run build

# Etapa 2: Producción (Ejecución del código compilado)
FROM node:18-alpine

WORKDIR /app

# Solo copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos solo las dependencias de producción (omitimos devDependencies)
RUN npm install --omit=dev

# Copiamos solo la carpeta compilada desde la etapa de 'builder'
COPY --from=builder /app/dist ./dist

# Exponemos el puerto del servicio
EXPOSE 3007

# Comando para iniciar el servicio usando el código compilado
CMD ["node", "dist/index.js"]