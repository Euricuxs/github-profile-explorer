import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from '../../components/Avatar'

describe('Avatar', () => {
  it('shows the image of the account', () => {
    render(
      <Avatar
        src="https://avatars.githubusercontent.com/u/583231?v=4"
        alt="octocat avatar"
        width={48}
        height={48}
      />,
    )

    const image = screen.getByAltText('octocat avatar')

    expect(image).toHaveAttribute('src', 'https://avatars.githubusercontent.com/u/583231?v=4')
  })

  it('shows a placeholder when the image cannot be loaded', () => {
    render(
      <Avatar
        src="https://avatars.githubusercontent.com/u/1?v=4"
        alt="octocat avatar"
        width={48}
        height={48}
      />,
    )

    const image = screen.getByAltText('octocat avatar')

    fireEvent.error(image)

    expect(image).toHaveAttribute('src', '/avatar-placeholder.svg')
    // The description stays, so the placeholder is not a mystery.
    expect(screen.getByAltText('octocat avatar')).toBeInTheDocument()
  })

  it('shows the image of a new account after another one failed', () => {
    const { rerender } = render(
      <Avatar src="https://avatars.githubusercontent.com/u/1?v=4" alt="first avatar" width={48} height={48} />,
    )

    fireEvent.error(screen.getByAltText('first avatar'))

    rerender(
      <Avatar
        src="https://avatars.githubusercontent.com/u/2?v=4"
        alt="second avatar"
        width={48}
        height={48}
      />,
    )

    expect(screen.getByAltText('second avatar')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/2?v=4',
    )
  })
})
