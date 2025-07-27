import { render, screen, fireEvent } from '@testing-library/react'
import { TicketCard } from '@/components/ticket-card'
import { mockTickets } from '@/data/mockTickets'

const mockTicket = mockTickets[0]

describe('TicketCard', () => {
  const mockOnArchive = jest.fn()
  const mockOnForward = jest.fn()
  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar as informações do ticket corretamente', () => {
    render(
      <TicketCard
        ticket={mockTicket}
        onArchive={mockOnArchive}
        onForward={mockOnForward}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText(mockTicket.title)).toBeInTheDocument()
    expect(screen.getByText(mockTicket.description)).toBeInTheDocument()
    expect(screen.getByText(mockTicket.user.name)).toBeInTheDocument()
  })

  it('deve chamar onArchive quando o botão arquivar for clicado', () => {
    render(
      <TicketCard
        ticket={mockTicket}
        onArchive={mockOnArchive}
        onForward={mockOnForward}
        onClick={mockOnClick}
      />
    )

    const archiveButton = screen.getByText('Arquivar')
    fireEvent.click(archiveButton)

    expect(mockOnArchive).toHaveBeenCalledWith(mockTicket.id)
  })

  it('deve chamar onForward quando o botão encaminhar for clicado', () => {
    render(
      <TicketCard
        ticket={mockTicket}
        onArchive={mockOnArchive}
        onForward={mockOnForward}
        onClick={mockOnClick}
      />
    )

    const forwardButton = screen.getByText('Encaminhar')
    fireEvent.click(forwardButton)

    expect(mockOnForward).toHaveBeenCalledWith(mockTicket.id)
  })

  it('deve exibir a prioridade correta', () => {
    render(
      <TicketCard
        ticket={mockTicket}
        onArchive={mockOnArchive}
        onForward={mockOnForward}
        onClick={mockOnClick}
      />
    )

    expect(screen.getByText('Alta')).toBeInTheDocument()
  })
})