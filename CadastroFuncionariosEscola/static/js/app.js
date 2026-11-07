const formulario = document.getElementById("formFuncionario");
const campoCargo = document.getElementById("cargo");
const campoDisciplina = document.getElementById("campoDisciplina");
const inputDisciplina = document.getElementById("disciplina");
const lista = document.getElementById("listaFuncionarios");
const total = document.getElementById("totalFuncionarios");
const mensagem = document.getElementById("mensagem");

const formatarMoeda = (valor) =>
    Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function mostrarMensagem(texto, tipo = "") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

campoCargo.addEventListener("change", () => {
    const ehProfessor = campoCargo.value.toLowerCase() === "professor";
    campoDisciplina.hidden = !ehProfessor;
    inputDisciplina.required = ehProfessor;
    if (!ehProfessor) inputDisciplina.value = "";
});

async function carregarFuncionarios() {
    lista.innerHTML = '<tr><td colspan="6" class="vazio">Carregando...</td></tr>';

    try {
        const resposta = await fetch("/api/funcionarios");
        if (!resposta.ok) throw new Error("Não foi possível carregar os funcionários.");
        const funcionarios = await resposta.json();

        total.textContent = funcionarios.length;

        if (funcionarios.length === 0) {
            lista.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum funcionário cadastrado ainda.</td></tr>';
            return;
        }

        lista.innerHTML = funcionarios.map((funcionario) => {
            const observacoes = [];
            if (funcionario.salario_acima_2000) {
                observacoes.push('<span class="tag tag-alerta">Salário ≥ R$ 2.000</span>');
            }
            if (funcionario.leciona_matematica) {
                observacoes.push('<span class="tag tag-info">Leciona Matemática</span>');
            }
            if (observacoes.length === 0) {
                observacoes.push('<span class="tag tag-ok">Sem alertas</span>');
            }

            return `
                <tr>
                    <td class="nome-funcionario">${escaparHtml(funcionario.nome)}</td>
                    <td>${escaparHtml(funcionario.cargo)}</td>
                    <td>${funcionario.disciplina ? escaparHtml(funcionario.disciplina) : "—"}</td>
                    <td class="salario">${formatarMoeda(funcionario.salario)}</td>
                    <td>${observacoes.join("")}</td>
                    <td><button class="botao botao-excluir" data-id="${funcionario.id}" type="button">Excluir</button></td>
                </tr>
            `;
        }).join("");
    } catch (erro) {
        lista.innerHTML = `<tr><td colspan="6" class="vazio">${escaparHtml(erro.message)}</td></tr>`;
    }
}

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[caractere]);
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    mostrarMensagem("");

    const dados = {
        nome: document.getElementById("nome").value.trim(),
        salario: document.getElementById("salario").value,
        cargo: campoCargo.value,
        disciplina: inputDisciplina.value.trim()
    };

    try {
        const resposta = await fetch("/api/funcionarios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });
        const resultado = await resposta.json();

        if (!resposta.ok) throw new Error(resultado.erro || "Erro ao cadastrar funcionário.");

        formulario.reset();
        campoDisciplina.hidden = true;
        inputDisciplina.required = false;
        mostrarMensagem("Funcionário cadastrado com sucesso!", "sucesso");
        await carregarFuncionarios();
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    }
});

lista.addEventListener("click", async (evento) => {
    const botao = evento.target.closest("[data-id]");
    if (!botao) return;

    if (!confirm("Tem certeza de que deseja excluir este funcionário?")) return;

    try {
        const resposta = await fetch(`/api/funcionarios/${botao.dataset.id}`, {
            method: "DELETE"
        });
        const resultado = await resposta.json();
        if (!resposta.ok) throw new Error(resultado.erro || "Erro ao excluir funcionário.");
        mostrarMensagem("Funcionário excluído com sucesso!", "sucesso");
        await carregarFuncionarios();
    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    }
});

document.getElementById("atualizar").addEventListener("click", carregarFuncionarios);

carregarFuncionarios();
