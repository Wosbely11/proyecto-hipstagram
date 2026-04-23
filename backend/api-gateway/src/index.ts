import express from 'express';
import cors, { CorsOptions } from 'cors'; 
import proxy from 'express-http-proxy';
import * as dotenv from 'dotenv';

dotenv.config();

const app: express.Application = express();

// 1. CONFIGURACIÓN DE CORS
const corsOptions: CorsOptions = {
    origin: [
        'http://localhost:4200',        // Angular Local
        'http://localhost:3000',        // React u otro
        'https://tu-dominio-real.com'   // Producción
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
//app.use(express.json());
app.use(express.json({ limit: '50mb' }));

// 2. MAPEO DE RUTAS (PROXIES) ACTUALIZADO
app.use('/users', proxy('http://auth-service:3001', {
    proxyReqPathResolver: (req) => {
        return '/users' + req.url; 
    }
}));

app.use('/users', proxy('http://user-service:3006'));

// Modificamos el proxy para que limpie el prefijo
app.use('/posts', proxy('http://post-service:3002', {
    limit: '50mb',
    proxyReqPathResolver: (req) => {
        return (req.url === '' || req.url === '/') ? '/' : req.url;
    }
}));

app.use('/media', proxy('http://media-service:3007', {
    limit: '50mb',
    proxyReqPathResolver: (req) => {
        return (req.url === '' || req.url === '/') ? '/' : req.url;
    }
}));

app.use('/interactions', proxy('http://interactions-service:3004'));
// ... resto de tus rutas
app.use('/search', proxy('http://search-service:3005', {
    proxyReqPathResolver: (req) => {
        // Esto asegura que /search/posts se envíe como /posts al microservicio
        return req.url; 
    }
}));
app.use('/audit', proxy('http://audit-service:3003'));
app.use('/moderation', proxy('http://moderation-service:3008'));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`🌐 API Gateway en TypeScript corriendo en puerto ${PORT}`);
    console.log(`🔗 Enrutando peticiones a los microservicios del ecosistema Hipstagram`);
});