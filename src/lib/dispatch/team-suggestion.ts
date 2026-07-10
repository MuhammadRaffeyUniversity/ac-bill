export type DispatchTeam = {
  id: string;
  name: string;
  region: string | null;
  serviceAreaTags: string[];
  activeJobs: number;
};

export type DispatchAddress = {
  area: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
};

export type TeamSuggestion = {
  teamId: string;
  reason: string;
  score: number;
};

function normalise(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase() ?? "";
}

function matches(tag: string, value: string) {
  return Boolean(tag && value && (tag === value || tag.includes(value) || value.includes(tag)));
}

export function suggestTeamsForDispatch(teams: DispatchTeam[], address: DispatchAddress): TeamSuggestion[] {
  const locationValues = [
    { label: "postcode", value: normalise(address.postcode), weight: 120 },
    { label: "area", value: normalise(address.area), weight: 100 },
    { label: "city", value: normalise(address.city), weight: 80 },
    { label: "state", value: normalise(address.state), weight: 40 },
  ];

  return teams
    .map((team) => {
      const tags = [...team.serviceAreaTags, team.region].map(normalise).filter(Boolean);
      const match = locationValues.find(({ value }) => tags.some((tag) => matches(tag, value)));
      const score = (match?.weight ?? 0) - team.activeJobs * 5;
      const workload = `${team.activeJobs} open ${team.activeJobs === 1 ? "job" : "jobs"}`;

      return {
        teamId: team.id,
        score,
        reason: match ? `Matches ${match.value} by ${match.label}; ${workload}.` : `No service-area match; ${workload}.`,
      };
    })
    .sort((left, right) => right.score - left.score || left.teamId.localeCompare(right.teamId));
}
