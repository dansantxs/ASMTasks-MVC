// Período padrão dos relatórios de histórico: o mês corrente, do dia 1º até hoje. É o recorte do
// dia a dia ("o que aconteceu neste mês") e, de quebra, evita que a tela abra puxando o histórico
// inteiro. Quem quiser outra janela é só trocar as datas.
//
// O Relatório de Comissão não usa isto de propósito: lá o padrão é o último mês FECHADO, porque
// é sobre ele que a comissão é apurada.

/** Data no formato que o <input type="date"> entende (aaaa-mm-dd), no fuso local. */
export function paraInputDate(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function mesAtualParaInputs() {
  const hoje = new Date();
  return {
    inicio: paraInputDate(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    fim: paraInputDate(hoje),
  };
}
