const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../server");

let server;
let apiUrl;

before(async () => {
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });

    apiUrl = "http://127.0.0.1:" + server.address().port;
});

after(async () => {
    if (!server) return;

    await new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) return reject(error);
            resolve();
        });

        server.closeAllConnections();
    });
});

function criarMatriz(temperatura = 20) {
    return Array.from({ length: 3 }, () => Array(3).fill(temperatura));
}

async function requisitarJson(payload) {
    const response = await fetch(apiUrl + "/api/monitoramento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    return {
        response,
        body: await response.json()
    };
}

test("GET / informa que a API está online", async () => {
    const response = await fetch(apiUrl + "/");
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, "ONLINE");
    assert.equal(body.mensagem, "API Rack Monitor funcionando!");
});

test("processa uma matriz 3x3 e calcula as médias de cada rack", async () => {
    const matriz = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90]
    ];

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 200);
    assert.equal(body.sucesso, true);
    assert.deepEqual(body.matriz, matriz);
    assert.deepEqual(body.medias, [20, 50, 80]);
    assert.equal(body.maiorTemperatura, 90);
    assert.deepEqual(body.localizacao, { rack: 2, sensor: 2 });
    assert.equal(body.alerta, true);
});

test("não ativa o alerta quando todas as temperaturas estão abaixo de 75 °C", async () => {
    const { response, body } = await requisitarJson({
        matriz: criarMatriz(74.99)
    });

    assert.equal(response.status, 200);
    assert.equal(body.alerta, false);
    assert.equal(body.maiorTemperatura, 74.99);
    assert.equal(body.mensagem, "Nenhum superaquecimento detectado.");
});

test("ativa o alerta quando uma temperatura é exatamente 75 °C", async () => {
    const matriz = criarMatriz(30);
    matriz[1][1] = 75;

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 200);
    assert.equal(body.alerta, true);
    assert.equal(
        body.mensagem,
        "ALERTA: Ponto Crítico de Sobreaquecimento Detectado"
    );
});

test("rejeita requisição sem a propriedade matriz", async () => {
    const { response, body } = await requisitarJson({});

    assert.equal(response.status, 400);
    assert.equal(body.erro, "A matriz deve possuir exatamente 3 racks.");
});

test("rejeita matriz que não seja um array", async () => {
    const { response, body } = await requisitarJson({ matriz: "inválida" });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "A matriz deve possuir exatamente 3 racks.");
});

test("rejeita matriz com menos de três racks", async () => {
    const { response, body } = await requisitarJson({
        matriz: [[20, 20, 20], [20, 20, 20]]
    });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "A matriz deve possuir exatamente 3 racks.");
});

test("rejeita matriz com mais de três racks", async () => {
    const matriz = criarMatriz();
    matriz.push([20, 20, 20]);

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "A matriz deve possuir exatamente 3 racks.");
});

test("rejeita rack que não seja um array de sensores", async () => {
    const matriz = criarMatriz();
    matriz[1] = "inválido";

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "O Rack 1 deve possuir exatamente 3 sensores.");
});

test("rejeita rack com menos de três sensores", async () => {
    const matriz = criarMatriz();
    matriz[2] = [20, 20];

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "O Rack 2 deve possuir exatamente 3 sensores.");
});

test("rejeita rack com mais de três sensores", async () => {
    const matriz = criarMatriz();
    matriz[0].push(20);

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.equal(body.erro, "O Rack 0 deve possuir exatamente 3 sensores.");
});

test("rejeita temperatura abaixo do limite mínimo de 10 °C", async () => {
    const matriz = criarMatriz();
    matriz[0][0] = 9.99;

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.match(body.erro, /Rack 0, Sensor 0/);
    assert.match(body.erro, /entre 10 e 90 °C/);
});

test("rejeita temperatura acima do limite máximo de 90 °C", async () => {
    const matriz = criarMatriz();
    matriz[2][1] = 90.01;

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.match(body.erro, /Rack 2, Sensor 1/);
    assert.match(body.erro, /entre 10 e 90 °C/);
});

test("rejeita temperatura enviada como texto", async () => {
    const matriz = criarMatriz();
    matriz[0][2] = "75";

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.match(body.erro, /Rack 0, Sensor 2/);
});

test("rejeita temperatura nula", async () => {
    const matriz = criarMatriz();
    matriz[1][0] = null;

    const { response, body } = await requisitarJson({ matriz });

    assert.equal(response.status, 400);
    assert.match(body.erro, /Rack 1, Sensor 0/);
});

test("rejeita corpo JSON nulo sem causar erro interno", async () => {
    const response = await fetch(apiUrl + "/api/monitoramento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "null"
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.erro, "A matriz deve possuir exatamente 3 racks.");
});
