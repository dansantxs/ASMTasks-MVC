export async function buscarEnderecoPorCep(cep, signal) {
  const apenasNumeros = cep.replace(/\D/g, '');
  if (apenasNumeros.length !== 8) return null;

  try {
    const res = await fetch(`/api/cep/${apenasNumeros}`, { signal });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.erro) return null;

    return {
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || ''
    };
  } catch (err) {
    if (err.name === 'AbortError') return null;
    return null;
  }
}
