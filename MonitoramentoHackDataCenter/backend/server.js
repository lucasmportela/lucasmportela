const express = require("express");
const cors = require("cors");

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

// Rota inicial da API
app.get("/", (req, res) => {
    res.json({
        mensagem: "API Rack Monitor funcionando!",
        status: "ONLINE"
    });
});

// Recebe e processa as temperaturas
app.post("/api/monitoramento", (req, res) => {
    const { matriz } = req.body;

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

    let Matriz = [];
    let TempMediaLista = [];

    let Maior = -Infinity;
    let coordenadai = 0;
    let coordenadaj = 0;

    let condicao = false;

    // Processamento da matriz com for aninhado
    for (let i = 0; i < 3; i++) {
        let Linha = [];
        let TempMedia = 0;

        for (let j = 0; j < 3; j++) {
            let Temp = matriz[i][j];

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

        TempMediaLista.push(
            TempMedia / Linha.length
        );
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

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});