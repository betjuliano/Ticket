'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  Share2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Globe,
  Shield,
} from 'lucide-react';

interface IntelligenceReport {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  analyst: string;
  confidence: number;
  threatLevel: string;
  summary: string;
  tags: string[];
  classification?: string;
  source?: string;
  location?: string;
  date?: string;
  threat?: string;
}

export default function IntelligencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] =
    useState<IntelligenceReport | null>(null);

  const reports: IntelligenceReport[] = [
    {
      id: 'INT-001',
      title: 'Análise de Vulnerabilidades de Rede',
      type: 'vulnerability',
      priority: 'HIGH',
      status: 'active',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T14:45:00Z',
      analyst: 'Ana Silva',
      confidence: 85,
      threatLevel: 'HIGH',
      summary: 'Identificadas múltiplas vulnerabilidades críticas na infraestrutura de rede.',
      tags: ['rede', 'vulnerabilidade', 'crítico'],
      classification: 'CONFIDENCIAL',
      source: 'Scanner de Rede',
      location: 'Rede Corporativa',
      date: '2025-01-15',
      threat: 'Alto',
    },
    {
      id: 'INT-002',
      title: 'Monitoramento de Tráfego Anômalo',
      type: 'monitoring',
      priority: 'MEDIUM',
      status: 'active',
      createdAt: '2025-01-14T16:20:00Z',
      updatedAt: '2025-01-15T09:15:00Z',
      analyst: 'Carlos Mendes',
      confidence: 72,
      threatLevel: 'MEDIUM',
      summary: 'Detectado aumento significativo no tráfego de rede durante horário não comercial.',
      tags: ['tráfego', 'anomalia', 'monitoramento'],
      classification: 'INTERNO',
      source: 'IDS/IPS',
      location: 'Gateway Principal',
      date: '2025-01-14',
      threat: 'Médio',
    },
    {
      id: 'INT-003',
      title: 'Relatório de Incidentes de Segurança',
      type: 'incident',
      priority: 'HIGH',
      status: 'resolved',
      createdAt: '2025-01-13T08:45:00Z',
      updatedAt: '2025-01-14T12:30:00Z',
      analyst: 'Roberto Lima',
      confidence: 95,
      threatLevel: 'HIGH',
      summary: 'Investigação completa de tentativa de acesso não autorizado ao sistema.',
      tags: ['incidente', 'acesso', 'investigação'],
      classification: 'RESTRITO',
      source: 'Logs de Sistema',
      location: 'Servidor Principal',
      date: '2025-01-13',
      threat: 'Alto',
    },
  ];

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'TOP SECRET':
        return 'bg-red-500/20 text-red-500';
      case 'SECRET':
        return 'bg-orange-500/20 text-orange-500';
      case 'CONFIDENTIAL':
        return 'bg-neutral-500/20 text-neutral-300';
      default:
        return 'bg-white/20 text-white';
    }
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'critical':
        return 'bg-red-500/20 text-red-500';
      case 'high':
        return 'bg-orange-500/20 text-orange-500';
      case 'medium':
        return 'bg-neutral-500/20 text-neutral-300';
      case 'low':
        return 'bg-white/20 text-white';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-white/20 text-white';
      case 'pending':
        return 'bg-orange-500/20 text-orange-500';
      case 'active':
        return 'bg-white/20 text-white';
      default:
        return 'bg-neutral-500/20 text-neutral-300';
    }
  };

  const filteredReports = reports.filter(
    report =>
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">
            INTELLIGENCE CENTER
          </h1>
          <p className="text-sm text-neutral-400">
            Classified reports and threat analysis
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            New Report
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="Search intelligence reports..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-800 border-neutral-600 text-white placeholder-neutral-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  TOTAL REPORTS
                </p>
                <p className="text-2xl font-bold text-white font-mono">1,247</p>
              </div>
              <FileText className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  CRITICAL THREATS
                </p>
                <p className="text-2xl font-bold text-red-500 font-mono">12</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">
                  ACTIVE SOURCES
                </p>
                <p className="text-2xl font-bold text-white font-mono">89</p>
              </div>
              <Globe className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intelligence Reports */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            INTELLIGENCE REPORTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map(report => (
              <div
                key={report.id}
                className="border border-neutral-700 rounded p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-neutral-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wider">
                          {report.title}
                        </h3>
                        <p className="text-xs text-neutral-400 font-mono">
                          {report.id}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-300 ml-8">
                      {report.summary}
                    </p>

                    <div className="flex flex-wrap gap-2 ml-8">
                      {report.tags.map(tag => (
                        <Badge
                          key={tag}
                          className="bg-neutral-800 text-neutral-300 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-orange-500/20 text-orange-500">
                        {report.classification || 'N/A'}
                      </Badge>
                      <Badge className="bg-red-500/20 text-red-500">
                        {report.threat || 'N/A'}
                      </Badge>
                      <Badge className={getStatusColor(report.status)}>
                        {report.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        <span>{report.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3" />
                        <span>{report.source}</span>
                      </div>
                      <div className="font-mono">{report.date}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-neutral-900 border-neutral-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-white tracking-wider">
                  {selectedReport.title}
                </CardTitle>
                <p className="text-sm text-neutral-400 font-mono">
                  {selectedReport.id}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setSelectedReport(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      CLASSIFICATION
                    </h3>
                    <div className="flex gap-2">
                      <Badge
                        className={getClassificationColor(
                          selectedReport.classification || 'N/A'
                        )}
                      >
                        {selectedReport.classification || 'N/A'}
                      </Badge>
                      <Badge className={getThreatColor(selectedReport.threat || 'N/A')}>
                        {(selectedReport.threat || 'N/A').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      SOURCE DETAILS
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Source Type:</span>
                        <span className="text-white font-mono">
                          {selectedReport.source}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Location:</span>
                        <span className="text-white">
                          {selectedReport.location}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Date:</span>
                        <span className="text-white font-mono">
                          {selectedReport.date}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Status:</span>
                        <Badge
                          className={getStatusColor(selectedReport.status)}
                        >
                          {selectedReport.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      TAGS
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.tags.map(tag => (
                        <Badge
                          key={tag}
                          className="bg-neutral-800 text-neutral-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                      THREAT ASSESSMENT
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Threat Level</span>
                        <Badge
                          className={getThreatColor(selectedReport.threat || 'medium')}
                        >
                          {(selectedReport.threat || 'medium').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            (selectedReport.threat || 'medium') === 'critical'
                              ? 'bg-red-500 w-full'
                              : (selectedReport.threat || 'medium') === 'high'
                                ? 'bg-orange-500 w-3/4'
                                : (selectedReport.threat || 'medium') === 'medium'
                                  ? 'bg-neutral-400 w-1/2'
                                  : 'bg-white w-1/4'
                          }`}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-300 tracking-wider mb-2">
                  EXECUTIVE SUMMARY
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {selectedReport.summary}
                </p>
              </div>

              <div className="flex gap-2 pt-4 border-t border-neutral-700">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 bg-transparent"
                >
                  Share Intel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
