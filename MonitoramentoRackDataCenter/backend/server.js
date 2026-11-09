const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);

// Cabeçalhos básicos de segurança aplicados a todas as respostas.
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");

    if (req.path.startsWith("/api/")) {
        res.setHeader("Cache-Control", "no-store");
    }

    next();
});

// Origens que podem acessar a API diretamente pelo navegador.
// Em produção, configure CORS_ORIGINS com a origem exata do frontend.
const DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

const corsOrigins = (
    process.env.CORS_ORIGINS === undefined
        ? DEFAULT_CORS_ORIGINS.join(",")
        : process.env.CORS_ORIGINS
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: corsOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204
}));

// Limite básico por IP para proteger a rota de processamento.
const rateLimitConfig = {
    windowMs: Math.max(1000, Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10) || 60000),
    max: Math.max(1, Number.parseInt(process.env.RATE_LIMIT_MAX || "60", 10) || 60)
};
const rateLimitStore = new Map();

// Expostos em app.locals para permitir testes determinísticos.
app.locals.rateLimitConfig = rateLimitConfig;
app.locals.rateLimitStore = rateLimitStore;

function limitarRequisicoes(req, res, next) {
    const now = Date.now();
    const { windowMs, max } = app.locals.rateLimitConfig;

    // Remove entradas expiradas para evitar crescimento indefinido do mapa.
    for (const [ip, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
            rateLimitStore.delete(ip);
        }
    }

    const ip = req.ip || req.socket.remoteAddress || "desconhecido";
    let entry = rateLimitStore.get(ip);

    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        rateLimitStore.set(ip, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(retryAfter));

    if (entry.count > max) {
        res.setHeader("Retry-After", String(retryAfter));
        return res.status(429).json({
            erro: "Limite de requisições excedido. Tente novamente mais tarde."
        });
    }

    next();
}

// Limita somente os envios de leituras; o preflight CORS não consome a cota.
app.use("/api/monitoramento", (req, res, next) => {
    if (req.method !== "POST") return next();
    return limitarRequisicoes(req, res, next);
});

app.use(express.json({ limit: "10kb" }));

// Rota inicial da API
app.get("/", (req, res) => {
    res.json({
        mensagem: "API Rack Monitor funcionando!",
        status: "ONLINE"
    });
});

// Recebe e processa as temperaturas
app.post("/api/monitoramento", (req, res) => {
    const matriz = req.body && typeof req.body === "object"
        ? req.body.matriz
        : undefined;

    // Validação da estrutura
    if (
        !Array.isArray(matriz) ||
        matriz.length !== 3
    ) {
        return res.status(400).json({
            erro: "A matriz deve possuir exatamente 3 racks."
        });
    }

    for (let i = 0; i < 3; i++) {
        if (!Array.isArray(matriz[i]) || matriz[i].length !== 3) {
            return res.status(400).json({
                erro: `O Rack ${i} deve possuir exatamente 3 sensores.`
            });
        }
    }

    const Matriz = [];
    const TempMediaLista = [];

    let Maior = -Infinity;
    let coordenadai = 0;
    let coordenadaj = 0;
    let condicao = false;

    // Processamento da matriz com for aninhado
    for (let i = 0; i < 3; i++) {
        const Linha = [];
        let TempMedia = 0;

        for (let j = 0; j < 3; j++) {
            const Temp = matriz[i][j];

            // Validação individual dos sensores
            if (
                typeof Temp !== "number" ||
                !Number.isFinite(Temp) ||
                Temp < 10.0 ||
                Temp > 90.0
            ) {
                return res.status(400).json({
                    erro: `Temperatura inválida no Rack ${i}, Sensor ${j}. Informe um valor entre 10 e 90 °C.`
                });
            }

            // Identifica a maior temperatura
            if (Temp > Maior) {
                Maior = Temp;
                coordenadai = i;
                coordenadaj = j;
            }

            // Verifica superaquecimento
            if (Temp >= 75.0) {
                condicao = true;
            }

            Linha.push(Temp);
            TempMedia += Temp;
        }

        Matriz.push(Linha);
        TempMediaLista.push(TempMedia / Linha.length);
    }

    // Retorna os resultados para o React
    res.json({
        sucesso: true,
        matriz: Matriz,
        medias: TempMediaLista,
        maiorTemperatura: Maior,
        localizacao: {
            rack: coordenadai,
            sensor: coordenadaj
        },
        alerta: condicao,
        mensagem: condicao
            ? "ALERTA: Ponto Crítico de Sobreaquecimento Detectado"
            : "Nenhum superaquecimento detectado."
    });
});

// Padroniza erros de parsing do JSON para manter respostas da API em JSON.
app.use((error, req, res, next) => {
    if (error && error.type === "entity.too.large") {
        return res.status(413).json({
            erro: "Corpo da requisição excede o limite de 10 KB."
        });
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({
            erro: "Corpo JSON inválido."
        });
    }

    next(error);
});

// Permite importar a aplicação nos testes sem abrir uma porta automaticamente.
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}

module.exports = app;
