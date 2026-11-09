export type DadosAcademicos = { instituicao: string; campus: string; curso: string; semestre: number | null }
export type DadosFinanceiros = { faixaRendaMensal: number; fontesRenda: string[]; objetivos: string[] }
export const fontesRenda = ['Estágio', 'Mesada', 'Bolsa', 'Freelance', 'Trabalho', 'Outras fontes']
export const objetivos = ['Fazer o dinheiro durar até o fim do mês', 'Montar uma reserva', 'Viajar', 'Intercâmbio', 'Formatura', 'Comprar algo', 'Investir']

export function validarSenha(senha: string, confirmacao: string): string {
  if (senha.length < 8 || !/\p{L}/u.test(senha) || !/[0-9]/.test(senha)) return 'Use no mínimo 8 caracteres, com letras e números.'
  if (new TextEncoder().encode(senha).length > 72) return 'A senha é muito longa. Use no máximo 72 bytes.'
  if (senha !== confirmacao) return 'As senhas não conferem.'
  return ''
}

export function destinoLogin(next: string) {
  return next.startsWith('/') && !next.startsWith('//') && !next.includes('\\') && !/^\/(login|cadastro)([/?#]|$)/.test(next) ? next : '/inicio'
}
