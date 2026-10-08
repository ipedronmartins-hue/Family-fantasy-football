// Clubes que aparecem no seletor da página principal.
// Lista escolhida à mão de propósito: as equipas são privadas, por isso só
// aparece aqui quem for acrescentado a este ficheiro.

export interface ClubEntry {
  club: string;
  team: string;
  slug: string;
}

export const FORMACAO_CLUBS: ClubEntry[] = [
  { club: "Gondomar SC", team: "Sub-13", slug: "gondomar" },
  { club: "FC Infesta", team: "Sub-13", slug: "fc-infesta-sub-13" },
];

// Conceito diferente: palpites 1X2 para uma equipa de seniores. Ainda não tem
// área própria na app, por isso o cartão pede para ser avisado.
export const LEOES = {
  club: "Leões Valboenses",
  label: "Seniores",
  title: "Palpites dos Leões",
};
