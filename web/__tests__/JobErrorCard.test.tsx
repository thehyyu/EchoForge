import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JobErrorCard from '@/app/admin/jobs/JobErrorCard'

const defaultProps = {
  jobId: 5,
  jobType: 'voice',
  errorMessage: 'Whisper 轉錄失敗',
  createdAt: '2026-01-01T00:00:00Z',
}

describe('JobErrorCard', () => {
  it('renders error message and retry button', () => {
    render(<JobErrorCard {...defaultProps} />)
    expect(screen.getByText('Whisper 轉錄失敗')).toBeInTheDocument()
    expect(screen.getByText('重試')).toBeInTheDocument()
  })

  it('shows success message after successful retry', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })

    render(<JobErrorCard {...defaultProps} />)
    fireEvent.click(screen.getByText('重試'))

    await waitFor(() => {
      expect(screen.getByText(/已重新排入佇列/)).toBeInTheDocument()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/jobs/5/retry',
      { method: 'POST' }
    )
  })

  it('shows error message when retry fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false })

    render(<JobErrorCard {...defaultProps} />)
    fireEvent.click(screen.getByText('重試'))

    await waitFor(() => {
      expect(screen.getByText(/操作失敗/)).toBeInTheDocument()
    })
  })
})
