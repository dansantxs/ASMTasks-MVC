const VIACEP_URL = 'https://viacep.com.br/ws';

export async function buscarEnderecoPorCep(cep) {
  const apenasNumeros = cep.replace(/\D/g, '');
  if (apenasNumeros.length !== 8) return null;

  try {
    const res = await fetch(`${VIACEP_URL}/${apenasNumeros}/json/`);
    if (!res.ok) throw new Error('Erro ao consultar o ViaCEP');

    const data = await res.json();
    if (data.erro) return null;

    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || ''
    };
  } catch (err) {
    console.error('Erro ao buscar CEP:', err);
    return null;
  }
}
