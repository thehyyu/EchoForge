import { render, screen } from '@testing-library/react'
import PublishButton from '@/app/admin/posts/PublishButton'

// mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

describe('PublishButton', () => {
  it('renders publish button', () => {
    render(<PublishButton postId={1} slug="test-slug" />)
    expect(screen.getByText('發佈')).toBeInTheDocument()
  })
})
