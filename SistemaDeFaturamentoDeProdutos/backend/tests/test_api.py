"""Testes de integração das rotas Flask com repositório JSON isolado."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import app as app_module
from repositorio import RepositorioProdutos


class TestBillingAPI(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory(prefix="billing-api-tests-")
        repositorio = RepositorioProdutos.__new__(RepositorioProdutos)
        repositorio.arquivo = Path(self.temp_dir.name) / "produtos_teste.json"
        repositorio.produtos = []
        repositorio._salvar([])
        app_module.repo = repositorio
        app_module.app.config.update(TESTING=True)
        self.client = app_module.app.test_client()

    def tearDown(self):
        self.temp_dir.cleanup()

    def criar_produto(self, nome="Notebook", preco=2500.0, quantidade=5):
        response = self.client.post(
            "/api/produtos",
            json={"nome": nome, "preco": preco, "quantidade": quantidade},
        )
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()

    def test_health_e_lista_inicial_vazia(self):
        health = self.client.get("/api/health")
        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.get_json()["status"], "online")

        response = self.client.get("/api/produtos")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["produtos"], [])
        self.assertEqual(response.get_json()["valor_total_estoque"], 0)

    def test_cadastro_persiste_produto_e_calcula_valor_do_estoque(self):
        produto = self.criar_produto()
        self.assertEqual(produto["valor_total_estoque"], 12500.0)

        response = self.client.get("/api/produtos")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.get_json()["produtos"]), 1)
        self.assertEqual(response.get_json()["valor_total_estoque"], 12500.0)

        conteudo = Path(app_module.repo.arquivo).read_text(encoding="utf-8")
        self.assertIn("Notebook", conteudo)

    def test_cadastro_rejeita_nome_preco_e_quantidade_invalidos(self):
        casos = [
            {"nome": "", "preco": 10, "quantidade": 1},
            {"nome": "Mouse", "preco": 0, "quantidade": 1},
            {"nome": "Mouse", "preco": -1, "quantidade": 1},
            {"nome": "Mouse", "preco": 10, "quantidade": -1},
            {"nome": "Mouse", "preco": 10, "quantidade": 1.5},
        ]
        for dados in casos:
            with self.subTest(dados=dados):
                response = self.client.post("/api/produtos", json=dados)
                self.assertEqual(response.status_code, 400)
                self.assertIn("erro", response.get_json())

        self.assertEqual(self.client.get("/api/produtos").get_json()["produtos"], [])

    def test_adicionar_e_remover_estoque_atualiza_persistencia(self):
        produto = self.criar_produto(quantidade=5)
        produto_id = produto["id"]

        adicionar = self.client.post(
            f"/api/produtos/{produto_id}/estoque/adicionar",
            json={"quantidade": 3},
        )
        self.assertEqual(adicionar.status_code, 200)
        self.assertEqual(adicionar.get_json()["quantidade"], 8)

        remover = self.client.post(
            f"/api/produtos/{produto_id}/estoque/remover",
            json={"quantidade": 2},
        )
        self.assertEqual(remover.status_code, 200)
        self.assertEqual(remover.get_json()["quantidade"], 6)

        dados_persistidos = json.loads(
            Path(app_module.repo.arquivo).read_text(encoding="utf-8")
        )
        produto_persistido = next(
            item for item in dados_persistidos if item["id"] == produto_id
        )
        self.assertEqual(produto_persistido["quantidade"], 6)

    def test_remocao_maior_que_estoque_nao_altera_produto(self):
        produto = self.criar_produto(quantidade=2)
        response = self.client.post(
            f"/api/produtos/{produto['id']}/estoque/remover",
            json={"quantidade": 3},
        )
        self.assertEqual(response.status_code, 409)

        atual = self.client.get("/api/produtos").get_json()["produtos"][0]
        self.assertEqual(atual["quantidade"], 2)

    def test_atualizar_e_excluir_produto(self):
        produto = self.criar_produto()
        produto_id = produto["id"]

        atualizar = self.client.put(
            f"/api/produtos/{produto_id}",
            json={"nome": "Notebook Pro", "preco": 3000, "quantidade": 4},
        )
        self.assertEqual(atualizar.status_code, 200)
        self.assertEqual(atualizar.get_json()["nome"], "Notebook Pro")
        self.assertEqual(atualizar.get_json()["valor_total_estoque"], 12000.0)

        excluir = self.client.delete(f"/api/produtos/{produto_id}")
        self.assertEqual(excluir.status_code, 200)
        self.assertEqual(self.client.get("/api/produtos").get_json()["produtos"], [])

    def test_rotas_retorna_404_para_produto_inexistente(self):
        atualizar = self.client.put("/api/produtos/999", json={"nome": "Ausente"})
        excluir = self.client.delete("/api/produtos/999")
        adicionar = self.client.post(
            "/api/produtos/999/estoque/adicionar", json={"quantidade": 1}
        )
        self.assertEqual(atualizar.status_code, 404)
        self.assertEqual(excluir.status_code, 404)
        self.assertEqual(adicionar.status_code, 404)


if __name__ == "__main__":
    unittest.main()
