class Produto:
    def __init__(self, nome, preco, quantidade=0):
        self.nome = nome
        self.quantidade = quantidade
        self.preco = preco

    @property
    def preco(self):
        return self._preco

    @preco.setter
    def preco(self, preco):
        valor = float(preco)
        if valor <= 0:
            raise ValueError("Preço tem que ser maior que zero!")
        self._preco = valor

    @property
    def quantidade(self):
        return self._quantidade

    @quantidade.setter
    def quantidade(self, quantidade):
        valor = int(quantidade)
        if valor < 0 or valor != quantidade:
            raise ValueError("A quantidade deve ser um inteiro não negativo!")
        self._quantidade = valor

    @property
    def valor_total_estoque(self):
        return self._preco * self._quantidade

    def adicionar_estoque(self, quantidade):
        try:
            valor = int(quantidade)
            if valor <= 0 or valor != float(quantidade):
                return False
        except (TypeError, ValueError):
            return False
        self.quantidade += valor
        return True

    def remover_estoque(self, quantidade):
        try:
            valor = int(quantidade)
            if valor <= 0 or valor != float(quantidade) or self.quantidade < valor:
                return False
        except (TypeError, ValueError):
            return False
        self.quantidade -= valor
        return True
