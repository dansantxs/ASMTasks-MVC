using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Text.RegularExpressions;

namespace API.Erros
{
    /// <summary>
    /// Transforma uma falha inesperada em resposta que o usuário entende.
    ///
    /// Antes, todo <c>catch</c> devolvia uma frase fixa ("Erro ao criar o atendimento.") e jogava a
    /// exceção fora. O usuário não descobria o que estava errado e não sobrava rastro para
    /// investigar depois. Aqui a exceção vai para o log com um código curto, que também aparece na
    /// tela: o usuário informa esse código e a falha exata é encontrada no log.
    ///
    /// As falhas de banco mais comuns viram explicação em português. O que não for reconhecido cai
    /// na mensagem geral — que ao menos diz o que não deu certo e carrega o código.
    /// </summary>
    public static class RespostaDeErro
    {
        /// <param name="acao">O que se tentava fazer, em infinitivo: "criar o atendimento".</param>
        public static ObjectResult Inesperado(ControllerBase controller, ILogger logger, Exception ex, string acao)
        {
            var codigo = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
            logger.LogError(ex, "Falha ao {Acao}. Código {Codigo}", acao, codigo);

            var explicacao = Explicar(ex)
                ?? $"Não foi possível {acao}. Tente de novo; se continuar, informe o código {codigo} ao suporte.";

            return controller.StatusCode(StatusCodes.Status500InternalServerError, new
            {
                erro = explicacao,
                codigo
            });
        }

        /// <summary>
        /// Falhas de banco que têm explicação clara. Devolve null para o que não for reconhecido —
        /// melhor a mensagem geral do que um palpite errado.
        /// </summary>
        private static string? Explicar(Exception ex)
        {
            var sql = Procurar<SqlException>(ex);
            if (sql == null) return null;

            return sql.Number switch
            {
                // Texto maior que a coluna. O SQL Server 2016+ diz qual coluna.
                2628 or 8152 => $"O texto {DeQualCampo(sql.Message)} passou do tamanho permitido. Encurte e tente de novo.",

                // Chave estrangeira: o registro está amarrado a outro.
                547 => "Este registro está ligado a outros no sistema, e por isso a operação não pôde ser concluída. Verifique os vínculos e tente de novo.",

                // Índice único.
                2601 or 2627 => "Já existe um registro com esses mesmos dados.",

                // Tempo esgotado.
                -2 => "A operação demorou mais do que o esperado e foi interrompida. Tente de novo.",

                // Servidor fora do ar ou inacessível.
                53 or 40 or 10053 or 10054 or 10060 or 4060 or 18456 =>
                    "O sistema não conseguiu falar com o banco de dados agora. Tente de novo em instantes.",

                _ => null
            };
        }

        /// <summary>
        /// "...in table 'x', column 'Descricao'" -> "da descrição". Sem a coluna na mensagem, devolve
        /// vazio e a frase fica genérica, mas ainda correta.
        /// </summary>
        private static string DeQualCampo(string mensagemDoBanco)
        {
            var achado = Regex.Match(mensagemDoBanco, @"column '([^']+)'", RegexOptions.IgnoreCase);
            if (!achado.Success) return "de um dos campos";

            var coluna = achado.Groups[1].Value;
            var nome = coluna switch
            {
                "Titulo" => "do título",
                "Descricao" => "da descrição",
                "Observacao" => "da observação",
                "ObservacaoConclusao" => "da observação de conclusão",
                "Nome" => "do nome",
                "NomeFantasia" => "do nome fantasia",
                "Email" => "do e-mail",
                "Telefone" => "do telefone",
                "Endereco" => "do endereço",
                _ => null
            };

            return nome ?? $"do campo {coluna}";
        }

        private static T? Procurar<T>(Exception? ex) where T : Exception
        {
            while (ex != null)
            {
                if (ex is T achado) return achado;
                ex = ex.InnerException;
            }
            return null;
        }
    }
}
