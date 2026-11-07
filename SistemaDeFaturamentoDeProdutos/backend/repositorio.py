import json
from pathlib import Path

class RepositorioProdutos:
    def __init__(self):
        self.arquivo = Path(__file__).parent / "data" / "produtos.json"
        self.arquivo.parent.mkdir(parents=True, exist_ok=True)
        if not self.arquivo.exists():
            self._salvar([])
        self.produtos = self._carregar()

    def _carregar(self):
        return json.loads(self.arquivo.read_text(encoding="utf-8"))

    def _salvar(self, dados):
        self.arquivo.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")

    def listar(self):
        return list(self.produtos)

    def buscar(self, produto_id):
        return next((p for p in self.produtos if p["id"] == produto_id), None)

    def criar(self, nome, preco, quantidade):
        novo_id = max((p["id"] for p in self.produtos), default=0) + 1
        item = {"id": novo_id, "nome": nome, "preco": float(preco), "quantidade": int(quantidade)}
        self.produtos.append(item)
        self._salvar(self.produtos)
        return item

    def atualizar(self, produto_id, **campos):
        item = self.buscar(produto_id)
        if item is None:
            return None
        item.update(campos)
        self._salvar(self.produtos)
        return item

    def excluir(self, produto_id):
        item = self.buscar(produto_id)
        if item is None:
            return False
        self.produtos.remove(item)
        self._salvar(self.produtos)
        return True
