export function getLeaderboardCategory(profile) {
  if (!profile) {
    return null;
  }

  const schoolType = String(
    profile.school_type || ""
  )
    .trim()
    .toLowerCase();

  switch (schoolType) {
    case "primary":
      return "Primary";

    case "secondary":
      return "Secondary";

    case "no_school":
      return "NoSchool";

    default:
      return null;
  }
}

export function getLearningCategoryLabel(category) {
  return category === "NoSchool"
    ? "No School"
    : category;
}

