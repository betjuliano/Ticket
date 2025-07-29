# ========================================
# SCRIPT DE DEPLOY PARA PORTAINER
# Sistema de Tickets - iaprojetos.com.br
# ========================================

param(
    [string]$Action = "deploy",
    [string]$StackName = "ticket-system",
    [switch]$Force
)

# Configurações do Portainer
$PORTAINER_URL = "https://portainer.iaprojetos.com.br"
$TOKEN = "yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJpYXByb2pldG9zIiwicm9sZSI6MSwic2NvcGUiOiJkZWZhdWx0IiwiZm9yY2VDaGFuZ2VQYXNzd29yZCI6ZmFsc2UsImV4cCI6MTc1MjEzOTIzOSwiaWF0IjoxNzUyMTEwNDM5LCJqdGkiOiJjMDE2MGY5ZC1jZWFkLTQ1ZjEtOWY4Yi1jNzY4YWRkYWJhN2YifQ.sPR5c2N-6Gfjhmnkhj1yspA64mbn7VOlD9lLIjaeSlI"
$SWARM_ID = "eg6ahp92i130xiavjv7unmrjg"
$ENDPOINT_ID = "1"

# Headers para API
$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-PortainerConnection {
    Write-ColorOutput Yellow "🔍 Testando conexão com Portainer..."
    try {
        $response = Invoke-RestMethod -Uri "$PORTAINER_URL/api/status" -Method GET -Headers $headers
        Write-ColorOutput Green "✅ Conexão com Portainer OK - Versão: $($response.Version)"
        return $true
    } catch {
        Write-ColorOutput Red "❌ Erro ao conectar com Portainer: $($_.Exception.Message)"
        return $false
    }
}

function Get-ExistingStack {
    param([string]$Name)
    
    try {
        $stacks = Invoke-RestMethod -Uri "$PORTAINER_URL/api/stacks" -Method GET -Headers $headers
        return $stacks | Where-Object { $_.Name -eq $Name }
    } catch {
        Write-ColorOutput Red "❌ Erro ao buscar stacks: $($_.Exception.Message)"
        return $null
    }
}

function Remove-Stack {
    param([object]$Stack)
    
    if ($Stack) {
        Write-ColorOutput Yellow "🗑️ Removendo stack existente: $($Stack.Name)"
        try {
            Invoke-RestMethod -Uri "$PORTAINER_URL/api/stacks/$($Stack.Id)" -Method DELETE -Headers $headers
            Write-ColorOutput Green "✅ Stack removido com sucesso"
            Start-Sleep -Seconds 5
        } catch {
            Write-ColorOutput Red "❌ Erro ao remover stack: $($_.Exception.Message)"
            return $false
        }
    }
    return $true
}

function Deploy-Stack {
    Write-ColorOutput Yellow "🚀 Iniciando deploy do stack: $StackName"
    
    # Verificar se arquivos existem
    if (-not (Test-Path "docker-compose.portainer.yml")) {
        Write-ColorOutput Red "❌ Arquivo docker-compose.portainer.yml não encontrado"
        return $false
    }
    
    if (-not (Test-Path ".env.portainer")) {
        Write-ColorOutput Red "❌ Arquivo .env.portainer não encontrado"
        return $false
    }
    
    # Ler arquivos
    $dockerCompose = Get-Content "docker-compose.portainer.yml" -Raw
    $envContent = Get-Content ".env.portainer" -Raw
    
    # Processar variáveis de ambiente
    $envVars = @()
    $envContent -split "`n" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            if ($parts.Length -eq 2) {
                $envVars += @{
                    "name" = $parts[0].Trim()
                    "value" = $parts[1].Trim()
                }
            }
        }
    }
    
    # Preparar payload
    $payload = @{
        "name" = $StackName
        "swarmId" = $SWARM_ID
        "stackFileContent" = $dockerCompose
        "env" = $envVars
    } | ConvertTo-Json -Depth 10
    
    # Deploy
    try {
        Write-ColorOutput Yellow "📦 Enviando stack para Portainer..."
        $response = Invoke-RestMethod -Uri "$PORTAINER_URL/api/stacks" -Method POST -Headers $headers -Body $payload
        Write-ColorOutput Green "✅ Stack deployado com sucesso! ID: $($response.Id)"
        return $true
    } catch {
        Write-ColorOutput Red "❌ Erro ao deployar stack: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $errorDetails = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorDetails)
            $errorBody = $reader.ReadToEnd()
            Write-ColorOutput Red "Detalhes do erro: $errorBody"
        }
        return $false
    }
}

function Get-StackStatus {
    param([string]$Name)
    
    $stack = Get-ExistingStack -Name $Name
    if ($stack) {
        Write-ColorOutput Green "📊 Status do Stack: $($stack.Name)"
        Write-ColorOutput White "   ID: $($stack.Id)"
        Write-ColorOutput White "   Status: $($stack.Status)"
        Write-ColorOutput White "   Endpoint: $($stack.EndpointId)"
        
        # Buscar serviços
        try {
            $services = Invoke-RestMethod -Uri "$PORTAINER_URL/api/endpoints/$ENDPOINT_ID/docker/services" -Method GET -Headers $headers
            $stackServices = $services | Where-Object { $_.Spec.Labels."com.docker.stack.namespace" -eq $Name }
            
            Write-ColorOutput Yellow "🔧 Serviços do Stack:"
            foreach ($service in $stackServices) {
                $replicas = "$($service.Spec.Mode.Replicated.Replicas)/$($service.ServiceStatus.RunningTasks)"
                Write-ColorOutput White "   - $($service.Spec.Name): $replicas réplicas"
            }
        } catch {
            Write-ColorOutput Red "❌ Erro ao buscar serviços: $($_.Exception.Message)"
        }
    } else {
        Write-ColorOutput Red "❌ Stack '$Name' não encontrado"
    }
}

function Show-Help {
    Write-ColorOutput Cyan @"
🎯 SCRIPT DE DEPLOY PORTAINER - SISTEMA DE TICKETS

Uso: .\deploy-portainer.ps1 [AÇÃO] [OPÇÕES]

Ações disponíveis:
  deploy     - Faz deploy do stack (padrão)
  status     - Mostra status do stack
  remove     - Remove o stack
  redeploy   - Remove e faz deploy novamente
  help       - Mostra esta ajuda

Opções:
  -StackName <nome>  - Nome do stack (padrão: ticket-system)
  -Force             - Força operação sem confirmação

Exemplos:
  .\deploy-portainer.ps1
  .\deploy-portainer.ps1 status
  .\deploy-portainer.ps1 redeploy -Force
  .\deploy-portainer.ps1 deploy -StackName my-tickets

"@
}

# ========================================
# MAIN SCRIPT
# ========================================

Write-ColorOutput Cyan "🎯 DEPLOY PORTAINER - SISTEMA DE TICKETS"
Write-ColorOutput Cyan "==========================================="

# Verificar conexão
if (-not (Test-PortainerConnection)) {
    exit 1
}

switch ($Action.ToLower()) {
    "deploy" {
        $existingStack = Get-ExistingStack -Name $StackName
        if ($existingStack -and -not $Force) {
            Write-ColorOutput Yellow "⚠️ Stack '$StackName' já existe. Use 'redeploy' ou -Force para sobrescrever."
            exit 1
        }
        
        if ($existingStack -and $Force) {
            if (-not (Remove-Stack -Stack $existingStack)) {
                exit 1
            }
        }
        
        if (Deploy-Stack) {
            Write-ColorOutput Green "🎉 Deploy concluído com sucesso!"
            Start-Sleep -Seconds 3
            Get-StackStatus -Name $StackName
        } else {
            exit 1
        }
    }
    
    "status" {
        Get-StackStatus -Name $StackName
    }
    
    "remove" {
        $existingStack = Get-ExistingStack -Name $StackName
        if ($existingStack) {
            if ($Force -or (Read-Host "Confirma remoção do stack '$StackName'? (y/N)") -eq "y") {
                Remove-Stack -Stack $existingStack
            }
        } else {
            Write-ColorOutput Yellow "⚠️ Stack '$StackName' não encontrado"
        }
    }
    
    "redeploy" {
        $existingStack = Get-ExistingStack -Name $StackName
        if ($existingStack) {
            if (-not (Remove-Stack -Stack $existingStack)) {
                exit 1
            }
        }
        
        if (Deploy-Stack) {
            Write-ColorOutput Green "🎉 Redeploy concluído com sucesso!"
            Start-Sleep -Seconds 3
            Get-StackStatus -Name $StackName
        } else {
            exit 1
        }
    }
    
    "help" {
        Show-Help
    }
    
    default {
        Write-ColorOutput Red "❌ Ação inválida: $Action"
        Show-Help
        exit 1
    }
}

Write-ColorOutput Cyan "\n🏁 Script finalizado."