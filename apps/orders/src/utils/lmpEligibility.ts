export const getPatientAgeYears = (ageString: string | undefined): number => {
  const match = ageString?.match(/^(\d+)\s*years?/);
  return parseInt(match?.[1] ?? '0', 10);
};

export const isPatientLmpEligible = (
  gender: string | undefined,
  age: string | undefined,
): boolean => {
  return gender === 'F' && getPatientAgeYears(age) >= 10;
};
