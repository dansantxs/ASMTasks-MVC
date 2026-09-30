using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    /// <summary>
    /// Tamanho máximo dos campos de texto, igual ao que a coluna do banco aceita.
    ///
    /// A tela já trava a digitação (Frontend/src/utils/limitesTexto.js), mas quem chama a API por
    /// fora do formulário também precisa de resposta clara — e, sem isto, o texto grande só era
    /// recusado lá no banco, virando erro sem explicação.
    ///
    /// Estes números têm de bater com o schema. Campo que não aparece aqui é texto ilimitado no
    /// banco (nvarchar(max)), como a descrição da tarefa e a do projeto.
    /// </summary>
    public static class LimitesDeTexto
    {
        public const int AtendimentoTitulo = 120;
        public const int AtendimentoDescricao = 500;
        public const int AtendimentoObservacaoConclusao = 2000;

        public const int TarefaTitulo = 200;
        public const int ProjetoTitulo = 200;

        /// <summary>
        /// Recusa o texto que passou do limite, dizendo qual campo e de quanto ele passou — é o que
        /// permite ao usuário resolver sozinho.
        /// </summary>
        public static void Exigir(string? valor, int maximo, string nomeDoCampo)
        {
            if (valor == null) return;

            var excedente = valor.Length - maximo;
            if (excedente <= 0) return;

            throw new ValidationException(
                $"{nomeDoCampo} passou do tamanho permitido: são {valor.Length} caracteres e o limite é {maximo}. " +
                $"Tire {excedente} para conseguir salvar.");
        }
    }
}
