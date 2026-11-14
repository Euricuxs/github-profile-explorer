import type { Repository } from '../../types/user'

/**
 * A repository with sensible defaults, so a test only has to say what it
 * cares about.
 */
export function makeRepository(overrides: Partial<Repository> = {}): Repository {
  return {
    id: 1,
    name: 'repo',
    fullName: 'octocat/repo',
    description: null,
    url: 'https://github.com/octocat/repo',
    language: 'TypeScript',
    stargazersCount: 0,
    forksCount: 0,
    isFork: false,
    isArchived: false,
    topics: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

/**
 * A list that is longer than one page and holds several languages.
 *
 * The repositories get more stars the higher their index, and they get
 * *older* the higher their index, so "most stars" and "recently updated"
 * lead to a different first repository.
 */
export function makeRepositoryList(): Repository[] {
  const languages: (string | null)[] = [
    ...Array.from({ length: 12 }, () => 'TypeScript'),
    ...Array.from({ length: 6 }, () => 'Python'),
    ...Array.from({ length: 4 }, () => null),
    ...Array.from({ length: 2 }, () => 'Rust'),
    'Go',
  ]

  return languages.map((language, index) =>
    makeRepository({
      id: index,
      name: `repo-${index}`,
      language,
      stargazersCount: index,
      updatedAt: new Date(Date.UTC(2024, 0, 1, 0, 0, 0) - index * 60_000).toISOString(),
    }),
  )
}

/**
 * A list that holds more languages than the chart can show.
 *
 * The counts are chosen so the shares are easy to check by hand: the list
 * holds 90 repositories in total.
 */
export function makeManyLanguageRepositoryList(): Repository[] {
  const counts: [string, number][] = [
    ['TypeScript', 20],
    ['Python', 15],
    ['JavaScript', 12],
    ['Java', 10],
    ['Go', 8],
    ['Rust', 7],
    ['C#', 6],
    ['Ruby', 5],
    ['PHP', 4],
    ['Shell', 3],
  ]

  const repositories: Repository[] = []
  let id = 0

  for (const [language, count] of counts) {
    for (let index = 0; index < count; index += 1) {
      repositories.push(
        makeRepository({
          id,
          name: `${language.toLowerCase()}-${index}`,
          language,
          stargazersCount: count - index,
        }),
      )
      id += 1
    }
  }

  return repositories
}
