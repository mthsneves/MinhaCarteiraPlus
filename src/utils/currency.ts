/**
 * Formata um valor numérico (em centavos ou decimal) para uma string de moeda BRL formatada.
 * Ideal para exibição de saldos.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Pega o texto digitado pelo usuário (ex: "1234") e formata como máscara de moeda (ex: "R$ 12,34").
 * Retorna tanto a string formatada para exibir no Input quanto o número real (12.34) para salvar no banco.
 */
export function maskCurrencyInput(text: string): { formatted: string; numeric: number } {
  // Remove tudo que não for número
  const numericString = text.replace(/\D/g, '');
  
  if (!numericString) {
    return { formatted: '', numeric: 0 };
  }

  // Converte para número dividindo por 100 para ter os centavos
  const numericValue = parseInt(numericString, 10) / 100;
  
  // Formata novamente para moeda BRL
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);

  return { formatted, numeric: numericValue };
}
