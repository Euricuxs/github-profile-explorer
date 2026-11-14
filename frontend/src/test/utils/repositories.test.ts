import { describe, expect, it } from 'vitest'
import {
  ALL_LANGUAGES,
  NOT_SPECIFIED_LANGUAGE,
  REPOSITORIES_PER_PAGE,
  calculateLanguageStats,
  filterRepositoriesByLanguage,
  getLanguageOptions,
  getPageCount,
  paginateRepositories,
  sortRepositories,
} from '../../utils/repositories'
import { makeRepository } from '../fixtures/repositories'
import type { Repository } from '../../types/user'

const repositories: Repository[] = [
  makeRepository({
    id: 1,
    name: 'alpha',
    language: 'TypeScript',
    stargazersCount: 10,
    updatedAt: '2024-03-01T00:00:00Z',
  }),
  makeRepository({
    id: 2,
    name: 'bravo',
    language: 'Python',
    stargazersCount: 30,
    updatedAt: '2024-01-01T00:00:00Z',
  }),
  makeRepository({
    id: 3,
    name: 'charlie',
    language: null,
    stargazersCount: 20,
    updatedAt: '2024-02-01T00:00:00Z',
  }),
]

describe('getLanguageOptions', () => {
  it('offers one option per language with its repository count', () => {
    const options = getLanguageOptions(repositories)

    expect(options).toEqual([
      { value: NOT_SPECIFIED_LANGUAGE, label: 'Not specified (1)', count: 1 },
      { value: 'Python', label: 'Python (1)', count: 1 },
      { value: 'TypeScript', label: 'TypeScript (1)', count: 1 },
    ])
  })

  it('groups the repositories without a language under "Not specified"', () => {
    const options = getLanguageOptions([
      ...repositories,
      makeRepository({ id: 4, language: null }),
    ])

    const notSpecified = options.find((option) => option.value === NOT_SPECIFIED_LANGUAGE)

    expect(notSpecified?.count).toBe(2)
  })

  it('returns no options for an empty list', () => {
    expect(getLanguageOptions([])).toEqual([])
  })
})

describe('filterRepositoriesByLanguage', () => {
  it('keeps every repository for the "all languages" option', () => {
    expect(filterRepositoriesByLanguage(repositories, ALL_LANGUAGES)).toHaveLength(3)
  })

  it('keeps only the repositories of the chosen language', () => {
    const filtered = filterRepositoriesByLanguage(repositories, 'TypeScript')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('alpha')
  })

  it('keeps the repositories without a language when they are chosen', () => {
    const filtered = filterRepositoriesByLanguage(repositories, NOT_SPECIFIED_LANGUAGE)

    expect(filtered).toHaveLength(1)
    expect(filtered[0].name).toBe('charlie')
  })

  it('returns nothing when no repository uses the chosen language', () => {
    expect(filterRepositoriesByLanguage(repositories, 'Ruby')).toEqual([])
  })

  it('does not change the list it receives', () => {
    const original = [...repositories]

    filterRepositoriesByLanguage(repositories, 'Python')

    expect(repositories).toEqual(original)
  })
})

describe('sortRepositories', () => {
  it('puts the most recently updated repository first', () => {
    const sorted = sortRepositories(repositories, 'updated')

    expect(sorted.map((repository) => repository.name)).toEqual(['alpha', 'charlie', 'bravo'])
  })

  it('puts the repository with the most stars first', () => {
    const sorted = sortRepositories(repositories, 'stars')

    expect(sorted.map((repository) => repository.name)).toEqual(['bravo', 'charlie', 'alpha'])
  })

  it('does not change the list it receives', () => {
    const original = [...repositories]

    sortRepositories(repositories, 'stars')

    expect(repositories).toEqual(original)
    expect(repositories.map((repository) => repository.name)).toEqual([
      'alpha',
      'bravo',
      'charlie',
    ])
  })
})

describe('paginateRepositories', () => {
  const list = Array.from({ length: 25 }, (_, index) => makeRepository({ id: index }))

  it('returns the repositories of the requested page', () => {
    const page = paginateRepositories(list, 1, REPOSITORIES_PER_PAGE)

    expect(page).toHaveLength(10)
    expect(page[0].id).toBe(0)
    expect(page[9].id).toBe(9)
  })

  it('returns the second page', () => {
    const page = paginateRepositories(list, 2, REPOSITORIES_PER_PAGE)

    expect(page).toHaveLength(10)
    expect(page[0].id).toBe(10)
  })

  it('returns a shorter last page', () => {
    const page = paginateRepositories(list, 3, REPOSITORIES_PER_PAGE)

    expect(page).toHaveLength(5)
    expect(page[0].id).toBe(20)
  })

  it('returns nothing for a page beyond the end of the list', () => {
    expect(paginateRepositories(list, 4, REPOSITORIES_PER_PAGE)).toEqual([])
  })
})

describe('getPageCount', () => {
  it('counts the pages a list needs', () => {
    expect(getPageCount(25, REPOSITORIES_PER_PAGE)).toBe(3)
    expect(getPageCount(20, REPOSITORIES_PER_PAGE)).toBe(2)
    expect(getPageCount(21, REPOSITORIES_PER_PAGE)).toBe(3)
  })

  it('always has at least one page', () => {
    expect(getPageCount(0, REPOSITORIES_PER_PAGE)).toBe(1)
    expect(getPageCount(1, REPOSITORIES_PER_PAGE)).toBe(1)
  })
})

describe('calculateLanguageStats', () => {
  it('counts the repositories of every language', () => {
    const stats = calculateLanguageStats(repositories)

    expect(stats).toEqual([
      { language: NOT_SPECIFIED_LANGUAGE, count: 1, percentage: 33.3 },
      { language: 'Python', count: 1, percentage: 33.3 },
      { language: 'TypeScript', count: 1, percentage: 33.3 },
    ])
  })

  it('calculates the percentage of every language', () => {
    const stats = calculateLanguageStats([
      makeRepository({ id: 1, language: 'TypeScript' }),
      makeRepository({ id: 2, language: 'TypeScript' }),
      makeRepository({ id: 3, language: 'Python' }),
    ])

    expect(stats).toEqual([
      { language: 'TypeScript', count: 2, percentage: 66.7 },
      { language: 'Python', count: 1, percentage: 33.3 },
    ])
  })

  it('names the repositories without a language "Not specified"', () => {
    const stats = calculateLanguageStats([makeRepository({ id: 1, language: null })])

    expect(stats).toEqual([{ language: NOT_SPECIFIED_LANGUAGE, count: 1, percentage: 100 }])
  })

  it('returns nothing for an empty list', () => {
    expect(calculateLanguageStats([])).toEqual([])
  })

  it('does not change the list it receives', () => {
    const original = [...repositories]

    calculateLanguageStats(repositories)

    expect(repositories).toEqual(original)
  })
})
