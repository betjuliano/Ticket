export const translations = {
  pt: {
    common: {
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      edit: 'Editar',
      search: 'Buscar',
      filter: 'Filtrar',
      clear: 'Limpar'
    },
    tickets: {
      title: 'Tickets',
      newTicket: 'Novo Ticket',
      status: 'Status',
      priority: 'Prioridade',
      category: 'Categoria',
      assignedTo: 'Responsável',
      createdBy: 'Criado por',
      createdAt: 'Criado em',
      archive: 'Arquivar',
      forward: 'Encaminhar',
      details: 'Detalhes',
      statuses: {
        open: 'Aberto',
        in_progress: 'Em Andamento',
        resolved: 'Resolvido',
        closed: 'Fechado'
      },
      priorities: {
        low: 'Baixa',
        medium: 'Média',
        high: 'Alta',
        critical: 'Crítica'
      }
    },
    dashboard: {
      title: 'Dashboard',
      totalTickets: 'Total de Tickets',
      openTickets: 'Tickets Abertos',
      resolvedTickets: 'Tickets Resolvidos',
      avgResolutionTime: 'Tempo Médio de Resolução'
    }
  },
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      clear: 'Clear'
    },
    tickets: {
      title: 'Tickets',
      newTicket: 'New Ticket',
      status: 'Status',
      priority: 'Priority',
      category: 'Category',
      assignedTo: 'Assigned To',
      createdBy: 'Created By',
      createdAt: 'Created At',
      archive: 'Archive',
      forward: 'Forward',
      details: 'Details',
      statuses: {
        open: 'Open',
        in_progress: 'In Progress',
        resolved: 'Resolved',
        closed: 'Closed'
      },
      priorities: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      }
    },
    dashboard: {
      title: 'Dashboard',
      totalTickets: 'Total Tickets',
      openTickets: 'Open Tickets',
      resolvedTickets: 'Resolved Tickets',
      avgResolutionTime: 'Avg Resolution Time'
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.pt