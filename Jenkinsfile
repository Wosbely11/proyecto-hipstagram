pipeline {
    agent any // Se ejecuta en cualquier nodo disponible de Jenkins

    stages {
        stage('1. Obtener Código') {
            steps {
                echo 'Descargando la última versión del repositorio...'
                checkout scm
            }
        }

        stage('2. Análisis de Calidad (SonarQube)') {
            environment {
                // Requiere que el plugin de SonarQube esté instalado en Jenkins
                scannerHome = tool 'SonarQubeScanner'
            }
            steps {
                echo 'Ejecutando escaneo de vulnerabilidades y bugs...'
                withSonarQubeEnv('SonarQube-Server') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }

        stage('3. Despliegue Simulado') {
            steps {
                echo 'El código es seguro. Listo para ejecutar docker-compose...'
                // sh "docker-compose up -d --build" ---------- Comentado para no afectar el servidor
            }
        }
    }
}