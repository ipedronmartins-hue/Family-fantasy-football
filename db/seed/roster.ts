import { Player } from "@/types/player";

/**
 * Pilot squad — Gondomar SC.
 * Note: two players share the display name "Duarte". They are disambiguated
 * with distinct ids (DUARTE-CB / DUARTE-MID) and distinct display names
 * ("Duarte" the central defender, "Duarte S." the interior midfielder) so
 * parents can tell them apart in every screen.
 */
export const roster: Player[] = [
  // Guarda-redes
  { id: "ENZO", number: 1, name: "Enzo", positionGroup: "GR", positionLabel: "Guarda-Redes", traits: ["Ágil", "Veloz", "Boa capacidade de reação"] },
  { id: "RAFAEL", number: 2, name: "Rafael", positionGroup: "GR", positionLabel: "Guarda-Redes", traits: ["Rápido", "Forte", "Presença física", "Boa capacidade de reação"] },

  // Defesas
  { id: "JOAO-NORONHA", number: 3, name: "João Noronha", positionGroup: "DEF", positionLabel: "Defesa Central", traits: ["Forte", "Excelente posicionamento", "Seguro no duelo", "Forte sentido de antecipação"] },
  { id: "MANAU", number: 4, name: "Manau", positionGroup: "DEF", positionLabel: "Defesa Central", traits: ["Rápido", "Empenhado", "Intenso", "Boa capacidade de recuperação"] },
  { id: "GABRIEL", number: 5, name: "Gabriel", positionGroup: "DEF", positionLabel: "Defesa Central", traits: ["Técnica", "Excelente posicionamento", "Boa qualidade com bola", "Capacidade para iniciar construção"] },
  { id: "TOMAS-S", number: 6, name: "Tomás S.", positionGroup: "DEF", positionLabel: "Defesa Central", traits: ["Rápido", "Forte", "Potente no duelo", "Capacidade de recuperação"] },
  { id: "DUARTE-CB", number: 7, name: "Duarte", positionGroup: "DEF", positionLabel: "Defesa Central", traits: ["Inteligente", "Técnico", "Boa leitura de jogo", "Boa tomada de decisão"] },
  { id: "NANDO", number: 8, name: "Nando", positionGroup: "DEF", positionLabel: "Defesa Esquerdo", traits: ["Esquerdino", "Veloz", "Boa capacidade para dar profundidade", "Forte no apoio ofensivo"] },
  { id: "FERNANDES", number: 9, name: "Fernandes", positionGroup: "DEF", positionLabel: "Defesa Direito", traits: ["Velocidade", "Potência", "Forte capacidade física", "Capacidade para atacar o corredor"] },
  { id: "SOARES", number: 10, name: "Soares", positionGroup: "DEF", positionLabel: "Defesa Direito", traits: ["Físico", "Forte", "Intenso nos duelos", "Segurança defensiva"] },

  // Médios
  { id: "SANTIAGO", number: 11, name: "Santiago", positionGroup: "MED", positionLabel: "Médio Defensivo", traits: ["Raça", "Técnica", "Intensidade", "Capacidade para recuperar e sair a jogar"] },
  { id: "VASCO-COUTINHO", number: 12, name: "Vasco Coutinho", positionGroup: "MED", positionLabel: "Médio", traits: ["Técnica", "Classe", "Inteligência", "Excelente leitura do jogo"] },
  { id: "ZE-PEDRO", number: 13, name: "Zé Pedro", positionGroup: "MED", positionLabel: "Médio Interior", traits: ["Forte", "Esquerdino", "Rápido", "Capacidade para transportar bola"] },
  { id: "SALVADOR", number: 14, name: "Salvador", positionGroup: "MED", positionLabel: "Médio Interior", traits: ["Técnica", "Raça", "Intensidade", "Capacidade de pressão"] },
  { id: "BERNA", number: 15, name: "Berna", positionGroup: "MED", positionLabel: "Médio Interior", traits: ["Raça", "Força", "Intensidade", "Forte presença nos duelos"] },
  { id: "DUARTE-MID", number: 16, name: "Duarte S.", positionGroup: "MED", positionLabel: "Médio Interior", traits: ["Inteligente", "Técnico", "Boa leitura do jogo", "Qualidade na decisão"] },

  // Extremos
  { id: "MATEUS", number: 17, name: "Mateus", positionGroup: "EXT", positionLabel: "Extremo", traits: ["Tecnicista", "Muito veloz", "Capacidade de desequilíbrio", "Forte no 1x1"] },
  { id: "MIGUEL", number: 18, name: "Miguel", positionGroup: "EXT", positionLabel: "Extremo", traits: ["Raça", "Tecnicista", "Intensidade", "Capacidade de desequilíbrio"] },
  { id: "DENYS", number: 19, name: "Denys", positionGroup: "EXT", positionLabel: "Extremo", traits: ["Técnica", "Classe", "Qualidade no 1x1", "Capacidade para criar desequilíbrios"] },
  { id: "ROCHA", number: 20, name: "Rocha", positionGroup: "EXT", positionLabel: "Extremo", traits: ["Rápido", "Duro", "Intenso", "Forte capacidade de aceleração"] },
  { id: "EDU", number: 21, name: "Edu", positionGroup: "EXT", positionLabel: "Extremo", traits: ["Inteligente", "Técnico", "Excelente leitura dos espaços", "Está frequentemente no sítio certo para finalizar ou criar perigo"] },

  // Avançados
  { id: "BARBOSA", number: 22, name: "Barbosa", positionGroup: "AV", positionLabel: "Avançado", traits: ["Super rápido", "Super forte", "Potência física", "Forte capacidade de finalização"] },
  { id: "TOMAS", number: 23, name: "Tomás", positionGroup: "AV", positionLabel: "Avançado", traits: ["Elevada capacidade física", "Remate muito potente", "Forte presença ofensiva", "Capacidade para finalizar de média distância"] },
  { id: "DINIS-DUARTE", number: 24, name: "Dinis Duarte", positionGroup: "AV", positionLabel: "Avançado", traits: ["Jogo de equipa", "Aplicado", "Inteligente", "Trabalha para a equipa", "Boa capacidade de combinação"] },
];
