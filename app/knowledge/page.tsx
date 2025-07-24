"use client"

import { useState } from "react"
import { KnowledgeDocument, AIMessage } from "@/types/global"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, FileText, Bot, Brain, Database, Download, Eye, Trash2, MessageSquare, Zap } from "lucide-react"

interface KnowledgePageProps {
  userRole: "user" | "coordinator"
}

export default function KnowledgePage({ userRole }: KnowledgePageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState("")
  const [showAiChat, setShowAiChat] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  // Remover a linha duplicada: const [userRole] = useState("coordinator")

  const documents = [
    {
      id: "DOC-001",
      title: "Manual de Procedimentos TI",
      description: "Guia completo para resolução de problemas técnicos comuns",
      category: "Técnico",
      uploadDate: "2025-06-15",
      fileType: "PDF",
      size: "2.5 MB",
      tags: ["manual", "ti", "procedimentos"],
      content: "Este documento contém procedimentos padrão para resolução de problemas técnicos...",
    },
    {
      id: "DOC-002",
      title: "Política de Equipamentos",
      description: "Diretrizes para solicitação e manutenção de equipamentos",
      category: "Equipamentos",
      uploadDate: "2025-06-10",
      fileType: "DOCX",
      size: "1.8 MB",
      tags: ["equipamentos", "política", "solicitação"],
      content: "Política institucional para gestão de equipamentos e recursos...",
    },
    {
      id: "DOC-003",
      title: "FAQ - Perguntas Frequentes",
      description: "Respostas para as dúvidas mais comuns dos usuários",
      category: "FAQ",
      uploadDate: "2025-06-08",
      fileType: "PDF",
      size: "950 KB",
      tags: ["faq", "dúvidas", "usuários"],
      content: "Compilação das perguntas mais frequentes e suas respectivas respostas...",
    },
    {
      id: "DOC-004",
      title: "Fluxo de Atendimento",
      description: "Processo padrão para atendimento de chamados",
      category: "Processos",
      uploadDate: "2025-06-05",
      fileType: "PDF",
      size: "1.2 MB",
      tags: ["fluxo", "atendimento", "processos"],
      content: "Documentação do fluxo completo de atendimento desde abertura até fechamento...",
    },
  ]

  const handleAiQuery = async () => {
    if (!aiInput.trim()) return

    const newMessage: AIMessage = {
      type: "user",
      content: aiInput,
      timestamp: new Date().toLocaleTimeString(),
    }

    setAiMessages([...aiMessages, newMessage])
    setAiInput("")

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse: AIMessage = {
        type: "ai",
        content: `Com base na knowledge base, encontrei informações relevantes sobre "${aiInput}". Segundo o Manual de Procedimentos TI, recomendo verificar primeiro as configurações de rede e depois os logs do sistema. Posso elaborar uma resposta mais detalhada se necessário.`,
        timestamp: new Date().toLocaleTimeString(),
        sources: ["DOC-001", "DOC-004"],
      }
      setAiMessages((prev) => [...prev, aiResponse])
    }, 2000)
  }

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">KNOWLEDGE BASE</h1>
          <p className="text-sm text-neutral-400">Base de conhecimento para suporte à IA e consultas</p>
        </div>
        <div className="flex gap-2">
          {userRole === "coordinator" && (
            <Button onClick={() => setShowUploadForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Upload Documento
            </Button>
          )}
          <Button onClick={() => setShowAiChat(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Bot className="w-4 h-4 mr-2" />
            Consultar IA
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">DOCUMENTOS</p>
                <p className="text-2xl font-bold text-white font-mono">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CATEGORIAS</p>
                <p className="text-2xl font-bold text-white font-mono">4</p>
              </div>
              <Database className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONSULTAS IA</p>
                <p className="text-2xl font-bold text-orange-500 font-mono">156</p>
              </div>
              <Brain className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PRECISÃO IA</p>
                <p className="text-2xl font-bold text-white font-mono">94%</p>
              </div>
              <Zap className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Buscar documentos na knowledge base..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-800 border-neutral-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDocuments.map((doc) => (
          <Card
            key={doc.id}
            className="bg-neutral-900 border-neutral-700 hover:border-orange-500/50 transition-colors cursor-pointer"
            onClick={() => setSelectedDocument(doc)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-orange-500" />
                  <div>
                    <CardTitle className="text-sm font-bold text-white tracking-wider">{doc.title}</CardTitle>
                    <p className="text-xs text-neutral-400">{doc.category}</p>
                  </div>
                </div>
                <Badge className="bg-neutral-800 text-neutral-300 text-xs">{doc.fileType}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-neutral-300">{doc.description}</p>

              <div className="flex flex-wrap gap-1">
                {doc.tags.map((tag) => (
                  <Badge key={tag} className="bg-orange-500/20 text-orange-500 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-neutral-400 space-y-1">
                <div className="flex justify-between">
                  <span>Upload:</span>
                  <span className="font-mono">{doc.uploadDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tamanho:</span>
                  <span className="font-mono">{doc.size}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Document Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-white tracking-wider">UPLOAD DOCUMENTO</CardTitle>
              <Button
                variant="ghost"
                onClick={() => setShowUploadForm(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">TÍTULO</label>
                <Input placeholder="Nome do documento..." className="bg-neutral-800 border-neutral-600 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">CATEGORIA</label>
                <Input
                  placeholder="Ex: Técnico, FAQ, Processos..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">DESCRIÇÃO</label>
                <Textarea
                  placeholder="Descreva o conteúdo do documento..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">TAGS</label>
                <Input
                  placeholder="Separadas por vírgula: manual, ti, procedimentos..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-300 mb-2 block">ARQUIVO</label>
                <div className="border-2 border-dashed border-neutral-600 rounded p-6 text-center">
                  <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Clique para selecionar ou arraste o arquivo aqui</p>
                  <p className="text-xs text-neutral-500 mt-1">PDF, DOC, DOCX até 10MB</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadForm(false)}
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Chat Modal */}
      {showAiChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-700">
              <CardTitle className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-500" />
                CONSULTA À IA - KNOWLEDGE BASE
              </CardTitle>
              <Button
                variant="ghost"
                onClick={() => setShowAiChat(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {aiMessages.length === 0 && (
                  <div className="text-center text-neutral-400 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                    <p>Faça uma pergunta e eu consultarei a knowledge base para ajudar</p>
                    <p className="text-sm mt-2">Ex: "Como resolver problemas de acesso ao sistema?"</p>
                  </div>
                )}
                {aiMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded ${
                        message.type === "user" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-300"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      {message.sources && (
                        <div className="mt-2 flex gap-1">
                          {message.sources.map((source) => (
                            <Badge key={source} className="bg-orange-500/20 text-orange-500 text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="bg-neutral-800 border-neutral-600 text-white"
                  onKeyPress={(e) => e.key === "Enter" && handleAiQuery()}
                />
                <Button onClick={handleAiQuery} className="bg-orange-500 hover:bg-orange-600 text-white">
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-white tracking-wider">{selectedDocument.title}</CardTitle>
                <p className="text-sm text-neutral-400">
                  {selectedDocument.category} • {selectedDocument.fileType}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedDocument(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">DESCRIÇÃO</h3>
                <p className="text-sm text-neutral-300">{selectedDocument.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">TAGS</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDocument.tags.map((tag) => (
                    <Badge key={tag} className="bg-orange-500/20 text-orange-500">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">CONTEÚDO</h3>
                <div className="p-4 bg-neutral-800 border border-neutral-600 rounded text-sm text-neutral-300">
                  {selectedDocument.content}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {userRole === "coordinator" && (
                  <Button
                    variant="outline"
                    className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
