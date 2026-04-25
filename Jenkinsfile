pipeline {
    agent any // Se ejecuta en cualquier nodo disponible de Jenkins

    environment {
        // Jenkins extrae las llaves de su bóveda y las guarda en estas variables
        AWS_ACCESS_KEY_ID     = credentials('AWS_ACCESS_KEY')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_KEY')
        AWS_REGION            = 'us-east-1' 
    }

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