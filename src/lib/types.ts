/**
 * Tipos de domínio do dashboard SMUP.
 *
 * Cada tipo aqui mapeia uma aba da planilha após normalização (ver
 * `transforms.ts`). Tipos brutos são prefixados com `Raw`; tipos normalizados
 * são os de uso público.
 */

export interface RawNegocio {
  deal_id: string;
  nome_negocio: string;
  valor_contrato: string;
  data_criacao: string;
  fase_atual: string;
  data_ultima_fase: string;
  proprietario: string;
  responsavel: string;
  n_pontos: string;
  cnpj: string;
  segmento: string;
  dor_relatada: string;
  status_aberto: string;
  link_hubspot: string;
}

export interface Negocio {
  dealId: string;
  nomeNegocio: string;
  valorContrato: number | null;
  dataCriacao: Date | null;
  faseAtual: string;
  dataUltimaFase: Date | null;
  responsavel: string;
  responsavelNormalizado: string;
  segmento: string;
  segmentoNormalizado: string;
  nPontos: number | null;
  statusAberto: boolean;
  leadTimeDias: number | null;
  linkHubspot: string;
}

export interface RawHistorico {
  log_id: string;
  deal_id: string;
  fase_anterior: string;
  fase_nova: string;
  data_movimentacao: string;
  tempo_na_fase: string;
}

export interface Historico {
  logId: string;
  dealId: string;
  faseAnterior: string;
  faseNova: string;
  dataMovimentacao: Date | null;
  tempoNaFase: number | null;
}

export interface RawTaxaConversao {
  ordem: string;
  transicao: string;
  taxa: string;
  total_saidas: string;
}

export interface TaxaConversao {
  ordem: number;
  transicao: string;
  taxa: number;
  totalSaidas: number;
}

export interface SmupDataset {
  negocios: Negocio[];
  historico: Historico[];
  taxas: TaxaConversao[];
  fetchedAt: string;
}

export interface DashboardFilters {
  responsavel?: string;
  segmento?: string;
  dateFrom?: string;
  dateTo?: string;
}
