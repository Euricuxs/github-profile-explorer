import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBar } from '../../components/SearchBar'

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    const onSearch = vi.fn()
    // `delay: null` makes user-event type without waiting between keystrokes.
    // Without it, user-event schedules its own timers, which never fire
    // while Vitest's fake clock is installed.
    const user = userEvent.setup({ delay: null })

    render(<SearchBar onSearch={onSearch} />)

    return { onSearch, user }
  }

  it('renders an accessible search input and button', () => {
    setup()

    expect(screen.getByRole('searchbox', { name: /search github users/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  it('updates the input value as the user types', async () => {
    const { user } = setup()
    const input = screen.getByRole('searchbox')

    await user.type(input, 'octocat')

    expect(input).toHaveValue('octocat')
  })

  it('waits for the debounce before searching', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), 'octocat')

    expect(onSearch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(499)

    expect(onSearch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('searches once for the whole term instead of once per keystroke', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), 'octocat')
    await vi.advanceTimersByTimeAsync(500)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('restarts the debounce when the user keeps typing', async () => {
    const { onSearch, user } = setup()
    const input = screen.getByRole('searchbox')

    await user.type(input, 'oct')
    await vi.advanceTimersByTimeAsync(400)

    await user.type(input, 'ocat')
    await vi.advanceTimersByTimeAsync(400)

    expect(onSearch).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(100)

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('searches immediately when the user presses Enter', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), 'octocat{Enter}')

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('searches immediately when the user clicks the Search button', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), 'octocat')
    await user.click(screen.getByRole('button', { name: /search/i }))

    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('trims the term before searching', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), '  octocat  {Enter}')

    expect(onSearch).toHaveBeenCalledWith('octocat')
  })

  it('does not search for a whitespace-only term', async () => {
    const { onSearch, user } = setup()

    await user.type(screen.getByRole('searchbox'), '   {Enter}')
    await vi.advanceTimersByTimeAsync(500)

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('resets the search when the input is cleared', async () => {
    const { onSearch, user } = setup()
    const input = screen.getByRole('searchbox')

    await user.type(input, 'octocat{Enter}')

    expect(onSearch).toHaveBeenCalledWith('octocat')

    onSearch.mockClear()

    await user.clear(input)

    expect(onSearch).toHaveBeenCalledWith('')
  })
})
